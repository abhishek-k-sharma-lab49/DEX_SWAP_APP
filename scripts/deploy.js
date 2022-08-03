const { ContractFunctionParameters, ContractExecuteTransaction, FileAppendTransaction, Hbar, PrivateKey, TokenId, AccountId } = require('@hashgraph/sdk');
const { initializeClientOperator, initializeTreaserClientOperator } = require('./client-operator');
const { associateToken, transferTokens } = require('./hts');
const { accountBalanceQuery } = require('./account-balance-query');
const { getUserWalletBalance, deposit, associateTokenWithUser } = require('./functions');
const {deployAllContracts, deploySwapHederaContract, deployTokenContract, swapTokens, approveTransaction, addLiquidity} = require('./deployContracts');
const {getBalances} = require('./getAllAcoountBalances');

require("dotenv").config();

async function deploy() {
    const client = initializeClientOperator();


    // Hedera Swap Contract
    //const newContractId = '0.0.47717682';//await deploySwapHederaContract();
    const newContractId = await deployTokenContract();
    console.log(`OSR New Contract ID: ${newContractId}`)
    //const value0 = await getBalances();
    //const result = await addLiquidity(newContractId);
    // const value = await getBalances();
    // console.log("1 time balance fetched\n\n");
    // const swapResult = await swapTokens(newContractId);
    // console.log("\n\n2 stepsToSwapNewTokens done\n\n");
    // const value2 = await getBalances();
}

function decodeEvent(eventName, log, topics) {
    const eventAbi = abi.find(event => (event.name === eventName && event.type === "event"));
    const decodedLog = web3.eth.abi.decodeLog(eventAbi.inputs, log, topics);
    return decodedLog;
}

async function stepsToSwap() {
    console.log('DEX smart contract ID is', newContractId.toSolidityAddress());

    // TODO: associating tokens and transferring tokens to DEX contract (initializing liquidity) via JS for now because sol isn't working
    console.log('\n////////// Associating and transfering tokens to DEX account for initial liquidity //////////');

    const treasuryId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
    const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PRIVATE_KEY);
    const dexId = AccountId.fromString(process.env.DEX_ACCOUNT_ID);
    const dexKey = PrivateKey.fromString(process.env.DEX_PRIVATE_KEY);
    const tokenAId = TokenId.fromString(process.env.TOKEN_A_ID);
    const tokenBId = TokenId.fromString(process.env.TOKEN_B_ID);

    console.log('Treasury, DEX, and token addresses (in Solidity address format');
    console.log('Treasury addr', treasuryId.toSolidityAddress());
    console.log('DEX addr', dexId.toSolidityAddress());
    console.log('\x1b[32m%x\x1b[0m', 'tokenA addr', tokenAId.toSolidityAddress(), '- Hedera TokenID (non solidity addr):', tokenAId.toString());
    console.log('\x1b[32m%x\x1b[0m', 'tokenB addr', tokenBId.toSolidityAddress(), '- Hedera TokenID (non solidity addr):', tokenBId.toString());

    // TODO: Check if you can transfer tokens without associating

    // Look for some logic to move ahaed withiout re association of token.
    console.log('\n////////// Associating tokens with DEX //////////');
    associateTokenWithUser(client, newContractId, dexId, dexKey, tokenAId);
    associateTokenWithUser(client, newContractId, dexId, dexKey, tokenBId);
    
   
    console.log('\n////////// Transferring tokens to DEX //////////');
    const tokenATransferAmount = 1000;
    const transferAStatus = await transferTokens(client, newContractId, tokenAId, treasuryId, treasuryKey, dexId, tokenATransferAmount);
    console.log(`Transfer ${tokenATransferAmount} token A transaction status: ${transferAStatus.status.toString()}`);
    const tokenBTransferAmount = 500;
    const transferBStatus = await transferTokens(client, newContractId, tokenBId, treasuryId, treasuryKey, dexId, tokenBTransferAmount);
    console.log(`Transfer ${tokenBTransferAmount} token B transaction status: ${transferBStatus.status.toString()}`);


    console.log('\n////////// Check balance of DEX to verify transfers succeeded (REAL VALUES FROM WALLET) //////////');
    //Verify initial liquidity was transferred to DEX
    await accountBalanceQuery(client, dexId);

    console.log('\n////////// DEX smart contract ready to interact with - Interacting with DEX //////////')

    // Give user 1000 tokens of each
    console.log('\n////////// Initialize a test user with 1000 TokenA and 1000 TokenB (REAL TOKEN VALUES) //////////');
    const testUserId = AccountId.fromString(process.env.ZACK_ACCOUNT_ID);
    const testUserKey = PrivateKey.fromString(process.env.ZACK_PRIVATE_KEY);

    const submitAssociateUserTokenATxReceipt = await associateToken(client, newContractId, testUserId, testUserKey, tokenAId);
    console.log(`Associate user ID ${testUserId} with TokenA transaction was: ${submitAssociateUserTokenATxReceipt.status.toString()}`);
    const submitAssociateUserTokenBTxReceipt = await associateToken(client, newContractId, testUserId, testUserKey, tokenBId);
    console.log(`Associate user ID ${testUserId} with TokenB transaction was: ${submitAssociateUserTokenBTxReceipt.status.toString()}`);

    const testUserInitialAReceipt = await transferTokens(client, newContractId, tokenAId, treasuryId, treasuryKey, testUserId, 1000);
    console.log(`Transfer 500 token A to user ID ${testUserId} transaction status:, ${testUserInitialAReceipt.status.toString()}`);
    const testUserInitialBReceipt = await transferTokens(client, newContractId, tokenBId, treasuryId, treasuryKey, testUserId, 1000);
    console.log(`Transfer 1000 token B to user ID ${testUserId} transaction status:, ${testUserInitialBReceipt.status.toString()}`);

    console.log('\x1b[32m%x\x1b[0m', '\n////////// Check test user wallet balance to confirm initial funds added (REAL TOKEN VALUES) //////////');
    await accountBalanceQuery(client, testUserId);

    // Play with smart contract
    console.log('\n////////// State of DEX at initialization //////////')
    await getDexState(client, newContractId);
    
    console.log('\n////////// Sign up for DEX //////////')
    await signup(client, newContractId);
    
    console.log('\n////////// Check wallet balance to make sure we have initial funds //////////')
    await getUserWalletBalance(client, newContractId, 'tokenA');
    await getUserWalletBalance(client, newContractId, 'tokenB');

    console.log('\n////////// Go to deposit 50 tokenB //////////')
    await deposit(client, newContractId, 'tokenB', 50, testUserId, testUserKey, dexId, dexKey);
    console.log('\n////////// Check wallet balance to validate transaction //////////')
    await getUserWalletBalance(client, newContractId, 'tokenA');
    await getUserWalletBalance(client, newContractId, 'tokenB');
    
    console.log('\n////////// Go to deposit 200 tokenA //////////')
    await deposit(client, newContractId, 'tokenA', 200, testUserId, testUserKey, dexId, dexKey);
    console.log('\n////////// Check wallet balance to validate transaction //////////')
    await getUserWalletBalance(client, newContractId, 'tokenA');
    await getUserWalletBalance(client, newContractId, 'tokenB');

    console.log('\n////////// Go to withdraw 100 tokenB //////////')
    await withdraw(client, newContractId, 'tokenB', 100, testUserId, testUserKey, dexId, dexKey);
    console.log('\n////////// Check wallet balance to validate transaction //////////')
    await getUserWalletBalance(client, newContractId, 'tokenA');
    await getUserWalletBalance(client, newContractId, 'tokenB');
}

deploy();