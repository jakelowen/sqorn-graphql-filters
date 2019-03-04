// const { applyFilters } = require("./index");
const {
  prep,
  composeExpressions,
  generateExpression,
  applyFilters
} = require("./applyFilters");

// const pg = require("pg");
const sq = require("@sqorn/pg")();

describe("Playbook", () => {
  test("simple root statements", async () => {
    const where = { oatmeal: { is: "fly" } };
    const results = prep(where);
    expect(results).toEqual([
      {
        class: "EXPRESSION",
        column: "oatmeal",
        operation: "is",
        value: "fly"
      }
    ]);
  });

  test("simple nested", async () => {
    const where = {
      AND: [{ ouija: { is: "smelly" } }]
    };
    const results = prep(where);
    expect(results).toEqual([
      {
        class: "PAREN",
        connector: "AND",
        operations: [
          {
            class: "EXPRESSION",
            column: "ouija",
            operation: "is",
            value: "smelly"
          }
        ]
      }
    ]);
  });

  test("complex", async () => {
    const where = {
      AND: [
        { bird: { can: "fly" } },
        { bird: { can: "sing" } },
        {
          AND: [
            { cat: { can: "meow", cant: "bark" } },
            { dog: { can: "boof", cant: "fly" } }
          ],
          OR: [{ hamster: { can: "dance" } }, { zims: { cant: "dilly" } }]
        }
      ]
    };

    const results = prep(where);
    // console.log(JSON.stringify(results, null, "\t"));
    expect(results).toEqual([
      {
        class: "PAREN",
        connector: "AND",
        operations: [
          {
            class: "EXPRESSION",
            column: "bird",
            operation: "can",
            value: "fly"
          },
          {
            class: "EXPRESSION",
            column: "bird",
            operation: "can",
            value: "sing"
          },
          {
            class: "PAREN",
            connector: "AND",
            operations: [
              {
                class: "EXPRESSION",
                column: "cat",
                operation: "can",
                value: "meow"
              },
              {
                class: "EXPRESSION",
                column: "cat",
                operation: "cant",
                value: "bark"
              },
              {
                class: "EXPRESSION",
                column: "dog",
                operation: "can",
                value: "boof"
              },
              {
                class: "EXPRESSION",
                column: "dog",
                operation: "cant",
                value: "fly"
              }
            ]
          },
          {
            class: "PAREN",
            connector: "OR",
            operations: [
              {
                class: "EXPRESSION",
                column: "hamster",
                operation: "can",
                value: "dance"
              },
              {
                class: "EXPRESSION",
                column: "zims",
                operation: "cant",
                value: "dilly"
              }
            ]
          }
        ]
      }
    ]);
  });
});

describe("Compose Expressions", () => {
  test("simple", async () => {
    let dbHandle = sq.from`test_table`;
    const where = prep({ bird: { eq: "fly" } });
    const expressions = composeExpressions(sq, where);
    const query = dbHandle.where(...expressions).query;
    expect(query).toEqual({
      args: ["fly"],
      text: "select * from test_table where (bird = $1)",
      type: "select"
    });
  });

  test("simple nested AND", async () => {
    let dbHandle = sq.from`test_table`;
    const where = prep({
      AND: [{ cat: { eq: "meow" } }, { bear: { eq: "sniff" } }]
    });
    const expressions = composeExpressions(sq, where);
    const query = dbHandle.where(...expressions).query;
    // console.log(query);
    expect(query).toEqual({
      text: "select * from test_table where ((cat = $1) and (bear = $2))",
      args: ["meow", "sniff"],
      type: "select"
    });
  });

  test("simple nested OR", async () => {
    let dbHandle = sq.from`test_table`;
    const where = prep({
      OR: [{ cat: { eq: "meow" } }, { bear: { eq: "sniff" } }]
    });
    const expressions = composeExpressions(sq, where);
    const query = dbHandle.where(...expressions).query;
    // console.log(query);
    expect(query).toEqual({
      text: "select * from test_table where ((cat = $1) or (bear = $2))",
      args: ["meow", "sniff"],
      type: "select"
    });
  });

  test("complex nested", async () => {
    let dbHandle = sq.from`test_table`;
    const where = prep({
      OR: [
        { cat: { eq: "meow" } },
        { AND: [{ bear: { eq: "sniff" } }, { dog: { eq: "bark" } }] }
      ]
    });
    const expressions = composeExpressions(sq, where);
    const query = dbHandle.where(...expressions).query;
    // console.log(query);
    expect(query).toEqual({
      text:
        "select * from test_table where ((cat = $1) or ((bear = $2) and (dog = $3)))",
      args: ["meow", "sniff", "bark"],
      type: "select"
    });
  });
});

