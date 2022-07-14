//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import "./HederaTokenService.sol";
import "./HederaResponseCodes.sol";

/*
With DEXes, smart contracts calculate the price of an asset by dividing the total amount of tokens in the liquidity pool by each other.

Since liquidity pools rebalance to maintain a 50/50 proportion of cryptocurrency assets by USD value, 
they can use the formula X * Y = K where X and Y are the USD value of cryptocurrencies in the pool, 
and K is the total value of funds in the pool. 

Always maintain a state whereby the multiplication of the price of Asset A and the price of B always equals the same number (k).

For example, there may be 79,180 Ethereum tokens and 134,457,994 USDC tokens in the ETH-USDC liquidity pool. 
The total amount of funds in the pool would be equivalent to $269,084,583. 

With this information, Uniswap can derive the current price of each asset. 
Take 134,457,994 and divide it by 79,140 to determine the price of Ethereum would be $1,698.13 on Uniswap’s exchange. 
*/

/*
Assume
-TokenA USD value = $1
-TokenB USD value = $2
*/

struct TokenCount {
    int tokenA; // 50
    int tokenB;
    mapping(address => int) tokens;
}

// contract LabHTS {
//     function tokenAssociate(address sender, address tokenAddress) external returns (int) {}
//     function tokenTransfer(
//         address tokenId,
//         address fromAccountId,
//         address toAccountId,
//         int64 tokenAmount
//     ) external returns (int) {}
//     function tokenDissociate(address sender, address tokenAddress) external returns (int) {}
// }

