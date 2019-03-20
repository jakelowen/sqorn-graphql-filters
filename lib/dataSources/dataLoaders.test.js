// const { applyFilters } = require("./index");
const _ = require("lodash");
const {
  generateCompositeKeyString,
  composeData,
  mapTo,
  makeNestedKeyValues,
  beltalowda,
  composeSimpleData
} = require("./dataLoaders");

// const pg = require("pg");
const sq = require("@sqorn/pg")();

describe("DataLoader Utils", () => {
  test("generateCompositeKeyString without modifier", () => {
    const keyString = generateCompositeKeyString(_.identity)({
      userId: 88,
      teamId: 99
    });
    expect(keyString).toEqual(`[["teamId",99],["userId",88]]`);
  });

  test("generateCompositeKeyString WITH modifier", () => {
    const modifierFn = x => _.pick(x, "teamId");
    const keyString = generateCompositeKeyString(modifierFn)({
      userId: 88,
      teamId: 99
    });
    expect(keyString).toEqual(`[["teamId",99]]`);
  });

  test("Compose Data", () => {
    const rows = [
      { userId: 88, teamId: 99, is: "result1" },
      { userId: 88, teamId: 99, is: "result4" },
      { userId: 66, teamId: 77, is: "result2" },
      { userId: 22, teamId: 33, is: "result3" }
    ];

    const keys = [
      { userId: 88, teamId: 99 },
      { userId: 66, teamId: 77 },
      { userId: 22, teamId: 33 }
    ];

    // takes an object and narrows to only userId and teamId
    const narrowToKeyFields = x => _.pick(x, ["userId", "teamId"]);

    // curries in modifier function to complete composition of key making func
    const cacheKeyFn = generateCompositeKeyString(narrowToKeyFields);

    // transforms data / organizes by key
    const dataPrepFn = composeData(cacheKeyFn, true);
    const data = dataPrepFn(keys, rows);
    expect(data).toEqual([
      [
        { is: "result1", teamId: 99, userId: 88 },
        { is: "result4", teamId: 99, userId: 88 }
      ],
      [{ is: "result2", teamId: 77, userId: 66 }],
      [{ is: "result3", teamId: 33, userId: 22 }]
    ]);
    expect(data[0][0].teamId).toEqual(keys[0].teamId);
    expect(data[0][0].userId).toEqual(keys[0].userId);
    expect(data[2][0].teamId).toEqual(keys[2].teamId);
    expect(data[2][0].userId).toEqual(keys[2].userId);
  });

  test("mapTo", () => {
    const rows = [
      { userId: 88, teamId: 99, is: "result1" },
      { userId: 88, teamId: 99, is: "result4" },
      { userId: 66, teamId: 77, is: "result2" },
      { userId: 22, teamId: 33, is: "result3" }
    ];

    const keys = [
      { userId: 88, teamId: 99 },
      { userId: 66, teamId: 77 },
      { userId: 22, teamId: 33 }
    ];

    // takes an object and narrows to only userId and teamId
    const narrowToKeyFields = x => _.pick(x, ["userId", "teamId"]);

    // curries in modifier function to complete composition of key making func
    const cacheKeyFn = generateCompositeKeyString(narrowToKeyFields);

    // transforms data / organizes by key
    const dataPrepFn = composeData(cacheKeyFn, true);

    const mapToFirst = mapTo(dataPrepFn, _.take);
    const mapToMany = mapTo(dataPrepFn, _.identity);
    const mapToLast = mapTo(dataPrepFn, _.takeRight);

    expect(mapToFirst(keys, rows)).toEqual([
      [{ is: "result1", teamId: 99, userId: 88 }],
      [{ is: "result2", teamId: 77, userId: 66 }],
      [{ is: "result3", teamId: 33, userId: 22 }]
    ]);

    expect(mapToLast(keys, rows)).toEqual([
      [{ is: "result4", teamId: 99, userId: 88 }],
      [{ is: "result2", teamId: 77, userId: 66 }],
      [{ is: "result3", teamId: 33, userId: 22 }]
    ]);

    expect(mapToMany(keys, rows)).toEqual([
      [
        { is: "result1", teamId: 99, userId: 88 },
        { is: "result4", teamId: 99, userId: 88 }
      ],
      [{ is: "result2", teamId: 77, userId: 66 }],
      [{ is: "result3", teamId: 33, userId: 22 }]
    ]);
  });

  test("makeNestedKeyValues", () => {
    const preData = [
      { userId: 88, teamId: 99 },
      { userId: 66, teamId: 77 },
      { userId: 22, teamId: 33 }
    ];
    const postData = makeNestedKeyValues(preData);
    expect(postData).toEqual({ userId: [88, 66, 22], teamId: [99, 77, 33] });
  });

  test("BeltaLowda composite key", async () => {
    const rows = [
      { userId: 88, teamId: 99, is: "result1" },
      { userId: 88, teamId: 99, is: "result4" }
    ];
    const dataFetcherFn = keyArray => Promise.resolve(rows);
    const narrowToKeyFields = x => _.pick(x, ["userId", "teamId"]);
    const cacheKeyFn = generateCompositeKeyString(narrowToKeyFields);
    const dataPrepFn = composeData(cacheKeyFn, true);
    const mapToFirst = mapTo(dataPrepFn, _.take);
    const loader = beltalowda(dataFetcherFn, mapToFirst, { cacheKeyFn });
    const data = await loader.load({ userId: 88, teamId: 99 });
    expect(data).toEqual([{ userId: 88, teamId: 99, is: "result1" }]);
  });

  test("BeltaLowda simple key", async () => {
    const rows = [{ id: 55, is: "result1" }];
    const dataFetcherFn = keyArray => Promise.resolve(rows);
    const cacheKeyFn = x => x.id;
    const dataPrepFn = composeData(cacheKeyFn);
    const mapToFirst = mapTo(dataPrepFn, _.take);
    const loader = beltalowda(dataFetcherFn, mapToFirst);
    const data = await loader.load(55);
    expect(data).toEqual([{ id: 55, is: "result1" }]);
  });
});
