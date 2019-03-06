const DataLoader = require("dataloader");
const keyBy = require("lodash.keyby");

const singleLoader = (dbHandle, keyName) =>
  new DataLoader(async keys => {
    const rows = await dbHandle.where({ [keyName]: keys }).all();
    const keyed = keyBy(rows, keyName);
    return keys.map(k => {
      return keyed[k];
    });
  });

module.exports = singleLoader;
