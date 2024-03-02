const config = require('config')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const Joi = require('joi')
require('dotenv').config();
const private_key = process.env.med_jwtPrivateKey
const userSchema = new mongoose.Schema({
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
        unique: true,
        required: true,
        maxlength: 15
    },
    medical_history: {
        type: String,
        default: '',
        maxlength: 1024
    },
    allergies: {
        type: String,
        default: '',
        maxlength: 1024
    },
    current_medications: {
        type: String,
        default: '',
        maxlength: 1024
    },
    isUser: {
        type: Boolean,
        default: true
    },
    fcmTokens: [{
        token: {
            type: String,
            required: true
        },
      
    }],
    birthdate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                // Check if the birthdate is not in the future
                return value <= new Date();
            },
            message: 'Birthdate cannot be in the future',
        },
    },
    verified: {
        type: Boolean,
        required: true,
        default: false
    },
    
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: true,
    },
    registeredServices: [
        {
            service: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Service',
                required: true,
            },
            serviceName: {
                type: String,
                enum: ['ambulance', 'BloodDonor'], // Add other service names as needed
                required: true,
            },
            // Add other fields specific to the user's registration in this service
        },
    ],
    bookedNumbers: [
        {
            doctorId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Doctor',
                // required: true,
            },
            bookedNumber: {
                type: Number,
                // required: true,
            },
            bookingDate: {
                type: Date,
                required: true,
            },
        },
    ],
});
// Virtual property to calculate age
userSchema.virtual('age').get(function () {
    const birthYear = this.birthdate.getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
});

// Here we put this method in the schema to make it easier 
// to add more more properties in the payload 
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, isUser: this.isUser }, private_key)
    return token
}

const User = mongoose.model('User', userSchema);

function validateUser(user) {
    const schema = {
        first_name: Joi.string().min(3).max(50).required(),
        last_name: Joi.string().min(3).max(50).required(),
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required(),
        phone: Joi.string().min(5).max(15).required(),
        medical_history: Joi.string().max(1024).default(''),
        allergies: Joi.string().max(1024).default(''),
        current_medications: Joi.string().max(1024).default(''),
        birthdate: Joi.string().regex(/^\d{4}\/\d{2}\/\d{2}$/).required(),
        gender: Joi.string().valid('male', 'female').required(),
    }

    return Joi.validate(user, schema);
}

module.exports = {
    User,
    validateUser
}