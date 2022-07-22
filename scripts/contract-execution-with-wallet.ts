import { HashConnectTypes, HashConnect } from "hashconnect";

let topic = "";
async function connectToUser() {
    let appMetadata: HashConnectTypes.AppMetadata = {
        name: "dApp Example",
        description: "An example hedera dApp",
        icon: "https://absolute.url/to/icon.png"
    }
    
    let hashconnect = new HashConnect();
    console.Console
    let initData = await hashconnect.init(appMetadata);
    let privateKey = initData.privKey; 

    console.log(`OSR PrivateKey: ${privateKey} \n\n`);

    let state = await hashconnect.connect();
    topic = state.topic;
    console.log(`OSR Topic: ${topic}`);
}



async function main() {
    connectToUser();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });