const create = dbHandle => async data => {
  const [record] = await dbHandle.insert(data).return("*");
  return record;
};

module.exports = create;
