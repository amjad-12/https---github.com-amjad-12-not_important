const Joi = require('joi')
const bcrypt = require('bcryptjs')
const { Pharmacist } = require('../../models/pharamacists/pharmacist')

async function authPharmacist(req, res) {
    try {
        const { error } = validateAuthPhramacist(req.body);
        if (error) return res.status(400).json({
            message: error.details[0].message
        });

        let pharmacist = await Pharmacist.findOne({ phone: req.body.phone });
        if (!pharmacist) return res.status(400).json({
            message: 'Invalid email or password.'
        });

        const validPassword = bcrypt.compare(req.body.password, pharmacist.password);
        if (!validPassword) return res.status(400).json({
            message: 'Invalid email or password.'
        });
        const token = pharmacist.generateAuthToken();
        return res.status(200).json({token: token});

    } catch (ex) {
        return res.status(500).json({
            message: 'Internal server error'
          });
    }
}

function validateAuthPhramacist(req) {
    const schema = {
        phone: Joi.number().min(5).required(),
        password: Joi.string().min(5).max(255).required()
    }

    return Joi.validate(req, schema)
}


module.exports = {
    authPharmacist
}