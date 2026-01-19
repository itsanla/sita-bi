import { randomBytes as cryptoRandomBytes } from 'crypto';

/**
 * Async wrapper untuk crypto.randomBytes
 * Menggunakan callback API untuk menghindari blocking event loop
 */
export const randomBytesAsync = (size: number): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        cryptoRandomBytes(size, (err, buf) => {
            if (err) {
                reject(err);
            } else {
                resolve(buf);
            }
        });
    });

/**
 * Generate random hex string secara async
 */
export const randomHexAsync = async (bytes: number): Promise<string> => {
    const buf = await randomBytesAsync(bytes);
    return buf.toString('hex');
};
