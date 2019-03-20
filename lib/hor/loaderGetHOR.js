const get = require("lodash.get");

module.exports = (loaderPath, recordIdPath) => async (root, args, ctx) => {
  const loader = get(ctx, loaderPath);
  const id = get(args, recordIdPath);
  return loader.load(id);
};
