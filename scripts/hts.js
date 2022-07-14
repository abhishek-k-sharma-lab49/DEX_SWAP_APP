const { ContractExecuteTransaction, ContractFunctionParameters } = require('@hashgraph/sdk');

/**
 * Associates a given account with a given token
 * @param {*} client client operator to interface with testnet
 * @param {*} contractId id of contract with HTS sol functions
 * @param {*} accountId id of account to be associated with token
 * @param {*} accountKey private key of account to be associated with token
 * @param {*} tokenId id of token to be associated
 * @returns receipt of associate token transaction
 */
async function associateToken(client, contractId, accountId, accountKey, tokenId) {
    const associateToken = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(2000000)
        .setFunction('tokenAssociate', new ContractFunctionParameters()
            .addAddress(accountId.toSolidityAddress())      // account to associate token to
            .addAddress(tokenId.toSolidityAddress())       // token address
        );
    const signAssociateTokenTx = await associateToken.freezeWith(client).sign(accountKey);
    const submitAssociateTokenTx = await signAssociateTokenTx.execute(client);
    return await submitAssociateTokenTx.getReceipt(client);
}

/**
 * Transfers tokens from one account to another
 * @param {*} client client operator to interface with testnet
 * @param {*} contractId id of contract with HTS sol functions
 * @param {*} tokenId id of token to be transferred
 * @param {*} transferFrom id of account to transfer tokens from
 * @param {*} transferFromKey private key of account to transfer tokens from
 * @param {*} transferTo id of account to transfer tokens to
 * @param {*} amount amount of tokens to transfer
 * @returns receipt of token transfer transaction
 */
async function transferTokens(client, contractId, tokenId, transferFrom, transferFromKey, transferTo, amount) {
    const tokenTransfer = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(2000000)
        .setFunction('tokenTransfer', new ContractFunctionParameters()
            .addAddress(tokenId.toSolidityAddress())             // token to transfer
            .addAddress(transferFrom.toSolidityAddress())        // account to transfer tokens from
            .addAddress(transferTo.toSolidityAddress())          // account to transfer tokens to
            .addInt64(amount)                                    // amount of tokens to transfer
        );
    const signTokenTransfer = await tokenTransfer.freezeWith(client).sign(transferFromKey);
    const submitTransfer = await signTokenTransfer.execute(client);
    return await submitTransfer.getReceipt(client);
}

module.exports = {
    associateToken,
    transferTokens,
}