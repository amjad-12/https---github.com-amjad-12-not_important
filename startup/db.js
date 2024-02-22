const mongose = require('mongoose')
// const { getWilayaList, getBaladyiatsForWilaya  } = require('@dzcode-io/leblad');

// const allWilayasDetails = getWilayaList(['name', 'name_ar', 'name_en', 'mattricule']);


module.exports = function () {
    mongose.connect('mongodb://127.0.0.1:27017/med-new')
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.log(`Couldn't connect to Mongodb`))
}