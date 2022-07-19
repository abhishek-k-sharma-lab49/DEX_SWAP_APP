//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.3 ;

import "./HederaTokenService.sol";
import "./HederaResponseCodes.sol";

contract SwapHederaTokens is HederaTokenService {
    mapping(address => mapping (address => int256)) balances;
    mapping(address => mapping (address => int256)) allowed;

    constructor() {

    }

    function addHbars() public payable {

    }

    function addLiquidity(
        address tokenIdA,
        address fromAccountId,
        int64 tokenAAmount,
        address tokenIdB,
        int64 tokenBAmount) public returns (int) {
            
            int responseCode = HederaTokenService.approve(tokenIdB, address(this), 50);
            int responseCode2 = HederaTokenService.approve(tokenIdA, address(this), 50);

            int response2 = HederaTokenService.transferToken(tokenIdB, fromAccountId, address(this), tokenBAmount);
            if (response2 != HederaResponseCodes.SUCCESS) {
                revert('Transfer failed');
            }

            int response = HederaTokenService.transferToken(tokenIdA, fromAccountId, address(this), tokenAAmount);

            if (response != HederaResponseCodes.SUCCESS) {
                revert('Transfer failed');
            }
            

            balances[address(this)][tokenIdA]+= tokenAAmount;
            balances[address(this)][tokenIdB]+= tokenBAmount;
    
            // if (userExists[toAccountId]) {                
            //     TokenCount storage token = wallet[toAccountId];
            //     token.tokens[tokenId] += tokenAmount; 
            // }

             return 1;
    }
}