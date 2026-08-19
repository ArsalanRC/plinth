// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/* solhint-disable quotes */
// Every string here is a fragment of SVG or JSON, both of which quote their own
// attributes with double quotes. Single-quoting the Solidity is what keeps the
// markup readable and free of escapes.

/**
 * @title DogArt
 * @notice A generative dog, drawn on chain, in nine layers.
 *
 * The second collection, and the same argument as the first: the picture is
 * built from the token id at read time, so it lasts exactly as long as the
 * chain does. No IPFS, no pinning service, no server.
 *
 * Nine layers rather than the cat's seven, which is close to the ceiling and
 * not an accident. `Art` is inlined into its collection, so the art sits inside
 * the contract's own bytecode and EIP-170 caps that at 24,576 bytes. Nine
 * measured at 23,087 with the cat art, leaving under 1,500 bytes. **Roughly
 * 1,800 bytes is the budget per layer**, which is why the variants below are
 * five or six each and every path is as short as it can be and still read.
 *
 * | Layer      | Options | Rarest            |
 * |------------|---------|-------------------|
 * | Background |       8 | Void, 3%          |
 * | Coat       |       8 | Void, 3%          |
 * | Pattern    |       5 | Merle, 8%         |
 * | Ears       |       5 | Prick, 8%         |
 * | Eye colour |       6 | Heterochromia, 5% |
 * | Eye shape  |       5 | Sleepy, 4%        |
 * | Muzzle     |       4 | Grizzled, 10%     |
 * | Collar     |       6 | Medal, 4%         |
 * | Accessory  |       6 | Crown, 4%         |
 *
 * **Ears carry the most weight and get the most room.** A dog and a cat drawn
 * at this size differ mainly in the ears and the muzzle: triangles on top read
 * as a cat whatever else is done. So the ear layer is the one that changes the
 * silhouette, and the muzzle is always present rather than being a variant.
 * That is the same lesson the fanout carrier marks taught, where a bird drawn
 * as one thin stroke read as a squiggle and a wing with no notch read as a leaf.
 *
 * **Colours are packed as `uint24` rather than stored as strings**, exactly as
 * in `Art`. A palette written as "#d9530a" costs seven bytes of bytecode per
 * entry against three packed, and with this many layers that difference is the
 * difference between fitting and not.
 */
