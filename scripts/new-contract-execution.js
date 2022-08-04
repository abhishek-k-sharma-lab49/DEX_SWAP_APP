//const { hethers } = require("@hashgraph/hethers");
// const { HashConnect} = require("hashconnect/dist/hashconnect");
// const {HashConnectTypes } = require("hashconnect/dist/types")
const { FileCreateTransaction, ContractCreateTransaction, FileAppendTransaction, AccountAllowanceApproveTransaction } = require('@hashgraph/sdk');

const {getBalances} = require('./getAllAcoountBalances');
const { TokenId, 
    AccountId, 
    ContractExecuteTransaction, 
    ContractFunctionParameters, 
    Client,
    PrivateKey } = require("@hashgraph/sdk");
const { deployNewSwapContract } = require('./deployContracts');
require("dotenv").config();


let topic = "";

const createClient = () => {
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    if (myAccountId == null ||
        myPrivateKey == null) {
        throw new Error("Environment variables myAccountId and myPrivateKey must be present");
    }

    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);
    return client;
}

const client = createClient();
const tokenA = TokenId.fromString("0.0.47646195").toSolidityAddress();
let tokenB = TokenId.fromString("0.0.47646196").toSolidityAddress();

let tokenC = TokenId.fromString("0.0.47652786").toSolidityAddress();
let tokenD = TokenId.fromString("0.0.47652784").toSolidityAddress();
const treasure = AccountId.fromString("0.0.47645191").toSolidityAddress();
const treasureKey = PrivateKey.fromString("308ed38983d9d20216d00371e174fe2d475dd32ac1450ffe2edfaab782b32fc5");
const contractId = "0.0.47835529";//"0.0.47717682";

const trader  = AccountId.fromString(process.env.TRADER_ACCOUNT_ID).toSolidityAddress();
const traderKey = PrivateKey.fromString(process.env.TRADER_PRIVATE_KEY);

const liquidityProviderID  = AccountId.fromString(process.env.LIQUIDITY_PROVIDER_ACCOUNT_ID).toSolidityAddress();
const liquidityProviderKey = PrivateKey.fromString(process.env.LIQUIDITY_PROVIDER_PRIVATE_KEY);


const createLiquidityPool = async () => {
    const tokenAQty = 10; 
    const tokenBQty = 10;
    console.log(`Creating a pool of ${tokenAQty} units of token A and ${tokenBQty} units of token B.`);
    const liquidityPool = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(2000000)
        .setFunction("initializeContract",
            new ContractFunctionParameters()
            .addAddress(treasure)
            .addAddress(tokenA)
            .addAddress(tokenB)
            .addInt64(tokenAQty)
            .addInt64(tokenBQty))
        .freezeWith(client) 
        .sign(treasureKey); 
    const liquidityPoolTx = await liquidityPool.execute(client);
    const transferTokenRx = await liquidityPoolTx.getReceipt(client);
    console.log(`Liquidity pool created: ${transferTokenRx.status}`);
    await pairCurrentPosition();
};

const addLiquidityTrader = async () => {
    const tokenAQty = 50;
    const tokenBQty = 50;
    console.log(`Adding ${tokenAQty} units of token A and ${tokenBQty} units of token B to the pool.`);
    const addLiquidityTx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2000000)
    .setFunction("addLiquidity",
        new ContractFunctionParameters()
        .addAddress(trader)
        .addAddress(tokenA)
        .addAddress(tokenB)
        .addInt64(tokenAQty)
        .addInt64(tokenBQty))
    .freezeWith(client) 
    .sign(traderKey); 
    const addLiquidityTxRes= await addLiquidityTx.execute(client);
    const transferTokenRx = await addLiquidityTxRes.getReceipt(client);

    console.log(`Liquidity added status: ${transferTokenRx.status}`);
};

const addLiquidity = async () => {
    const tokenAQty = 10;
    const tokenBQty = 10;
    console.log(`Adding ${tokenAQty} units of token A and ${tokenBQty} units of token B to the pool.`);
    const addLiquidityTx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2000000)
    .setFunction("addLiquidity",
        new ContractFunctionParameters()
        .addAddress(treasure)
        .addAddress(tokenA)
        .addAddress(tokenB)
        .addInt64(tokenAQty)
        .addInt64(tokenBQty))
    .freezeWith(client) 
    .sign(treasureKey); 
    const addLiquidityTxRes= await addLiquidityTx.execute(client);
    const transferTokenRx = await addLiquidityTxRes.getReceipt(client);

    console.log(`Liquidity added status: ${transferTokenRx.status}`);
    await pairCurrentPosition();
};

