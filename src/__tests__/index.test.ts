import * as collection from 'berish-collection';
import * as faker from 'faker';
import LINQ from '../';

class TestAType {}
class TestBType {}

function generateCard(index: number = 0) {
  return {
    age: faker.random.number({ min: 0, max: 30 }),
    email: faker.internet.email(),
    id: faker.random.uuid(),
    rating: faker.random.number({ min: 0, max: 100 }),
    types: index % 2 === 0 ? new TestAType() : new TestBType(),
  };
}

function getLinq(count: number = 10) {
  const data = Array(count)
    .fill(null)
    .map((m, i) => generateCard(i));
  return LINQ.from(data);
}

describe('check linq', () => {
  test('instance of linq', () => {
    const linq1 = LINQ.from([1]);
    const linq2 = linq1.skip(1);
    expect(LINQ.from([1])).not.toBe(LINQ.from([1]));
    expect(linq1).not.toBe(linq2);
    expect(LINQ.from([]) === LINQ.from([])).toBeFalsy();
  });

  test('clone', () => {
    const linq1 = LINQ.from([1, 2, 3]);
    const cloned = linq1.clone();

    expect(cloned).toEqual(linq1);
    expect(cloned === linq1).toBeFalsy();
  });

  test('where', () => {
    const linq = getLinq();
    expect(linq.where(m => m.age % 2 === 0)).toEqual(linq.filter(m => m.age % 2 === 0));
  });

  test('whereWithAccum', () => {
    const linq = getLinq();

    const where = linq.whereWithAccum(m => m.age, selected => Math.max(...selected), (m, i, l, max) => m >= max);
    const max = Math.max(...linq.map(m => m.age));
    const maxWhere = linq.where(m => m.age === max);

    expect(where).toEqual(maxWhere);
  });

  test('select', () => {
    const linq = getLinq();

    const selected = linq.select(m => m.email);
    const mapped = linq.map(m => m.email);

    expect(selected).toEqual(mapped);
  });

  test('selectMany', () => {
    const linq = LINQ.from([getLinq(), getLinq(), getLinq()]);

    const selected1 = linq.selectMany();
    expect(selected1).toEqual([...linq[0], ...linq[1], ...linq[2]]);

    const selected2 = linq.selectMany(m => m.select(m => m.id));
    expect(selected2).toEqual([
      ...linq[0].select(m => m.id),
      ...linq[1].select(m => m.id),
      ...linq[2].select(m => m.id),
    ]);
  });

  test('take', () => {
    const linq = getLinq(50);

    const take = linq.take(20);
    expect(take.length).toBe(20);
    expect(take).toEqual(linq.slice(0, 20));
  });

  test('skip', () => {
    const linq = getLinq(100);

    const skip = linq.skip(20);
    expect(skip.length).toBe(80);
    expect(skip).toEqual(linq.slice(20));
  });

  test('count', () => {
    const linq = getLinq(100);

    const count1 = linq.count();
    expect(count1).toBe(100);

    const count2 = linq.count(m => m.age % 2 === 0);
    expect(count2).toBe(linq.where(m => m.age % 2 === 0).count());
  });

  test('indexWhere', () => {
    const linq = getLinq();

    const indexWhere = linq.indexWhere(m => m.age % 2 === 0);
    expect(indexWhere).toEqual(linq.select((m, i) => (m.age % 2 === 0 ? i : null)).notNull());
  });
  test('elementsAtIndex', () => {
    const linq = getLinq();

    const elementsAtIndex = linq.elementsAtIndex([0, 5, 8, 12]);
    expect(elementsAtIndex.length).toBe(4);
    expect(elementsAtIndex).toEqual([linq[0], linq[5], linq[8], linq[12]]);
  });

  test('notNull', () => {
    const linq = getLinq(100);

    const notNull = linq.select((m, i) => (i % 2 === 0 ? m : null)).notNull();
    expect(notNull.length).toBe(50);
    expect(notNull).toEqual(linq.where((m, i) => i % 2 === 0));
  });

  test('notEmpty', () => {
    const linq = getLinq(100);

    const notEmpty = linq.select((m, i) => (i % 2 === 0 ? m : '')).notEmpty();
    expect(notEmpty.length).toBe(50);
    expect(notEmpty).toEqual(linq.where((m, i) => i % 2 === 0));
  });

  test('first', () => {
    const linq = getLinq();

    const first1 = linq.first();
    expect(first1).toBe(linq[0]);

    const first2 = linq.first(m => m.age % 2 === 0);
    expect(first2).toBe(linq.where(m => m.age % 2 === 0).first());
  });

  test('last', () => {
    const linq = getLinq();

    const last1 = linq.last();
    expect(last1).toBe(linq[linq.length - 1]);

    const last2 = linq.last(m => m.age % 2 === 0);
    expect(last2).toBe(linq.where(m => m.age % 2 === 0).last());
  });

  test('distinct', () => {
    const linq = getLinq(100);

    const distinct1 = linq.select(m => m.age).distinct();
    expect(distinct1.length).toBe(new Set(linq.select(m => m.age)).size);

    const distinct2 = linq.distinct(m => m.age);
    const addedAges: number[] = [];
    const testDistinct2 = linq.where(m => {
      if (addedAges.indexOf(m.age) === -1) {
        addedAges.push(m.age);
        return true;
      }
      return false;
    });
    expect(distinct2).toEqual(testDistinct2);
  });

  test('max', () => {
    const linq = getLinq();

    const max = linq.max(m => m.age);
    const maxValue = Math.max(...linq.select(m => m.age));
    expect(max).toEqual(linq.where(m => m.age === maxValue));
  });

  test('maxValue', () => {
    const linq = getLinq();

    const maxValue = linq.maxValue(m => m.age);
    expect(maxValue).toBe(Math.max(...linq.select(m => m.age)));
  });

  test('min', () => {
    const linq = getLinq();

    const min = linq.min(m => m.age);
    const minValue = Math.min(...linq.select(m => m.age));
    expect(min).toEqual(linq.where(m => m.age === minValue));
  });

  test('minValue', () => {
    const linq = getLinq();

    const minValue = linq.minValue(m => m.age);
    expect(minValue).toBe(Math.min(...linq.select(m => m.age)));
  });

  test('ofType', () => {
    const linq = getLinq();

    const ofType1 = linq.ofType(Object);
    expect(ofType1).toEqual(linq);

    const ofType2 = linq.ofType(TestAType, m => m.types);
    expect(ofType2).toEqual(linq.where(m => m.types instanceof TestAType));

    const ofType3 = linq.ofType([TestAType, TestBType], m => m.types);
    expect(ofType3).toEqual(linq);
  });

  test('orderByAscending', () => {
    const linq1 = LINQ.from([4, 2, 1, 5, 8, -1]);
    const orderByAscending1 = linq1.orderByAscending();
    expect(orderByAscending1).toEqual([-1, 1, 2, 4, 5, 8]);

    const linq2 = getLinq();

    const orderByAscending2 = linq2.orderByAscending(m => m.age);
    const bySort2 = linq2.sort((a, b) => {
      if (a.age > b.age) return 1;
      if (a.age < b.age) return -1;
      return 0;
    });
    expect(orderByAscending2).toEqual(bySort2);
  });

  test('orderByDescending', () => {
    const linq1 = LINQ.from([4, 2, 1, 5, 8, -1]);
    const orderByDescending1 = linq1.orderByDescending();
    expect(orderByDescending1).toEqual([8, 5, 4, 2, 1, -1]);

    const linq2 = getLinq();

    const orderByDescending2 = linq2.orderByDescending(m => m.age);
    const bySort2 = linq2.sort((a, b) => {
      if (a.age < b.age) return 1;
      if (a.age > b.age) return -1;
      return 0;
    });
    expect(orderByDescending2).toEqual(bySort2);
  });

  test('sum', () => {
    const linq1 = LINQ.from([4, 2, 1, 5, 8, -1]);
    const sum1 = linq1.sum();
    expect(sum1).toBe(linq1.reduce((a, b) => a + b, 0));

    const linq2 = getLinq();
    const sum2 = linq2.sum(m => m.age);
    expect(sum2).toBe(linq2.select(m => m.age).reduce((a, b) => a + b, 0));
  });

  test('except', () => {
    const linq1 = LINQ.from([4, 2, 1, 5, 8, -1]);
    const linq2 = LINQ.from([4, -100, 7, 5, 8, -1]);
    const expect1 = linq1.except(linq2);
    expect(expect1).toEqual([2, 1]);

    const linq3 = getLinq(100);
    const linq4 = getLinq(100);
    const expect2 = linq3.except(linq4);
    expect(expect2).toEqual(linq3);

    const expect3 = linq3.except(linq4, m => m.age);
    expect(expect3).toEqual(linq3.where(m => !linq4.contains(m, k => k.age)));
  });

  test('groupBy', () => {
    const linq = getLinq();
    const dict1 = linq.groupBy(m => m.age);

    const ages = linq.select(m => m.age).distinct();
    const dict2 = collection.Dictionary.fromArray(
      ages.select(m => new collection.KeyValuePair(m, linq.where(k => k.age === m))),
    );

    expect(dict1).toEqual(dict2);
  });

  test('contains', () => {
    const linq1 = LINQ.from(['hey', 'bro']);
    expect(linq1.contains('hey')).toBeTruthy();
    expect(linq1.contains('hello')).toBeFalsy();

    const linq2 = getLinq(100);
    expect(linq2.contains(linq2[0])).toBeTruthy();

    let card = generateCard();
    while (!linq2.first(m => m.age === card.age)) {
      card = generateCard();
    }
    expect(linq2.contains(card)).toBeFalsy();
    expect(linq2.contains(card, m => m.age)).toBeTruthy();
  });

  test('containsAll', () => {
    const linq1 = LINQ.from(['hey', 'bro']);
    expect(linq1.containsAll(['hey', 'bro'])).toBeTruthy();
    expect(linq1.containsAll(['hey', 'hello'])).toBeFalsy();

    const linq2 = getLinq(100);
    expect(linq2.containsAll([linq2.first(), linq2.last()])).toBeTruthy();

    let card1 = generateCard();
    while (!linq2.first(m => m.age === card1.age)) {
      card1 = generateCard();
    }

    let card2 = generateCard();
    while (!linq2.first(m => m.age === card2.age)) {
      card2 = generateCard();
    }
    expect(linq2.containsAll([card1, card2])).toBeFalsy();
    expect(linq2.containsAll([card1, card2], m => m.age)).toBeTruthy();
  });

  test('average', () => {
    const linq1 = LINQ.from([1, 2, 5, 10]);
    expect(linq1.average()).toBe(4.5);
    expect(linq1.average(null, m => m % 2 === 0)).toBe(6);

    const linq2 = getLinq();
    expect(linq2.average(m => m.age)).toBe(linq2.select(m => m.age).average());
    expect(linq2.average(m => m.rating, m => m.age > 18)).toBe(
      linq2
        .where(m => m.age > 18)
        .select(m => m.rating)
        .average(),
    );
  });

  test('intersect', () => {
    const linq1 = LINQ.from([4, 2, 1, 5, 8, -1]);
    const linq2 = LINQ.from([4, -100, 7, 5, 8, -1]);
    const intersect1 = linq1.intersect(linq2);
    expect(intersect1).toEqual([4, 5, 8, -1]);

    const linq3 = getLinq(100);
    const linq4 = getLinq(100);
    const intersect2 = linq3.intersect(linq4);
    expect(intersect2).toEqual([]);

    const intersect3 = linq3.intersect(linq4, m => m.age);
    expect(intersect3).toEqual(linq3.where(m => linq4.contains(m, k => k.age)));
  });

  test('reverse', () => {
    const linq = LINQ.from([1, 4, 2, 3, 3]);
    expect(linq.reverse()).toEqual([3, 3, 2, 4, 1]);
  });

  test('concat', () => {
    const linq1 = LINQ.from([1, 4, 3]);
    const linq2 = LINQ.from([2, 3, 3]);
    expect(linq1.concat(linq2)).toEqual([1, 4, 3, 2, 3, 3]);
  });

  test('slice', () => {
    const linq = LINQ.from([1, 4, 2, 3, 3]);
    expect(linq.slice(2, 4)).toEqual([2, 3]);
  });

  test('splice', () => {
    const linq = getLinq();
    const cloned = linq.clone();
    cloned.splice(0, 3);
    expect(cloned).toEqual(linq.skip(3));
  });

  test('map', () => {
    const linq = LINQ.from([{ id: 1 }, { id: 2 }]);
    expect(linq.map(m => m.id)).toEqual([1, 2]);
  });

  test('filter', () => {
    const linq = LINQ.from([{ id: 1 }, { id: 2 }]);
    expect(linq.filter(m => m.id > 1)).toEqual([{ id: 2 }]);
  });
});
