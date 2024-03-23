const express = require('express')
const app = express()
// process.env.TZ = 'America/New_York';

require('./startup/routes')(app);
require('./startup/db')();
require('./startup/config')();

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

const server = app.listen(5000, () => console.log('listening'))