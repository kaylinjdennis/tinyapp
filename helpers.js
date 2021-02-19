const getUserByEmail = (email, database) => {
  let correctUser;
  for (let user in database) {
    if (database[user].email === email) {
      correctUser = database[user];
    }
  }
  return correctUser;
};

module.exports = { getUserByEmail };