describe("generate expressions", () => {
  test("eq", () => {
    const expression = generateExpression(sq, "eq", "foo", "bar");
    expect(expression.query).toEqual({
      text: "(foo = $1)",
      args: ["bar"],
      type: "expression"
    });
  });
  test("neq", () => {
    const expression = generateExpression(sq, "neq", "foo", "bar");
    expect(expression.query).toEqual({
      text: "(foo <> $1)",
      args: ["bar"],
      type: "expression"
    });
  });
  test("in", () => {
    const expression = generateExpression(sq, "in", "foo", ["a", "b"]);
    expect(expression.query).toEqual({
      text: "(foo in ($1, $2))",
      args: ["a", "b"],
      type: "expression"
    });
  });
  test("notIn", () => {
    const expression = generateExpression(sq, "notIn", "foo", ["a", "b"]);
    expect(expression.query).toEqual({
      text: "(foo not in ($1, $2))",
      args: ["a", "b"],
      type: "expression"
    });
  });
  test("lt", () => {
    const expression = generateExpression(sq, "lt", "foo", 5);
    expect(expression.query).toEqual({
      text: "(foo < $1)",
      args: [5],
      type: "expression"
    });
  });
  test("lte", () => {
    const expression = generateExpression(sq, "lte", "foo", 5);
    expect(expression.query).toEqual({
      text: "(foo <= $1)",
      args: [5],
      type: "expression"
    });
  });
  test("gt", () => {
    const expression = generateExpression(sq, "gt", "foo", 5);
    expect(expression.query).toEqual({
      text: "(foo > $1)",
      args: [5],
      type: "expression"
    });
  });
  test("gte", () => {
    const expression = generateExpression(sq, "gte", "foo", 5);
    expect(expression.query).toEqual({
      text: "(foo >= $1)",
      args: [5],
      type: "expression"
    });
  });
  test("contains", () => {
    const expression = generateExpression(sq, "contains", "foo", "bar");
    expect(expression.query).toEqual({
      text: "foo ILIKE $1",
      args: ["%bar%"],
      type: "fragment"
    });
  });
  test("not contains", () => {
    const expression = generateExpression(sq, "notContains", "foo", "bar");
    expect(expression.query).toEqual({
      text: "foo NOT ILIKE $1",
      args: ["%bar%"],
      type: "fragment"
    });
  });
  test("startsWith", () => {
    const expression = generateExpression(sq, "startsWith", "foo", "bar");
    expect(expression.query).toEqual({
      text: "foo ILIKE $1",
      args: ["bar%"],
      type: "fragment"
    });
  });
  test("endsWith", () => {
    const expression = generateExpression(sq, "endsWith", "foo", "bar");
    expect(expression.query).toEqual({
      text: "foo ILIKE $1",
      args: ["%bar"],
      type: "fragment"
    });
  });
  test("notEndsWith", () => {
    const expression = generateExpression(sq, "notEndsWith", "foo", "bar");
    expect(expression.query).toEqual({
      text: "foo NOT ILIKE $1",
      args: ["%bar"],
      type: "fragment"
    });
  });
  test("containsDate", () => {
    const expression = generateExpression(
      sq,
      "containsDate",
      "foo",
      "2019-08-01"
    );
    expect(expression.query).toEqual({
      text: "foo @> $1",
      args: ["[2019-08-01,2019-08-01]"],
      type: "fragment"
    });
  });
  test("overlapsDateRange", () => {
    const expression = generateExpression(sq, "overlapsDateRange", "foo", {
      startDate: "2018-01-01",
      endDate: "2018-12-31"
    });
    expect(expression.query).toEqual({
      text: "foo && $1",
      args: ["[2018-01-01,2018-12-31]"],
      type: "fragment"
    });
  });
  test("containsDateRange", () => {
    const expression = generateExpression(sq, "containsDateRange", "foo", {
      startDate: "2018-01-01",
      endDate: "2018-12-31"
    });
    expect(expression.query).toEqual({
      text: "foo @> $1",
      args: ["[2018-01-01,2018-12-31]"],
      type: "fragment"
    });
  });
  test("between", () => {
    const expression = generateExpression(sq, "between", "foo", {
      start: 10,
      end: 20
    });
    expect(expression.query).toEqual({
      text: "(foo between $1 and $2)",
      args: [10, 20],
      type: "expression"
    });
  });
  test("not_between", () => {
    const expression = generateExpression(sq, "not_between", "foo", {
      start: 10,
      end: 20
    });
    expect(expression.query).toEqual({
      text: "(foo not between $1 and $2)",
      args: [10, 20],
      type: "expression"
    });
  });
  test("unsupported Operation", () => {
    expect(() => generateExpression(sq, "fizbo", "foo", "bar")).toThrow();
  });
});

describe("applyFilters", () => {
  test("happy path", () => {
    let dbHandle = sq.from`test_table`;
    const where = prep({ bird: { eq: "fly" } });
    const results = applyFilters(sq, dbHandle, where);
    expect(results.query).toEqual({
      text: "select * from test_table where (bird = $1)",
      args: ["fly"],
      type: "select"
    });
  });
});