contract HederaLabDex is HederaTokenService {
    // Existing users
    mapping(address => bool) userExists;

    // Amount in each users "wallet"
    mapping(address => TokenCount) wallet;

    // Amount in liquidity pool for each account
    mapping(address => TokenCount) liquidity;

    // quantityA
    int quantityA;
    // quantityB
    int quantityB;
    // priceA
    int priceA;
    // priceB
    int priceB;
    // invariant k
    int k;
    // constant x and y
    int x;
    int y;

    // LabHTS deployedLabHTS;

    event InitializationAssociatation(int responseCodeA, int responseCodeB);
    event InitializationLiquidityAdd(int responseCodeA, int responseCodeB);
    event Signup(address indexed account, int walletTokenA, int walletTokenB);
    event Deposit(int withdrawAmount);
    event Withdrawal(int depositAmount);

    constructor() {
    // constructor(address treasuryAddr, address tokenA, address tokenB) {
    // constructor(address HTSContractAddr, address treasuryAddr, address tokenA, address tokenB) {
        // Associate tokens with this contract so it can receive the initial liquiidty
        // deployedLabHTS = LabHTS(HTSContractAddr);
        // int associateTokenARes = deployedLabHTS.tokenAssociate(address(this), tokenA);
        // int associateTokenBRes = deployedLabHTS.tokenAssociate(address(this), tokenB);
        // int associateTokenARes = tokenAssociate(address(this), tokenA);
        // int associateTokenBRes = tokenAssociate(address(this), tokenB);
        // emit InitializationAssociatation(associateTokenARes, associateTokenBRes);

        // Transfer initial liquidity to this contract (from Treasury)
        // int transferTokenARes = deployedLabHTS.tokenTransfer(tokenA, treasuryAddr, address(this), 1000);
        // int transferTokenBRes = deployedLabHTS.tokenTransfer(tokenB, treasuryAddr, address(this), 500);
        // int transferTokenARes = tokenTransfer(tokenA, treasuryAddr, address(this), 1000);
        // int transferTokenBRes = tokenTransfer(tokenB, treasuryAddr, address(this), 500);
        // emit InitializationLiquidityAdd(transferTokenARes, transferTokenBRes);
        
        quantityA = 1000;
        quantityB = 500;
        priceA = 1 * 1000000000;    // for more accurate numbers - UI code must divide by 1000000000 for actual price
        priceB = 2 * 1000000000;
        x = priceA*quantityA;
        y = priceB*quantityB;
        require(x == y);
        k = (priceA*quantityA)*(priceB*quantityB);
    }

    function greetings() public pure returns (string memory) {
        return "OSR";
    }

    // As a user I want to be able to sign up and get 1000 of tokenA and tokenB
    function signup() public {
        // TODO: Associate tokens with account address
        // TODO: Transfer tokens from treasury to account address
        // If user does not already exist, add 1000 of tokenA and tokenB to their wallet
        require(!userExists[msg.sender]);
        wallet[msg.sender].tokenA += 1000;
        wallet[msg.sender].tokenB += 1000;
        userExists[msg.sender] = true;
        emit Signup(msg.sender, wallet[msg.sender].tokenA, wallet[msg.sender].tokenB);
    }

    function getCurrentState() public view returns (
        int _quantityA,
        int _quantityB,
        int _priceA,
        int _priceB,
        int _k,
        int _x,
        int _y
    ) {
        return (
            quantityA,
            quantityB,
            priceA,
            priceB,
            k,
            x,
            y
        );
    }

    // swap transaction where user is depositing a certain amount
    function deposit(string memory token, int amount) public {
        require(userExists[msg.sender]);
        // first check if token is either tokenA or tokenB, then make sure user has enough in wallet to deposit
        tokenNameCheck(token);
        if (keccak256(bytes(token)) == keccak256(bytes('tokenA'))) {
            require(wallet[msg.sender].tokenA >= amount);
        } else {
            require(wallet[msg.sender].tokenB >= amount);
        }
        
        // get details of post transaction. check for negative quantities or price
        (int _quantityA, int _quantityB, int _priceA, int _priceB, int _oppositeAmountRequired) = getPostSwapDetails(token, 'deposit', amount);
        require(_quantityA > 0);
        require(_quantityB > 0);
        require(_priceA > 0);
        require(_priceB > 0);
        
        // process transaction
        // remove amount deposited from user's wallet, add amount withdrawn to user's wallet, set new quantities and prices
        // TODO: transfer from liqudity pool to wallet and vice/versa for appropriate tokens
        if (keccak256(bytes(token)) == keccak256(bytes('tokenA'))) {
            wallet[msg.sender].tokenA -= amount;
            wallet[msg.sender].tokenB += _oppositeAmountRequired;
        } else {
            wallet[msg.sender].tokenB -= amount;
            wallet[msg.sender].tokenA += _oppositeAmountRequired;
        }
        quantityA = _quantityA;
        quantityB = _quantityB;
        priceA = _priceA;
        priceB = _priceB;

        emit Deposit(_oppositeAmountRequired);
        // swap the coins here not in JS
    }

    // swap transaction where user is withdrawing a certain amount
    function withdrawal(string memory token, int amount) public {
        require(userExists[msg.sender]);
        // first check if token is either tokenA or tokenB, then make sure enough in liquidity pool to withdraw
        tokenNameCheck(token);
        if (keccak256(bytes(token)) == keccak256(bytes('tokenA'))) {
            require(quantityA >= amount);
        } else {
            require(quantityB >= amount);
        }

        // get details of post transaction. check for negative quantities or price
        (int _quantityA, int _quantityB, int _priceA, int _priceB, int _oppositeAmountRequired) = getPostSwapDetails(token, 'withdrawal', amount);
        require(_quantityA > 0);
        require(_quantityB > 0);
        require(_priceA > 0);
        require(_priceB > 0);

        // process transaction
        // check that user has enough in wallet to perform deposit
        // remove amount deposited from user's wallet, add amount withdrawn to user's wallet, set new quantities and prices
        // TODO: transfer from liqudity pool to wallet and vice/versa for appropriate tokens
        if (keccak256(bytes(token)) == keccak256(bytes('tokenA'))) {
            require(wallet[msg.sender].tokenB >= _oppositeAmountRequired);
            wallet[msg.sender].tokenB -= _oppositeAmountRequired;
            wallet[msg.sender].tokenA += amount;
        } else {
            require(wallet[msg.sender].tokenA >= _oppositeAmountRequired);
            wallet[msg.sender].tokenA -= _oppositeAmountRequired;
            wallet[msg.sender].tokenB += amount;
        }
        quantityA = _quantityA;
        quantityB = _quantityB;
        priceA = _priceA;
        priceB = _priceB;

        emit Withdrawal(_oppositeAmountRequired);
    }

    // returns the new quantity and price of both tokens given a swap transaction.
    // also returns the amount withdrawn for deposits, or the amount deposited for withdrawals
    function getPostSwapDetails(string memory token, string memory direction, int amount) public view returns (
        int newQuantityA,
        int newQuantityB,
        int newPriceA,
        int newPriceB,
        int oppositeAmountRequired // how much user needs to deposit for a certain withdrawal amount or how much withdrawn for a certain deposit amount
    ) {
        require(keccak256(bytes(direction)) == keccak256(bytes('deposit')) || keccak256(bytes(direction)) == keccak256(bytes('withdrawal')));
        tokenNameCheck(token);
        require(amount >= 0);
        // TODO: only 2 tokens for now. make this work for other pairings later
       if (keccak256(bytes(direction)) == keccak256(bytes('deposit'))) {
            // deposits
            if (keccak256(bytes(token)) == keccak256(bytes('tokenA'))) {
                // token A
                newQuantityA = quantityA + amount;
                // x * y = k ---> priceXquantityX * priceYquantityY = k --> quantityY = k/pXqXpY
                newQuantityB = k/(newQuantityA * priceA * priceB);
                oppositeAmountRequired = quantityB - newQuantityB;
            } else {
                // token B
                newQuantityB = quantityB + amount;
                newQuantityA = k/(newQuantityB * priceB * priceA); 
                oppositeAmountRequired = quantityA - newQuantityA;
            }
        } else {
            // withdrawals
            if (keccak256(bytes(token)) == keccak256(bytes('tokenA'))) {
                // token A
                newQuantityA = quantityA - amount;
                newQuantityB = k/(newQuantityA * priceA * priceB);
                oppositeAmountRequired = newQuantityB - quantityB;
            } else {
                // token B
                newQuantityB = quantityB - amount;
                newQuantityA = k/(newQuantityB * priceB * priceA);
                oppositeAmountRequired = newQuantityA - quantityA;
            }
        }
        newPriceA = x/newQuantityA;
        newPriceB = y/newQuantityB;

        return (newQuantityA, newQuantityB, newPriceA, newPriceB, oppositeAmountRequired);
    }

    // As a user I want to be able to check the balance in my wallet
    // function getWalletBalance() public view returns (int tokenA, int tokenB) {
    //     require(userExists[msg.sender]);
    //     return (wallet[msg.sender].tokenA, wallet[msg.sender].tokenB);
    // }

    function getWalletBalanceA() public view returns (int) {
        require(userExists[msg.sender]);
        return wallet[msg.sender].tokenA;
    }

    function getWalletBalanceB() public view returns (int) {
        require(userExists[msg.sender]);
        return wallet[msg.sender].tokenB;
    }

    // As a user I want to be able to check the amount of liquidity I am currently providing
    // function getProvidedLiquidity() public view returns (int tokenA, int tokenB) {
    //     return (liquidity[msg.sender].tokenA, liquidity[msg.sender].tokenB);
    // }

    function getFormulaVariableValue(string memory value) public view returns (int) {
        require(keccak256(bytes(value)) == keccak256(bytes('x')) || keccak256(bytes(value)) == keccak256(bytes('y')) || keccak256(bytes(value)) == keccak256(bytes('k')));
        if (keccak256(bytes(value)) == keccak256(bytes('x'))) {
            return x;
        } else if (keccak256(bytes(value)) == keccak256(bytes('y'))) {
            return y;
        } else {
            return k;
        }
    }

    // As a user I want to be able to get the price or quantity of a given token
    function getTokenDetail(string memory token, string memory detail) public view returns (int) {
        require(keccak256(bytes(detail)) == keccak256(bytes('price')) || keccak256(bytes(detail)) == keccak256(bytes('quantity')));
        tokenNameCheck(token);
        if (keccak256(bytes(token)) == keccak256(bytes('tokenA'))) {
            // token A
            if (keccak256(bytes(detail)) == keccak256(bytes('price'))) {
                // price
                return priceA;
            } else {
                // quantity
                return quantityA;
            }
        } else {
            // token B
            if (keccak256(bytes(detail)) == keccak256(bytes('price'))) {
                // price
                return priceB;
            } else {
                // quantity
                return quantityB;
            }
        }
    }

    // checks if token name is 'tokenA' or 'tokenB'
    function tokenNameCheck(string memory token) private pure {
        require(keccak256(bytes(token)) == keccak256(bytes('tokenA')) || keccak256(bytes(token)) == keccak256(bytes('tokenB')));
    }

    function tokenAssociate(address sender, address tokenAddress) public returns (int) {
        int response = HederaTokenService.associateToken(sender, tokenAddress);

        if (response != HederaResponseCodes.SUCCESS) {
            revert('Associate failed');
        }

        return response;
    }

    function tokenTransfer(
        address tokenId,
        address fromAccountId,
        address toAccountId,
        int64 tokenAmount
    ) public returns (int) {
        int response = HederaTokenService.transferToken(tokenId, fromAccountId, toAccountId, tokenAmount);

        if (response != HederaResponseCodes.SUCCESS) {
            revert('Transfer failed');
        }
    
        if (userExists[toAccountId]) {                
            TokenCount storage token = wallet[toAccountId];
            token.tokens[tokenId] += tokenAmount; 
        }

        return response;
    }

    function tokenDissociate(address sender, address tokenAddress) public returns (int) {
        int response = HederaTokenService.dissociateToken(sender, tokenAddress);

        if (response != HederaResponseCodes.SUCCESS) {
            revert('Dissociate failed');
        }

        return response;
    }
}