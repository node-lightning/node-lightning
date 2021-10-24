export class Network {
    constructor(
        readonly name: string,
        readonly p2pkhPrefix: number,
        readonly p2shPrefix: number,
        readonly p2wpkhPrefix: string,
        readonly p2wshPrefix: string,
        readonly xpubVersion: number,
        readonly xprvVersion: number,
        readonly ypubVersion: number,
        readonly yprvVersion: number,
    ) {}

    public isMainnet() {
        return this.name === "mainnet";
    }

    public static get mainnet(): Network {
        return mainnet;
    }

    public static get testnet(): Network {
        return testnet;
    }

    public static get all(): Network[] {
        return all;
    }
}

const mainnet = new Network(
    "mainnet",
    0x00,
    0x05,
    "bc",
    "bc",
    0x0488b21e,
    0x0488ade4,
    0x049d7cb2,
    0x049d7878,
);

const testnet = new Network(
    "testnet",
    0x6f,
    0xc4,
    "tb",
    "tb",
    0x043587cf,
    0x04358394,
    0x044a5262,
    0x044a4e28,
);
const all = [mainnet, testnet];
