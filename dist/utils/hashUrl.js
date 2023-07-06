"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashUrl = void 0;
const crypto_1 = require("crypto");
const hashUrl = (content, algo = 'md5') => {
    const hashFunc = (0, crypto_1.createHash)(algo); // you can also sha256, sha512 etc
    hashFunc.update(content);
    return hashFunc.digest('hex'); // will return hash, formatted to HEX
};
exports.hashUrl = hashUrl;
