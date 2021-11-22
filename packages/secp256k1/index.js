const addon = require("./build/Release/addon");
const secp256k1 = require("./lib")(new addon.Secp256k1());
module.exports = secp256k1;
