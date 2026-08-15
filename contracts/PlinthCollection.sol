// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {Art} from "./Art.sol";

/**
 * @title PlinthCollection
 * @notice A small ERC-721 collection whose art and metadata live on chain.
 *
 * The token standard itself comes from OpenZeppelin and that is on purpose.
 * Hand-writing ERC-721 is not a display of skill, it is a place to put a bug
 * that costs somebody their token. The judgement in this file is in what sits
 * around the standard:
 *
 * - A supply that cannot be raised after deployment, so the promise is
 *   checkable rather than trusted.
 * - Metadata with no off-chain half. `tokenURI` builds the image every time it
 *   is called, so there is no pinning service to lapse and no base URI for a
 *   future owner to repoint. There is no setter because there is nowhere to
 *   set it to.
 * - A royalty registered per token, matching exactly the number its own
 *   picture draws.
 */
contract PlinthCollection is ERC721, ERC2981, Ownable {
    /// @notice Basis points a token's royalty can never exceed.
    uint96 public constant MAX_ROYALTY_BPS = 1000;

    /// @notice Tokens that will ever exist. Immutable, so the promise is checkable.
    uint256 public immutable maxSupply;

    uint256 public totalMinted;

    event Minted(address indexed to, uint256 indexed tokenId, uint96 royaltyBps);

    error SoldOut(uint256 max);
    error NoSuchToken(uint256 tokenId);
    error ZeroAddress();

    /**
     * @param royaltyReceiver Who every token's royalty is paid to. The rate is
     *        per token and comes from the art, but the recipient is one address
     *        for the whole collection, which is what a creator actually wants.
     */
    constructor(string memory name_, string memory symbol_, uint256 maxSupply_, address royaltyReceiver)
        ERC721(name_, symbol_)
        Ownable(msg.sender)
    {
        if (royaltyReceiver == address(0)) revert ZeroAddress();

        maxSupply = maxSupply_;
        _setDefaultRoyalty(royaltyReceiver, 0);
    }

    /**
     * @notice Mint the next token to an address.
     * @dev Ids start at 1 and run up, so id 0 stays free to mean "no token".
     *      Open to anyone: this collection exists to be traded on a testnet,
     *      and a mint behind an allowlist would only make it harder to try.
     *
     *      The royalty is registered here rather than derived at read time so
     *      that `royaltyInfo` and the picture cannot drift apart. Both come
     *      from `Art.royaltyBps`.
     */
    function mint(address to) external returns (uint256 tokenId) {
        if (totalMinted >= maxSupply) revert SoldOut(maxSupply);

        tokenId = ++totalMinted;

        uint96 bps = uint96(Art.royaltyBps(tokenId));
        _setTokenRoyalty(tokenId, _royaltyReceiver(), bps);
        _safeMint(to, tokenId);

        emit Minted(to, tokenId, bps);
    }

    /// @notice The metadata document, built from the id every time it is asked for.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NoSuchToken(tokenId);
        return Art.tokenURI(tokenId, name());
    }

    /// @notice The image on its own, for anything that wants the SVG directly.
    function imageOf(uint256 tokenId) external view returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NoSuchToken(tokenId);
        return Art.svg(tokenId);
    }

    /**
     * @notice The seven layers of a token id.
     * @dev Pure, and deliberately does not require the token to exist. The art
     *      is a function of the id alone, so a front end can show what the next
     *      mint would look like before anybody pays for it, and the rarity
     *      table can be sampled without minting a hundred tokens first.
     *
     *      Order: background, fur, pattern, eye colour, eye shape, mouth,
     *      accessory. The same order they appear in the metadata.
     */
    function traitsOf(uint256 tokenId) external pure returns (string[7] memory) {
        (, string memory bg) = Art.background(tokenId);
        (, string memory coat) = Art.fur(tokenId);
        (, string memory eyes) = Art.eyeColour(tokenId);

        return [
            bg,
            coat,
            Art.pattern(tokenId),
            eyes,
            Art.eyeShape(tokenId),
            Art.mouth(tokenId),
            Art.accessory(tokenId)
        ];
    }

    /**
     * @notice Every token this address owns.
     * @dev Linear in the supply, and unusable from another contract at any
     *      real size. It exists for the page, which calls it with `eth_call`
     *      where nobody pays for the gas. Enumerable would put that cost on
     *      every single transfer instead, forever, to save a read that happens
     *      off chain.
     */
    function tokensOf(address owner) external view returns (uint256[] memory ids) {
        uint256 found;
        uint256 minted = totalMinted;
        uint256[] memory buffer = new uint256[](balanceOf(owner));

        for (uint256 id = 1; id <= minted && found < buffer.length; id++) {
            if (_ownerOf(id) == owner) {
                buffer[found] = id;
                found++;
            }
        }

        return buffer;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /// @dev The address every token's royalty goes to, read back from ERC-2981.
    function _royaltyReceiver() private view returns (address receiver) {
        (receiver,) = royaltyInfo(0, 0);
    }
}
