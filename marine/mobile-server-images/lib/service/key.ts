export const BASE64 = 'base64';
export const HEX = 'hex';
export const ASCII = 'ascii';


/*
import crypto, {DiffieHellman} from "crypto";

const CryptoJS = require('crypto-js');

export const BASE64 = 'base64';
export const HEX = 'hex';
export const ASCII = 'ascii';

export function createDiffieHellman(prime: string, generator: string): DiffieHellman {
    const dh = crypto.createDiffieHellman(prime, HEX, generator, HEX);

    dh.generateKeys();

    return dh;
}

export function cipher_old(secret: string, value: string): string {
    console.info("secret " + secret);
    console.info("length " + secret.length);

    const iv = secret.slice(0, 32); // first 16 bytes
    const key = secret.slice(32, 96); // next 32 bytes

    const ivBuffer = Buffer.from(iv, HEX);
    const keyBuffer = Buffer.from(key, HEX);

    console.info("ivBuffer length " + ivBuffer.length);
    console.info("keyBuffer length " + keyBuffer.length);

    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer).setAutoPadding(true);
    const encrypted = Buffer.concat([cipher.update(value, ASCII), cipher.final()]);

    return encrypted.toString(BASE64);
}

export function cipher(secret: string, value: string): string {
    const iv = CryptoJS.enc.Hex.parse(secret.slice(0, 32)); // first 16 bytes
    const key = CryptoJS.enc.Hex.parse(secret.slice(32, 96)); // next 32 bytes

    const encrypted = CryptoJS.AES.encrypt(value, key, {iv: iv});

    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}
*/