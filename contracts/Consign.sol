// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Consign
 * @notice A consignment marketplace for ERC-721 tokens.
 *
 * The seller keeps the token. This contract never takes custody of anything
 * except the buyer's money, and it holds that only until the payee withdraws.
 *
 * Four decisions shape the whole contract, and each one exists because the
 * obvious alternative fails in a way that is easy to miss:
 *
 * 1. Listing is by approval, not by escrow. A marketplace that holds your token
 *    can strand it. The cost is that listings go stale, so staleness is checked
 *    and anybody can clear one.
 * 2. Nobody is paid inside `buy`. Proceeds are credited and withdrawn later. A
 *    seller whose `receive` reverts would otherwise make their own item
 *    unsellable, and the buyer would carry the blame.
 * 3. The listing is deleted before the token moves. `safeTransferFrom` calls
 *    the buyer back, and the buyer is the one party here who is not trusted.
 * 4. Royalties are read defensively and capped. A collection reporting a
 *    royalty above the sale price would otherwise revert every sale it touches.
 */
contract Consign is Ownable, ReentrancyGuard {
    /**
     * @dev `price` is `uint96` so a listing occupies one storage slot rather
     *      than two. 2^96 wei is around 79 billion ether, so the ceiling is not
     *      a real constraint, and the saving is paid on every single listing.
     */
    struct Listing {
        address seller;
        uint96 price;
    }

    /// @notice Basis points the owner may never charge above.
    uint16 public constant MAX_FEE_BPS = 1000;

    /// @notice Basis points a collection may never claim above, however it answers.
    uint16 public constant MAX_ROYALTY_BPS = 1000;

    uint16 private constant BPS_DENOMINATOR = 10_000;

    mapping(address collection => mapping(uint256 tokenId => Listing)) private _listings;
    mapping(address payee => uint256 balance) private _proceeds;

    uint16 public feeBps;
    address public feeRecipient;

    event Listed(address indexed collection, uint256 indexed tokenId, address indexed seller, uint256 price);
    event PriceChanged(address indexed collection, uint256 indexed tokenId, uint256 price);
    event Cancelled(address indexed collection, uint256 indexed tokenId, address indexed seller);
    event Pruned(address indexed collection, uint256 indexed tokenId, address indexed clearedBy);
    event Sold(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed buyer,
        address seller,
        uint256 price,
        uint256 royalty,
        uint256 fee
    );
    event Credited(address indexed payee, uint256 amount);
    event Withdrawn(address indexed payee, uint256 amount);
    event FeeChanged(uint16 bps, address recipient);

    error PriceIsZero();
    error NotOwner(address owner, address caller);
    error NotApproved();
    error NotListed();
    error AlreadyListed();
    error NotSeller(address seller, address caller);
    error WrongPayment(uint256 expected, uint256 sent);
    error ListingStale();
    error ListingIsFine();
    error NothingToWithdraw();
    error WithdrawFailed();
    error FeeTooHigh(uint16 max, uint16 requested);
    error ZeroAddress();

    constructor(uint16 feeBps_, address feeRecipient_) Ownable(msg.sender) {
        _setFee(feeBps_, feeRecipient_);
    }

    // ---------------------------------------------------------------- selling

    /**
     * @notice Offer a token you own for sale at a fixed price.
     * @dev Approval is checked here as well as at purchase. Checking only here
     *      would let a seller list, revoke, and leave a listing that cannot be
     *      filled. Checking only at purchase would let anyone list a token they
     *      have never touched, which is the cheapest way to poison a front end.
     */
    function list(address collection, uint256 tokenId, uint96 price) external {
        if (price == 0) revert PriceIsZero();
        if (_listings[collection][tokenId].seller != address(0)) revert AlreadyListed();

        address owner = IERC721(collection).ownerOf(tokenId);
        if (owner != msg.sender) revert NotOwner(owner, msg.sender);
        if (!_approved(collection, tokenId, msg.sender)) revert NotApproved();

        _listings[collection][tokenId] = Listing({seller: msg.sender, price: price});
        emit Listed(collection, tokenId, msg.sender, price);
    }

    /// @notice Change the asking price of a listing you own.
    function updatePrice(address collection, uint256 tokenId, uint96 price) external {
        if (price == 0) revert PriceIsZero();
        Listing storage item = _listings[collection][tokenId];
        if (item.seller == address(0)) revert NotListed();
        if (item.seller != msg.sender) revert NotSeller(item.seller, msg.sender);

        item.price = price;
        emit PriceChanged(collection, tokenId, price);
    }

    /// @notice Withdraw your own listing.
    function cancel(address collection, uint256 tokenId) external {
        Listing memory item = _listings[collection][tokenId];
        if (item.seller == address(0)) revert NotListed();
        if (item.seller != msg.sender) revert NotSeller(item.seller, msg.sender);

        delete _listings[collection][tokenId];
        emit Cancelled(collection, tokenId, msg.sender);
    }

    /**
     * @notice Clear a listing that can no longer be filled.
     * @dev Deliberately open to anyone. A seller who has moved their token
     *      elsewhere has no reason to come back and tidy up, and until somebody
     *      does the listing sits in every front end reading this contract as
     *      though it were real.
     */
    function pruneListing(address collection, uint256 tokenId) external {
        Listing memory item = _listings[collection][tokenId];
        if (item.seller == address(0)) revert NotListed();
        if (_fillable(collection, tokenId, item.seller)) revert ListingIsFine();

        delete _listings[collection][tokenId];
        emit Pruned(collection, tokenId, msg.sender);
    }

    // ----------------------------------------------------------------- buying

    /**
     * @notice Buy a listed token at exactly the asking price.
     *
     * @dev Exact payment is a deliberate choice over refunding the difference.
     *      Refunding means sending ether back to the buyer during the purchase,
     *      which is the same push payment this contract avoids everywhere else.
     *      It also happens to protect the buyer: if the seller raises the price
     *      while this transaction is in the mempool, it reverts instead of
     *      quietly paying more than the buyer agreed to.
     */
    function buy(address collection, uint256 tokenId) external payable nonReentrant {
        Listing memory item = _listings[collection][tokenId];
        if (item.seller == address(0)) revert NotListed();
        if (msg.value != item.price) revert WrongPayment(item.price, msg.value);
        if (!_fillable(collection, tokenId, item.seller)) revert ListingStale();

        // Effects before interactions. `safeTransferFrom` below hands control to
        // the buyer, and everything this contract believes must already be true
        // by the time that happens.
        delete _listings[collection][tokenId];

        (address creator, uint256 royalty) = _royalty(collection, tokenId, msg.value);
        uint256 fee = (msg.value * feeBps) / BPS_DENOMINATOR;
        uint256 toSeller = msg.value - royalty - fee;

        if (royalty != 0) _credit(creator, royalty);
        if (fee != 0) _credit(feeRecipient, fee);
        _credit(item.seller, toSeller);

        emit Sold(collection, tokenId, msg.sender, item.seller, msg.value, royalty, fee);

        IERC721(collection).safeTransferFrom(item.seller, msg.sender, tokenId);
    }

    // ------------------------------------------------------------------ money

    /// @notice Amount `payee` is owed and has not taken yet.
    function proceedsOf(address payee) external view returns (uint256) {
        return _proceeds[payee];
    }

    /**
     * @notice Take everything owed to you.
     * @dev Zeroed before the transfer. This is the one place in the contract
     *      where getting the order wrong drains it rather than merely confusing
     *      it, because the recipient is arbitrary code that is being handed
     *      ether and control at the same moment.
     */
    function withdraw() external nonReentrant {
        uint256 amount = _proceeds[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        _proceeds[msg.sender] = 0;

        (bool sent,) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert WithdrawFailed();

        emit Withdrawn(msg.sender, amount);
    }

    // ------------------------------------------------------------------ admin

    /**
     * @notice Change the marketplace fee.
     * @dev Bounded by a constant rather than by the owner's restraint. An owner
     *      who can set the fee to 100% can take a sale in full, and buyers have
     *      no way to see it coming.
     */
    function setFee(uint16 bps, address recipient) external onlyOwner {
        _setFee(bps, recipient);
    }

    // --------------------------------------------------------------- viewing

    /// @notice The listing for a token, or a zero-address seller if there is none.
    function listingOf(address collection, uint256 tokenId) external view returns (Listing memory) {
        return _listings[collection][tokenId];
    }

    /// @notice Whether a listing exists and could be filled right now.
    function isFillable(address collection, uint256 tokenId) external view returns (bool) {
        Listing memory item = _listings[collection][tokenId];
        if (item.seller == address(0)) return false;
        return _fillable(collection, tokenId, item.seller);
    }

    /// @notice How a given sale price would divide, without making the sale.
    function quote(address collection, uint256 tokenId, uint256 price)
        external
        view
        returns (address creator, uint256 royalty, uint256 fee, uint256 toSeller)
    {
        (creator, royalty) = _royalty(collection, tokenId, price);
        fee = (price * feeBps) / BPS_DENOMINATOR;
        toSeller = price - royalty - fee;
    }

    // -------------------------------------------------------------- internals

    function _setFee(uint16 bps, address recipient) private {
        if (bps > MAX_FEE_BPS) revert FeeTooHigh(MAX_FEE_BPS, bps);
        if (recipient == address(0)) revert ZeroAddress();

        feeBps = bps;
        feeRecipient = recipient;
        emit FeeChanged(bps, recipient);
    }

    function _credit(address payee, uint256 amount) private {
        _proceeds[payee] += amount;
        emit Credited(payee, amount);
    }

    function _approved(address collection, uint256 tokenId, address owner) private view returns (bool) {
        IERC721 nft = IERC721(collection);
        return nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(owner, address(this));
    }

    /**
     * @dev A listing is fillable when the seller still owns the token and this
     *      contract may still move it. Both can stop being true after listing
     *      without anybody telling this contract, which is the price of not
     *      taking custody.
     */
    function _fillable(address collection, uint256 tokenId, address seller) private view returns (bool) {
        try IERC721(collection).ownerOf(tokenId) returns (address owner) {
            if (owner != seller) return false;
        } catch {
            return false;
        }
        return _approved(collection, tokenId, seller);
    }

    /**
     * @dev Royalties are somebody else's code answering a question about money,
     *      so every answer is treated as hostile until it is bounded.
     *
     *      A collection that reports a royalty larger than the sale price would
     *      underflow the seller's share and revert the sale. That reverts every
     *      purchase of that collection forever, and the marketplace would look
     *      like the broken party. Capping keeps the sale alive and keeps the
     *      damage inside the collection that caused it.
     */
    function _royalty(address collection, uint256 tokenId, uint256 price)
        private
        view
        returns (address creator, uint256 amount)
    {
        if (collection.code.length == 0) return (address(0), 0);

        try IERC165(collection).supportsInterface(type(IERC2981).interfaceId) returns (bool supported) {
            if (!supported) return (address(0), 0);
        } catch {
            return (address(0), 0);
        }

        try IERC2981(collection).royaltyInfo(tokenId, price) returns (address receiver, uint256 reported) {
            if (receiver == address(0) || reported == 0) return (address(0), 0);

            uint256 cap = (price * MAX_ROYALTY_BPS) / BPS_DENOMINATOR;
            return (receiver, reported > cap ? cap : reported);
        } catch {
            return (address(0), 0);
        }
    }
}
