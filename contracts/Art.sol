// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/* solhint-disable quotes */
// Every string here is a fragment of SVG or JSON, both of which quote their own
// attributes with double quotes. Single-quoting the Solidity is what keeps the
// markup readable and free of escapes.

/**
 * @title Art
 * @notice A generative cat, drawn on chain, in seven layers.
 *
 * The usual pattern points `tokenURI` at IPFS. That is a promise about a file
 * on a network nobody in the transaction controls, and a collection whose art
 * has fallen off its pinning service is a common enough sight to be a joke.
 * Everything here is built from the token id at read time, so the art lasts
 * exactly as long as the chain does.
 *
 * Seven independent traits, each rolled from its own hash of the id and each
 * weighted, so some cats are genuinely rarer than others:
 *
 * | Layer     | Options | Rarest             |
 * |-----------|---------|--------------------|
 * | Background|       8 | Void, 3%           |
 * | Fur       |       8 | Void, 3%           |
 * | Pattern   |       5 | Spotted, 8%        |
 * | Eye colour|       6 | Heterochromia, 5%  |
 * | Eye shape |       5 | Laser, 4%          |
 * | Mouth     |       4 | Fangs, 10%         |
 * | Accessory |       7 | Crown, 3%          |
 *
 * That is 268,800 distinct cats against a supply of 500, so a collision is
 * possible and vanishingly unlikely. The traits are published in the metadata
 * as ERC-721 attributes, which is what lets a marketplace filter by them.
 *
 * **Colours are packed as `uint24` rather than stored as strings.** A palette
 * written out as "#d9530a" costs seven bytes of bytecode per entry and there
 * are forty of them. Packed, each is three, and the hex conversion is written
 * once. That is the difference between comfortably inside the 24KB contract
 * limit and uncomfortably near it.
 */
