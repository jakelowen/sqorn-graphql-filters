module.exports.applyFilters = require("./applyFilters");
module.exports.getManyHOR = require("./hor/getManyHOR");
module.exports.addOneHOR = require("./hor/addOneHOR");
module.exports.getOneHOR = require("./hor/getOneHOR");
module.exports.loaderGetHOR = require("./hor/loaderGetHOR");
module.exports.removeOneHOR = require("./hor/removeOneHOR");
module.exports.updateOneHOR = require("./hor/updateOneHOR");
module.exports.createGDS = require("./dataSources/create");
module.exports.manyLoaderGDS = require("./dataSources/manyLoader");
module.exports.removeGDS = require("./dataSources/remove");
module.exports.removeManyGDS = require("./dataSources/removeMany");
module.exports.singleLoaderGDS = require("./dataSources/singleLoader");
module.exports.updateGDS = require("./dataSources/update");
module.exports.typedefs = require("./typedefs");

const {
  generateCompositeKeyString,
  composeData,
  mapTo,
  makeNestedKeyValues,
  beltalowda
} = require("./dataSources/dataLoaders");

module.exports.generateCompositeKeyString = generateCompositeKeyString;
module.exports.composeData = composeData;
module.exports.mapTo = mapTo;
module.exports.makeNestedKeyValues = makeNestedKeyValues;
module.exports.beltalowda = beltalowda;

// module.exports.applyFilters = applyFilters;
// module.exports.getManyHOR = getManyHOR;
// module.exports.addOneHOR = addOneHOR;
// module.exports.getOneHOR = getOneHOR;
// module.exports.removeOneHOR = removeOneHOR;
// module.exports.updateOneHOR = updateOneHOR;
// module.exports.typedefs = typedefs;
// module.exports.createGDS = createGDS;
// module.exports.manyLoaderGDS = manyLoaderGDS;
// module.exports.removeGDS = removeGDS;
// module.exports.removeManyGDS = removeManyGDS;
// module.exports.singleLoaderGDS = singleLoaderGDS;
// module.exports.updateGDS = updateGDS;
