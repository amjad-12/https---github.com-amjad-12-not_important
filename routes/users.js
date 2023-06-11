const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')

const userController = require('../controllers/userController');

router.post('/', userController.createUser);
router.get('/me', auth, userController.getProfileUser);
router.put('/me', auth, userController.editProfileUser);

module.exports = router;