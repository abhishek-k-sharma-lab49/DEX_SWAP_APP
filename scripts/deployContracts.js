const { Hbar, TokenId, AccountId, ContractFunctionParameters, ContractCallQuery, ContractExecuteTransaction } = require('@hashgraph/sdk');
const { FileCreateTransaction, ContractCreateTransaction, FileAppendTransaction, PrivateKey, AccountAllowanceApproveTransaction } = require('@hashgraph/sdk');
const { transferTokens } = require('./hts');
const { accountBalanceQuery } = require('./account-balance-query');
const Web3 = require('web3');
require("dotenv").config();

const { initializeClientOperator, initializeDEXClientOperator, initializeTreaserClientOperator } = require('./client-operator');

// appends file to file indicated by bytecodeFileId and returns the receipt
async function appendFile(client, bytecodeFileId, contents, fileKey) {
    const fileAppendSecondTx = await new FileAppendTransaction()
        .setFileId(bytecodeFileId)
        .setContents(contents)
        .setMaxTransactionFee(new Hbar(2))
        .freezeWith(client);

    const signSecondTx = await fileAppendSecondTx.sign(fileKey);
    const txSecondResponse = await signSecondTx.execute(client);
    return await txSecondResponse.getReceipt(client);
}

async function stepsToSwapNewTokens(newContractId) {
    console.log("OSR ID");
    console.log(process.env.TREASURY_ACCOUNT_ID);
    const treasuryId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
    const traderId = AccountId.fromString(process.env.TRADER_ACCOUNT_ID);
    const tokenAId = TokenId.fromString(process.env.TOKEN_A_ID);
    const tokenBId = TokenId.fromString(process.env.TOKEN_B_ID);
    const client = initializeTreaserClientOperator();
    console.log("OSR IDs");
    console.log(treasuryId);
    console.log(tokenAId);
    console.log(tokenBId);
    console.log(newContractId);
    const addLiquidityContractQuery = await new ContractExecuteTransaction()
    .setGas(100000)
    .setContractId(newContractId)
    .setFunction('addLiquidity',
     new ContractFunctionParameters()
        .addAddress(tokenAId.toSolidityAddress())
        .addAddress(treasuryId.toSolidityAddress())
        .addInt64(50)
        .addAddress(tokenBId.toSolidityAddress())
        .addInt64(50)
    )
    
    const addLiquidityResult = await addLiquidityContractQuery.execute(client);
    const addLiquidityRecord = await addLiquidityResult.getRecord(client);
    addLiquidityRecord.contractFunctionResult.logs.forEach(log => {
        const logStringHex = ('0x'.concat(Buffer.from(log.data).toString('hex')));

        const logTopics = []
        log.topics.forEach(topic => {
            logTopics.push('0x'.concat(Buffer.from(topic).toString('hex')));
        });

        const event = decodeEvent('addLiquidity', logStringHex, logTopics.slice(1));
        withdrawAmount = event.withdrawAmount;

        console.log(`User deposited ${amount} ${coin} and received ${withdrawAmount} ${coin === 'tokenA' ? 'tokenB' : 'tokenA'} in return`);
    });

    //console.log('\x1b[32m%s\x1b[0m', '////////// Executing transfer between wallets (REAL TOKENS MOVING AROUND HERE) //////////');

    return addLiquidityRecord;
}

async function approveTransaction(contract) {
    const treasuryId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
    const traderId = AccountId.fromString(process.env.TRADER_ACCOUNT_ID);
    const treasuryKey = AccountId.fromString(process.env.TREASURY_PRIVATE_KEY);
    const tokenAId = TokenId.fromString(process.env.TOKEN_A_ID);
    const tokenBId = TokenId.fromString(process.env.TOKEN_B_ID);
    const contractId = AccountId.fromString(contract);
    const client = initializeClientOperator();
    const transaction = new AccountAllowanceApproveTransaction()
    .approveTokenAllowance(
        tokenAId,
        treasuryId,
        contractId,
        50
    )
    .setGas(100000)
    
    //Sign the transaction with the owner account key
    const signTx = await transaction.sign(treasuryKey);

    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log("The transaction consensus status is " +transactionStatus.toString());
}

