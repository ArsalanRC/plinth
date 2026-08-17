// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Drip
 * @notice A faucet for test POL, with the rate limit enforced on chain.
 *
 * Nobody can create Amoy POL. Only the official faucets mint it, so everything
 * here redistributes POL that somebody already queued up behind a captcha and a
 * mainnet balance check. This contract does not remove that cost, it moves it:
 * the owner pays it once, and a visitor spends the result without meeting any
 * of the walls. Saying so on the page is part of the design, because a faucet
 * that hides where its money comes from looks like free money and then runs dry
 * with no explanation.
 *
 * Three limits, each answering a different way this goes wrong:
 *
 * 1. A fixed amount per claim, so a caller cannot ask for the balance.
 * 2. A cooldown per recipient, so one address cannot claim in a loop.
 * 3. A ceiling on what this contract will hold, so a mistake in the topup
 *    script cannot move a whole wallet into it.
 *
 * The third reads as paranoia until you notice that the topup script computes
 * the amount it sends, and that three separate hand-typed numbers in this
 * repository's deploy script went stale and cost a failed run each.
 *
 * @dev The limit this cannot lift, which the page states rather than hides: an
 *      address holding exactly zero cannot call `claim`, because calling it
 *      costs gas and gas is paid in the currency being asked for. No contract
 *      solves that. Bootstrapping an empty wallet needs a third party to pay,
 *      which means a relayer, which means a server, which this project does not
 *      have. `claimFor` is the honest version: anybody already holding POL can
 *      pay the gas to fund a stranger.
 */
