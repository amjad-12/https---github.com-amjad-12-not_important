const express = require('express');
const router = express.Router();

const authDoctor = require('../../middleware/authDoctor')
const doctor = require('../../middleware/doctor')
const user = require('../../middleware/user')
const authUser = require('../../middleware/authUser')

const magazineController = require('../../controllers/servicesController/magazineController')

router.post('/add', [authDoctor, doctor], magazineController.addMagazine)
router.post('/get', [authUser, user], magazineController.getMagazinesPagination)


module.exports = router;