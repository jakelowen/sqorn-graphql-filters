const update = (dbHandle, idName = "id") => async (id, data) => {
  const [record] = await dbHandle
    .set(data)
    .where({ [idName]: id })
    .return("*");
  return record;
};

module.exports = update;
