const removeMany = (dbHandle, fieldName) => async value => {
  await dbHandle.where({ [fieldName]: value }).delete;
  return true;
};

module.exports = removeMany;
