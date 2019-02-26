/**
 * @description set localStorage
 * @param {*} key
 * @param {*} v
 */
export const setStorageItem = (key, v) => {
    if (typeof v === 'object') {
        v = JSON.stringify(v);
    }
    window.localStorage.setItem(`someId${key}`, v);
};

/**
 * @description get localStorage
 * @param {*} key
 */
export const getStorageItem = key => {
    let v = window.localStorage.getItem(`someId${key}`);
    try {
        v = JSON.parse(v);
    } catch (e) { }
    return v;
};