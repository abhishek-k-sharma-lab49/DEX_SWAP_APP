const { FileCreateTransaction, ContractCreateTransaction, FileAppendTransaction, Hbar, PrivateKey, TokenId, AccountId } = require('@hashgraph/sdk');
const {accountBalanceQuery} = require('./account-balance-query');
const { initializeClientOperator, initializeDEXClientOperator } = require('./client-operator');
require("dotenv").config();

async function getBalances() {

    const client = initializeClientOperator();
    console.log('OSR creating IDs now');
    const treasuryId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
    const dexId = AccountId.fromString(process.env.DEX_CONTRACT_OWNER_ID);
    const traderID = AccountId.fromString(process.env.TRADER_ACCOUNT_ID);
    const liquidityProviderID = AccountId.fromString(process.env.LIQUIDITY_PROVIDER_ACCOUNT_ID);
    const myAccountId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
    
    const tokenAId = TokenId.fromString(process.env.TOKEN_A_ID);
    const tokenBId = TokenId.fromString(process.env.TOKEN_B_ID);
    

    console.log('Treasury, DEX, and token addresses (in Solidity address format');
    console.log('Treasury addr', treasuryId.toSolidityAddress());
    console.log('DEX addr', dexId.toSolidityAddress());
    console.log('\x1b[32m%x\x1b[0m', 'tokenA addr', tokenAId.toSolidityAddress(), '- Hedera TokenID (non solidity addr):', tokenAId.toString());
    console.log('\x1b[32m%x\x1b[0m', 'tokenB addr', tokenBId.toSolidityAddress(), '- Hedera TokenID (non solidity addr):', tokenBId.toString());
    
    console.log('Treasury, Account Detail');
    const response = await accountBalanceQuery(client, treasuryId);

    console.log(' Dex Contract Owner');
    const response1 = await accountBalanceQuery(client, dexId);

    console.log(' Trader');
    const response2 = await accountBalanceQuery(client, traderID);

    console.log('Liquidity Provider');
    const response3 = await accountBalanceQuery(client, liquidityProviderID);

    console.log(' My Account');
    const response4 = await accountBalanceQuery(client, myAccountId);
}

getBalances();