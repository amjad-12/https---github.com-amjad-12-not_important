const express = require('express');
const router = express.Router();

const authPharmacistController = require('../../controllers/pharmacistsControllers/authPharmacistController')

router.post('/', authPharmacistController.authPharmacist)

module.exports = router