library DogArt {
    using Strings for uint256;

    /// @dev The royalty ceiling the collection enforces, in basis points.
    uint256 internal constant MAX_ROYALTY_BPS = 1000;

    /**
     * @notice The royalty this token carries, in basis points.
     * @dev Deterministic in the id, between 250 and 1000, so every token sits
     *      inside the ceiling and the marketplace never has to cap one.
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
            out[6 - i] = symbols[uint8(colour >> (i * 4)) & 0x0f];
        }
        return string(out);
    }

    // -------------------------------------------------------------- layers

    /// @dev Background. Void is the 3% one.
    function background(uint256 id) internal pure returns (uint24 colour, string memory name) {
        uint256 r = _roll(id, "bg");
        if (r < 18) return (0xf2e7d4, "Sand");
        if (r < 34) return (0xdbe9df, "Sage");
        if (r < 50) return (0xe6dced, "Lilac");
        if (r < 64) return (0xf7dfd4, "Peach");
        if (r < 77) return (0xd7e2f1, "Sky");
        if (r < 88) return (0xefe2bd, "Butter");
        if (r < 97) return (0x2b3a3a, "Pine");
        return (0x100e0c, "Void");
    }

    /// @dev Coat. Void is the 3% one, and it needs a light outline to read.
    function coat(uint256 id) internal pure returns (uint24 colour, string memory name) {
        uint256 r = _roll(id, "coat");
        if (r < 20) return (0xc98b47, "Golden");
        if (r < 38) return (0x8a7a6c, "Ash");
        if (r < 54) return (0xf1e6d5, "Wheaten");
        if (r < 68) return (0x5f4232, "Chocolate");
        if (r < 80) return (0xa8522c, "Rust");
        if (r < 90) return (0x9fadb8, "Slate");
        if (r < 97) return (0xe2bd6f, "Straw");
        return (0x191919, "Void");
    }

    /// @dev Markings drawn over the coat.
    function pattern(uint256 id) internal pure returns (string memory) {
        uint256 r = _roll(id, "pattern");
        if (r < 40) return "Solid";
        if (r < 63) return "Blaze";
        if (r < 79) return "Saddle";
        if (r < 92) return "Patch";
        return "Merle";
    }

    /**
     * @dev The layer that makes it a dog. Prick is the 8% one.
     *
     *      Given the most room of the nine on purpose: at 22px the ears are
     *      most of what a viewer uses to tell this apart from the cats.
     */
    function ears(uint256 id) internal pure returns (string memory) {
        uint256 r = _roll(id, "ears");
        if (r < 34) return "Drop";
        if (r < 58) return "Folded";
        if (r < 76) return "Long";
        if (r < 92) return "Tufted";
        return "Prick";
    }

    function eyeColour(uint256 id) internal pure returns (uint24 colour, string memory name) {
        uint256 r = _roll(id, "eyecol");
        if (r < 30) return (0x6b4423, "Brown");
        if (r < 50) return (0xc9a227, "Amber");
        if (r < 68) return (0x3d7ac4, "Blue");
        if (r < 82) return (0x4c8a52, "Hazel");
        if (r < 95) return (0x5a4b6b, "Slate");
        return (0x3d7ac4, "Heterochromia");
    }

    function eyeShape(uint256 id) internal pure returns (string memory) {
        uint256 r = _roll(id, "eyeshape");
        if (r < 42) return "Round";
        if (r < 66) return "Soft";
        if (r < 82) return "Wink";
        if (r < 96) return "Wide";
        return "Sleepy";
    }

    /// @dev The snout. Always drawn; only its finish varies.
    function muzzle(uint256 id) internal pure returns (string memory) {
        uint256 r = _roll(id, "muzzle");
        if (r < 42) return "Pale";
        if (r < 70) return "Dark";
        if (r < 90) return "Masked";
        return "Grizzled";
    }

    function collar(uint256 id) internal pure returns (string memory) {
        uint256 r = _roll(id, "collar");
        if (r < 32) return "None";
        if (r < 54) return "Leather";
        if (r < 70) return "Bandana";
        if (r < 84) return "Tag";
        if (r < 96) return "Chain";
        return "Medal";
    }

    function accessory(uint256 id) internal pure returns (string memory) {
        uint256 r = _roll(id, "acc");
        if (r < 40) return "None";
        if (r < 58) return "Cap";
        if (r < 72) return "Bow";
        if (r < 84) return "Goggles";
        if (r < 96) return "Beanie";
        return "Crown";
    }

    // --------------------------------------------------------- the drawing

    /**
     * @notice The dog, as an SVG string.
     * @dev Order matters: ears sit behind the head, the muzzle over it, and
     *      anything worn over everything.
     */
    function svg(uint256 id) internal pure returns (string memory) {
        (uint24 bg,) = background(id);
        (uint24 fur,) = coat(id);

        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">',
            '<rect width="600" height="600" fill="', _hex(bg), '"/>',
            _ears(id, fur),
            '<ellipse cx="300" cy="312" rx="164" ry="148" fill="', _hex(fur),
            '" stroke="#100e0c" stroke-width="8"/>',
            _pattern(id, fur),
            _muzzle(id, fur),
            _eyes(id),
            _collar(id),
            _accessory(id),
            "</svg>"
        );
    }

    function _ears(uint256 id, uint24 fur) private pure returns (string memory) {
        bytes32 e = keccak256(bytes(ears(id)));
        string memory c = _hex(fur);

        if (e == keccak256("Folded")) {
            // Hangs to the jaw, then kicks forward at the tip. The kick is what
            // stops a folded ear reading as a rounded bear ear.
            return string.concat(
                '<path d="M132 216 Q86 348 150 404 Q196 384 178 300 Q170 244 190 214 Z" fill="', c,
                '" stroke="#100e0c" stroke-width="8"/>'
                '<path d="M468 216 Q514 348 450 404 Q404 384 422 300 Q430 244 410 214 Z" fill="', c,
                '" stroke="#100e0c" stroke-width="8"/>');
        }
        if (e == keccak256("Long")) {
            return string.concat(
                '<ellipse cx="128" cy="356" rx="56" ry="158" fill="', c,
                '" stroke="#100e0c" stroke-width="8"/>'
                '<ellipse cx="472" cy="356" rx="56" ry="158" fill="', c,
                '" stroke="#100e0c" stroke-width="8"/>');
        }
        if (e == keccak256("Tufted")) {
            // Angular and leaning outward, with a tuft breaking the edge. The
            // first two attempts used a curve through a control point above the
            // skull and both rendered as rounded bumps, which is a bear ear.
            // Straight lines and an outward lean are what make it a dog.
            // Half up, half tipped over. The tip folding forward is the shape a
            // collie has and nothing feline does. An earlier version leaned the
            // whole ear outward with a tuft off the side and read as a lynx.
            return string.concat(
                '<path d="M186 228 L164 96 Q236 116 244 190 Z" fill="', c,
                '" stroke="#100e0c" stroke-width="8" stroke-linejoin="round"/>'
                '<path d="M414 228 L436 96 Q364 116 356 190 Z" fill="', c,
                '" stroke="#100e0c" stroke-width="8" stroke-linejoin="round"/>'
                '<path d="M164 96 Q206 104 220 140 Q184 132 164 96 Z" fill="#8a6a52"'
                ' stroke="#100e0c" stroke-width="6" stroke-linejoin="round"/>'
                '<path d="M436 96 Q394 104 380 140 Q416 132 436 96 Z" fill="#8a6a52"'
                ' stroke="#100e0c" stroke-width="6" stroke-linejoin="round"/>');
        }
        if (e == keccak256("Prick")) {
            // Tall, narrow and upright, sat close to the crown. A shepherd, not
            // a cat. The first version was wide low triangles with pink inners,
            // which is a cat ear exactly, and this collection sits beside a
            // collection of actual cats.
            return string.concat(
                '<path d="M204 214 L196 52 L286 190 Z" fill="', c,
                '" stroke="#100e0c" stroke-width="8" stroke-linejoin="round"/>'
                '<path d="M396 214 L404 52 L314 190 Z" fill="', c,
                '" stroke="#100e0c" stroke-width="8" stroke-linejoin="round"/>'
                '<path d="M216 196 L204 104 L252 178 Z" fill="#7a5c46"/>'
                '<path d="M384 196 L396 104 L348 178 Z" fill="#7a5c46"/>');
        }
        // Drop, and the default. Sits wide and low so it clearly hangs beside
        // the head rather than sitting on top of it.
        return string.concat(
            '<ellipse cx="132" cy="344" rx="62" ry="126" fill="', c,
            '" stroke="#100e0c" stroke-width="8"/>'
            '<ellipse cx="468" cy="344" rx="62" ry="126" fill="', c,
            '" stroke="#100e0c" stroke-width="8"/>');
    }

    function _pattern(uint256 id, uint24 fur) private pure returns (string memory) {
        bytes32 p = keccak256(bytes(pattern(id)));
        // Dark coats need a light marking and light coats a dark one, or the
        // pattern is there in the data and invisible in the picture.
        string memory ink = fur < 0x808080 ? "#f4efe6" : "#4a3b2f";

        if (p == keccak256("Blaze")) {
            // A real blaze is lighter than the coat and runs from the forehead
            // down onto the muzzle, widening as it goes. Drawn dark and stopped
            // short, it read as a unibrow.
            // The thin outline is what makes it survive a cream coat, where a
            // white blaze is nearly invisible on a real dog too.
            return '<path d="M286 170 Q300 162 314 170 L332 398 Q300 414 268 398 Z"'
                ' fill="#f7f2e8" stroke="#8a7256" stroke-width="3" stroke-opacity="0.4"/>';
        }
        if (p == keccak256("Saddle")) {
            return string.concat('<path d="M170 300 Q300 236 430 300 L430 344 Q300 292 170 344 Z" fill="',
                ink, '" opacity="0.72"/>');
        }
        if (p == keccak256("Patch")) {
            return string.concat('<ellipse cx="216" cy="268" rx="58" ry="50" fill="', ink, '" opacity="0.8"/>');
        }
        if (p == keccak256("Merle")) {
            return string.concat(
                '<circle cx="212" cy="252" r="26" fill="', ink, '" opacity="0.55"/>'
                '<circle cx="382" cy="286" r="20" fill="', ink, '" opacity="0.55"/>'
                '<circle cx="256" cy="352" r="15" fill="', ink, '" opacity="0.55"/>');
        }
        return "";
    }

    function _muzzle(uint256 id, uint24 fur) private pure returns (string memory) {
        bytes32 m = keccak256(bytes(muzzle(id)));

        string memory snout = "#efe4d4";
        if (m == keccak256("Dark")) snout = "#6d5a48";
        if (m == keccak256("Masked")) snout = "#3a3129";
        if (m == keccak256("Grizzled")) snout = "#cfc7ba";

        // Smaller and lower than the first attempt. At 96 by 70 on a 164 by 148
        // head the snout filled the face, and a round head with a big round
        // snout is a bear whatever the ears are doing.
        return string.concat(
            '<ellipse cx="300" cy="404" rx="76" ry="56" fill="', snout,
            '" stroke="#100e0c" stroke-width="7"/>',
            // The nose, then the mouth line under it. Both fixed, because the
            // muzzle layer varies the colour and the shape has to stay a dog.
            '<path d="M270 366 Q300 348 330 366 Q300 394 270 366 Z" fill="#1b1613"/>'
            '<path d="M300 392 L300 410 M300 410 Q276 428 258 410 M300 410 Q324 428 342 410"'
            ' fill="none" stroke="#1b1613" stroke-width="6" stroke-linecap="round"/>',
            fur < 0x808080 ? '<path d="M228 430 Q300 456 372 430" fill="none" stroke="#1b1613"'
                ' stroke-width="5" opacity="0.5"/>' : "");
    }

    function _eyes(uint256 id) private pure returns (string memory) {
        (uint24 col, string memory name) = eyeColour(id);
        bytes32 s = keccak256(bytes(eyeShape(id)));

        string memory left = _hex(col);
        // Heterochromia is the 5% roll, and it is the one trait that has to
        // differ between the two eyes rather than within one.
        string memory right = keccak256(bytes(name)) == keccak256("Heterochromia") ? "#c9a227" : left;

        if (s == keccak256("Sleepy")) {
            return '<path d="M212 286 Q246 266 280 286 M320 286 Q354 266 388 286" fill="none"'
                ' stroke="#100e0c" stroke-width="9" stroke-linecap="round"/>';
        }
        if (s == keccak256("Wink")) {
            return string.concat(
                _eye(246, 288, 30, left),
                '<path d="M322 290 Q354 270 386 290" fill="none" stroke="#100e0c"'
                ' stroke-width="9" stroke-linecap="round"/>');
        }
        if (s == keccak256("Wide")) {
            return string.concat(_eye(246, 286, 36, left), _eye(354, 286, 36, right));
        }
        if (s == keccak256("Soft")) {
            return string.concat(
                _eye(246, 290, 26, left), _eye(354, 290, 26, right),
                '<path d="M214 254 Q246 240 278 250 M322 250 Q354 240 386 254" fill="none"'
                ' stroke="#100e0c" stroke-width="6" stroke-linecap="round"/>');
        }
        return string.concat(_eye(246, 288, 30, left), _eye(354, 288, 30, right));
    }

    function _eye(uint256 cx, uint256 cy, uint256 r, string memory col)
        private pure returns (string memory)
    {
        return string.concat(
            '<circle cx="', cx.toString(), '" cy="', cy.toString(), '" r="', r.toString(),
            '" fill="', col, '" stroke="#100e0c" stroke-width="6"/>'
            '<circle cx="', cx.toString(), '" cy="', cy.toString(), '" r="',
            (r / 2).toString(), '" fill="#100e0c"/>');
    }

    function _collar(uint256 id) private pure returns (string memory) {
        bytes32 c = keccak256(bytes(collar(id)));

        if (c == keccak256("Leather")) {
            return '<path d="M186 452 Q300 512 414 452 L414 484 Q300 544 186 484 Z"'
                ' fill="#7a4a2c" stroke="#100e0c" stroke-width="6"/>';
        }
        if (c == keccak256("Bandana")) {
            // Tucked under the jaw. Drawn full width and hanging to the chest
            // it was a bib, and it was the loudest thing in the picture.
            return '<path d="M224 452 L376 452 L300 540 Z" fill="#b5442e" stroke="#100e0c" stroke-width="6"/>'
                '<path d="M252 474 L272 486 M348 474 L328 486" stroke="#e5c0a4" stroke-width="5"/>';
        }
        if (c == keccak256("Tag")) {
            return '<path d="M190 452 Q300 514 410 452 L410 480 Q300 542 190 480 Z"'
                ' fill="#4a5d6b" stroke="#100e0c" stroke-width="6"/>'
                '<circle cx="300" cy="534" r="22" fill="#d9b23a" stroke="#100e0c" stroke-width="6"/>';
        }
        if (c == keccak256("Chain")) {
            return '<path d="M192 450 Q300 528 408 450" fill="none" stroke="#c9c6bd" stroke-width="12"/>'
                '<path d="M192 450 Q300 528 408 450" fill="none" stroke="#8b8880"'
                ' stroke-width="4" stroke-dasharray="9 11"/>';
        }
        if (c == keccak256("Medal")) {
            return '<path d="M188 452 Q300 512 412 452 L412 482 Q300 542 188 482 Z"'
                ' fill="#2f3f5c" stroke="#100e0c" stroke-width="6"/>'
                '<circle cx="300" cy="544" r="28" fill="#e0b64a" stroke="#100e0c" stroke-width="6"/>'
                '<path d="M300 528 L306 540 L318 540 L308 548 L312 560 L300 552 L288 560'
                ' L292 548 L282 540 L294 540 Z" fill="#8a6a1e"/>';
        }
        return "";
    }

    function _accessory(uint256 id) private pure returns (string memory) {
        bytes32 a = keccak256(bytes(accessory(id)));

        if (a == keccak256("Cap")) {
            return '<path d="M176 202 Q300 108 424 202 L424 226 L176 226 Z"'
                ' fill="#1f6f8b" stroke="#100e0c" stroke-width="7"/>'
                '<path d="M424 206 L512 234 L508 256 L420 232 Z" fill="#17596f"'
                ' stroke="#100e0c" stroke-width="5"/>';
        }
        if (a == keccak256("Bow")) {
            return '<g transform="translate(392 168)">'
                '<path d="M0 0 L-44 -26 L-44 26 Z" fill="#e0567a" stroke="#100e0c" stroke-width="6"/>'
                '<path d="M0 0 L44 -26 L44 26 Z" fill="#e0567a" stroke="#100e0c" stroke-width="6"/>'
                '<circle r="13" fill="#f2a0b4" stroke="#100e0c" stroke-width="5"/></g>';
        }
        if (a == keccak256("Goggles")) {
            return '<path d="M196 286 L404 286" stroke="#3a3129" stroke-width="14"/>'
                '<circle cx="246" cy="286" r="46" fill="#8fd0e8" fill-opacity="0.45"'
                ' stroke="#3a3129" stroke-width="10"/>'
                '<circle cx="354" cy="286" r="46" fill="#8fd0e8" fill-opacity="0.45"'
                ' stroke="#3a3129" stroke-width="10"/>';
        }
        if (a == keccak256("Beanie")) {
            return '<path d="M178 214 Q300 92 422 214 Z" fill="#6b4a8c" stroke="#100e0c" stroke-width="7"/>'
                '<rect x="170" y="204" width="260" height="34" rx="16" fill="#563a70"'
                ' stroke="#100e0c" stroke-width="6"/>'
                '<circle cx="300" cy="112" r="22" fill="#a888c4"/>';
        }
        if (a == keccak256("Crown")) {
            return '<path d="M204 190 L232 108 L264 168 L300 92 L336 168 L368 108 L396 190 Z"'
                ' fill="#e0b64a" stroke="#100e0c" stroke-width="7"/>'
                '<circle cx="300" cy="140" r="13" fill="#c9425a" stroke="#100e0c" stroke-width="4"/>';
        }
        return "";
    }

    // ------------------------------------------------------------ metadata

    function percent(uint256 bps) internal pure returns (string memory) {
        return string.concat((bps / 100).toString(), ".", ((bps % 100) / 10).toString(), "%");
    }

    function _trait(string memory key, string memory value) private pure returns (string memory) {
        return string.concat('{"trait_type":"', key, '","value":"', value, '"}');
    }

    /**
     * @notice Every layer, as ERC-721 attributes.
     * @dev Split out for the same reason `Art.attributes` is: too many locals
     *      in one frame otherwise, and nine layers is worse than seven.
     */
    function attributes(uint256 id) internal pure returns (string memory) {
        (, string memory bgName) = background(id);
        (, string memory coatName) = coat(id);
        (, string memory eyeName) = eyeColour(id);

        return string.concat(
            "[",
            _trait("Background", bgName), ",",
            _trait("Coat", coatName), ",",
            _trait("Pattern", pattern(id)), ",",
            _trait("Ears", ears(id)), ",",
            _trait("Eyes", eyeName), ",",
            _trait("Eye shape", eyeShape(id)), ",",
            _trait("Muzzle", muzzle(id)), ",",
            _trait("Collar", collar(id)), ",",
            _trait("Accessory", accessory(id)), ",",
            _trait("Creator royalty", percent(royaltyBps(id))),
            "]"
        );
    }

    function tokenURI(uint256 id, string memory name) internal pure returns (string memory) {
        string memory json = string.concat(
            '{"name":"', name, " #", id.toString(),
            '","description":"A dog, drawn on chain in nine weighted layers. No IPFS, no pinning ',
            'service, no server: the picture is built from the token id every time it is asked for.",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg(id))), '",',
            '"attributes":', attributes(id), "}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
}
