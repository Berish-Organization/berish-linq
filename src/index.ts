import * as collection from 'berish-collection';

type CallbackType<T, Response> = (item: T, index: number, linq: LINQ<T>) => Response;
type CallbackWithAccumType<T, Accum, Response> = (item: T, index: number, linq: LINQ<T>, accum: Accum) => Response;
type CallbackOnlyItemType<T, Response> = (item: T) => Response;

export default class LINQ<T> extends Array<T> {
  public static from<T>(items?: T[]): LINQ<T> {
    const linq = new LINQ<T>();
    if (items && items.length > 0) linq.push(...items);
    return linq;
  }

  public clone(): LINQ<T> {
    return this.slice(0);
  }

  public where(whereFunc: CallbackType<T, boolean>): LINQ<T> {
    const returnValue = this.filter((m, i) => whereFunc(m, i, this));
    return LINQ.from(returnValue);
  }

  public whereWithAccum<K, Accum = LINQ<K>>(
    selectFunc: CallbackType<T, K>,
    accumFunc: (selected: LINQ<K>, linq: LINQ<T>) => Accum,
    whereSelectedFunc: CallbackWithAccumType<K, Accum, boolean>,
  ): LINQ<T> {
    const selected = this.select(selectFunc);
    const accum = accumFunc ? accumFunc(selected, this) : ((selected as any) as Accum);
    return this.where((m, i, linq) => whereSelectedFunc(selected[i], i, selected, accum));
  }

  public select<K>(selectFunc: CallbackType<T, K>): LINQ<K> {
    if (!selectFunc) return (this as any) as LINQ<K>;
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

  public count(func?: CallbackType<T, boolean>): number {
    if (!func) return this.length || 0;
    return this.where(func).count();
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
    if (selectFunc)
      return this.whereWithAccum(selectFunc, null, (m, i, linq, selected) => selected.indexOf(selected[i]) === i);
    return this.where((m, i, linq) => linq.indexOf(m) === i);
  }

  public max(numberFunc?: CallbackType<T, number>): LINQ<T> {
    return this.whereWithAccum(numberFunc, selected => Math.max(...selected), (m, i, linq, max) => m === max);
  }

  public maxValue(numberFunc?: CallbackType<T, number>): number {
    return Math.max(...this.select(numberFunc));
  }

  public min(numberFunc?: CallbackType<T, number>): LINQ<T> {
    return this.whereWithAccum(numberFunc, selected => Math.min(...selected), (m, i, linq, min) => m === min);
  }

  public minValue(numberFunc?: CallbackType<T, number>): number {
    return Math.min(...this.select(numberFunc));
  }

  public ofType<Type extends new (...args) => any, K>(type: Type | Type[], selectFunc?: CallbackType<T, K>): LINQ<T> {
    const types = Array.isArray(type) ? LINQ.from(type) : LINQ.from([type]);
    return this.whereWithAccum(selectFunc, null, m => types.some(k => m instanceof k));
  }

  public orderByAscending<K>(sortSelectFunc?: CallbackOnlyItemType<T, K>): LINQ<T> {
    if (sortSelectFunc)
      return LINQ.from(
        this.sort((a, b) => {
          const ak = sortSelectFunc(a);
          const bk = sortSelectFunc(b);
          if (ak < bk) return -1;
          if (ak > bk) return 1;
          return 0;
        }),
      );
    return LINQ.from(
      this.sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      }),
    );
  }

  public orderByDescending<K>(sortSelectFunc?: CallbackOnlyItemType<T, K>): LINQ<T> {
    if (sortSelectFunc)
      return LINQ.from(
        this.sort((a, b) => {
          const ak = sortSelectFunc(a);
          const bk = sortSelectFunc(b);
          if (ak > bk) return -1;
          if (ak < bk) return 1;
          return 0;
        }),
      );
    return LINQ.from(
      this.sort((a, b) => {
        if (a > b) return -1;
        if (a < b) return 1;
        return 0;
      }),
    );
  }

  public sum(selectFunc?: CallbackType<T, number>): number {
    if (selectFunc) return this.select(selectFunc).sum();
    return this.reduce((a, b) => Number(a) + Number(b), 0);
  }

  public except<K>(items: T | T[] | LINQ<T>, selectFunc?: CallbackType<T, K>): LINQ<T> {
    const array = Array.isArray(items) ? items : [items];
    if (selectFunc) {
      const linq = LINQ.from(array).select(selectFunc);
      return this.where((m, i, l) => linq.indexOf(selectFunc(m, i, l)) === -1);
    }
    return this.where(m => array.indexOf(m) === -1);
  }

  public groupBy<K>(selectFunc: CallbackType<T, K>): collection.Dictionary<K, LINQ<T>> {
    const dict = new collection.Dictionary<K, LINQ<T>>();
    this.forEach((m, i) => {
      const key = selectFunc(m, i, this);
      if (!dict.containsKey(key)) dict.add(key, LINQ.from());
      dict.get(key).push(m);
    });
    return dict;
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
    return this.sum() / this.count();
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