const removeLiquidity = async () => {
    const tokenAQty = 3;
    const tokenBQty = 3;
    console.log(`Removing ${tokenAQty} units of token A and ${tokenBQty} units of token B from the pool.`);
    const removeLiquidity = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2000000)
    .setFunction("removeLiquidity",
        new ContractFunctionParameters()
        .addAddress(treasure)
        .addAddress(tokenA)
        .addAddress(tokenB)
        .addInt64(tokenAQty)
        .addInt64(tokenBQty))
    .freezeWith(client) 
    .sign(treasureKey); 
    const removeLiquidityTx = await removeLiquidity.execute(client);
    const transferTokenRx = await removeLiquidityTx.getReceipt(client);

    console.log(`Liquidity remove status: ${transferTokenRx.status}`);
    await pairCurrentPosition();
};

const swapTokenALiqiProvider = async () => {
    const tokenAQty = 5;
    const tokenBQty = 0;
    console.log(`Swapping a ${tokenAQty} units of token A from the pool.`);
    console.log(`${traderKey}`);
    //Need to pass different token B address so that only swap of token A is considered.
    tokenB = TokenId.fromString("0.0.47646100").toSolidityAddress();
    const swapToken = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2000000)
    .setFunction("swapToken",
        new ContractFunctionParameters()
        .addAddress(liquidityProviderID)
        .addAddress(tokenA)
        .addAddress(tokenB)
        .addInt64(tokenAQty)
        .addInt64(tokenBQty))
    .freezeWith(client) 
    .sign(liquidityProviderKey); 
    const swapTokenTx = await swapToken.execute(client);
    const transferTokenRx = await swapTokenTx.getReceipt(client);

    console.log(`Swap status: ${transferTokenRx.status}`);
    await pairCurrentPosition();
};

const swapTokenATrader = async () => {
    const tokenAQty = 5;
    const tokenBQty = 0;
    console.log(`Swapping a ${tokenAQty} units of token A from the pool.`);
    console.log(`${traderKey}`);
    //Need to pass different token B address so that only swap of token A is considered.
    tokenB = TokenId.fromString("0.0.47646100").toSolidityAddress();
    const swapToken = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2000000)
    .setFunction("swapToken",
        new ContractFunctionParameters()
        .addAddress(trader)
        .addAddress(tokenA)
        .addAddress(tokenB)
        .addInt64(tokenAQty)
        .addInt64(tokenBQty))
    .freezeWith(client) 
    .sign(traderKey); 
    const swapTokenTx = await swapToken.execute(client);
    const transferTokenRx = await swapTokenTx.getReceipt(client);

    console.log(`Swap status: ${transferTokenRx.status}`);
    await pairCurrentPosition();
};

const swapTokenA = async () => {
    const tokenAQty = 5;
    const tokenBQty = 0;
    console.log(`Swapping a ${tokenAQty} units of token A from the pool.`);
    //Need to pass different token B address so that only swap of token A is considered.
    tokenB = TokenId.fromString("0.0.47646100").toSolidityAddress();
    const swapToken = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2000000)
    .setFunction("swapToken",
        new ContractFunctionParameters()
        .addAddress(treasure)
        .addAddress(tokenA)
        .addAddress(tokenB)
        .addInt64(tokenAQty)
        .addInt64(tokenBQty))
    .freezeWith(client) 
    .sign(treasureKey); 
    const swapTokenTx = await swapToken.execute(client);
    const transferTokenRx = await swapTokenTx.getReceipt(client);

    console.log(`Swap status: ${transferTokenRx.status}`);
    await pairCurrentPosition();
};

const getBalanceFromContract = async () => {
    const getContributorTokenShare = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(1000000)
    .setFunction("getPoolBalance",
        new ContractFunctionParameters()
                .addAddress(tokenA)
                .addAddress(tokenB)
                )
    .freezeWith(client);
    const getContributorTokenShareTx = await getContributorTokenShare.execute(client);
    const response = await getContributorTokenShareTx.getRecord(client);
    const tokenAQty = response.contractFunctionResult.getInt64(0);
    const tokenBQty = response.contractFunctionResult.getInt64(1);
    console.log(`${tokenAQty} units of token A and ${tokenBQty} units of token B available in pool.`);
};

const addNewLiquidityABTreasure = async () => {
    const tokenAQty = 150;
    const tokenBQty = 100;
    console.log(`Adding ${tokenAQty} units of token A and ${tokenBQty} units of token B to the pool.`);
    const addLiquidityTx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2000000)
    .setFunction("addLiquidity",
        new ContractFunctionParameters()
        .addAddress(treasure)
        .addAddress(tokenA)
        .addAddress(tokenB)
        .addInt64(tokenAQty)
        .addInt64(tokenBQty))
    .freezeWith(client) 
    .sign(treasureKey); 
    const addLiquidityTxRes= await addLiquidityTx.execute(client);
    const transferTokenRx = await addLiquidityTxRes.getReceipt(client);
    const response = await addLiquidityTxRes.getRecord(client);
    const tokenAQtyBack = response.contractFunctionResult.getInt64(0);
    const tokenBQtyBack = response.contractFunctionResult.getInt64(1);
    const location = response.contractFunctionResult.getString(2);
    console.log(`${tokenAQtyBack} units of token A and ${tokenBQtyBack} units of token B contributed in pool. ${location}`);
    console.log(`Liquidity added status: ${transferTokenRx.status}`);
    //await pairCurrentPosition();
};

