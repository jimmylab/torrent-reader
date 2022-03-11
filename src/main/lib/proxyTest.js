const handler = {
    get(target, key) {
        if (target instanceof Map) {
            if (!target.has(key)) return;
            let val = target.get(key);
            if (val instanceof Map) {
                let proxy = new Proxy(val, handler);
                return proxy;
            } else return val;
        }
    },
    set(target, key, val) {
        console.log(target, key)
        if (target instanceof Map) {
            target.set(key, val);
            return true;
        } else {
            target[key] = val;
        }
    },
}

const obj = new Map([
    ['a', 1],
    ['b', new Map([
        [123, 456],
        ['c', 'd'],
        ['arr', [1, 2, 3]],
    ])],
    ['e', 'f'],
]);

p = new Proxy(obj, handler);
p.b.arr[0] = 999
console.log(p)