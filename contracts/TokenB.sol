// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract TokenB is ERC20 {
    constructor() ERC20("LabTokenB", "LabB"){
        _mint(msg.sender, 10000 * 10 ** 18);
    }
}