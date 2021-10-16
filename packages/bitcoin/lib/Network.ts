export class Network {
    constructor(
        readonly name: string,
        readonly p2pkhPrefix: number,
        readonly p2shPrefix: number,
        readonly xpubPrefix: number,
        readonly xprvPrefix: number,
    ) {}

    public isMainnet() {
        return this.name === "mainnet";
    }

    public static get mainnet() {
        return mainnet;
    }

    public static get testnet() {
        return testnet;
    }
}

const mainnet = new Network("mainnet", 0x00, 0x05, 0x0488b21e, 0x0488ade4);
const testnet = new Network("testnet", 0xc4, 0x6f, 0x043587cf, 0x04358394);
