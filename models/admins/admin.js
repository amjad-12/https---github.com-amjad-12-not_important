const config = require('config')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const Joi = require('joi')
require('dotenv').config();
const private_key = process.env.med_jwtPrivateKey
const adminSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },
    last_name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: 5,
        maxlength: 255
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    phone: {
        type: Number,
        required: true,
        maxlength: 15
    },
    isAdmin: {
        type: Boolean,
        default: true
    }
});

// Here we put this method in the schema to make it easier 
// to add more more properties in the payload 
adminSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        { 
            _id: this._id,
            isAdmin: this.isAdmin,
            // isUser: this.isUser,
            // isPharmacist: this.isPharmacist, 
        }, private_key)
    return token
}

const Admin = mongoose.model('Admin', adminSchema);

function validateAdmin(admin) {
    const schema = {
        first_name: Joi.string().min(3).max(50).required(),
        last_name: Joi.string().min(3).max(50).required(),
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required(),
        phone: Joi.number().min(5).required(),
    }

    return Joi.validate(admin, schema);
}

module.exports = {
    Admin,
    validateAdmin
}