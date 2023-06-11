const mongose = require('mongoose')

module.exports = function () {
    mongose.connect('mongodb://127.0.0.1/med')
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.log(`Couldn't connect to Mongodb`))
}