const { initializeClientOperator} = require('./client-operator');
const { Hbar, TokenId, AccountId, PrivateKey, TransferTransaction, AccountBalanceQuery } = require('@hashgraph/sdk');
const Web3 = require('web3');
require("dotenv").config();

async function transeferTokensToWalletAccount() {
    const tokenA = TokenId.fromString("0.0.47646195");
    const tokenB = TokenId.fromString("0.0.47646196");
    const walletAccount = AccountId.fromString("0.0.47711880");
    const client = initializeClientOperator();

    await transferAmount(client, walletAccount, tokenA, 5)
    await transferAmount(client, walletAccount, tokenB, 5)

}

async function transferAmount(client, toClientId, token, amount) {
    const treasure = AccountId.fromString("0.0.47645191")
    const treasureKey = PrivateKey.fromString("308ed38983d9d20216d00371e174fe2d475dd32ac1450ffe2edfaab782b32fc5");

    let tokenTransferTx = await new TransferTransaction()
	                        .addTokenTransfer(token, treasure, -1*amount)
	                        .addTokenTransfer(token, toClientId, amount)
	                        .freezeWith(client)
	                        .sign(treasureKey);

    //SUBMIT THE TRANSACTION
    let tokenTransferSubmit = await tokenTransferTx.execute(client);

    //GET THE RECEIPT OF THE TRANSACTION
    let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);

    //LOG THE TRANSACTION STATUS
    console.log(`\n- Stablecoin transfer from Treasury to Alice: ${tokenTransferRx.status} \n`);

    // BALANCE CHECK
    var balanceCheckTx = await new AccountBalanceQuery().setAccountId(treasure).execute(client);
    console.log(`- Treasury balance: ${balanceCheckTx.tokens._map.get(token.toString())} units of token ID ${token}`);
    var balanceCheckTx = await new AccountBalanceQuery().setAccountId(toClientId).execute(client);
    console.log(`- Alice's balance: ${balanceCheckTx.tokens._map.get(token.toString())} units of token ID ${token}`);   
}

transeferTokensToWalletAccount();