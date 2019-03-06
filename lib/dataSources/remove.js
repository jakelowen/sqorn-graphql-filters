const remove = dbHandle => async id => {
  await dbHandle.where({ id }).delete;
  return true;
};

module.exports = remove;
