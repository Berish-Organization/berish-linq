import * as collection from "berish-collection";

export class LINQ<T> {
    protected _items: T[] = [];

    constructor(items: T[]) {
        if (items == null)
            throw new Error("LINQException: LINQ items == null");
        this._items = items;
    }

    public toArray() {
        return this._items
    }

    public static fromArray<T>(items: T[]): LINQ<T> {
        return new LINQ(items);
    }

    public copy() {
        return this._items.slice();
    }

    public where(func: (item: T, index: number, linq: LINQ<T>) => boolean): LINQ<T> {
        return LINQ.fromArray(this._items.filter((m, i) => func(m, i, this) === true));
    }

    public take(count: number) {
        let items = ([] as T[]).concat(this._items);
        items.splice(count);
        return LINQ.fromArray(items);
    }

    public skip(count: number) {
        return LINQ.fromArray(([] as T[]).concat(this._items).splice(count));
    }

    public count(): number;
    public count(func: (item: T, index: number, linq: LINQ<T>) => boolean): number;
    public count(func?: (item: T, index: number, linq: LINQ<T>) => boolean): number {
        if (func) {
            return this.where(func).count();
        }
        return this._items.length;
    }

    public elementAt(id: number): T {
        let el = this.elementAtOrNull(id);
        if (el == null)
            throw new Error(`LINQException: ${id} id not found`);
        return el;
    }

    public elementAtOrNull(id: number) {
        return this._items[id];
    }

    public single(): T;
    public single(func: (item: T, index: number, linq: LINQ<T>) => boolean): T;
    public single(func?: (item: T, index: number, linq: LINQ<T>) => boolean): T {
        let el = this.singleOrNull(func);
        if (el == null)
            throw new Error("LINQException: single = null");
        return el;
    }

    public singleOrNull(): T;
    public singleOrNull(func: (item: T, index: number, linq: LINQ<T>) => boolean): T;
    public singleOrNull(func?: (item: T, index: number, linq: LINQ<T>) => boolean): T {
        if (func)
            return this.where(func).singleOrNull();
        let count = this.count();
        if (count > 1 || count <= 0)
            return null;
        return this.elementAtOrNull(0);
    }

    public first(): T;
    public first(func: (item: T, index: number, linq: LINQ<T>) => boolean): T;
    public first(func?: (item: T, index: number, linq: LINQ<T>) => boolean): T {
        let el = this.firstOrNull(func);
        if (el == null)
            throw new Error("LINQException: first = null");
        return el;
    }

    public firstOrNull(): T;
    public firstOrNull(func: (item: T, index: number, linq: LINQ<T>) => boolean): T;
    public firstOrNull(func?: (item: T, index: number, linq: LINQ<T>) => boolean): T {
        if (func)
            return this.where(func).firstOrNull();
        return this.elementAtOrNull(0);
    }

    public last(): T;
    public last(func: (item: T, index: number, linq: LINQ<T>) => boolean): T;
    public last(func?: (item: T, index: number, linq: LINQ<T>) => boolean): T {
        let el = this.lastOrNull(func);
        if (el == null)
            throw new Error("LINQException: last = null");
        return el;
    }

    public lastOrNull(): T;
    public lastOrNull(func: (item: T, index: number, linq: LINQ<T>) => boolean): T;
    public lastOrNull(func?: (item: T, index: number, linq: LINQ<T>) => boolean): T {
        if (func)
            return this.where(func).lastOrNull();
        return this.elementAtOrNull(this._items.length - 1);
    }

    public notNull() {
        return this.where(m => m != null);
    }

    public notEmpty() {
        return this.where(m => !!m);
    }

    public distinct<K>(): LINQ<T>;
    public distinct<K>(func: (item: T, index: number, linq: LINQ<T>) => K): LINQ<T>;
    public distinct<K>(func?: (item: T, index: number, linq: LINQ<T>) => K): LINQ<T> {
        if (func) {
            return this.select(func).distinct().select(m => this.firstOrNull((k, i, l) => func(k, i, l) === m));
        } else
            return LINQ.fromArray(this._items.filter((value, index, self) => self.indexOf(value) === index));
    }

    public except(array: LINQ<T>): LINQ<T>;
    public except(array: T[]): LINQ<T>;
    public except(array: T[] | LINQ<T>): LINQ<T>;
    public except(array: T[] | LINQ<T> | T): LINQ<T> {
        let items = array instanceof LINQ ? array._items : array instanceof Array ? array : [array];
        let temp = LINQ.fromArray(items).distinct();
        return LINQ.fromArray(this._items.filter((v, i, s) => temp._items.indexOf(v) === -1));
    }

    public max(func: (item: T, index: number, linq: LINQ<T>) => number) {
        return Math.max(...this.select(func)._items);
    }

