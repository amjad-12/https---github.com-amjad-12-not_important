const express = require('express');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
// const { Assistant } = require('../models/doctors/assistantDoctor'); // Adjust the path as needed
const {Assistant} = require('../../models/doctors/assistantDoctor')
const Joi = require('joi');

async function loginAssistantDoctor(req, res) {
    try {
        const { error } = validateAssistantLogin(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

    

        const { name, password } = req.body;

        // Find the assistant by their name
        const assistant = await Assistant.findOne({ name });
        if (!assistant) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if the provided password matches the hashed password in the database
        const validPassword = await bcrypt.compare(password, assistant.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate a JSON Web Token (JWT) for authentication
        const token = assistant.generateAuthToken(); // Replace 'yourSecretKey' with your actual secret key
        return res.status(200).json({ token });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}



function validateAssistantLogin(req) {
    const schema = {
      name: Joi.string().required(),
      password: Joi.string().min(5).max(255).required(),
    };
  
    return Joi.validate(req, schema);
  }

module.exports = {
    loginAssistantDoctor
}