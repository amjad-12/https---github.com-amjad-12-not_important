const express = require('express');
const router = express.Router();
const user = require('../../middleware/user');
const authUser = require('../../middleware/authUser')
const servicesController = require('../../controllers/servicesController/services')

router.get('/me', [authUser, user], servicesController.getMyRegisteredServices)
router.get('/:serviceName/profile',  [authUser, user], servicesController.getMyProfileService)
router.put('/:serviceName/toggle-status', [authUser, user], servicesController.toggleStatusOfProfileService)
router.put('/editServiceLocation/:serviceId', [authUser, user], servicesController.editMyServiceStateAndMunicipality)

module.exports = router;