    public min(func: (item: T, index: number, linq: LINQ<T>) => number) {
        return Math.min(...this.select(func)._items);
    }

    public reverse() {
        return LINQ.fromArray(this._items.reverse());
    }

    public average(): number;
    public average(sumFunction: (item: T, index: number, linq: LINQ<T>) => number): number;
    public average(sumFunction: (item: T, index: number, linq: LINQ<T>) => number, countFunction: (item: T, index: number, linq: LINQ<T>) => number): number;
    public average(sumFunction?: (item: T, index: number, linq: LINQ<T>) => number, countFunction?: (item: T, index: number, linq: LINQ<T>) => number): number {
        return this.sum(sumFunction) / (countFunction ? this.sum(countFunction) : this.count());
    }

    public orderBy<K>(): LINQ<T>;
    public orderBy<K>(func: (item: T) => K): LINQ<T>;
    public orderBy<K>(func?: (item: T) => K): LINQ<T> {
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

    public forEach(func: (value: { item: T, index: number, linq: LINQ<T> }) => void): LINQ<T> {
        this._items.forEach((v, i, s) =>
            func({ item: v, index: i, linq: this }));
        return this;
    }

    public orderByDescending<K>(): LINQ<T>;
    public orderByDescending<K>(func: (item: T) => K): LINQ<T>;
    public orderByDescending<K>(func?: (item: T) => K): LINQ<T> {
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

    public sum(): number;
    public sum(func: (item: T, index: number, linq: LINQ<T>) => number): number;
    public sum(func?: (item: T, index: number, linq: LINQ<T>) => number): number {
        let sum: number = 0;
        let index: number = 0;
        for (let item of this._items) {
            if (!(func || item instanceof Number))
                throw new Error("LINQException: not defined Function or item isn't number");
            sum += func ? func(item, index, this) : Number(item);
            index++;
        }
        return sum;
    }

    public ofType(type: any): LINQ<T> {
        return this.where(item => item instanceof type);
    }
    public select<K>(func: (item: T, index: number, linq: LINQ<T>) => K): LINQ<K> {
        return LINQ.fromArray(this._items.map((item, i) => func(item, i, this)));
    }
    public selectMany<K>(func: (item: T, index: number, linq: LINQ<T>) => K[]): LINQ<K> {
        return LINQ.fromArray([].concat(...this.select(func).toArray()) as K[]).distinct();
        /*let temp: K[] = [];
        for (let item of this._items) {
            let res = func(item);
            if (res instanceof Array)
                temp = temp.concat(res);
            else
                throw new Error("LINQException: result of func isn't array");
        }
        return LINQ.fromArray(temp);*/
    }

    public groupBy<K>(func: (item: T, index: number, linq: LINQ<T>) => K) {
        let out = new collection.Dictionary<K, T[]>();
        this.forEach(m => {
            let key = func(m.item, m.index, this);
            if (!out.containsKey(key))
                out.add(key, []);
            let a = out.get(key);
            a.push(m.item);
        });
        return out;
    }

    // Conditions
    public contains(value: T): boolean {
        return this._items.indexOf(value) !== -1;
    }
    public containsAll(array: T[]) {
        return LINQ.fromArray(array).all(item => this.contains(item));
    }

    public any(func: (item: T) => boolean): boolean {
        for (let id = 0; id < this.count(); id++) {
            if (func(this.elementAtOrNull(id)) === true) {
                return true;
            }
        }
        return false;
    }
    public all(func: (item: T) => boolean): boolean {
        for (let id = 0; id < this.count(); id++) {
            if (func(this.elementAtOrNull(id)) === false)
                return false;
        }
        return true;
    }

    // Modifications
    public concat(array: T): LINQ<T>;
    public concat(array: LINQ<T>): LINQ<T>;
    public concat(array: T[]): LINQ<T>;
    public concat(array: T[] | LINQ<T> | T): LINQ<T> {
        let items = array instanceof LINQ ? array._items : array instanceof Array ? array : [array];
        return LINQ.fromArray(this._items.concat(items));
    }

    public intersect(array: LINQ<T>): LINQ<T>
    public intersect(array: T[]): LINQ<T>;
    public intersect(array: T[] | LINQ<T>, func: (item: T, item2: T, id: number, id2: number) => boolean): LINQ<T>
    public intersect(array: T[] | LINQ<T>, func?: (item: T, item2: T, id: number, id2: number) => boolean): LINQ<T> {
        if (func) {
            /*if (func == null) {
                func = ({item, id, item2, id2}) => item === item2;
            }*/
            let arr: T[] = array instanceof LINQ ? array._items : array;
            let out: T[] = [];
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
        } else {
            return this.except(this.except(array));
        }
        /**/
    }
}