async function deployAllContracts() {
    //const cont1 = await deployDexContract();
    console.log('deployAllContracts called');
    const cont2 = await deploySwapHederaContract();
    console.log('Swap ContractId' + cont2);
    return cont2
    // const cont3 = await deployTokenAContract();
    // console.log('deployTokenAContract ID' + cont3);
    // const cont4 = await deployTokenBContract();
    // console.log('deployTokenBContract ID' + cont3);
}

async function deploySwapHederaContract() {
    
    const treasuryId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
    const traderId = AccountId.fromString(process.env.TRADER_ACCOUNT_ID);
    const tokenAId = TokenId.fromString(process.env.TOKEN_A_ID);
    const tokenBId = TokenId.fromString(process.env.TOKEN_B_ID);
    const client = initializeClientOperator();

    //return process.env.LAST_CONTRACT;
    // REMOVE ABOVE RETURN IF YOU WANT TO RE_DEPLOY THE CONTRACT
    console.log('\n////////// Creating OSR Swap Contract');
    let contractJson = require('../artifacts/contracts/SwapHederaTokens.sol/SwapHederaTokens.json');
    const bytecode = contractJson.bytecode;
    const bytecodeLength = bytecode.length;

    bytecodeFirstQuarter = bytecode.substring(0, bytecodeLength / 5);
    bytecodeSecondQuarter = bytecode.substring(bytecodeLength / 5, bytecodeLength * 2 / 5);
    bytecodeThirdQuarter = bytecode.substring(bytecodeLength * 2 / 5, bytecodeLength * 3 / 5);
    bytecodeFourthQuarter = bytecode.substring(bytecodeLength * 3 / 5, bytecodeLength * 4 / 5);
    bytecodeFifthQuarter = bytecode.substring(bytecodeLength * 4 / 5);

    // Create a file on Hedera and store the hex-encoded bytecode
    // need to sign file transaction with keys so can append other parts of bytecode to it
    const fileKey = await PrivateKey.generateED25519();
    const filePublicKey = fileKey.publicKey;
    console.log('\n////////// Swap Contract File Creation Transaction');
    const fileCreateTx = new FileCreateTransaction()
        .setKeys([filePublicKey])           // sign file with public key
        .setContents(bytecodeFirstQuarter)
        .freezeWith(client);
    // sign file create transaction with fileKey (private)
    const signTx = await fileCreateTx.sign(fileKey);
    // Submit file to Hedera test net signing with the transaction fee payer key specified in client
    const submitTx = await signTx.execute(client);
    // Get receipt of the file create transaction
    const fileReceipt = await submitTx.getReceipt(client);
    // Get file ID from the receipt
    const bytecodeFileId = fileReceipt.fileId;

    // APPEND REST OF BYTECODE TO FILE
    // append second part of bytecode
    const secondReceipt = await appendFile(client, bytecodeFileId, bytecodeSecondQuarter, fileKey);
    console.log('Appending Second part of file status:', secondReceipt.status.toString());
    // append third part of bytecode
    const thirdReceipt = await appendFile(client, bytecodeFileId, bytecodeThirdQuarter, fileKey);
    console.log('Appending Third part of file status:', thirdReceipt.status.toString());
    // append fourth part of bytecode
    const fourthReceipt = await appendFile(client, bytecodeFileId, bytecodeFourthQuarter, fileKey);
    console.log('Appending Fourth part of file status:', fourthReceipt.status.toString());
    // append fifth part of bytecode
    const fifthReceipt = await appendFile(client, bytecodeFileId, bytecodeFifthQuarter, fileKey);
    console.log('Appending Fifth part of file status:', fifthReceipt.status.toString());


    console.log('\n////////// Swap Contract ContractCreateTransaction');

    
    const contractTx = await new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)  // Hedera file ID containing bytecode
        .setGas(10000000) // gas to instantiate contract (for transaction)
        .setConstructorParameters(); 
    // provide token IDs, treasury address, and address of HTS contract (so we can call it) to constructor
    // Submit transaction to Hedera testnet and execute
    const contractResponse = await contractTx.execute(client);
    // Get receipt of contract create transaction
    const contractReceipt = await contractResponse.getReceipt(client);
    // Get smart contract ID
    const newContractId = contractReceipt.contractId;
    console.log('\n////////// Swap Contract Id :'+ newContractId);
    return  newContractId
}

