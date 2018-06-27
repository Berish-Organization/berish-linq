"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const collection = require("berish-collection");
class LINQ {
    constructor(items) {
        this._items = [];
        if (items == null)
            throw new Error("LINQException: LINQ items == null");
        this._items = items;
    }
    toArray() {
        return this._items;
    }
    static fromArray(items) {
        return new LINQ(items);
    }
    copy() {
        return this._items.slice();
    }
    where(func) {
        return LINQ.fromArray(this._items.filter((m, i) => func(m, i, this) === true));
    }
    take(count) {
        let items = [].concat(this._items);
        items.splice(count);
        return LINQ.fromArray(items);
    }
    skip(count) {
        return LINQ.fromArray([].concat(this._items).splice(count));
    }
    count(func) {
        if (func) {
            return this.where(func).count();
        }
        return this._items.length;
    }
    elementAt(id) {
        let el = this.elementAtOrNull(id);
        if (el == null)
            throw new Error(`LINQException: ${id} id not found`);
        return el;
    }
    elementAtOrNull(id) {
        return this._items[id];
    }
    single(func) {
        let el = this.singleOrNull(func);
        if (el == null)
            throw new Error("LINQException: single = null");
        return el;
    }
    singleOrNull(func) {
        if (func)
            return this.where(func).singleOrNull();
        let count = this.count();
        if (count > 1 || count <= 0)
            return null;
        return this.elementAtOrNull(0);
    }
    first(func) {
        let el = this.firstOrNull(func);
        if (el == null)
            throw new Error("LINQException: first = null");
        return el;
    }
    firstOrNull(func) {
        if (func)
            return this.where(func).firstOrNull();
        return this.elementAtOrNull(0);
    }
    last(func) {
        let el = this.lastOrNull(func);
        if (el == null)
            throw new Error("LINQException: last = null");
        return el;
    }
    lastOrNull(func) {
        if (func)
            return this.where(func).lastOrNull();
        return this.elementAtOrNull(this._items.length - 1);
    }
    notNull() {
        return this.where(m => m != null);
    }
    notEmpty() {
        return this.where(m => !!m);
    }
    distinct(func) {
        if (func) {
            return this.select(func).distinct().select(m => this.firstOrNull((k, i, l) => func(k, i, l) === m));
        }
        else
            return LINQ.fromArray(this._items.filter((value, index, self) => self.indexOf(value) === index));
    }
    except(array) {
        let items = array instanceof LINQ ? array._items : array instanceof Array ? array : [array];
        let temp = LINQ.fromArray(items).distinct();
        return LINQ.fromArray(this._items.filter((v, i, s) => temp._items.indexOf(v) === -1));
    }
    max(func) {
        return Math.max(...this.select(func)._items);
    }
    min(func) {
        return Math.min(...this.select(func)._items);
    }
    reverse() {
        return LINQ.fromArray(this._items.reverse());
    }
    average(sumFunction, countFunction) {
        return this.sum(sumFunction) / (countFunction ? this.sum(countFunction) : this.count());
    }
    orderBy(func) {
        let orderFunc = func ? (a, b) => {
            let x = func(a);
            let y = func(b);
            if (x < y) {
                return -1;
            }
            if (x > y) {
                return 1;
            }
            return 0;
        } : undefined;
        return LINQ.fromArray(this._items.sort(orderFunc));
    }
    forEach(func) {
        this._items.forEach((v, i, s) => func({ item: v, index: i, linq: this }));
        return this;
    }
    orderByDescending(func) {
        let orderFunc = func ? (a, b) => {
            let x = func(a);
            let y = func(b);
            if (x > y) {
                return -1;
            }
            if (x < y) {
                return 1;
            }
            return 0;
        } : undefined;
        return LINQ.fromArray(this._items.sort(orderFunc));
    }
    sum(func) {
        let sum = 0;
        let index = 0;
        for (let item of this._items) {
            if (!(func || item instanceof Number))
                throw new Error("LINQException: not defined Function or item isn't number");
            sum += func ? func(item, index, this) : Number(item);
            index++;
        }
        return sum;
    }
    ofType(type) {
        return this.where(item => item instanceof type);
    }
    select(func) {
        return LINQ.fromArray(this._items.map((item, i) => func(item, i, this)));
    }
    selectMany(func) {
        return LINQ.fromArray([].concat(...this.select(func).toArray())).distinct();
    }
    groupBy(func) {
        let out = new collection.Dictionary();
        this.forEach(m => {
            let key = func(m.item, m.index, this);
            if (!out.containsKey(key))
                out.add(key, []);
            let a = out.get(key);
            a.push(m.item);
        });
        return out;
    }
    contains(value) {
        return this._items.indexOf(value) !== -1;
    }
    containsAll(array) {
        return LINQ.fromArray(array).all(item => this.contains(item));
    }
    any(func) {
        for (let id = 0; id < this.count(); id++) {
            if (func(this.elementAtOrNull(id)) === true) {
                return true;
            }
        }
        return false;
    }
    all(func) {
        for (let id = 0; id < this.count(); id++) {
            if (func(this.elementAtOrNull(id)) === false)
                return false;
        }
        return true;
    }
    concat(array) {
        let items = array instanceof LINQ ? array._items : array instanceof Array ? array : [array];
        return LINQ.fromArray(this._items.concat(items));
    }
    intersect(array, func) {
        if (func) {
            let arr = array instanceof LINQ ? array._items : array;
            let out = [];
            for (let idx = 0; idx < this.count(); idx++) {
                let item = this.elementAtOrNull(idx);
                for (let idx2 = 0; idx2 < arr.length; idx2++) {
                    let item2 = arr[idx2];
                    if (func(item, item2, idx, idx2) === true) {
                        out.push(item);
                    }
                }
            }
            return LINQ.fromArray(out);
        }
        else {
            return this.except(this.except(array));
        }
    }
}
exports.LINQ = LINQ;
//# sourceMappingURL=index.js.map