//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./HederaTokenService.sol";
import "./HederaResponseCodes.sol";

contract SwapHederaTokens is HederaTokenService {
    
    mapping (address => int) contractBalance;
    uint private unlocked = 1;

    struct Pair {
        Token token0;
        Token token1;
    }

    struct Token {
        address tokenAddress;
        int64 tokenQty;
    }

    struct LiquidityContributor {
       mapping (address => mapping (address => Pair)) userTokenPairs;
    }

    address creator;

    mapping (address => mapping (address => Pair)) tokenPairs;
    mapping (address => mapping (address => bool)) tokenPairsAvailabe;

    modifier onlyOwner {
      require(msg.sender == creator, "Only owner can change the contract.");
      _;
   }

   modifier lock {
        require(unlocked == 1, 'UniswapV2: LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }

    function pairAvailable(address _token0, address _token1) internal view returns(bool) {
        (address token0, address token1) = _token0 < _token1 ? (_token0, _token1) : (_token1, _token0);
        return tokenPairsAvailabe[token0][token1];
    }

    function pairOf(address _token0, address _token1) internal view returns(Pair memory) {
        (address token0, address token1) = _token0 < _token1 ? (_token0, _token1) : (_token1, _token0);
        return tokenPairs[token0][token1];
    }

    //checks if pair is available for token0 and token1 and if token 1 amount is enough to debit from pool
    function pairQuantityAvailable(address _token0, address _token1, int64 _amount) internal view returns(bool) {
        (address token0, address token1) = _token0 < _token1 ? (_token0, _token1) : (_token1, _token0);
        if (tokenPairsAvailabe[token0][token1]) {
           int64 tokenAmount = tokenPairs[token0][token1].token1.tokenQty;
           if (tokenAmount >= _amount) {
                return true;
           }
        } 
        return false;
    }

    constructor() {
       creator = msg.sender;
    }

    function getContractBalance( address tokenAddress) public view returns (int) {
        return contractBalance[tokenAddress];
    }

    function getPoolBalance( address _token0, address _token1) public view returns (int64, int64) {
        return (tokenPairs[_token0][_token1].token0.tokenQty, tokenPairs[_token0][_token1].token1.tokenQty);
    }

    function addLiquidity(address fromAccount, address _token0, address _token1, int64 _token0Qty, int64 _token1Qty) public returns(int64, int64,string memory){
        (address token0, address token1, int64 token0Qty, int64 token1Qty) = _token0 < _token1 ? (_token0, _token1, _token0Qty, _token1Qty ) : (_token1, _token0, _token1Qty, _token0Qty);
        if (tokenPairsAvailabe[token0][token1]) {
            tokenPairs[token0][token1].token0.tokenQty += token0Qty;
            tokenPairs[token0][token1].token1.tokenQty += token1Qty;
        } 
         else {
            require(token0 != token1, 'UniswapV2: IDENTICAL_ADDRESSES');
            require(token0 != address(0), 'UniswapV2: ZERO_ADDRESS');
            Pair memory pair = Pair(Token(token0, token0Qty), Token(token1, token1Qty));
            HederaTokenService.associateToken(address(this), token0);
            HederaTokenService.associateToken(address(this), token1);
            tokenPairs[token0][token1] = pair;
            tokenPairsAvailabe[token0][token1] = true;
            
        }

        int response = HederaTokenService.transferToken(token0, fromAccount, address(this), token0Qty);
        require(response == HederaResponseCodes.SUCCESS, "Add liquidity: Transfering token A to contract failed with status code");

        response = HederaTokenService.transferToken(token1, fromAccount, address(this), token1Qty);
        require(response == HederaResponseCodes.SUCCESS, "Add liquidity: Transfering token B to contract failed with status code");
        return (tokenPairs[token0][token1].token0.tokenQty, tokenPairs[token0][token1].token1.tokenQty, "made New");
    }


    function swapToken(address to, address _tokenA, address _tokenB, int64 _deltaAQty, int64 _deltaBQty) external {
        require(pairAvailable(_tokenA, _tokenB), "Pair pool not available");
        require(pairQuantityAvailable(_tokenA, _tokenB, _deltaBQty), "Pair Quantity not available");
        int64 deltaBQty;
        deltaBQty = (tokenPairs[_tokenA][_tokenB].token1.tokenQty * _deltaAQty) / (tokenPairs[_tokenA][_tokenB].token0.tokenQty + _deltaAQty);
        if (tokenPairsAvailabe[_tokenA][_tokenB]) {
            tokenPairs[_tokenA][_tokenB].token0.tokenQty += _deltaAQty;
            tokenPairs[_tokenA][_tokenB].token1.tokenQty -= deltaBQty;
        } else if (tokenPairsAvailabe[_tokenB][_tokenA]) {
            tokenPairs[_tokenB][_tokenA].token0.tokenQty -= deltaBQty;
            tokenPairs[_tokenB][_tokenA].token1.tokenQty += _deltaAQty; 
        }
        int response = HederaTokenService.transferToken(_tokenA, to, address(this), _deltaAQty);
        require(response == HederaResponseCodes.SUCCESS, "swapTokenA: Transfering token A to contract failed with status code");
        response = HederaTokenService.transferToken(_tokenB, address(this), to, deltaBQty);
        require(response == HederaResponseCodes.SUCCESS, "swapTokenA: Transfering token B to contract failed with status code");
    }

     function getPairQty(address _token0, address _token1) public view returns (int64, int64) {
         Pair memory pair = pairOf(_token0, _token1);
         if (pair.token0.tokenAddress == _token0) {
            return (pair.token0.tokenQty, pair.token1.tokenQty);
         } else {
            return (pair.token1.tokenQty, pair.token0.tokenQty);
         }
     }
}
