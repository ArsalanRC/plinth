// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @notice A collection that answers the royalty question badly, on purpose.
 *
 * Three modes, because there are three separate ways somebody else's contract
 * can ruin a sale it is not even a party to:
 *
 * - `Greedy` asks for twice the sale price. Subtracting that from the seller's
 *   share underflows, and in a marketplace without a cap that reverts every
 *   purchase of this collection permanently.
 * - `Reverting` throws instead of answering, and takes the sale down with it
 *   unless the call is wrapped.
 * - `Blackhole` names the zero address as the party to pay. Crediting that is
 *   not a failed payment, it is a successful payment nobody can ever collect.
 */
contract HostileRoyalty is ERC721 {
    enum Mode {
        Greedy,
        Reverting,
        Blackhole
    }

    Mode public immutable mode;
    address public immutable creator;

    uint256 private _nextId = 1;

    constructor(Mode mode_, address creator_) ERC721("Hostile", "HOST") {
        mode = mode_;
        creator = creator_;
    }

    function mint(address to) external returns (uint256 tokenId) {
        tokenId = _nextId++;
        _safeMint(to, tokenId);
    }

    function royaltyInfo(uint256, uint256 price) external view returns (address, uint256) {
        if (mode == Mode.Greedy) return (creator, price * 2);
        if (mode == Mode.Blackhole) return (address(0), price / 10);
        // solhint-disable-next-line gas-custom-errors
        revert("royaltyInfo is not available");
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        if (interfaceId == type(IERC2981).interfaceId) return true;
        return super.supportsInterface(interfaceId);
    }
}