async function deploySwapContract() {
    const treasuryId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
    const traderId = AccountId.fromString(process.env.TRADER_ACCOUNT_ID);
    const tokenAId = TokenId.fromString(process.env.TOKEN_A_ID);
    const tokenBId = TokenId.fromString(process.env.TOKEN_B_ID);
    const client = initializeClientOperator();

    //return process.env.LAST_CONTRACT;
    // REMOVE ABOVE RETURN IF YOU WANT TO RE_DEPLOY THE CONTRACT
    console.log('\n////////// Creating OSR Swap Contract');
    let contractJson = require('../artifacts/contracts/Swap.sol/Swap.json');
    const bytecode = contractJson.bytecode;
    const bytecodeLength = bytecode.length;

    bytecodeFirstQuarter = bytecode.substring(0, bytecodeLength / 5);
    bytecodeSecondQuarter = bytecode.substring(bytecodeLength / 5, bytecodeLength * 2 / 5);
    bytecodeThirdQuarter = bytecode.substring(bytecodeLength * 2 / 5, bytecodeLength * 3 / 5);
    bytecodeFourthQuarter = bytecode.substring(bytecodeLength * 3 / 5, bytecodeLength * 4 / 5);
    bytecodeFifthQuarter = bytecode.substring(bytecodeLength * 4 / 5);

    // Create a file on Hedera and store the hex-encoded bytecode
    // need to sign file transaction with keys so can append other parts of bytecode to it
    const fileKey = await PrivateKey.generateED25519();
    const filePublicKey = fileKey.publicKey;
    console.log('\n////////// Swap Contract File Creation Transaction');
    const fileCreateTx = new FileCreateTransaction()
        .setKeys([filePublicKey])           // sign file with public key
        .setContents(bytecodeFirstQuarter)
        .freezeWith(client);
    // sign file create transaction with fileKey (private)
    const signTx = await fileCreateTx.sign(fileKey);
    // Submit file to Hedera test net signing with the transaction fee payer key specified in client
    const submitTx = await signTx.execute(client);
    // Get receipt of the file create transaction
    const fileReceipt = await submitTx.getReceipt(client);
    // Get file ID from the receipt
    const bytecodeFileId = fileReceipt.fileId;

    // APPEND REST OF BYTECODE TO FILE
    // append second part of bytecode
    const secondReceipt = await appendFile(client, bytecodeFileId, bytecodeSecondQuarter, fileKey);
    console.log('Appending Second part of file status:', secondReceipt.status.toString());
    // append third part of bytecode
    const thirdReceipt = await appendFile(client, bytecodeFileId, bytecodeThirdQuarter, fileKey);
    console.log('Appending Third part of file status:', thirdReceipt.status.toString());
    // append fourth part of bytecode
    const fourthReceipt = await appendFile(client, bytecodeFileId, bytecodeFourthQuarter, fileKey);
    console.log('Appending Fourth part of file status:', fourthReceipt.status.toString());
    // append fifth part of bytecode
    const fifthReceipt = await appendFile(client, bytecodeFileId, bytecodeFifthQuarter, fileKey);
    console.log('Appending Fifth part of file status:', fifthReceipt.status.toString());


    console.log('\n////////// Swap Contract ContractCreateTransaction');

    
    const contractTx = await new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)  // Hedera file ID containing bytecode
        .setGas(1000000) // gas to instantiate contract (for transaction)
        .setConstructorParameters(new ContractFunctionParameters()
         .addAddress(tokenAId.toSolidityAddress())
         .addAddress(treasuryId.toSolidityAddress())
         .addAddress(tokenBId.toSolidityAddress())
         .addAddress(traderId.toSolidityAddress())
         .addUint256(50)
         ); // provide token IDs, treasury address, and address of HTS contract (so we can call it) to constructor
    // Submit transaction to Hedera testnet and execute
    const contractResponse = await contractTx.execute(client);
    // Get receipt of contract create transaction
    const contractReceipt = await contractResponse.getReceipt(client);
    // Get smart contract ID
    const newContractId = contractReceipt.contractId;
    console.log('\n////////// Swap Contract Id :'+ newContractId);
    return  newContractId
}