const addNewLiquidityCDTreasure = async () => {
    const tokenCQty = 50;
    const tokenDQty = 100;
    console.log(`Adding ${tokenCQty} units of token C and ${tokenDQty} units of token D to the pool.`);
    const addLiquidityTx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2000000)
    .setFunction("addLiquidity",
        new ContractFunctionParameters()
        .addAddress(treasure)
        .addAddress(tokenC)
        .addAddress(tokenD)
        .addInt64(tokenCQty)
        .addInt64(tokenDQty))
    .freezeWith(client) 
    .sign(treasureKey); 
    const addLiquidityTxRes= await addLiquidityTx.execute(client);
    const transferTokenRx = await addLiquidityTxRes.getReceipt(client);
    const response = await addLiquidityTxRes.getRecord(client);
    const tokenCQtyBack = response.contractFunctionResult.getInt64(0);
    const tokenDQtyBack = response.contractFunctionResult.getInt64(1);
    const location = response.contractFunctionResult.getString(2);
    console.log(`${tokenCQtyBack} units of token C and ${tokenDQtyBack} units of token D contributed in pool. ${location}`);
    console.log(`Liquidity added status: ${transferTokenRx.status}`);
    //await pairCurrentPosition();
};

const swapTokenAtoB = async () => {
    const tokenAQty = 2;
    const tokenBQty = 0;
    console.log(`Swapping a ${tokenAQty} units of token A from the pool.`);
    //Need to pass different token B address so that only swap of token A is considered.
    //tokenB = TokenId.fromString("0.0.47646100").toSolidityAddress();
    const swapToken = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2000000)
    .setFunction("swapToken",
        new ContractFunctionParameters()
        .addAddress(treasure)
        .addAddress(tokenA)
        .addAddress(tokenB)
        .addInt64(tokenAQty)
        .addInt64(tokenBQty))
    .freezeWith(client) 
    .sign(treasureKey); 
    const swapTokenTx = await swapToken.execute(client);
    const transferTokenRx = await swapTokenTx.getReceipt(client);

    console.log(`Swap status: ${transferTokenRx.status}`);
    //await pairCurrentPosition();
};

const swapTokenCtoD = async () => {
    const tokenCQty = 0;
    const tokenDQty = 2;
    console.log(`Swapping a ${tokenCQty} units of token A from the pool.`);
    //Need to pass different token B address so that only swap of token A is considered.
    //tokenB = TokenId.fromString("0.0.47646100").toSolidityAddress();
    const swapToken = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2000000)
    .setFunction("swapToken",
        new ContractFunctionParameters()
        .addAddress(treasure)
        .addAddress(tokenD)
        .addAddress(tokenC)
        .addInt64(tokenDQty)
        .addInt64(tokenCQty))
    .freezeWith(client) 
    .sign(treasureKey); 
    const swapTokenTx = await swapToken.execute(client);
    const transferTokenRx = await swapTokenTx.getReceipt(client);

    console.log(`Swap status: ${transferTokenRx.status}`);
    //await pairCurrentPosition();
};


const pairCurrentPosition = async () => {
    const getPairQty = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(1000000)
        .setFunction("getPairQty")
        .freezeWith(client);
    const getPairQtyTx = await getPairQty.execute(client);
    const response = await getPairQtyTx.getRecord(client);
    const tokenAQty = response.contractFunctionResult.getInt64(0);
    const tokenBQty = response.contractFunctionResult.getInt64(1);
    console.log(`${tokenAQty} units of token A and ${tokenBQty} units of token B are present in the pool. \n`);
};

const getContributorTokenShare = async () => {
    const getContributorTokenShare = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(1000000)
        .setFunction("getContributorTokenShare",
            new ContractFunctionParameters()
                    .addAddress(treasure)
                    )
        .freezeWith(client);
    const getContributorTokenShareTx = await getContributorTokenShare.execute(client);
    const response = await getContributorTokenShareTx.getRecord(client);
    const tokenAQty = response.contractFunctionResult.getInt64(0);
    const tokenBQty = response.contractFunctionResult.getInt64(1);
    console.log(`${tokenAQty} units of token A and ${tokenBQty} units of token B contributed by ${treasure}.`);
};

async function main() {
     //await getBalances();
    //await deployNewSwapContract();

    //  await addNewLiquidityABTreasure();
    //  await addNewLiquidityCDTreasure();
    //await getBalanceFromContract();
        //  await getBalances();
    //await swapTokenAtoB();
    await swapTokenCtoD();
    //await getBalances();
    //  await createLiquidityPool();
    //  await addLiquidity();
    //  await removeLiquidity();
    //   await swapTokenA();
    //  await getContributorTokenShare();
    // await addLiquidityTrader();
    // await getBalances();
    // await swapTokenATrader();
    // await swapTokenALiqiProvider();
    // await getBalances();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });