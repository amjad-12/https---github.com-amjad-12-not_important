const config = require('config')
require('dotenv').config();
const private_key = process.env.med_jwtPrivateKey
module.exports = function() {
    if (!private_key) {
        console.log('FATAL ERROR: jwtPrivateKey is not defined.');
        process.exit(1);
    }    
}
