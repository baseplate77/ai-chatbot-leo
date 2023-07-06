import { createHash } from "crypto";

export const hashUrl = (content: string, algo = 'md5') => {
    const hashFunc = createHash(algo);   // you can also sha256, sha512 etc
    hashFunc.update(content);
    return hashFunc.digest('hex');       // will return hash, formatted to HEX
}