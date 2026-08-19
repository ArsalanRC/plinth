// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {DogArt} from "./DogArt.sol";

/**
 * @title PlinthDogs
 * @notice The second collection. Nine layers, on chain, same rules as the first.
 *
 * **This is deliberately a near-copy of `PlinthCollection` rather than a shared
 * base class, and the reason is the size limit.** The art library is inlined
 * into whichever contract imports it, so this contract's bytecode is its own
 * plumbing plus nine layers of drawing. Nine measured at 23,087 bytes against
 * an EIP-170 ceiling of 24,576, which leaves under 1,500 to spare.
 *
 * An abstract base with virtual `_svg` and `_traits` would be the tidier
 * arrangement and it costs bytecode: a dispatch table, and the compiler can no
 * longer inline through the virtual call. Spending part of a 1,500 byte margin
 * on tidiness that no reader benefits from is the wrong trade here.
 *
 * The duplication is real and worth naming. If a bug is found in `mint`,
 * `tokensOf` or the royalty wiring, **it exists twice**. Both files say so.
 *
 * The one structural difference is `traitsOf`, which returns nine rather than
 * seven. That is not incidental: the page reads the array positionally to build
 * the rarity table, so the two collections cannot share a reader either.
 */
contract PlinthDogs is ERC721, ERC2981, Ownable {
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
     * @dev Ids start at 1, so id 0 stays free to mean "no token". The royalty
     *      is registered here rather than derived at read time, so
     *      `royaltyInfo` and the picture cannot drift apart.
     */
    function mint(address to) external returns (uint256 tokenId) {
        if (totalMinted >= maxSupply) revert SoldOut(maxSupply);

        tokenId = ++totalMinted;

        uint96 bps = uint96(DogArt.royaltyBps(tokenId));
        _setTokenRoyalty(tokenId, _royaltyReceiver(), bps);
        _safeMint(to, tokenId);

        emit Minted(to, tokenId, bps);
    }

    /// @notice The metadata document, built from the id every time it is asked for.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NoSuchToken(tokenId);
        return DogArt.tokenURI(tokenId, name());
    }

    /// @notice The image on its own, for anything that wants the SVG directly.
    function imageOf(uint256 tokenId) external view returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NoSuchToken(tokenId);
        return DogArt.svg(tokenId);
    }

    /**
     * @notice The nine layers of a token id.
     * @dev Pure, and deliberately does not require the token to exist, so a
     *      front end can show what the next mint would look like before anybody
     *      pays for it and the rarity table can be sampled without minting.
     *
     *      Order: background, coat, pattern, ears, eye colour, eye shape,
     *      muzzle, collar, accessory. The same order as the metadata.
     */
    function traitsOf(uint256 tokenId) external pure returns (string[9] memory) {
        (, string memory bg) = DogArt.background(tokenId);
        (, string memory fur) = DogArt.coat(tokenId);
        (, string memory eyes) = DogArt.eyeColour(tokenId);

        return [
            bg,
            fur,
            DogArt.pattern(tokenId),
            DogArt.ears(tokenId),
            eyes,
            DogArt.eyeShape(tokenId),
            DogArt.muzzle(tokenId),
            DogArt.collar(tokenId),
            DogArt.accessory(tokenId)
        ];
    }

    /**
     * @notice Every token this address owns.
     * @dev Linear in the supply and unusable from another contract at any real
     *      size. It exists for the page, which calls it with `eth_call` where
     *      nobody pays the gas. Enumerable would put that cost on every
     *      transfer instead, forever, to save a read that happens off chain.
     *
     *      At a supply of 5000 this is a long loop. Still cheaper than the
     *      alternative, and still free where it is actually called.
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
