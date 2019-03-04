const map = require("lodash.map");
const keys = require("lodash.keys");
const { applyFilters } = require("./applyFilters");

const getManyHOR = (dbHandle, existsFilters) => async (root, args, context) => {
  let query = dbHandle;
  const sq = context.sq;
  if (args.input && args.input.where) {
    // These are the WHERE EXISTS sub filters applied before and Joins.
    if (existsFilters) {
      keys(existsFilters).forEach(efKey => {
        if (efKey in args.input.where) {
          const value = existsFilters[efKey];
          const subWhere = args.input.where[efKey];
          // the raws are ok here because they are config and not user provided.
          const existsClause = sq
            .from(sq.raw(value.tableName))
            .where(sq.raw(value.where))
            .return(1)
            .limit(1);

          // construct the exists clause
          const existsClauseWithWheres = applyFilters(
            sq,
            existsClause,
            subWhere
          );

          // apply the subwhere exists filter with their own conditions
          query = query.where`EXISTS (${existsClauseWithWheres})`;

          // delete the exists condition as they are no longer needed
          delete args.input.where[efKey];
        }
      });
    }
    // apply other primary wheres (excluding exists subwheres)
    query = applyFilters(sq, query, args.input.where);
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
