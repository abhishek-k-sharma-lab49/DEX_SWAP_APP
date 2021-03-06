//const { hethers } = require("@hashgraph/hethers");
const { HashConnect} = require("hashconnect/dist/hashconnect");
const {HashConnectTypes } = require("hashconnect/dist/types")


const {getBalances} = require('./getAllAcoountBalances');
const { TokenId, 
    AccountId, 
    ContractExecuteTransaction, 
    ContractFunctionParameters, 
    Client,
    PrivateKey } = require("@hashgraph/sdk");
require("dotenv").config();


let topic = "";
async function connectToUser() {
    
    const appMetadata = HashConnectTypes.AppMetadata("dApp Example", "An example hedera dApp", "https://absolute.url/to/icon.png")
    
    let hashconnect = new HashConnect();
    console.Console
    let initData = await hashconnect.init(appMetadata);
    let privateKey = initData.privKey; 

    console.log(`OSR PrivateKey: ${privateKey} \n\n`);

    let state = await hashconnect.connect();
    topic = state.topic;
    console.log(`OSR Topic: ${topic}`);
}

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
const treasure = AccountId.fromString("0.0.47645191").toSolidityAddress();
const treasureKey = PrivateKey.fromString("308ed38983d9d20216d00371e174fe2d475dd32ac1450ffe2edfaab782b32fc5");
const contractId = "0.0.47717682";

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
    await pairCurrentPosition();
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
    connectToUser();
    //  await createLiquidityPool();
    //  await addLiquidity();
    //  await removeLiquidity();
      //await swapTokenA();
    //  await getContributorTokenShare();
    //await addLiquidityTrader();
    // await getBalances();
    // //await swapTokenATrader();
    // await swapTokenALiqiProvider();
    // await getBalances();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });