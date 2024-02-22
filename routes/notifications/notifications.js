const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path')

const authDoctor = require('../../middleware/authDoctor')
const doctor = require('../../middleware/doctor')
const user = require('../../middleware/user')
const authUser = require('../../middleware/authUser')

const notificationController = require('../../controllers/notificationsController/notificationsController')

router.get('/user-previous-notification', [authUser, user], notificationController.getMyPreviousNotification)
router.get('/user-unreaded-notification', [authUser, user], notificationController.getUnReadedNotifications)
router.put('/user-mark-read-notification/:id', [authUser, user], notificationController.markNotificationAsReaded)

module.exports = router