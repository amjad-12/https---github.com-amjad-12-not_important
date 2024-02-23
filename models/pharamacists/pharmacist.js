const config = require('config')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const Joi = require('joi')
require('dotenv').config();
const private_key = process.env.med_jwtPrivateKey

const pharmacistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },
    location: {
        lng: {
            type: Number,
            required: true
        },
        lat: {
            type: Number,
            required: true
        }
    },
    municipality: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the Specialization schema
        ref: 'Municipality', // Refers to the 'Specialization' model
        required: true,
    },
    state: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the Specialization schema
        ref: 'State', // Refers to the 'Specialization' model
        required: true,
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
    cardIdNumber: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    pharmacyLicenseNumber: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    codeOfficine: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    isPharmacist: {
        type: Boolean,
        default: true
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
    isOpen: {
        type: Boolean,
        default: false
    }
});


pharmacistSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, isPharmacist: this.isPharmacist },private_key)
    return token
}

const Pharmacist = mongoose.model('Pharmacist', pharmacistSchema)

function validatePharmacist(pharmacist) {
    const schema = {
        name: Joi.string().min(3).max(50).required(),
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required(),
        phone: Joi.number().min(5).required(),
        cardIdNumber: Joi.string().min(5).max(50).required(),
        pharmacyLicenseNumber: Joi.string().min(5).max(50).required(),
        municipality: Joi.string().required(),
        state: Joi.string().required(),
        codeOfficine: Joi.string().min(5).max(50).required(),
        location: Joi.object({
            lng: Joi.number().required(),
            lat: Joi.number().required()
        }).required()
    }

    return Joi.validate(pharmacist, schema);
}

module.exports = {
    Pharmacist,
    pharmacistSchema,
    validatePharmacist
}