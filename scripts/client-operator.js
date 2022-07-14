const { Client } = require('@hashgraph/sdk');

function initializeClientOperator() {
    // Grab Hedera testnet account ID and private key from .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    if (myAccountId == null || myPrivateKey == null) {
        throw new Error('Environment variables myAccountId and myPrivateKey must be present')
    }

    // Create connection to Hedera network using Hedera JS SDK
    const client = Client.forTestnet();

    client.setOperator(myAccountId, myPrivateKey);

    return client;
}

function initializeDEXClientOperator() {
    // Grab Hedera testnet account ID and private key from .env file
    const myAccountId = process.env.DEX_CONTRACT_OWNER_ID;
    const myPrivateKey = process.env.DEX_CONTRACT_OWNER_KEY;

    if (myAccountId == null || myPrivateKey == null) {
        throw new Error('Environment variables myAccountId and myPrivateKey must be present')
    }

    // Create connection to Hedera network using Hedera JS SDK
    const client = Client.forTestnet();

    client.setOperator(myAccountId, myPrivateKey);

    return client;
}

function initializeTreaserClientOperator() {
    // Grab Hedera testnet account ID and private key from .env file
    const myAccountId = process.env.TREASURY_ACCOUNT_ID;
    const myPrivateKey = process.env.TREASURY_PRIVATE_KEY;

    if (myAccountId == null || myPrivateKey == null) {
        throw new Error('Environment variables myAccountId and myPrivateKey must be present')
    }

    // Create connection to Hedera network using Hedera JS SDK
    const client = Client.forTestnet();

    client.setOperator(myAccountId, myPrivateKey);

    return client;
}

module.exports = {
    initializeClientOperator,
    initializeDEXClientOperator,
    initializeTreaserClientOperator
}