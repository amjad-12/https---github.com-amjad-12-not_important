const express = require('express');
const router = express.Router();

const user = require('../../middleware/user');

const authUser = require('../../middleware/authUser')
const userController = require('../../controllers/usersControllers/userController');

const authDoctor = require('../../middleware/authDoctor')
const doctor = require('../../middleware/doctor')

router.post('/', userController.createUser);
router.get('/me', [authUser, user], userController.getProfileUser);
router.get('/getUsersSuggestions/:phoneNumber', [authDoctor, doctor], userController.getSuggestionUsersByNumber);
router.put('/me', [authUser, user], userController.editProfileUser);
router.get('/verify/:id', userController.verifyUserByEmail);

module.exports = router;