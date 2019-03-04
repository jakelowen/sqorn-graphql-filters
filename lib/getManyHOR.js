const map = require("lodash.map");
const keys = require("lodash.keys");
const applyFilters = require("./applyFilters");

const getManyHOR = (dbHandle, existsFilters) => async (root, args, context) => {
  const query = dbHandle;
  if (args.input && args.input.where) {
    // These are the WHERE EXISTS sub filters applied before and Joins.
    if (existsFilters) {
      keys(existsFilters).forEach(efKey => {
        if (efKey in args.input.where) {
          const value = existsFilters[efKey];
          const subWhere = args.input.where[efKey];
          const sq = context.sq;
          // the raws are ok here because they are config and not user provided.
          query = query.where(
            sq.txt`EXISTS (SELECT 1 FROM ${sq.raw(
              value.tableName
            )} WHERE ${sq.raw(value.where)}) `
          );
          // apply the subwhere exists filter with their own conditions
          query = applyFilters(dbHandle, subWhere);
          // delete the exists condition as they are no longer needed
          delete args.input.where[efKey];
        }
      });
    }

    // apply other primary wheres (excluding exists subwheres)
    query = applyFilters(query, args.input.where);
  }

  const countQuery = query.return`COUNT (*)`;
  const selectQuery = query.return`*`;
  const [count] = await countQuery;

  if (args.input && args.input.sort) {
    selectQuery.orderBy(
      map(args.input.sort, (order, column) => ({
        by: column,
        sort: order
      }))
    );
  }

  const limit = args.input && args.input.limit ? args.input.limit : 20;
  const offset = args.input && args.input.offset ? args.input.offset : 0;

  selectQuery.limit(limit + 1);
  selectQuery.offset(offset);

  const items = await selectQuery;

  return {
    hasMore: items.length === limit + 1,
    totalCount: count.count,
    items: items.slice(0, limit)
  };
};

module.exports = getManyHOR;
