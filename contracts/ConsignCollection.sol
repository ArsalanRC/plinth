// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ConsignCollection
 * @notice A small ERC-721 collection with a creator royalty, built to give the
 *         marketplace something real to trade.
 *
 * The token standard itself comes from OpenZeppelin and that is on purpose.
 * Hand-writing ERC-721 is not a display of skill, it is a place to put a bug
 * that costs somebody their token. The judgement in this file is in what sits
 * around the standard: a supply that cannot be raised later, a royalty bounded
 * at construction, and metadata that can be frozen once and never moved again.
 */
contract ConsignCollection is ERC721, ERC2981, Ownable {
    using Strings for uint256;

    /// @notice Basis points the creator royalty may never exceed.
    uint96 public constant MAX_ROYALTY_BPS = 1000;

    /// @notice Tokens that will ever exist. Immutable, so the promise is checkable.
    uint256 public immutable maxSupply;

    uint256 public totalMinted;
    bool public metadataFrozen;

    string private _baseTokenURI;

    event Minted(address indexed to, uint256 indexed tokenId);
    event BaseURIChanged(string baseURI);
    event MetadataFrozen(string baseURI);

    error SoldOut(uint256 max);
    error RoyaltyTooHigh(uint96 max, uint96 requested);
    error MetadataIsFrozen();
    error NoSuchToken(uint256 tokenId);
    error ZeroAddress();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        uint256 maxSupply_,
        address royaltyReceiver,
        uint96 royaltyBps
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        if (royaltyBps > MAX_ROYALTY_BPS) revert RoyaltyTooHigh(MAX_ROYALTY_BPS, royaltyBps);
        if (royaltyReceiver == address(0)) revert ZeroAddress();

        maxSupply = maxSupply_;
        _baseTokenURI = baseTokenURI_;
        _setDefaultRoyalty(royaltyReceiver, royaltyBps);
    }

    /**
     * @notice Mint the next token to an address.
     * @dev Ids start at 1 and run up, so id 0 stays free to mean "no token".
     *      Open to anyone: this collection exists to be traded on a testnet, and
     *      a mint behind an allowlist would only make it harder to try.
     */
    function mint(address to) external returns (uint256 tokenId) {
        if (totalMinted >= maxSupply) revert SoldOut(maxSupply);

        tokenId = ++totalMinted;
        _safeMint(to, tokenId);
        emit Minted(to, tokenId);
    }

    /// @notice Point metadata somewhere else, until it is frozen.
    function setBaseURI(string calldata baseTokenURI_) external onlyOwner {
        if (metadataFrozen) revert MetadataIsFrozen();

        _baseTokenURI = baseTokenURI_;
        emit BaseURIChanged(baseTokenURI_);
    }

    /**
     * @notice Give up the right to move the metadata, permanently.
     * @dev One way on purpose. A collection whose owner can still repoint every
     *      token is a collection whose art is a promise rather than a holding.
     */
    function freezeMetadata() external onlyOwner {
        metadataFrozen = true;
        emit MetadataFrozen(_baseTokenURI);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NoSuchToken(tokenId);
        return string.concat(_baseTokenURI, tokenId.toString(), ".json");
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
