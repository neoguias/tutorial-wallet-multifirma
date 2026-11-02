// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

contract Wallet {
    struct Transfer {
        uint256 id;
        uint256 amount;
        address payable recipient;
        uint256 approvals;
        bool executed;
    }

    address[] public owners;
    uint256 public immutable minApprovals;
    mapping(address => bool) public isOwner;
    mapping(address => mapping(uint256 => bool)) public approved;
    Transfer[] private transfers;

    error InvalidOwners();
    error InvalidThreshold();
    error DuplicateOwner();
    error OnlyOwner();
    error InvalidRecipient();
    error InvalidAmount();
    error UnknownTransfer();
    error AlreadyApproved();
    error AlreadyExecuted();
    error InsufficientBalance();
    error TransferFailed();

    event Deposit(address indexed sender, uint256 amount);
    event TransferCreated(uint256 indexed id, address indexed creator, address indexed recipient, uint256 amount);
    event TransferApproved(uint256 indexed id, address indexed owner);
    event TransferExecuted(uint256 indexed id, address indexed recipient, uint256 amount);

    constructor(address[] memory initialOwners, uint256 requiredApprovals) {
        if (initialOwners.length == 0) revert InvalidOwners();
        if (requiredApprovals == 0 || requiredApprovals > initialOwners.length) revert InvalidThreshold();
        for (uint256 i; i < initialOwners.length; i++) {
            address owner = initialOwners[i];
            if (owner == address(0)) revert InvalidOwners();
            if (isOwner[owner]) revert DuplicateOwner();
            isOwner[owner] = true;
            owners.push(owner);
        }
        minApprovals = requiredApprovals;
    }

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert OnlyOwner();
        _;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransfers() external view returns (Transfer[] memory) {
        return transfers;
    }

    function createTransfer(uint256 amount, address payable recipient) external onlyOwner returns (uint256 id) {
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        id = transfers.length;
        transfers.push(Transfer(id, amount, recipient, 0, false));
        emit TransferCreated(id, msg.sender, recipient, amount);
    }

    function approveTransfer(uint256 id) external onlyOwner {
        if (id >= transfers.length) revert UnknownTransfer();
        Transfer storage transfer = transfers[id];
        if (transfer.executed) revert AlreadyExecuted();
        if (approved[msg.sender][id]) revert AlreadyApproved();
        approved[msg.sender][id] = true;
        transfer.approvals++;
        emit TransferApproved(id, msg.sender);
        if (transfer.approvals < minApprovals) return;
        if (address(this).balance < transfer.amount) revert InsufficientBalance();
        transfer.executed = true;
        (bool success,) = transfer.recipient.call{value: transfer.amount}("");
        if (!success) revert TransferFailed();
        emit TransferExecuted(id, transfer.recipient, transfer.amount);
    }
}
