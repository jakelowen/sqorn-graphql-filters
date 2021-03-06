const map = require("lodash.map");
const keys = require("lodash.keys");
const isEmpty = require("lodash.isempty");
const snakeCase = require("lodash.snakecase");
const { applyFilters } = require("../applyFilters");

const prepQuery = (sq, query, existsFilters, where) => {
  if (!isEmpty(where)) {
    query = applyFilters(sq, query, where, existsFilters);
  }
  return query;
};

const getManyHOR = (dbHandle, existsFilters) => async (root, args, context) => {
  let query = dbHandle;
  const sq = context.sq;
  query = prepQuery(sq, query, existsFilters, args.input && args.input.where);
  const countQuery = query.return`COUNT (*)`;
  let selectQuery = query.return`*`;
  const [count] = await countQuery;

  if (args.input && args.input.sort) {
    map(args.input.sort, (order, column) => {
      selectQuery = selectQuery.orderBy({
        by: snakeCase(column),
        sort: order.toLowerCase()
      });
    });
  }

  const limit = args.input && args.input.limit ? args.input.limit : 20;
  const offset = args.input && args.input.offset ? args.input.offset : 0;

  selectQuery = selectQuery.limit(limit + 1);
  selectQuery = selectQuery.offset(offset);

  const items = await selectQuery;

  return {
    hasMore: items.length === limit + 1,
    totalCount: count.count,
    items: items.slice(0, limit)
  };
};

module.exports.getManyHOR = getManyHOR;

const myModule = (module.exports = getManyHOR);
myModule.prepQuery = prepQuery;
