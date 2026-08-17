// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IDrip {
    function claim() external returns (uint256);
    function claimFor(address recipient) external returns (uint256);
}

/**
 * @notice A recipient that tries to claim again while it is being paid.
 *
 * The faucet hands control to the recipient, with all the remaining gas, at the
 * exact moment it is sending money. That is the whole attack surface, and it is
 * the same one the marketplace's `withdraw` has. A faucet that wrote its
 * cooldown after the transfer would pay this contract as many times as it cared
 * to ask, in one transaction, until the balance was gone.
 *
 * The nested calls are wrapped so their reverts do not travel back out. The
 * test is that the first claim succeeds and every nested one is refused, and a
 * bare nested call would take the first one down with it and prove nothing.
 */
contract ReentrantClaimer {
    IDrip private immutable drip;

    uint256 public received;
    uint256 public succeeded;
    uint256 public refused;

    bool private inside;

    constructor(IDrip drip_) {
        drip = drip_;
    }

    function start() external {
        drip.claim();
    }

    // A complex fallback is the attack. Simplifying it would remove the test.
    // solhint-disable-next-line no-complex-fallback
    receive() external payable {
        received += msg.value;

        // Only the outermost payment mounts the attack. Without this an actual
        // hole would recurse until the gas ran out, and the test would report a
        // gas failure rather than the number of times it got paid.
        if (inside) return;
        inside = true;

        for (uint256 i = 0; i < 3; i++) {
            try drip.claim() returns (uint256) {
                succeeded++;
            } catch {
                refused++;
            }
        }

        inside = false;
    }
}

/**
 * @notice A recipient that cannot be paid.
 *
 * Its `receive` reverts, so the transfer fails. What matters is what the faucet
 * does next: the whole claim comes back, which means the cooldown this address
 * just consumed is rolled back with it. A faucet that recorded the claim and
 * then ignored a failed send would burn a day of this address's allowance and
 * hand it nothing.
 */
contract RejectsDrip {
    IDrip private immutable drip;

    constructor(IDrip drip_) {
        drip = drip_;
    }

    function start() external {
        drip.claim();
    }

    receive() external payable {
        // A string revert, not a custom error, because this mock is imitating
        // an ordinary badly written contract rather than this repository's own.
        // solhint-disable-next-line gas-custom-errors
        revert("no thanks");
    }
}
