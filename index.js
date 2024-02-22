const express = require('express')
const app = express()
// process.env.TZ = 'America/New_York';

require('./startup/routes')(app);
require('./startup/db')();
require('./startup/config')();



const server = app.listen(5000, () => console.log('listening'))