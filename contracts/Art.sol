// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Art
 * @notice Token art generated on chain, so a token is never a link to a
 *         picture somebody has to keep paying for.
 *
 * The usual pattern points `tokenURI` at IPFS. That is a promise about a file
 * on a network nobody in the transaction controls, and a collection whose art
 * has fallen off its pinning service is a common enough sight to be a joke.
 * Everything here is built from the token id at read time, so the art lasts
 * exactly as long as the chain does.
 *
 * The picture is also the thing the contract argues about. Each token draws
 * its own split: the creator's royalty against everything the seller keeps.
 *
 * It draws the royalty and nothing else on purpose. A marketplace fee would
 * make a better picture and the collection has no way to know one, because
 * the fee belongs to whichever marketplace the token is sold on. Art that
 * states a number its own contract cannot produce is decoration pretending to
 * be data.
 */
library Art {
    using Strings for uint256;

    /// @dev The royalty ceiling the collection enforces, in basis points.
    uint256 internal constant MAX_ROYALTY_BPS = 1000;

    /**
     * @notice The royalty this token carries, in basis points.
     * @dev Deterministic in the id, between 250 and 1000, so every token sits
     *      inside the ceiling and the marketplace never has to cap one.
     *      `ConsignCollection` registers this exact number with ERC-2981 at
     *      mint, so the picture and `royaltyInfo` cannot disagree.
     */
    function royaltyBps(uint256 id) internal pure returns (uint256) {
        return 250 + (uint256(keccak256(abi.encodePacked(id, "royalty"))) % 751);
    }

    /// @dev Warm grounds, all of them readable behind ink.
    function _ground(uint256 id) private pure returns (string memory) {
        string[4] memory grounds = ["#f7f2ea", "#efe7d9", "#f2ece3", "#faf6ef"];
        return grounds[id % 4];
    }

    /// @dev The seller's colour, the loud one, as it is on the page.
    function _hot(uint256 id) private pure returns (string memory) {
        string[5] memory hots = ["#d9530a", "#c2410c", "#e2690b", "#b3311a", "#e8590c"];
        return hots[uint256(keccak256(abi.encodePacked(id, "hot"))) % 5];
    }

    /// @dev The creator's colour.
    function _cool(uint256 id) private pure returns (string memory) {
        string[5] memory cools = ["#6b5bd0", "#7c6bd6", "#5b4fc0", "#8072e0", "#4f43b0"];
        return cools[uint256(keccak256(abi.encodePacked(id, "cool"))) % 5];
    }

    /**
     * @notice The image, as an SVG string.
     * @dev 600 by 600. A ring with a four pointed star inside it, over one bar
     *      divided where the royalty falls. Everything derives from `id`, so a
     *      token draws the same picture on every client that renders it.
     */
    function svg(uint256 id) internal pure returns (string memory) {
        uint256 royalty = royaltyBps(id);
        uint256 seller = 10_000 - royalty;

        // 480 wide drawing area starting at x = 60.
        uint256 wSeller = (seller * 480) / 10_000;
        uint256 wRoyalty = 480 - wSeller;

        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">',
            '<rect width="600" height="600" fill="', _ground(id), '"/>',
            '<circle cx="300" cy="250" r="150" fill="none" stroke="#100e0c" stroke-width="18"/>',
            '<path d="M300 155 L318 232 L395 250 L318 268 L300 345 L282 268 L205 250 L282 232 Z" fill="',
            _hot(id), '"/>',
            '<rect x="60" y="470" width="', wSeller.toString(), '" height="26" fill="', _hot(id), '"/>',
            '<rect x="', (60 + wSeller).toString(), '" y="470" width="', wRoyalty.toString(),
            '" height="26" fill="', _cool(id), '"/>',
            '<rect x="60" y="470" width="480" height="26" fill="none" stroke="#100e0c" stroke-width="3"/>',
            _caption(id, royalty),
            "</svg>"
        );
    }

    /// @dev The id and the royalty, set in the same mono the page uses.
    function _caption(uint256 id, uint256 royalty) private pure returns (string memory) {
        return string.concat(
            '<text x="60" y="440" font-family="IBM Plex Mono, ui-monospace, monospace" ',
            'font-size="26" font-weight="600" fill="#100e0c">CONSIGN #', id.toString(), "</text>",
            '<text x="540" y="440" text-anchor="end" ',
            'font-family="IBM Plex Mono, ui-monospace, monospace" font-size="26" fill="#6a635a">',
            percent(royalty), " ROYALTY</text>"
        );
    }

    /// @notice Basis points as a percentage with one decimal, without a float.
    function percent(uint256 bps) internal pure returns (string memory) {
        return string.concat((bps / 100).toString(), ".", ((bps % 100) / 10).toString(), "%");
    }

    /**
     * @notice The full ERC-721 metadata document, as a data URI.
     * @dev Base64 rather than raw, because a raw JSON data URI carrying an SVG
     *      needs percent encoding that several wallets get wrong.
     */
    function tokenURI(uint256 id, string memory name) internal pure returns (string memory) {
        uint256 royalty = royaltyBps(id);

        string memory json = string.concat(
            '{"name":"', name, " #", id.toString(),
            '","description":"A share of a sale, drawn on chain. The bar is the split: what the seller keeps, ',
            'and what the creator is owed on every resale.",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg(id))), '",',
            '"attributes":[',
            '{"trait_type":"Creator royalty","value":"', percent(royalty), '"},',
            '{"trait_type":"Seller keeps","value":"', percent(10_000 - royalty), '"}',
            "]}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
}
