const Joi = require('joi')
const bcrypt = require('bcryptjs')
const { User } = require('../models/user')


async function authUser(req, res) {
    try {
        const { error } = validateAuth(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        let user = await User.findOne({ phone: req.body.phone });
        if (!user) return res.status(400).send('Invalid email or password.')

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).send('Invalid email or password.')

        const token = user.generateAuthToken();
        res.send(token)
    } catch (ex) {
        res.status(500).send('Internal server error.')
    }

}

function validateAuth(req) {
    const schema = {
        phone: Joi.string().min(5).required(),
        password: Joi.string().min(5).max(255).required()
    }

    return Joi.validate(req, schema)
}

module.exports = {
    authUser
}