const { Laboratory } = require('../../models/laboratories/laboratory')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const express = require('express');
const Joi = require('joi');



async function loginLaboratory(req, res) {
    try {
        const { error } = validateLaboratoryLogin(req.body);
        if (error) return res.status(400).json({
            message: error.details[0].message
        });
        // Get the laboratory's phone and password from the request body
        const { phone, password } = req.body;

        // Find the laboratory by phone
        const laboratory = await Laboratory.findOne({ phone });

        // Check if the laboratory exists
        if (!laboratory) return res.status(400).json({
            message: 'Invalid email or password.'
        });


        // Verify the provided password against the stored hash
        const validPassword = await bcrypt.compare(password, laboratory.password);
        if (!validPassword) return res.status(400).json({
            error: 'Invalid email or password.'
        });

        const token = laboratory.generateAuthToken();
        return res.status(200).json({ token: token });


    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

function validateLaboratoryLogin(req) {
    const schema = {
        phone: Joi.string().required(),
        password: Joi.string().min(5).max(255).required(),
    };

    return Joi.validate(req, schema);
}


module.exports = {
    loginLaboratory
}