async function deployTokenAContract() {
    return '0.0.47682203';
    const treasuryId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
    const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PRIVATE_KEY);
    const tokenAId = TokenId.fromString(process.env.TOKEN_A_ID);
    const tokenBId = TokenId.fromString(process.env.TOKEN_B_ID);

    const client = initializeTreaserClientOperator();
    //return process.env.LAST_CONTRACT;
    // REMOVE ABOVE RETURN IF YOU WANT TO RE_DEPLOY THE CONTRACT
    console.log('\n////////// Creating OSR TokenA Called');
    let contractJson = require('../artifacts/contracts/TokenA.sol/TokenA.json');
    console.log('\n////////// Creating OSR Called' + contractJson.bytecode);
    const bytecode = contractJson.bytecode;

    console.log('\n////////// Creating and uploading smart contract files to Hedera testnet //////////');
    console.log('\n////////// Uploading DEX contract //////////');
    console.log('DEX contract file is too large so uploading in chunks');

    const bytecodeLength = bytecode.length;

    bytecodeFirstQuarter = bytecode.substring(0, bytecodeLength / 5);
    bytecodeSecondQuarter = bytecode.substring(bytecodeLength / 5, bytecodeLength * 2 / 5);
    bytecodeThirdQuarter = bytecode.substring(bytecodeLength * 2 / 5, bytecodeLength * 3 / 5);
    bytecodeFourthQuarter = bytecode.substring(bytecodeLength * 3 / 5, bytecodeLength * 4 / 5);
    bytecodeFifthQuarter = bytecode.substring(bytecodeLength * 4 / 5);

    // Create a file on Hedera and store the hex-encoded bytecode
    // need to sign file transaction with keys so can append other parts of bytecode to it
    const fileKey = await PrivateKey.generateED25519();
    const filePublicKey = fileKey.publicKey;

    const fileCreateTx = new FileCreateTransaction()
        .setKeys([filePublicKey])           // sign file with public key
        .setContents(bytecodeFirstQuarter)
        .freezeWith(client);
    // sign file create transaction with fileKey (private)
    const signTx = await fileCreateTx.sign(fileKey);
    // Submit file to Hedera test net signing with the transaction fee payer key specified in client
    const submitTx = await signTx.execute(client);
    // Get receipt of the file create transaction
    const fileReceipt = await submitTx.getReceipt(client);
    // Get file ID from the receipt
    const bytecodeFileId = fileReceipt.fileId;

    console.log('First part of DEX file deployed to testnet')
    console.log('DEX smart contract byte code file ID:', bytecodeFileId.toString());

    // APPEND REST OF BYTECODE TO FILE
    // append second part of bytecode
    const secondReceipt = await appendFile(client, bytecodeFileId, bytecodeSecondQuarter, fileKey);
    console.log('Appending Second part of file status:', secondReceipt.status.toString());
    // append third part of bytecode
    const thirdReceipt = await appendFile(client, bytecodeFileId, bytecodeThirdQuarter, fileKey);
    console.log('Appending Third part of file status:', thirdReceipt.status.toString());
    // append fourth part of bytecode
    const fourthReceipt = await appendFile(client, bytecodeFileId, bytecodeFourthQuarter, fileKey);
    console.log('Appending Fourth part of file status:', fourthReceipt.status.toString());
    // append fifth part of bytecode
    const fifthReceipt = await appendFile(client, bytecodeFileId, bytecodeFifthQuarter, fileKey);
    console.log('Appending Fifth part of file status:', fifthReceipt.status.toString());

    console.log('\n////////// Instantiate contract instance for deployed files //////////');
    console.log('\n////////// Instantiating DEX contract //////////');

    const contractTx = await new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)  // Hedera file ID containing bytecode
        .setGas(1000000) // gas to instantiate contract (for transaction)
        .setConstructorParameters(new ContractFunctionParameters()
            .addString('Lab49 Token A')
            .addString('L49A')
            .addInt256(10000)
            //'Lab49 Token A', 'L49A'
        ); // provide token IDs, treasury address, and address of HTS contract (so we can call it) to constructor
    // Submit transaction to Hedera testnet and execute
    const contractResponse = await contractTx.execute(client);
    // Get receipt of contract create transaction
    const contractReceipt = await contractResponse.getReceipt(client);
    // Get smart contract ID
    const newContractId = contractReceipt.contractId;

    return  newContractId
}