library Art {
    using Strings for uint256;

    /// @dev The royalty ceiling the collection enforces, in basis points.
    uint256 internal constant MAX_ROYALTY_BPS = 1000;

    /**
     * @notice The royalty this token carries, in basis points.
     * @dev Deterministic in the id, between 250 and 1000, so every token sits
     *      inside the ceiling and the marketplace never has to cap one.
     *      `PlinthCollection` registers this exact number with ERC-2981 at
     *      mint, so the token and `royaltyInfo` cannot disagree.
     */
    function royaltyBps(uint256 id) internal pure returns (uint256) {
        return 250 + (_hash(id, "royalty") % 751);
    }

    // ------------------------------------------------------------- rolling

    function _hash(uint256 id, string memory salt) private pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(id, salt)));
    }

    /// @dev A 0 to 99 roll for one layer, independent of every other layer.
    function _roll(uint256 id, string memory salt) private pure returns (uint256) {
        return _hash(id, salt) % 100;
    }

    // ------------------------------------------------------------- palette

    /// @dev `#rrggbb` from a packed colour. Written once, used everywhere.
    function _hex(uint24 colour) private pure returns (string memory) {
        bytes memory out = new bytes(7);
        bytes16 symbols = "0123456789abcdef";

        out[0] = "#";
        for (uint256 i = 0; i < 6; i++) {
            out[6 - i] = symbols[(uint256(colour) >> (i * 4)) & 0xf];
        }

        return string(out);
    }

    // -------------------------------------------------------------- layers

    /// @dev Background. Void is the 3% one.
    function background(uint256 id) internal pure returns (uint24 colour, string memory name) {
        uint256 r = _roll(id, "bg");
        if (r < 18) return (0xf2e7d4, "Sand");
        if (r < 34) return (0xdce8e4, "Mint");
        if (r < 50) return (0xe8dcef, "Lilac");
        if (r < 64) return (0xf6dcd8, "Blush");
        if (r < 77) return (0xd9e3f0, "Sky");
        if (r < 88) return (0xf0e3c2, "Butter");
        if (r < 97) return (0x2c3440, "Slate");
        return (0x100e0c, "Void");
    }

    /// @dev Fur. Void is the 3% one, and it needs a light outline to read.
    function fur(uint256 id) internal pure returns (uint24 colour, string memory name) {
        uint256 r = _roll(id, "fur");
        if (r < 20) return (0xd9924a, "Ginger");
        if (r < 38) return (0x8c8c94, "Grey");
        if (r < 54) return (0xf3ece1, "Cream");
        if (r < 68) return (0x6b4a33, "Chocolate");
        if (r < 80) return (0xc9713a, "Marmalade");
        if (r < 90) return (0xa8b6c4, "Russian Blue");
        if (r < 97) return (0xe8c86a, "Honey");
        return (0x1a1a1e, "Void");
    }

    /// @dev Markings drawn over the fur.
    function pattern(uint256 id) internal pure returns (string memory) {
        uint256 r = _roll(id, "pattern");
        if (r < 40) return "Solid";
        if (r < 65) return "Tabby";
        if (r < 80) return "Tuxedo";
        if (r < 92) return "Patch";
        return "Spotted";
    }

    function eyeColour(uint256 id) internal pure returns (uint24 colour, string memory name) {
        uint256 r = _roll(id, "eyecol");
        if (r < 26) return (0x4c9a52, "Green");
        if (r < 48) return (0xc9a227, "Amber");
        if (r < 68) return (0x3d7ac4, "Blue");
        if (r < 82) return (0x7a5230, "Copper");
        if (r < 95) return (0x5f4b8b, "Violet");
        return (0x4c9a52, "Heterochromia");
    }

    function eyeShape(uint256 id) internal pure returns (string memory) {
        uint256 r = _roll(id, "eyeshape");
        if (r < 44) return "Round";
        if (r < 66) return "Sleepy";
        if (r < 81) return "Wink";
        if (r < 96) return "Wide";
        return "Laser";
    }

    function mouth(uint256 id) internal pure returns (string memory) {
        uint256 r = _roll(id, "mouth");
        if (r < 40) return "Smile";
        if (r < 70) return "Neutral";
        if (r < 90) return "Blep";
        return "Fangs";
    }

    function accessory(uint256 id) internal pure returns (string memory) {
        uint256 r = _roll(id, "acc");
        if (r < 35) return "None";
        if (r < 55) return "Collar";
        if (r < 70) return "Bow";
        if (r < 82) return "Scarf";
        if (r < 91) return "Sunglasses";
        if (r < 97) return "Beanie";
        return "Crown";
    }

    // --------------------------------------------------------- the drawing

    /**
     * @notice The cat, as an SVG string.
     * @dev 600 by 600. Layers paint back to front: background, ears, head,
     *      pattern, eyes, nose, mouth, whiskers, accessory. Everything derives
     *      from `id`, so a token draws the same cat on every client.
     */
    function svg(uint256 id) internal pure returns (string memory) {
        (uint24 bg,) = background(id);
        (uint24 coat,) = fur(id);

        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">',
            '<rect width="600" height="600" fill="', _hex(bg), '"/>',
            _ears(coat),
            '<ellipse cx="300" cy="340" rx="176" ry="156" fill="', _hex(coat),
            '" stroke="#100e0c" stroke-width="8"/>',
            _pattern(id, coat),
            _eyes(id),
            '<path d="M283 384 L317 384 L300 403 Z" fill="#e08a94" stroke="#100e0c" stroke-width="4"/>',
            _mouth(id),
            _whiskers(),
            _accessory(id),
            "</svg>"
        );
    }

    function _ears(uint24 coat) private pure returns (string memory) {
        string memory c = _hex(coat);
        return string.concat(
            '<path d="M158 250 L176 104 L286 200 Z" fill="', c, '" stroke="#100e0c" stroke-width="8"/>',
            '<path d="M442 250 L424 104 L314 200 Z" fill="', c, '" stroke="#100e0c" stroke-width="8"/>',
            '<path d="M186 232 L196 152 L252 202 Z" fill="#e08a94"/>',
            '<path d="M414 232 L404 152 L348 202 Z" fill="#e08a94"/>'
        );
    }

    /// @dev Markings, clipped to the head by sitting inside its ellipse.
    function _pattern(uint256 id, uint24 coat) private pure returns (string memory) {
        string memory kind = pattern(id);
        bytes32 k = keccak256(bytes(kind));

        if (k == keccak256("Solid")) return "";

        if (k == keccak256("Tabby")) {
            return string.concat(
                '<g stroke="#100e0c" stroke-opacity="0.45" stroke-width="11" fill="none" stroke-linecap="round">',
                '<path d="M262 214 L272 250"/><path d="M300 206 L300 244"/><path d="M338 214 L328 250"/>',
                '<path d="M150 320 L196 332"/><path d="M450 320 L404 332"/>',
                '<path d="M154 372 L198 378"/><path d="M446 372 L402 378"/></g>'
            );
        }

        if (k == keccak256("Tuxedo")) {
            // A white muzzle and chin, not a stripe down the whole face. The
            // first version started level with the eyes and read as a blaze
            // painted over the cat rather than as its markings. The nose and
            // mouth draw after this, so they land on the white, which is what
            // a real tuxedo cat looks like.
            return '<path d="M300 350 Q252 400 266 460 Q300 478 334 460 Q348 400 300 350 Z"'
                ' fill="#f8f4ec" fill-opacity="0.94"/>';
        }

        if (k == keccak256("Patch")) {
            return string.concat(
                '<ellipse cx="212" cy="286" rx="58" ry="52" fill="#100e0c" fill-opacity="0.34"/>',
                '<ellipse cx="382" cy="420" rx="46" ry="38" fill="#100e0c" fill-opacity="0.24"/>'
            );
        }

        // Spotted, the 8%.
        coat; // silences an unused warning without a lint suppression comment
        return string.concat(
            '<g fill="#100e0c" fill-opacity="0.3">',
            '<circle cx="206" cy="300" r="17"/><circle cx="238" cy="368" r="13"/>',
            '<circle cx="196" cy="390" r="11"/><circle cx="392" cy="306" r="16"/>',
            '<circle cx="366" cy="374" r="12"/><circle cx="406" cy="392" r="10"/></g>'
        );
    }

    function _eyes(uint256 id) private pure returns (string memory) {
        (uint24 col,) = eyeColour(id);
        string memory shape = eyeShape(id);
        bytes32 s = keccak256(bytes(shape));

        // Heterochromia is the only trait that reads another layer: one eye
        // keeps the rolled colour and the other goes blue, which is what the
        // real thing looks like.
        (, string memory colName) = eyeColour(id);
        string memory left = _hex(col);
        string memory right =
            keccak256(bytes(colName)) == keccak256("Heterochromia") ? _hex(0x3d7ac4) : left;

        if (s == keccak256("Sleepy")) {
            return string.concat(
                '<g stroke="#100e0c" stroke-width="10" fill="none" stroke-linecap="round">',
                '<path d="M204 318 Q240 296 276 318"/><path d="M324 318 Q360 296 396 318"/></g>'
            );
        }

        if (s == keccak256("Wink")) {
            return string.concat(
                _eye(240, 316, 36, 42, left),
                '<path d="M324 318 Q360 296 396 318" stroke="#100e0c" stroke-width="10" fill="none"'
                ' stroke-linecap="round"/>'
            );
        }

        if (s == keccak256("Wide")) {
            return string.concat(_eye(240, 314, 44, 48, left), _eye(360, 314, 44, 48, right));
        }

        if (s == keccak256("Laser")) {
            return string.concat(
                _eye(240, 316, 36, 42, left),
                _eye(360, 316, 36, 42, right),
                '<g stroke="#e8331f" stroke-width="9" stroke-opacity="0.85" stroke-linecap="round">',
                '<path d="M240 316 L60 250"/><path d="M360 316 L540 250"/></g>'
            );
        }

        return string.concat(_eye(240, 316, 36, 42, left), _eye(360, 316, 36, 42, right));
    }

    function _eye(uint256 cx, uint256 cy, uint256 rx, uint256 ry, string memory col)
        private
        pure
        returns (string memory)
    {
        return string.concat(
            '<ellipse cx="', cx.toString(), '" cy="', cy.toString(),
            '" rx="', rx.toString(), '" ry="', ry.toString(),
            '" fill="', col, '" stroke="#100e0c" stroke-width="6"/>',
            '<ellipse cx="', cx.toString(), '" cy="', cy.toString(),
            '" rx="', (rx / 3).toString(), '" ry="', (ry / 2).toString(), '" fill="#100e0c"/>',
            '<circle cx="', (cx - rx / 3).toString(), '" cy="', (cy - ry / 3).toString(),
            '" r="7" fill="#ffffff" fill-opacity="0.9"/>'
        );
    }

    function _mouth(uint256 id) private pure returns (string memory) {
        bytes32 m = keccak256(bytes(mouth(id)));

        if (m == keccak256("Neutral")) {
            return '<path d="M300 403 L300 418 M262 434 Q300 418 338 434"'
                ' stroke="#100e0c" stroke-width="7" fill="none" stroke-linecap="round"/>';
        }

        if (m == keccak256("Blep")) {
            return string.concat(
                '<path d="M300 403 L300 418 M268 428 Q300 452 332 428"',
                ' stroke="#100e0c" stroke-width="7" fill="none" stroke-linecap="round"/>',
                '<path d="M286 440 Q300 472 314 440 Z" fill="#e8697a" stroke="#100e0c" stroke-width="5"/>'
            );
        }

        if (m == keccak256("Fangs")) {
            return string.concat(
                '<path d="M300 403 L300 418 M262 430 Q300 448 338 430"',
                ' stroke="#100e0c" stroke-width="7" fill="none" stroke-linecap="round"/>',
                '<path d="M276 434 L284 458 L292 436 Z" fill="#ffffff" stroke="#100e0c" stroke-width="3"/>',
                '<path d="M308 436 L316 458 L324 434 Z" fill="#ffffff" stroke="#100e0c" stroke-width="3"/>'
            );
        }

        // Smile
        return '<path d="M300 403 L300 420 M258 424 Q280 452 300 420 Q320 452 342 424"'
            ' stroke="#100e0c" stroke-width="7" fill="none" stroke-linecap="round"/>';
    }

    function _whiskers() private pure returns (string memory) {
        return '<g stroke="#100e0c" stroke-width="5" stroke-opacity="0.7" stroke-linecap="round">'
            '<path d="M196 400 L96 384"/><path d="M196 416 L100 428"/>'
            '<path d="M404 400 L504 384"/><path d="M404 416 L500 428"/></g>';
    }

    function _accessory(uint256 id) private pure returns (string memory) {
        bytes32 a = keccak256(bytes(accessory(id)));

        if (a == keccak256("Collar")) {
            return '<path d="M196 452 Q300 512 404 452 L404 480 Q300 540 196 480 Z"'
                ' fill="#c2410c" stroke="#100e0c" stroke-width="6"/>'
                '<circle cx="300" cy="506" r="18" fill="#e8c86a" stroke="#100e0c" stroke-width="5"/>';
        }

        if (a == keccak256("Bow")) {
            return '<g transform="translate(396 176)">'
                '<path d="M0 0 L-44 -26 L-44 26 Z" fill="#e0567a" stroke="#100e0c" stroke-width="6"/>'
                '<path d="M0 0 L44 -26 L44 26 Z" fill="#e0567a" stroke="#100e0c" stroke-width="6"/>'
                '<circle r="13" fill="#f2a0b4" stroke="#100e0c" stroke-width="5"/></g>';
        }

        if (a == keccak256("Scarf")) {
            return '<path d="M186 460 Q300 528 414 460 L414 496 Q300 564 186 496 Z"'
                ' fill="#3f7a8c" stroke="#100e0c" stroke-width="6"/>'
                '<path d="M370 486 L420 580 L364 578 Z" fill="#3f7a8c" stroke="#100e0c" stroke-width="6"/>';
        }

        if (a == keccak256("Sunglasses")) {
            return '<g stroke="#100e0c" stroke-width="7">'
                '<rect x="186" y="284" width="112" height="70" rx="16" fill="#1c1c22"/>'
                '<rect x="302" y="284" width="112" height="70" rx="16" fill="#1c1c22"/>'
                '<path d="M298 306 L302 306" /><path d="M186 300 L142 288"/>'
                '<path d="M414 300 L458 288"/></g>';
        }

        if (a == keccak256("Beanie")) {
            return '<path d="M148 214 Q300 62 452 214 Z" fill="#5a4a8c" stroke="#100e0c" stroke-width="8"/>'
                '<rect x="140" y="206" width="320" height="42" rx="20" fill="#7565b0"'
                ' stroke="#100e0c" stroke-width="8"/>'
                '<circle cx="300" cy="76" r="26" fill="#f3ece1" stroke="#100e0c" stroke-width="7"/>';
        }

        if (a == keccak256("Crown")) {
            return '<path d="M176 178 L206 74 L252 138 L300 52 L348 138 L394 74 L424 178 Z"'
                ' fill="#e8c020" stroke="#100e0c" stroke-width="8" stroke-linejoin="round"/>'
                '<circle cx="300" cy="120" r="14" fill="#e0567a" stroke="#100e0c" stroke-width="5"/>';
        }

        return "";
    }

    // ------------------------------------------------------------ metadata

    /// @notice Basis points as a percentage with one decimal, without a float.
    function percent(uint256 bps) internal pure returns (string memory) {
        return string.concat((bps / 100).toString(), ".", ((bps % 100) / 10).toString(), "%");
    }

    function _trait(string memory key, string memory value) private pure returns (string memory) {
        return string.concat('{"trait_type":"', key, '","value":"', value, '"}');
    }

    /**
     * @notice The full ERC-721 metadata document, as a data URI.
     * @dev Base64 rather than raw, because a raw JSON data URI carrying an SVG
     *      needs percent encoding that several wallets get wrong.
     *
     *      Every layer is published as an attribute. Without them a marketplace
     *      cannot filter or rank by rarity, and a weighted generative
     *      collection whose weights are invisible is just a picture.
     */
    /**
     * @notice Every layer, as ERC-721 attributes.
     * @dev Its own function rather than inline, because building it alongside
     *      the rest of the document put too many locals on the stack for the
     *      legacy code generator and failed to compile. Splitting it is a
     *      smaller change than turning on `viaIR` for the whole project.
     */
    function attributes(uint256 id) internal pure returns (string memory) {
        (, string memory bgName) = background(id);
        (, string memory furName) = fur(id);
        (, string memory eyeName) = eyeColour(id);

        return string.concat(
            "[",
            _trait("Background", bgName), ",",
            _trait("Fur", furName), ",",
            _trait("Pattern", pattern(id)), ",",
            _trait("Eyes", eyeName), ",",
            _trait("Eye shape", eyeShape(id)), ",",
            _trait("Mouth", mouth(id)), ",",
            _trait("Accessory", accessory(id)), ",",
            _trait("Creator royalty", percent(royaltyBps(id))),
            "]"
        );
    }

    function tokenURI(uint256 id, string memory name) internal pure returns (string memory) {
        string memory json = string.concat(
            '{"name":"', name, " #", id.toString(),
            '","description":"A cat, drawn on chain in seven weighted layers. No IPFS, no pinning ',
            'service, no server: the picture is built from the token id every time it is asked for.",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg(id))), '",',
            '"attributes":', attributes(id), "}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
}
