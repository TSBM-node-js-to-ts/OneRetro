export function nanoid(size = 16) {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let id = "";
    const array = new Uint8Array(size);
    crypto.getRandomValues(array);

    for (const byte of array) {
        id += chars[byte % chars.length];
    }
    return id;
}
