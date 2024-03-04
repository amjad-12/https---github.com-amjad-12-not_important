const Joi = require('joi')
const bcrypt = require('bcryptjs')
const { User } = require('../../models/users/user')
const { sendPushNotification } = require('../notificationsController/notificationsController')

async function authUser(req, res) {
    try {


        const { error } = validateAuthUser(req.body);
        if (error) {
            return res.status(400).json({
                data: [],
                message: error.details[0].message,
                status: false,
                code: 400
            });
        }

        let user = await User.findOne({ phone: req.body.phone });
        if (!user) {
            return res.status(400).json({
                data: [],
                message: 'Invalid email or password.',
                status: false,
                code: 400
            });
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                data: [],
                message: 'Invalid email or password.',
                status: false,
                code: 400
            });
        }

        // Check if the user is verified
        if (!user.verified) {
            return res.status(403).json({
                data: [],
                message: 'Your account is not verified yet.',
                status: false,
                code: 700
            });
        }


        // Capture the FCM token sent in the request body
        const fcmToken = req.body.fcmToken;
        if (fcmToken) {
            // Check if the FCM token already exists in the user's document
            const existingToken = user.fcmTokens.find(token => token.token === fcmToken);
            if (!existingToken) {
                // If not, add the new FCM token to the user's document
                user.fcmTokens.push({ token: fcmToken });
            }
        }

        // sendPushNotification(fcmToken, '6570d7422bc6e7b98ff715c1',user._id, 'amjad is', 'we want it to work')

        const token = user.generateAuthToken();

        await user.save();
        const responseData = {
            token,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            username: user.username,
        };

        return res.json({
            data: responseData,
            message: 'Authentication successful.',
            status: true,
            code: 200
        });
    } catch (ex) {
        return res.status(500).json({
            data: [],
            message: 'Internal server error.',
            status: false,
            code: 500
        });
    }
}

function validateAuthUser(req) {
    const schema = {
        phone: Joi.string().min(5).max(15).required(),
        password: Joi.string().min(5).max(255).required(),
        fcmToken: Joi.string().min(5).max(255).required(),
    }

    return Joi.validate(req, schema)
}

module.exports = {
    authUser
}