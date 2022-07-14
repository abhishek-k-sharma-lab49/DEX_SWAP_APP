//SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.8.0 <0.9.3 ;

import "./HederaTokenService.sol";
import "./HederaResponseCodes.sol";
import "./TokenA.sol";
import "./TokenB.sol";
//import "@openzeppelin/contracts/utils/math/SafeMath.sol";



contract Swap is HederaTokenService {
    //using SafeMath for uint;

    TokenA public token1;
    address public owner1;
    TokenB public token2;
    address public owner2;
    uint public amount1;
    uint public amount2;
    uint public swapRate;

    constructor(
        address _token1,
        address _owner1,
        address _token2,
        address _owner2,
        uint _amount1
    ) {
        token1 = TokenA(_token1);
        owner1 = _owner1;
        token2 = TokenB(_token2);
        owner2 = _owner2;
        swapRate = 1;
        amount1 = _amount1;
        amount2 = _amount1 * swapRate;
    }

    function swap() public {
        require(msg.sender == owner1 || msg.sender == owner2, "Not authorized from owners");
        require(
            token1.allowance(owner1, address(this)) >= amount1,
            "Token 1 allowance too low"
        );
        require(
            token2.allowance(owner2, address(this)) >= amount2,
            "Token 2 allowance too low"
        );

        _safeTransferFromA(token1, owner1, owner2, amount1);
        _safeTransferFromB(token2, owner2, owner1, amount2);
    }

    function _safeTransferFromA(
        TokenA token,
        address sender,
        address recipient,
        uint amount
    ) private {
        bool sent = token.transferFrom(sender, recipient, amount);
        require(sent, "Token transfer failed");
    }

    function _safeTransferFromB(
        TokenB token,
        address sender,
        address recipient,
        uint amount
    ) private {
        bool sent = token.transferFrom(sender, recipient, amount);
        require(sent, "Token transfer failed");
    }
}