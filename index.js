const express = require('express')
const app = express()

require('./startup/routes')(app);
require('./startup/db')();
require('./startup/config')();


const server = app.listen(5000, () => console.log('listening'))