const express = require('express');
const router = express.Router();

const authAdminController = require('../../controllers/adminsController/authAdminController')

router.post('/', authAdminController.authAdmin)

module.exports = router