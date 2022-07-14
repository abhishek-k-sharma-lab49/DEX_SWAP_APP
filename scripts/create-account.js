const { Client, AccountBalanceQuery, AccountCreateTransaction, PrivateKey, Hbar } = require('@hashgraph/sdk');
const { initializeClientOperator } = require('./client-operator');
require("dotenv").config();

async function createAccount() {
    const client = initializeClientOperator();

    const myAccountId = process.env.MY_ACCOUNT_ID;

    // Create the account balance query
    const query = new AccountBalanceQuery().setAccountId(myAccountId);

    // Submit the query to a Hedera network
    const accountBalance = await query.execute(client);

    // Print the balance of hbars
    console.log("The hbar account balance for this account is " +accountBalance.hbars);

    // Create treasury account
    console.log('\n////////// Create account //////////');

    // Create private/public key for treasury account
    const newAccountPrivateKey = await PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;
    console.log('private key:', newAccountPrivateKey.toStringRaw());

    const accountCreateTransaction = new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(new Hbar(100));

    // sign account create transaction with client private key and submit to network
    const accountCreateTx = await accountCreateTransaction.execute(client);

    const accountCreateReceipt = await accountCreateTx.getReceipt(client);

    // new accountId

    const newAccountId = accountCreateReceipt.accountId;

    console.log('New account ID:', newAccountId.toString());
}

createAccount();