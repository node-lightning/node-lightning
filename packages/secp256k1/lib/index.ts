/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export * from "./EcdhOptions";
export * from "./EcdsaOptions";
export * from "./EcdsaResult";
export * from "./Secp256k1";

import path from "path";
import { Secp256k1 } from "./Secp256k1";

const addon = require(path.resolve(__dirname, "../build/Release/addon"));
const instance: Secp256k1 = new Secp256k1(new addon.Secp256k1());
export default instance;
