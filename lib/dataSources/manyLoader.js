const DataLoader = require("dataloader");
const groupBy = require("lodash.groupby");

const manyLoader = (dbHandle, keyName) =>
  new DataLoader(async keys => {
    const rows = await dbHandle.where({ [keyName]: keys }).all();
    const grouped = groupBy(rows, keyName);
    return keys.map(k => grouped[k]);
  });

module.exports = manyLoader;
