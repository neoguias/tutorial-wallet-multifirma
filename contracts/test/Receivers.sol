// SPDX-License-Identifier: MIT
pragma solidity ^0.8.38;

interface IWallet {
    function approveTransfer(uint256 id) external;
}

contract GasReceiver {
    uint256 public received;
    receive() external payable { received += msg.value; }
}

contract RejectingReceiver {
    receive() external payable { revert("Recepcion rechazada"); }
}

contract ReentrantReceiver {
    address public wallet;
    uint256 public transferId;
    bool public reentered;
    function configure(address target, uint256 id) external { wallet = target; transferId = id; }
    receive() external payable {
        (reentered,) = wallet.call(abi.encodeCall(IWallet.approveTransfer, (transferId)));
    }
}
