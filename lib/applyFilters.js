const map = require("lodash.map");
const snakeCase = require("lodash.snakecase");
const keys = require("lodash.keys");
const includes = require("lodash.includes");

const applyFilters = (sq, query, where, existsFilters) => {
  const preppedWhere = prep(where, existsFilters);
  const expressions = composeExpressions(sq, preppedWhere, existsFilters);
  return query.where(...expressions);
};

module.exports.applyFilters = applyFilters;

const prep = (payload, existsFilters, isNested = false) => {
  // console.log("INTIAL EF", existsFilters);
  const outPayload = [];

  map(payload, (x, y) => {
    if (includes(keys(existsFilters), y)) {
      // This is an exists statement
      outPayload.push({
        class: "EXISTS",
        tableName: existsFilters[y].tableName,
        joinCondition: existsFilters[y].joinCondition,
        // operations: prep(x, existsFilters),
        subwhere: x
      });
    } else if (!Array.isArray(x) && !isNested) {
      map(x, (v, k) => {
        outPayload.push({
          class: "EXPRESSION",
          column: y,
          operation: k,
          value: v
        });
      });
    } else if (y === "AND") {
      outPayload.push({
        class: "PAREN",
        connector: "AND",
        operations: prep(x, existsFilters, true)
      });
    } else if (y === "OR") {
      outPayload.push({
        class: "PAREN",
        connector: "OR",
        operations: prep(x, existsFilters, true)
      });
    } else {
      map(x, (v, k) => {
        if (k === "AND" || k === "OR") {
          const subOp = prep({ [k]: v }, existsFilters);
          outPayload.push(subOp[0]);
        } else if (includes(keys(existsFilters), k)) {
          // This is an exists statement
          outPayload.push({
            class: "EXISTS",
            tableName: existsFilters[k].tableName,
            joinCondition: existsFilters[k].joinCondition,
            operations: prep(v, existsFilters),
            subwhere: v
          });
        } else {
          map(v, (x, d) => {
            outPayload.push({
              class: "EXPRESSION",
              column: k,
              operation: d,
              value: x
            });
          });
        }
      });
    }
  });
  return outPayload;
};

module.exports.prep = prep;

const composeExpressions = (sq, playbook, existsFilters) => {
  const outPayload = [];
  map(playbook, statement => {
    switch (statement.class) {
      case "PAREN": {
        if (statement.connector === "OR") {
          const ops = composeExpressions(sq, statement.operations);
          const expression = sq.e.or(...ops);
          outPayload.push(expression);
        } else if (statement.connector === "AND") {
          const ops = composeExpressions(sq, statement.operations);
          const expression = sq.e.and(...ops);
          outPayload.push(expression);
        }
        break;
      }
      case "EXPRESSION": {
        const expression = generateExpression(
          sq,
          statement.operation,
          statement.column,
          statement.value
        );
        outPayload.push(expression);
        break;
      }
      case "EXISTS": {
        const existsClause = sq
          .from(sq.raw(statement.tableName))
          .where(sq.raw(statement.joinCondition))
          .return(1)
          .limit(1);

        // construct the exists clause
        const existsClauseWithWheres = applyFilters(
          sq,
          existsClause,
          statement.subwhere,
          existsFilters
        );

        // apply the subwhere exists filter with their own conditions
        const expression = sq.txt`(EXISTS (${existsClauseWithWheres}))`;
        outPayload.push(expression);
      }
    }
  });
  return outPayload;
};

module.exports.composeExpressions = composeExpressions;

const generateExpression = (sq, operation, columnName, value) => {
  const cn = snakeCase(columnName);
  // console.log(">>>>>>>", operation, cn, value);
  switch (operation) {
    // eq =
    case "eq": {
      return sq.e.eq(sq.raw(cn), value);
      break;
    }
    // not <>
    case "neq": {
      return sq.e.neq(sq.raw(cn), value);
      break;
    }
    // in
    case "in": {
      return sq.e.in(sq.raw(cn), value);
      break;
    }
    // not in
    case "notIn": {
      return sq.e.notIn(sq.raw(cn), value);
      break;
    }
    // les than <
    case "lt": {
      return sq.e.lt(sq.raw(cn), value);
      break;
    }
    // less than or equal to <=
    case "lte": {
      return sq.e.lte(sq.raw(cn), value);
      break;
    }
    // greater than >
    case "gt": {
      return sq.e.gt(sq.raw(cn), value);
      break;
    }
    // greater than or equal to >=
    case "gte": {
      return sq.e.gte(sq.raw(cn), value);
      break;
    }
    // string value contains substring
    case "contains": {
      const search = `%${value}%`;
      return sq.txt`${sq.raw(cn)} ILIKE ${search}`;
      break;
    }
    // string value NOT contains substring
    case "notContains": {
      const search = `%${value}%`;
      return sq.txt`${sq.raw(cn)} NOT ILIKE ${search}`;
      break;
    }
    // string value begins with substring
    case "startsWith": {
      const search = `${value}%`;
      return sq.txt`${sq.raw(cn)} ILIKE ${search}`;
      break;
    }
    // string value NOT begins with substring
    case "notStartsWith": {
      const search = `${value}%`;
      return sq.txt`${sq.raw(cn)} NOT ILIKE ${search}`;
      break;
    }
    // string value ends with substring
    case "endsWith": {
      const search = `%${value}`;
      return sq.txt`${sq.raw(cn)} ILIKE ${search}`;
      break;
    }
    // string value NOT ends with substring
    case "notEndsWith": {
      const search = `%${value}`;
      return sq.txt`${sq.raw(cn)} NOT ILIKE ${search}`;
      break;
    }
    case "containsDate": {
      const search = `[${value},${value}]`;
      return sq.txt`${sq.raw(cn)} @> ${search}`;
      break;
    }
    case "overlapsDateRange": {
      const search = `[${value.startDate},${value.endDate}]`;
      return sq.txt`${sq.raw(cn)} && ${search}`;
      break;
    }
    case "containsDateRange": {
      const search = `[${value.startDate},${value.endDate}]`;
      return sq.txt`${sq.raw(cn)} @> ${search}`;
      break;
    }
    case "between": {
      return sq.e.between(sq.raw(cn), value.start, value.end);
    }
    case "not_between": {
      return sq.e.notBetween(sq.raw(cn), value.start, value.end);
    }
    default: {
      // throw new Error("Unsupported operation");
      // return sq;
      break;
    }
  }
};

module.exports.generateExpression = generateExpression;
