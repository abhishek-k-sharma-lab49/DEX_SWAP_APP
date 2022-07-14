const { AccountBalanceQuery } = require('@hashgraph/sdk');

async function accountBalanceQuery(client, accountId) {
    const accountBalance = new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);

    console.log('\x1b[32m%x\x1b[0m', `The account with ID ${accountId.toString()} WALLET balance is: ${JSON.stringify(JSON.parse((await accountBalance).tokens.toString(), null, 4))}`);
}

module.exports = {
    accountBalanceQuery,
}