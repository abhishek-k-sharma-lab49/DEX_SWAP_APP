const { TokenCreateTransaction, TokenType, AccountId, PrivateKey } = require('@hashgraph/sdk');
const { initializeClientOperator } = require('../util/client-operator');
require("dotenv").config();

async function submitTokenTransaction(client, treasuryKey, treasuryId, tokenName, tokenSymbol, ) {
    // token create transaction
    const createToken = new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setTokenType(TokenType.FungibleCommon)
        .setTreasuryAccountId(treasuryId)
        .setInitialSupply(1000000);

    // sign with treasury key
    const signTokenTx = await createToken.freezeWith(client).sign(treasuryKey);

    // submit transaction to hedera testnet
    const submitTokenTx = await signTokenTx.execute(client);

    // get tokenID
    const tokenId = await (await submitTokenTx.getReceipt(client)).tokenId;

    console.log(`${tokenName} (${tokenSymbol}) created - tokenID: ${tokenId.toString()}`);
}

async function createToken() {
    const client = initializeClientOperator();

    // Create token
    // treasury ID and private key
    const treasuryId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
    const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PRIVATE_KEY);

    // create token A
    await submitTokenTransaction(client, treasuryKey, treasuryId, 'Lab49 Token A', 'L49A');

    // create token B
    await submitTokenTransaction(client, treasuryKey, treasuryId, 'Lab49 Token B', 'L49B');
}

createToken();