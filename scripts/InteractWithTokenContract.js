const { TokenId, 
    AccountId, 
    ContractExecuteTransaction, 
    ContractFunctionParameters, 
    Client,
    PrivateKey } = require("@hashgraph/sdk");
require("dotenv").config();

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
const contractId = "0.0.47795131";

const trader  = AccountId.fromString(process.env.TRADER_ACCOUNT_ID).toSolidityAddress();
const traderKey = PrivateKey.fromString(process.env.TRADER_PRIVATE_KEY);

const liquidityProviderID  = AccountId.fromString(process.env.LIQUIDITY_PROVIDER_ACCOUNT_ID).toSolidityAddress();
const liquidityProviderKey = PrivateKey.fromString(process.env.LIQUIDITY_PROVIDER_PRIVATE_KEY);


const getTreaserBalance = async () => {
    
    const getBalanceTransaction = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(2000000)
    .setFunction("balanceOf",
        new ContractFunctionParameters()
        .addAddress(tokenA)
        .addAddress(treasure))
    .freezeWith(client) 
    .sign(treasureKey); 
    const addLiquidityTxRes= await getBalanceTransaction.execute(client);
    const response = await addLiquidityTxRes.getRecord(client);
    const tokenAQty = response.contractFunctionResult.getInt64(0);

    console.log(`Treasery current Balance: ${tokenAQty}`);
};

getTreaserBalance();