import { HashValue } from "./HashValue";

export class Network {
    public static regtest(genesisHash: HashValue): Network {
        return new Network(
            "regtest",
            genesisHash,
            0x6f, // m or n
            0xc4, // 2
            "bcrt",
            "bcrt",
            0x043587cf, // tpub
            0x04358394, // tprv
            0x044a5262, // upub
            0x044a4e28, // uprv
            0x045f1cf6, // vpub
            0x045f18bc, // vprv
            0xef,
        );
    }

    constructor(
        readonly name: string,
        readonly genesisHash: HashValue,
        readonly p2pkhPrefix: number,
        readonly p2shPrefix: number,
        readonly p2wpkhPrefix: string,
        readonly p2wshPrefix: string,
        readonly xpubVersion: number,
        readonly xprvVersion: number,
        readonly ypubVersion: number,
        readonly yprvVersion: number,
        readonly zpubVersion: number,
        readonly zprvVersion: number,
        readonly wifPrefix: number,
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
    HashValue.fromRpc("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"),
    0x00, // 1
    0x05, // 3
    "bc",
    "bc",
    0x0488b21e, // xpub
    0x0488ade4, // xprv
    0x049d7cb2, // ypub
    0x049d7878, // yprv
    0x04b24746, // zpub
    0x04b2430c, // zprv
    0x80, // 5 (uncompressed), K or L (compressed)
);

const testnet = new Network(
    "testnet",
    HashValue.fromRpc("000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943"),
    0x6f, // m or n
    0xc4, // 2
    "tb",
    "tb",
    0x043587cf, // tpub
    0x04358394, // tprv
    0x044a5262, // upub
    0x044a4e28, // uprv
    0x045f1cf6, // vpub
    0x045f18bc, // vprv
    0xef,
);

const all = [mainnet, testnet];
