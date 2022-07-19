//SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.8.0 <0.9.3 ;

import "./HederaTokenService.sol";
import "./HederaResponseCodes.sol";
//import "./Token.sol";
//import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IERC20 {
     function transferFrom(address _owner, address _receiver, uint _amount) external returns (bool);
     function approve(address _delegate, uint _amount) external returns (bool);
}


contract Swap is HederaTokenService {
    //using SafeMath for uint;

    IERC20 public token1;
    address public owner1;
    IERC20 public token2;
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
        token1 = IERC20(_token1);
        owner1 = _owner1;
        token2 = IERC20(_token2);
        owner2 = _owner2;
        swapRate = 1;
        amount1 = _amount1;
        amount2 = _amount1 * swapRate;
    }

    function isOwner() public view returns(bool) {
        return (msg.sender == owner1 || msg.sender == owner2);
    }

    function swap(uint token1Amount, uint token2Amount) public {

        require(msg.sender == owner1 || msg.sender == owner2, "Not authorized from owners");
        // token1.approve(address(this), token1Amount);
        // token2.approve(address(this), token2Amount);
        // require(
        //     token1.allowance(owner1, address(this)) >= amount1,
        //     "Token 1 allowance too low"
        // );
        // require(
        //     token2.allowance(owner2, address(this)) >= amount2,
        //     "Token 2 allowance too low"
        // );

        _safeTransferFrom(token1, owner1, owner2, token1Amount);
        _safeTransferFrom(token2, owner2, owner1, token2Amount);
    }

    function _safeTransferFrom(
        IERC20 token,
        address sender,
        address recipient,
        uint amount
    ) private {
        bool sent = token.transferFrom(sender, recipient, amount);
        require(sent, "Token transfer failed");
    }
}