async function deployTokenBContract() {
    return '0.0.47682203';
    const treasuryId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
    const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PRIVATE_KEY);
    const tokenAId = TokenId.fromString(process.env.TOKEN_A_ID);
    const tokenBId = TokenId.fromString(process.env.TOKEN_B_ID);

    const client = initializeTreaserClientOperator();
    //return process.env.LAST_CONTRACT;
    // REMOVE ABOVE RETURN IF YOU WANT TO RE_DEPLOY THE CONTRACT
    console.log('\n////////// Creating OSR TokenB Called');
    let contractJson = require('../artifacts/contracts/TokenB.sol/TokenB.json');
    console.log('\n////////// Creating OSR Called' + contractJson.bytecode);
    const bytecode = contractJson.bytecode;

    console.log('\n////////// Creating and uploading smart contract files to Hedera testnet //////////');
    console.log('\n////////// Uploading DEX contract //////////');
    console.log('DEX contract file is too large so uploading in chunks');

    const bytecodeLength = bytecode.length;

    bytecodeFirstQuarter = bytecode.substring(0, bytecodeLength / 5);
    bytecodeSecondQuarter = bytecode.substring(bytecodeLength / 5, bytecodeLength * 2 / 5);
    bytecodeThirdQuarter = bytecode.substring(bytecodeLength * 2 / 5, bytecodeLength * 3 / 5);
    bytecodeFourthQuarter = bytecode.substring(bytecodeLength * 3 / 5, bytecodeLength * 4 / 5);
    bytecodeFifthQuarter = bytecode.substring(bytecodeLength * 4 / 5);

    // Create a file on Hedera and store the hex-encoded bytecode
    // need to sign file transaction with keys so can append other parts of bytecode to it
    const fileKey = await PrivateKey.generateED25519();
    const filePublicKey = fileKey.publicKey;

    const fileCreateTx = new FileCreateTransaction()
        .setKeys([filePublicKey])           // sign file with public key
        .setContents(bytecodeFirstQuarter)
        .freezeWith(client);
    // sign file create transaction with fileKey (private)
    const signTx = await fileCreateTx.sign(fileKey);
    // Submit file to Hedera test net signing with the transaction fee payer key specified in client
    const submitTx = await signTx.execute(client);
    // Get receipt of the file create transaction
    const fileReceipt = await submitTx.getReceipt(client);
    // Get file ID from the receipt
    const bytecodeFileId = fileReceipt.fileId;

    console.log('First part of DEX file deployed to testnet')
    console.log('DEX smart contract byte code file ID:', bytecodeFileId.toString());

    // APPEND REST OF BYTECODE TO FILE
    // append second part of bytecode
    const secondReceipt = await appendFile(client, bytecodeFileId, bytecodeSecondQuarter, fileKey);
    console.log('Appending Second part of file status:', secondReceipt.status.toString());
    // append third part of bytecode
    const thirdReceipt = await appendFile(client, bytecodeFileId, bytecodeThirdQuarter, fileKey);
    console.log('Appending Third part of file status:', thirdReceipt.status.toString());
    // append fourth part of bytecode
    const fourthReceipt = await appendFile(client, bytecodeFileId, bytecodeFourthQuarter, fileKey);
    console.log('Appending Fourth part of file status:', fourthReceipt.status.toString());
    // append fifth part of bytecode
    const fifthReceipt = await appendFile(client, bytecodeFileId, bytecodeFifthQuarter, fileKey);
    console.log('Appending Fifth part of file status:', fifthReceipt.status.toString());

    console.log('\n////////// Instantiate contract instance for deployed files //////////');
    console.log('\n////////// Instantiating DEX contract //////////');

    const contractTx = await new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)  // Hedera file ID containing bytecode
        .setGas(1000000) // gas to instantiate contract (for transaction)
        .setConstructorParameters(new ContractFunctionParameters()
        .addString('Lab49 Token A')
        .addString('L49A')
        .addInt256(10000)
        ); // provide token IDs, treasury address, and address of HTS contract (so we can call it) to constructor
    // Submit transaction to Hedera testnet and execute
    const contractResponse = await contractTx.execute(client);
    // Get receipt of contract create transaction
    const contractReceipt = await contractResponse.getReceipt(client);
    // Get smart contract ID
    const newContractId = contractReceipt.contractId;

    return  newContractId;
}

module.exports =  {
    deployAllContracts,
    deploySwapHederaContract,
    stepsToSwapNewTokens,
    approveTransaction
}

