const express = require('express');
const router = express.Router();

const authUserController = require('../../controllers/usersControllers/authUserController')

router.post('/', authUserController.authUser)

module.exports = router