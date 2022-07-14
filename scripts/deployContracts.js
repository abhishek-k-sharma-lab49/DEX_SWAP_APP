const { Hbar, TokenId, AccountId, ContractFunctionParameters, ContractCallQuery, ContractExecuteTransaction } = require('@hashgraph/sdk');
const { FileCreateTransaction, ContractCreateTransaction, FileAppendTransaction, PrivateKey } = require('@hashgraph/sdk');
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

async function deployAllContracts() {
    //const cont1 = await deployDexContract();
    const cont2 = await deploySwapContract();
    const cont3 = await deployTokenAContract();
    const cont4 = await deployTokenBContract();
}

async function deployDexContract() {
    const client = initializeDEXClientOperator();
    //return process.env.LAST_CONTRACT;
    // REMOVE ABOVE RETURN IF YOU WANT TO RE_DEPLOY THE CONTRACT
    console.log('\n////////// Creating OSR Called');
    let contractJson = require('../contracts/HederaLabDex.json');
    console.log('\n////////// Creating OSR Called' + contractJson.data);
    const bytecode = contractJson.data.bytecode.object;

    console.log('\n////////// Creating and uploading smart contract files to Hedera testnet //////////');
    // console.log('\n////////// Uploading HTS contract //////////');
    // const fileCreateTxHTS = new FileCreateTransaction().setContents(HTSBytecode);
    // const submitTxHTS = fileCreateTxHTS.execute(client);
    // const HTSFileReceipt = await (await submitTxHTS).getReceipt(client);
    // const HTSBytecodeFileId = HTSFileReceipt.fileId;

    // console.log('HTS smart contract byte code file ID:', HTSBytecodeFileId.toString());

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
        // .setConstructorParameters(new ContractFunctionParameters()
            // .addAddress(HTSContractId.toSolidityAddress())
            // .addAddress(treasuryId.toSolidityAddress())
            // .addAddress(tokenAId.toSolidityAddress())
            // .addAddress(tokenBId.toSolidityAddress())
        // ); // provide token IDs, treasury address, and address of HTS contract (so we can call it) to constructor
    // Submit transaction to Hedera testnet and execute
    const contractResponse = await contractTx.execute(client);
    // Get receipt of contract create transaction
    const contractReceipt = await contractResponse.getReceipt(client);
    // Get smart contract ID
    const newContractId = contractReceipt.contractId;

    return  newContractId
}

async function deploySwapContract(path) {
    const client = initializeDEXClientOperator();
    //return process.env.LAST_CONTRACT;
    // REMOVE ABOVE RETURN IF YOU WANT TO RE_DEPLOY THE CONTRACT
    console.log('\n////////// Creating OSR Swap Contract');
    let contractJson = require('../artifacts/contracts/Swap.sol/Swap.json');
    console.log('\n////////// Creating OSR Called' + contractJson.data);
    const bytecode = contractJson.data.bytecode.object;
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
         .addAddress(tokenAId.toSolidityAddress())
         .addAddress(treasuryId.toSolidityAddress())
         .addAddress(tokenBId.toSolidityAddress())
         .addAddress(treasuryId.toSolidityAddress())
         .addAddress(100)
         ); // provide token IDs, treasury address, and address of HTS contract (so we can call it) to constructor
    // Submit transaction to Hedera testnet and execute
    const contractResponse = await contractTx.execute(client);
    // Get receipt of contract create transaction
    const contractReceipt = await contractResponse.getReceipt(client);
    // Get smart contract ID
    const newContractId = contractReceipt.contractId;

    return  newContractId
}

async function deployTokenAContract() {
    const client = initializeTreaserClientOperator();
    //return process.env.LAST_CONTRACT;
    // REMOVE ABOVE RETURN IF YOU WANT TO RE_DEPLOY THE CONTRACT
    console.log('\n////////// Creating OSR TokenA Called');
    let contractJson = require('../artifacts/contracts/TokenA.sol/TokenA.json');
    console.log('\n////////// Creating OSR Called' + contractJson.data);
    const bytecode = contractJson.data.bytecode.object;

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
            .addAddress(tokenAId.toSolidityAddress())
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
    const client = initializeTreaserClientOperator();
    //return process.env.LAST_CONTRACT;
    // REMOVE ABOVE RETURN IF YOU WANT TO RE_DEPLOY THE CONTRACT
    console.log('\n////////// Creating OSR TokenB Called');
    let contractJson = require('../artifacts/contracts/TokenB.sol/TokenB.json');
    console.log('\n////////// Creating OSR Called' + contractJson.data);
    const bytecode = contractJson.data.bytecode.object;

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
            .addAddress(tokenAId.toSolidityAddress())
        ); // provide token IDs, treasury address, and address of HTS contract (so we can call it) to constructor
    // Submit transaction to Hedera testnet and execute
    const contractResponse = await contractTx.execute(client);
    // Get receipt of contract create transaction
    const contractReceipt = await contractResponse.getReceipt(client);
    // Get smart contract ID
    const newContractId = contractReceipt.contractId;

    return  newContractId;
}

deployAllContracts();

