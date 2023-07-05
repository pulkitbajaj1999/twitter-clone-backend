const mongoose = require('mongoose')

module.exports.dbConnect = (uri) => {
  return mongoose
    .connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('Database Connected')
    })
    .catch((err) => {
      console.log('Error while connecting to database!\n', err)
    })
}
