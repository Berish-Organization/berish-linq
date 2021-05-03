import BigNumber from 'bignumber.js';

type CallbackType<T, Response> = (item: T, index: number, linq: LINQ<T>) => Response;
type CallbackWithAccumType<T, Response, Accum> = (item: T, index: number, linq: LINQ<T>, accum: Accum) => Response;
type CallbackCompareType<T, Response> = (a: T, b: T) => Response;
type CallbackOnlyItemType<T, Response> = (item: T) => Response;
type OfTypeStringValues = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';

export default class LINQ<T> extends Array<T> {
  public static from<T>(items?: T[] | LINQ<T>): LINQ<T> {
    if (this.isLINQ(items)) return items;
    const linq = new LINQ<T>();
    if (items && items.length > 0) linq.push(...items);
    return linq;
  }

  public static isLINQ(data: any): data is LINQ<any> {
    if (data instanceof LINQ) return true;
    return false;
  }

  public toArray(): T[] {
    return new Array(...this);
  }

  public clone(): LINQ<T> {
    return this.slice(0);
  }

  public equals(linq: any[]) {
    return this === linq;
  }

  public equalsValues<K>(linq: any[], selectFunc?: CallbackType<T, K>) {
    if (this.equals(linq)) return true;
    if (linq == null) return false;
    if (this.length !== linq.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.
    const linq1 = this.select(selectFunc);
    const linq2 = LINQ.from(linq).select(selectFunc);

    return linq1.every((m, i) => linq2[i] === m);
  }

  public where(whereFunc?: CallbackType<T, boolean>): LINQ<T> {
    if (!whereFunc) return this;
    const returnValue = this.filter((m, i) => whereFunc(m, i, this));
    return LINQ.from(returnValue);
  }

  public whereInSelect<K>(selectFunc: CallbackType<T, K>, whereFunc: CallbackType<K, boolean>): LINQ<T> {
    if (!selectFunc || !whereFunc) return this;
    const selected = this.select(selectFunc);
    return this.where((m, i) => whereFunc(selected[i], i, selected));
  }

  public whereInSelectWithAccum<K, Accum = LINQ<K>>(
    selectFunc: CallbackType<T, K>,
    getAccumFunc: (selected: LINQ<K>, linq: LINQ<T>) => Accum,
    whereFunc: CallbackWithAccumType<K, boolean, Accum>,
  ): LINQ<T> {
    if (!selectFunc || !getAccumFunc || !whereFunc) return this;
    const selected = this.select(selectFunc);
    const accum = getAccumFunc(selected, this);
    return this.where((m, i, linq) => whereFunc(selected[i], i, selected, accum));
  }

  public select(): LINQ<T>;
  public select<K>(selectFunc: CallbackType<T, K>): LINQ<K>;
  public select<K>(selectFunc?: CallbackType<T, K>): LINQ<K> | LINQ<T> {
    if (!selectFunc) return this;
    const returnValue = this.map((m, i) => selectFunc(m, i, this));
    return LINQ.from(returnValue);
  }

  public selectMany<K>(selectFunc?: CallbackType<T, K[]>): LINQ<K> {
    const selected = this.select(selectFunc);
    const returnValue = [].concat(...selected) as K[];
    return LINQ.from(returnValue);
  }

  public take(count: number): LINQ<T> {
    const returnValue = this.slice(0, count);
    return LINQ.from(returnValue);
  }

  public skip(count: number): LINQ<T> {
    const returnValue = this.slice(count);
    return LINQ.from(returnValue);
  }

  public count(whereFunc?: CallbackType<T, boolean>): number {
    if (!whereFunc) return this.length || 0;
    return this.where(whereFunc).count();
  }

  public indexWhere(whereFunc?: CallbackType<T, boolean>): LINQ<number> {
    const selected = this.select<number>((m, i, linq) => (whereFunc(m, i, linq) ? i : null));
    return selected.notNull();
  }

  public elementsAtIndex(indexes: number[]): LINQ<T> {
    return LINQ.from(indexes).select(m => this[m]);
  }

  public notNull<K>(selectFunc?: CallbackType<T, K>): LINQ<T> {
    if (selectFunc) return this.where((m, i, linq) => selectFunc(m, i, linq) != null);
    return this.where(m => m != null);
  }

  public notEmpty<K>(selectFunc?: CallbackType<T, K>): LINQ<T> {
    if (selectFunc) return this.where((m, i, linq) => !!selectFunc(m, i, linq));
    return this.where(m => !!m);
  }

  public first(whereFunc?: CallbackType<T, boolean>): T {
    if (whereFunc) return this.where(whereFunc).first();
    return this[0];
  }

  public last(whereFunc?: CallbackType<T, boolean>): T {
    if (whereFunc) return this.where(whereFunc).last();
    const lastIndex = this.length ? this.length - 1 : 0;
    return this[lastIndex];
  }

  public distinct<K>(selectFunc?: CallbackType<T, K>): LINQ<T> {
    if (selectFunc) return this.whereInSelect(selectFunc, (m, i, selected) => selected.indexOf(m) === i);
    return this.where((m, i, linq) => linq.indexOf(m) === i);
  }

  public max(numberFunc?: CallbackType<T, number>): LINQ<T> {
    return this.whereInSelectWithAccum(
      numberFunc,
      selected => BigNumber.max(...selected).toNumber(),
      (m, i, linq, max) => m === max,
    );
  }

  public maxValue(numberFunc?: CallbackType<T, number>): number {
    return BigNumber.max(...this.select(numberFunc)).toNumber();
  }

  public min(numberFunc?: CallbackType<T, number>): LINQ<T> {
    return this.whereInSelectWithAccum(
      numberFunc,
      selected => BigNumber.min(...selected).toNumber(),
      (m, i, linq, min) => m === min,
    );
  }

  public minValue(numberFunc?: CallbackType<T, number>): number {
    return BigNumber.min(...this.select(numberFunc)).toNumber();
  }

  public ofType<Type extends new (...args) => any, K>(
    type: OfTypeStringValues | OfTypeStringValues[] | Type | Type[] | (OfTypeStringValues | Type)[],
    selectFunc?: CallbackType<T, K>,
  ): LINQ<T> {
    const types = Array.isArray(type) ? LINQ.from(type) : LINQ.from([type]);
    return this.whereInSelect(selectFunc, m =>
      types.some(k => (typeof k === 'string' ? typeof m === k : m instanceof k)),
    );
  }

  public orderByAscending<K>(sortSelectFunc?: CallbackOnlyItemType<T, K>): LINQ<T> {
    if (sortSelectFunc)
      return LINQ.from<T>(
        this.sort((a, b) => {
          const ak = sortSelectFunc(a);
          const bk = sortSelectFunc(b);
          if (ak < bk) return -1;
          if (ak > bk) return 1;
          return 0;
        }),
      );
    return LINQ.from<T>(
      this.sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      }),
    );
  }

  public orderByDescending<K>(sortSelectFunc?: CallbackOnlyItemType<T, K>): LINQ<T> {
    if (sortSelectFunc)
      return LINQ.from<T>(
        this.sort((a, b) => {
          const ak = sortSelectFunc(a);
          const bk = sortSelectFunc(b);
          if (ak > bk) return -1;
          if (ak < bk) return 1;
          return 0;
        }),
      );
    return LINQ.from<T>(
      this.sort((a, b) => {
        if (a > b) return -1;
        if (a < b) return 1;
        return 0;
      }),
    );
  }

  public sum(selectFunc?: CallbackType<T, number>): number {
    if (selectFunc) return this.select(selectFunc).sum();

    return this.reduce((a, b) => a.plus(Number(b)), new BigNumber(0)).toNumber();
  }

  public except<K>(items: T | T[] | LINQ<T>, selectFunc?: CallbackType<T, K>): LINQ<T> {
    const array = Array.isArray(items) ? items : [items];
    if (selectFunc) {
      const linq = LINQ.from(array).select(selectFunc);
      return this.where((m, i, l) => linq.indexOf(selectFunc(m, i, l)) === -1);
    }
    return this.where(m => array.indexOf(m) === -1);
  }

  public groupBy<K>(
    selectFunc: CallbackType<T, K>,
    compareKeyFunc?: CallbackCompareType<K, boolean>,
  ): LINQ<[K, LINQ<T>]> {
    compareKeyFunc = compareKeyFunc || ((a, b) => a === b);
    const tuples: LINQ<[K, LINQ<T>]> = LINQ.from();
    const keys = this.select(selectFunc);
    for (const key of keys) {
      const cacheTuple = tuples.filter(m => compareKeyFunc(m[0], key))[0];
      if (!cacheTuple) tuples.push([key, this.whereInSelect(selectFunc, k => compareKeyFunc(key, k))]);
    }
    return tuples;
  }

  public contains<K>(value: T, selectFunc?: CallbackOnlyItemType<T, K>): boolean {
    if (selectFunc) return this.select(selectFunc).contains(selectFunc(value));

    return this.indexOf(value) !== -1;
  }

  public containsAll<K>(value: T[] | LINQ<T>, selectFunc?: CallbackType<T, K>): boolean {
    if (selectFunc) {
      const selected = this.select(selectFunc);
      return value.every((m, i) => selected.indexOf(selectFunc(m, i, this)) !== -1);
    }

    return value.every(m => this.indexOf(m) !== -1);
  }

  public average(selectFunc?: CallbackType<T, number>, whereFunc?: CallbackType<T, boolean>): number {
    if (whereFunc) return this.where(whereFunc).average(selectFunc);
    if (selectFunc) return this.select(selectFunc).average();

    return new BigNumber(this.sum()).dividedBy(this.count()).toNumber();
  }

  public intersect<K>(items: T | T[] | LINQ<T>, selectFunc?: CallbackType<T, K>): LINQ<T> {
    const array = Array.isArray(items) ? items : [items];
    if (selectFunc) {
      const linq = LINQ.from(array).select(selectFunc);
      return this.where((m, i, l) => linq.indexOf(selectFunc(m, i, l)) !== -1);
    }
    return this.where(m => array.indexOf(m) !== -1);
  }

  // Corrected return types for system Array<T> methods

  public reverse(): LINQ<T> {
    return super.reverse() as LINQ<T>;
  }

  public concat(...items: ConcatArray<T>[]): LINQ<T>;
  public concat(...items: (T | ConcatArray<T>)[]): LINQ<T>;
  public concat(...items: (T | ConcatArray<T> | LINQ<T>)[]): LINQ<T>;
  public concat(...items: (T | ConcatArray<T> | LINQ<T>)[]): LINQ<T> {
    return super.concat(...items) as LINQ<T>;
  }

  public slice(start?: number, end?: number): LINQ<T> {
    return super.slice(start, end) as LINQ<T>;
  }

  public splice(start: number, deleteCount?: number): LINQ<T>;
  public splice(start: number, deleteCount: number, ...items: T[]): LINQ<T>;
  public splice(start: number, deleteCount: number, ...items: T[]): LINQ<T> {
    return super.splice(start, deleteCount, ...items) as LINQ<T>;
  }

  public map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): LINQ<U> {
    return super.map(callbackfn, thisArg) as LINQ<U>;
  }

  public filter<S extends T>(callbackfn: (value: T, index: number, array: T[]) => value is S, thisArg?: any): LINQ<S>;
  public filter(callbackfn: (value: T, index: number, array: T[]) => unknown, thisArg?: any): LINQ<T>;
  public filter(callbackfn: (value: T, index: number, array: T[]) => unknown, thisArg?: any): LINQ<T> {
    return super.filter(callbackfn, thisArg) as LINQ<T>;
  }
}
