const config = require('config')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const Joi = require('joi')

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
        minlength:5,
        maxlength: 255
    },
    password: {
        type: String,
        required: true,
        minlength:5,
        maxlength: 255
    },
    phone: {
        type: Number,
        required: true,
        maxlength:15
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
    }
});

// Here we put this method in the schema to make it easier 
// to add more more properties in the payload 
userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({_id: this._id}, config.get('jwtPrivateKey'))
    return token
}

const User = mongoose.model('User', userSchema);

function validateUser(user) {
    const schema = {
        first_name: Joi.string().min(3).max(50).required(),
        last_name: Joi.string().min(3).max(50).required(),
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required(),
        phone: Joi.number().min(5).required(),
        medical_history: Joi.string().max(1024).default(''),
        allergies: Joi.string().max(1024).default(''),
        current_medications: Joi.string().max(1024).default('')
    } 

    return Joi.validate(user, schema);
}

module.exports = {
    User,
    validateUser
}