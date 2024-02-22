const { Notification } = require('../../models/notifications/notifications'); // Import Notification model
// const { Doctor } = require('../../models/doctors/doctor');

const admin = require('firebase-admin')
const serviceAccount = require('../../notifications/notificationService.json')

const firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),


})



async function sendPushNotification(devicePushToken, senderId, receiverId, title, body) {
    try {
        // Send notification
        const res = await firebaseAdmin.messaging().send({
            token: devicePushToken,
            notification: {
                title,
                body
            }
        });


        // Save notification data to MongoDB
        const notification = new Notification({
            sender: senderId,
            receiver: receiverId,
            title,
            body,
            read: false
        });
        await notification.save();
    } catch (error) {
        console.error('Error sending notification:', error);
        throw new Error('Failed to send notification');
    }
}


async function getUnReadedNotifications(req, res) {
    try {
        const userId = req.user._id; // Assuming user ID is available in request
        const notifications = await Notification.find({ receiver: userId, read: false });
        res.json({
            code: 200,
            status: true,
            message: "notifications retrive successfully",
            data: notifications
        });
    } catch (error) {

        res.status(500).json({
            message: 'Failed to fetch notifications',
            code: 500,
            status: false,
            data: null
        });
    }
}

async function markNotificationAsReaded(req, res) {
    try {
        const notificationId = req.params.id;
        await Notification.findByIdAndUpdate(notificationId, { read: true }); res.json({
            code: 200,
            status: true, message: 'Notification marked as read', data: null
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            message: 'Failed to mark notification as read', 
            code: 500,
            data: null,
            status: true,
        });
    }
}

async function getMyPreviousNotification(req, res) {
    try {
        const userId = req.user._id; // Assuming user ID is available in request
        const { page = 1, limit = 10 } = req.query;
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 } // Sort by creation date in descending order
        };
        const notifications = await Notification.find({ receiver: userId }, options).select('title body read createdAt');
        res.json({data:notifications, message:'data retireved successfully', status: true, code:200});
    } catch (error) {
 
        res.status(500).json({             code: 500,
            data: null,
            status: true,message: 'Failed to fetch previous notifications' });
    }
}

module.exports = {
    sendPushNotification,
    getMyPreviousNotification,
    markNotificationAsReaded,
    getUnReadedNotifications
}