// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface IConsign {
    function buy(address collection, uint256 tokenId) external payable;
    function withdraw() external;
}

/**
 * @notice A seller that cannot be paid.
 *
 * Its `receive` reverts, which under a marketplace that pays sellers during the
 * purchase makes every sale of its items fail. Under this one the sale goes
 * through and only this contract's own withdrawal fails, which is the point.
 */
contract RejectsEther is IERC721Receiver {
    IConsign private immutable _market;

    constructor(IConsign market) {
        _market = market;
    }

    function callWithdraw() external {
        _market.withdraw();
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {
        revert("no thanks");
    }
}

/**
 * @notice Re-enters `withdraw` the moment it is paid.
 *
 * This is the attack that takes money rather than merely confusing state. If
 * the balance were zeroed after the transfer instead of before it, each nested
 * call would read the same balance again and pay it out again until the
 * marketplace was empty.
 */
contract ReentrantWithdrawer is IERC721Receiver {
    IConsign private immutable _market;

    uint256 public reentryAttempts;
    bool public reentryReverted;

    constructor(IConsign market) {
        _market = market;
    }

    function callWithdraw() external {
        _market.withdraw();
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {
        if (reentryAttempts >= 1) return;
        reentryAttempts++;

        try _market.withdraw() {
            reentryReverted = false;
        } catch {
            reentryReverted = true;
        }
    }
}

/**
 * @notice Re-enters `buy` from inside the token transfer that completes a sale.
 *
 * `safeTransferFrom` calls the receiver back, and the receiver is the buyer, who
 * is the one party in a sale nobody has any reason to trust. The listing is
 * already gone by then, so the second purchase finds nothing to buy.
 */
contract ReentrantBuyer is IERC721Receiver {
    IConsign private immutable _market;

    address private _collection;
    uint256 private _tokenId;
    uint256 private _price;

    uint256 public reentryAttempts;
    bool public reentryReverted;

    constructor(IConsign market) {
        _market = market;
    }

    function attack(address collection, uint256 tokenId, uint256 price) external payable {
        _collection = collection;
        _tokenId = tokenId;
        _price = price;
        _market.buy{value: price}(collection, tokenId);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        if (reentryAttempts == 0 && address(this).balance >= _price) {
            reentryAttempts++;

            try _market.buy{value: _price}(_collection, _tokenId) {
                reentryReverted = false;
            } catch {
                reentryReverted = true;
            }
        }
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {}
}
