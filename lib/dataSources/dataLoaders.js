const _ = require("lodash");
const DataLoader = require("dataloader");

// ********************* core functions *********************

// get reproducible deterministic string from key
// use _.identity as modifier if you don't want to modify
exports.generateCompositeKeyString = modifyFn => key => {
  // start by running key through modifer function
  const sortedPairs = _(modifyFn(key))
    // convert to [[key: value], [key: value]] pairs
    .toPairs()
    // order the keys in array for consistency
    .sortBy(_.head)
    // execute!
    .values();
  // convert to string and return
  return JSON.stringify(sortedPairs);
};

// given a key prep function, groups any rows by keys
// and reorders by order of keys
exports.composeData = (keyFn, composite = false) => (keys, rows) => {
  const outMap = {};
  _.forEach(rows, row => {
    // generates a key for row with supplied keyFn
    const key = keyFn(row);
    // defaults each key to empty array
    outMap[key] = _.defaultTo(outMap[key], []);
    // drops row into right key obj
    outMap[key].push(row);
  });
  // reorders outMap to order of supplied keys
  return _.map(keys, key => outMap[composite ? keyFn(key) : key]);
};

// constructs a final 'mapTo' results
exports.mapTo = (dataPrepFn, extractFn) => (keys, rows) => {
  // prep the data
  const data = dataPrepFn(keys, rows);
  // returns data in final shape
  return _.map(data, x => extractFn(x));
};

// takes a collection and nests collections value into keys.
// Perfect for use in 'WHERE IN' queries
// [
//   {userId: 88, teamId: 99},
//   {userId: 66, teamId: 77},
//   {userId: 22, teamId: 33},
// ] =>
// { userId: [ 88, 66, 22 ], teamId: [ 99, 77, 33 ] }
exports.makeNestedKeyValues = keys => {
  const wheres = {};
  _(keys).forEach(keySet => {
    _.forOwn(keySet, (value, key) => {
      // console.log(keySet, value, key)
      wheres[key] = _.defaultTo(wheres[key], []);
      wheres[key].push(value);
    });
  });
  return wheres;
};

// generic dataloader composer.
// queryFn must convert keys => rows
// mapperFn must organize rows into correct shape
// options must comply with dataloader options. Good place for cacheKeyFn
exports.beltalowda = (dataFetcherFn, mapperFn, options = {}) =>
  new DataLoader(async keys => {
    const rows = await dataFetcherFn(keys);
    return mapperFn(keys, rows);
  }, options);
