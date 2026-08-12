// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface IConsignView {
    struct Listing {
        address seller;
        uint96 price;
    }

    function buy(address collection, uint256 tokenId) external payable;
    function listingOf(address collection, uint256 tokenId) external view returns (Listing memory);
    function isFillable(address collection, uint256 tokenId) external view returns (bool);
}

/**
 * @notice Reads the marketplace from inside the transfer that completes a sale.
 *
 * This is the case the ordering in `buy` actually protects against, and it is
 * not an attack on this contract at all. Nothing here tries to buy twice or
 * take money. It only looks, which is the point: any contract that prices,
 * lends against, or indexes a listing can be made to look at exactly this
 * moment, because the buyer chooses when the callback happens.
 *
 * If the listing were deleted after the transfer instead of before it, every
 * one of those readers would see a token that has already moved still offered
 * for sale by somebody who no longer owns it. That is a true answer to the
 * wrong question, and read-only reentrancy has cost real money on exactly this
 * shape of mistake.
 */
contract SaleObserver is IERC721Receiver {
    IConsignView private immutable market;

    bool public observed;
    address public observedSeller;
    uint96 public observedPrice;
    bool public observedFillable;

    constructor(IConsignView market_) {
        market = market_;
    }

    function buyVia(address collection, uint256 tokenId) external payable {
        market.buy{value: msg.value}(collection, tokenId);
    }

    /**
     * @dev `msg.sender` here is the collection, because the token contract is
     *      what calls the receiver. So the observer needs no setup and cannot
     *      be pointed at the wrong listing by mistake.
     */
    function onERC721Received(address, address, uint256 tokenId, bytes calldata)
        external
        returns (bytes4)
    {
        IConsignView.Listing memory item = market.listingOf(msg.sender, tokenId);

        observed = true;
        observedSeller = item.seller;
        observedPrice = item.price;
        observedFillable = market.isFillable(msg.sender, tokenId);

        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {}
}
