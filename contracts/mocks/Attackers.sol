// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IPlinth {
    function list(address collection, uint256 tokenId, uint96 price) external;
    function buy(address collection, uint256 tokenId) external payable;
    function withdraw() external;
}

/**
 * @dev Shared by the attackers so each one can become a real seller. A contract
 *      cannot accrue proceeds without selling something, and a seller that
 *      never sold is not the case any of these tests are about.
 */
abstract contract Seller is IERC721Receiver {
    IPlinth internal immutable market;

    constructor(IPlinth market_) {
        market = market_;
    }

    function listOn(address collection, uint256 tokenId, uint96 price) external {
        IERC721(collection).approve(address(market), tokenId);
        market.list(collection, tokenId, price);
    }

    function callWithdraw() external {
        market.withdraw();
    }

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        virtual
        returns (bytes4)
    {
        return IERC721Receiver.onERC721Received.selector;
    }
}

/**
 * @notice A seller that cannot be paid.
 *
 * Its `receive` reverts, which under a marketplace that pays sellers during the
 * purchase makes every sale of its items fail, and makes the buyer look like
 * the broken party. Under this one the sale goes through and only this
 * contract's own withdrawal fails, which is the point.
 */
contract RejectsEther is Seller {
    constructor(IPlinth market_) Seller(market_) {}

    receive() external payable {
        // A string revert, not a custom error, because this mock is imitating
        // the badly written contracts the marketplace has to survive.
        // solhint-disable-next-line gas-custom-errors
        revert("no thanks");
    }
}

/**
 * @notice Re-enters `withdraw` the moment it is paid.
 *
 * This is the attack that takes money rather than merely confusing state. If
 * the balance were zeroed after the transfer instead of before it, each nested
 * call would read the same balance again and pay it out again until the
 * marketplace was empty, including money owed to people who are not party to
 * this sale at all.
 */
contract ReentrantWithdrawer is Seller {
    /**
     * @dev Enough attempts to empty a marketplace holding several sales worth
     *      of other people's money. One attempt is not a test: a single nested
     *      withdrawal fails for want of balance whenever the contract holds
     *      only what this attacker is owed, which makes the defence look
     *      load-bearing when it is the arithmetic doing the work.
     */
    uint256 public constant MAX_REENTRIES = 4;

    uint256 public reentryAttempts;
    uint256 public reentrySuccesses;

    constructor(IPlinth market_) Seller(market_) {}

    // A fallback doing real work is exactly the hazard here, so the rule
    // warning about it is right in general and wrong about this contract.
    // solhint-disable-next-line no-complex-fallback
    receive() external payable {
        if (reentryAttempts >= MAX_REENTRIES) return;
        reentryAttempts++;

        try market.withdraw() {
            reentrySuccesses++;
        } catch {} // solhint-disable-line no-empty-blocks
    }
}

/**
 * @notice Re-enters `buy` from inside the token transfer that completes a sale.
 *
 * `safeTransferFrom` calls the receiver back, and the receiver is the buyer,
 * who is the one party in a sale nobody has any reason to trust. The listing is
 * already deleted by the time control arrives here, so the second purchase
 * finds nothing to buy.
 */
contract ReentrantBuyer is Seller {
    address private _collection;
    uint256 private _tokenId;
    uint256 private _price;

    uint256 public reentryAttempts;
    bool public reentryReverted;

    constructor(IPlinth market_) Seller(market_) {}

    function attack(address collection, uint256 tokenId, uint256 price) external {
        _collection = collection;
        _tokenId = tokenId;
        _price = price;
        market.buy{value: price}(collection, tokenId);
    }

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        override
        returns (bytes4)
    {
        if (reentryAttempts == 0 && address(this).balance >= _price) {
            reentryAttempts++;

            try market.buy{value: _price}(_collection, _tokenId) {
                reentryReverted = false;
            } catch {
                reentryReverted = true;
            }
        }
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {}
}
