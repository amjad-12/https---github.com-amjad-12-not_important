const Joi = require('joi')
const bcrypt = require('bcryptjs')
const { Admin } = require('../../models/admins/admin')


async function authAdmin(req, res) {
    try {
        // console.log('pl')
        const { error } = validateAuthAdmin(req.body);
        if (error) return res.status(400).send(error.details[0].message);
        
        let admin = await Admin.findOne({ phone: req.body.phone });
        if (!admin) return res.status(400).send('Invalid email or password.');

        const validPassword = await bcrypt.compare(req.body.password, admin.password);
        if (!validPassword) return res.status(400).send('Invalid email or password.');

        const token = admin.generateAuthToken();
        return res.status(200).json({token: token});
    } catch (ex) {
        return res.status(500).send('Internal server error.');
    }

}

function validateAuthAdmin(req) {
    const schema = {
        phone: Joi.number().min(5).required(),
        password: Joi.string().min(5).max(255).required()
    }

    return Joi.validate(req, schema)
}

module.exports = {
    authAdmin
}