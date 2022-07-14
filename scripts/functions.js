const { Hbar, TokenId, AccountId, ContractFunctionParameters, ContractCallQuery, ContractExecuteTransaction } = require('@hashgraph/sdk');
const { FileCreateTransaction, ContractCreateTransaction, FileAppendTransaction, PrivateKey } = require('@hashgraph/sdk');
const { transferTokens } = require('./hts');
const { accountBalanceQuery } = require('./account-balance-query');
const Web3 = require('web3');

const { initializeClientOperator, initializeDEXClientOperator } = require('./client-operator');


const web3 = new Web3;
const abi = require('../contracts/HederaLabDex.json').abi;

// ripped from Hedera example https://github.com/hashgraph/hedera-smart-contracts-libs-lab/blob/6ceaa3ea344ec838b5b2cbb22cbdfcf9326d89b7/javascriptWithWeb3js/index.js#L311
/**
 * Decodes event contents using the ABI definition of the event
 * @param eventName the name of the event
 * @param log log data as a Hex string
 * @param topics an array of event topics
 */
function decodeEvent(eventName, log, topics) {
    const eventAbi = abi.find(event => (event.name === eventName && event.type === "event"));
    const decodedLog = web3.eth.abi.decodeLog(eventAbi.inputs, log, topics);
    return decodedLog;
}

async function getUserWalletBalance(client, contractId, coin) {
    console.log('User wallet contains:');
    const userWalletTokenContractQuery = await new ContractCallQuery()
                .setGas(100000)
                .setContractId(contractId)
                .setFunction(coin === 'tokenA' ? 'getWalletBalanceA' : 'getWalletBalanceB')
                .setQueryPayment(new Hbar(2)); 

    const userWalletTokenResult = await userWalletTokenContractQuery.execute(client);
    const userWalletTokenReturnVal = userWalletTokenResult.getInt256();
    console.log(`${userWalletTokenReturnVal} Token${coin === 'tokenA' ? 'A' : 'B'}`);

}

async function deposit(client, contractId, coin, amount, userId, userPrivateKey, dexId, dexPrivateKey) {
    let withdrawAmount;
    const tokenToDeposit = coin === 'tokenA' ? TokenId.fromString(process.env.TOKEN_A_ID) : TokenId.fromString(process.env.TOKEN_B_ID);
    const tokenToWithdraw = coin === 'tokenA' ? TokenId.fromString(process.env.TOKEN_B_ID) : TokenId.fromString(process.env.TOKEN_A_ID);

    // Check starting wallet balances of user and DEX prior to transaction
    console.log('\x1b[32m%s\x1b[0m', 'Deposit transaction invoked. Current wallet balances of user and DEX (REAL TOKEN VALUES FROM WALLET):');
    await accountBalanceQuery(client, userId);
    await accountBalanceQuery(client, dexId);

    // call contract to update numerical values stored there
    const depositContractQuery = await new ContractExecuteTransaction()
                .setGas(100000)
                .setContractId(contractId)
                .setFunction('deposit', new ContractFunctionParameters().addString(coin).addInt256(amount))

    // get withdrawal amount for deposit
    const depositResult = await depositContractQuery.execute(client);
    const depositRecord = await depositResult.getRecord(client);
    depositRecord.contractFunctionResult.logs.forEach(log => {
        const logStringHex = ('0x'.concat(Buffer.from(log.data).toString('hex')));

        const logTopics = []
        log.topics.forEach(topic => {
            logTopics.push('0x'.concat(Buffer.from(topic).toString('hex')));
        });

        const event = decodeEvent('Deposit', logStringHex, logTopics.slice(1));
        withdrawAmount = event.withdrawAmount;

        console.log(`User deposited ${amount} ${coin} and received ${withdrawAmount} ${coin === 'tokenA' ? 'tokenB' : 'tokenA'} in return`);
    });

    console.log('\x1b[32m%s\x1b[0m', '////////// Executing transfer between wallets (REAL TOKENS MOVING AROUND HERE) //////////');

    // Execute deposit transaction
    const submitUserDepositTxReceipt = await transferTokens(client, contractId, tokenToDeposit, userId, userPrivateKey, dexId, amount);
    console.log(`Deposit ${amount} ${coin} to DEX transaction status:, ${submitUserDepositTxReceipt.status.toString()}`);

    // Execute withdraw transaction
    const submitdexWithdrawalTxReceipt = await transferTokens(client, contractId, tokenToWithdraw, dexId, dexPrivateKey, userId, withdrawAmount);
    console.log(`Withdraw ${withdrawAmount} ${coin === 'tokenA' ? 'tokenB' : 'tokenA'} from DEX transaction status:, ${submitdexWithdrawalTxReceipt.status.toString()}`);

    // Check wallet balances of user and DEX following transaction
    console.log('\x1b[32m%s\x1b[0m', 'Ending wallet balances of user and DEX following transaction (REAL TOKEN VALUES FROM WALLET):');
    await accountBalanceQuery(client, userId);
    await accountBalanceQuery(client, dexId);

    // check DEX state (numerical values recorded in contract)
    console.log('\nDEX State following this transaction:')
    await getDexState(client, contractId);
}

async function associateTokenWithUser(client, newContractId, accountIdToBeAssociated, accountKeyToBeAssociated,  tokenId) {
    console.log("\n////////// Associating tokens with "+accountIdToBeAssociated+" //////////");
    const submitAssociateTokenATxReceipt = await associateToken(client, newContractId, accountIdToBeAssociated, accountKeyToBeAssociated, tokenId);
    console.log("Associate"+ accountIdToBeAssociated+ " with" +tokenId+ " transaction was", submitAssociateTokenATxReceipt.status.toString());
}

module.exports = {
    getUserWalletBalance,
    deposit,
    associateTokenWithUser,
}