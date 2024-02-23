const config = require('config')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const Joi = require('joi')
require('dotenv').config();
const private_key = process.env.med_jwtPrivateKey
const assistantDoctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
    },
    registeredByDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    examControl: {
        type: Boolean,
        default: false 
    },
    bookControl: {
        type: Boolean,
        default: false 
    },
    isAssistant: {
        type: Boolean,
        default: true
    },
});

assistantDoctorSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ 
        _id: this._id, 
        isAssistant: this.isAssistant, 
        registeredByDoctor: this.registeredByDoctor,
        examControl: this.examControl,
        bookControl: this.bookControl
    }, private_key)
    return token
}


const Assistant = mongoose.model('Assistant', assistantDoctorSchema);

function validateAssitantDoctor(assistantDoctor) {
    const schema = {
        name: Joi.string().required(),
        password: Joi.string().min(5).max(255).required(),
        examControl: Joi.boolean(),
        bookControl: Joi.boolean()
        // registeredByDoctor: Joi.string().required(),
    };

    return Joi.validate(assistantDoctor, schema);
}

module.exports = {
    Assistant,
    validateAssitantDoctor
};
