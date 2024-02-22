const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const {Doctor} = require('../../models/doctors/doctor');
const Joi = require('joi');



// Doctor login
async function loginDoctor(req, res) {
  try {
    const { error } = validateDoctorLogin(req.body);
    if (error) return res.status(400).json({
      message: error.details[0].message,
      status: false,
      data: [], 
      code:400
    });

    let doctor = await Doctor.findOne({ phone: req.body.phone });
    if (!doctor) return res.status(400).json({
      message: 'Invalid email or password.',
      status: false,
      data: [], 
      code:400
    });

    const validPassword = bcrypt.compare(req.body.password, doctor.password);
    if (!validPassword) return res.status(400).json({
      message: 'Invalid email or password.',
      status: false,
      data: [], 
      code:400
    });
    const token = doctor.generateAuthToken();
    return res.status(200).json({ data: {token}, message: 'logged in successfully', status: true, code:200 });

  } catch (ex) {
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

function validateDoctorLogin(req) {
  const schema = {
    phone: Joi.string().required(),
    password: Joi.string().min(5).max(255).required(),
  };

  return Joi.validate(req, schema);
}

module.exports = {
  loginDoctor
};