contract Drip is Ownable {
    /// @notice How long a recipient waits between claims. Fixed, so the promise is checkable.
    uint256 public constant COOLDOWN = 24 hours;

    /// @notice The most the owner may ever set a single claim to.
    uint256 public constant MAX_DRIP = 0.05 ether;

    /// @notice The most this contract will ever hold.
    uint256 public constant MAX_BALANCE = 1 ether;

    /// @notice What one claim pays out.
    uint256 public dripAmount;

    /// @notice When each recipient last claimed. Zero means never.
    mapping(address recipient => uint256 at) public lastClaimAt;

    event Claimed(address indexed recipient, address indexed paidBy, uint256 amount);
    event Funded(address indexed from, uint256 amount, uint256 balance);
    event DripChanged(uint256 amount);
    event Swept(address indexed to, uint256 amount);

    error DripIsZero();
    error DripTooLarge(uint256 max, uint256 requested);
    error TooSoon(uint256 nextClaimAt);
    error Dry(uint256 balance, uint256 needed);
    error TooFull(uint256 max, uint256 balance);
    error ZeroAddress();
    error SendFailed();
    error NothingToSweep();

    /**
     * @param dripAmount_ What one claim pays. Sized against the gas price of the
     *        day rather than guessed: the sizing table is in the project notes.
     * @dev Payable so the faucet can be deployed and funded in one transaction,
     *      which on a testnet where POL is rationed is worth the extra branch.
     */
    constructor(uint256 dripAmount_) payable Ownable(msg.sender) {
        _setDrip(dripAmount_);
        if (address(this).balance > MAX_BALANCE) revert TooFull(MAX_BALANCE, address(this).balance);
    }

    // ---------------------------------------------------------------- claiming

    /// @notice Take a drip for yourself.
    function claim() external returns (uint256 amount) {
        return _drip(msg.sender);
    }

    /**
     * @notice Take a drip on behalf of an address, paying the gas yourself.
     * @dev The cooldown is keyed on the recipient rather than the caller, which
     *      is the only version that works. Keyed on the caller, one funded
     *      address could empty this contract in a single transaction by naming
     *      a fresh recipient each time.
     *
     *      It does not stop somebody generating addresses and claiming for each
     *      one. No faucet without an identity check does. That is what the
     *      balance ceiling is for: the loss is bounded by what is in here, and
     *      what is in here is bounded by a constant.
     */
    function claimFor(address recipient) external returns (uint256 amount) {
        return _drip(recipient);
    }

    // ---------------------------------------------------------------- funding

    /**
     * @notice Add to the faucet. Anybody may.
     * @dev The ceiling check is the reason this is not an empty body, and it
     *      costs more than the 2300 gas that `transfer` and `send` forward. So
     *      a contract funding this faucet has to use `call`. That is the right
     *      way round: the guard is the point, and funding from another contract
     *      is not a case this faucet has.
     */
    // solhint-disable-next-line no-complex-fallback
    receive() external payable {
        if (address(this).balance > MAX_BALANCE) revert TooFull(MAX_BALANCE, address(this).balance);
        emit Funded(msg.sender, msg.value, address(this).balance);
    }

    // ------------------------------------------------------------------ admin

    /**
     * @notice Change what one claim pays.
     * @dev Bounded by a constant rather than by the owner's restraint, the same
     *      reasoning as the marketplace fee. It is settable at all because gas
     *      moves: this network went from 30 to 45 gwei inside one day, and a
     *      drip sized for the cheaper number stops covering a mint at the
     *      dearer one.
     */
    function setDrip(uint256 amount) external onlyOwner {
        _setDrip(amount);
    }

    /**
     * @notice Take the remaining balance back out.
     * @dev The owner funded it, so the owner can recover it. A testnet faucet
     *      that swallows what it is given is a worse trap than one that can be
     *      emptied by the person who filled it.
     */
    function sweep(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();

        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToSweep();

        (bool sent,) = payable(to).call{value: amount}("");
        if (!sent) revert SendFailed();

        emit Swept(to, amount);
    }

    // ---------------------------------------------------------------- viewing

    /// @notice When `recipient` may next claim. Zero means right now.
    function nextClaimAt(address recipient) public view returns (uint256) {
        uint256 last = lastClaimAt[recipient];
        return last == 0 ? 0 : last + COOLDOWN;
    }

    /**
     * @notice Everything the page needs to draw the button, in one call.
     * @dev One call rather than four, because each one is a network round trip
     *      and the button is drawn on every wallet change. `claimsLeft` is the
     *      honest number to show a visitor: an empty faucet should say it is
     *      empty rather than offering a transaction that reverts.
     */
    function check(address recipient)
        external
        view
        returns (bool ready, uint256 nextAt, uint256 amount, uint256 balance, uint256 claimsLeft)
    {
        nextAt = nextClaimAt(recipient);
        amount = dripAmount;
        balance = address(this).balance;
        claimsLeft = balance / amount;
        ready = block.timestamp >= nextAt && balance >= amount && recipient != address(0);
    }

    // -------------------------------------------------------------- internals

    function _setDrip(uint256 amount) private {
        if (amount == 0) revert DripIsZero();
        if (amount > MAX_DRIP) revert DripTooLarge(MAX_DRIP, amount);

        dripAmount = amount;
        emit DripChanged(amount);
    }

    /**
     * @dev The cooldown is written before the money moves. The recipient may be
     *      a contract, and this is the single line that stops it claiming twice
     *      inside one transaction: the nested call reads the timestamp it just
     *      set and reverts on the cooldown.
     *
     *      Reordering it costs the whole balance rather than merely confusing
     *      the accounting, which is the same shape as `withdraw` in the
     *      marketplace and is worth recognising in both places.
     */
    function _drip(address recipient) private returns (uint256 amount) {
        if (recipient == address(0)) revert ZeroAddress();

        uint256 next = nextClaimAt(recipient);
        if (block.timestamp < next) revert TooSoon(next);

        amount = dripAmount;
        if (address(this).balance < amount) revert Dry(address(this).balance, amount);

        lastClaimAt[recipient] = block.timestamp;

        (bool sent,) = payable(recipient).call{value: amount}("");
        if (!sent) revert SendFailed();

        emit Claimed(recipient, msg.sender, amount);
    }
}
