const mongoose = require('mongoose');
const Joi = require('joi');

const assistantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    isAssistant: {
        type: Boolean,
        default: true
    },
});

const Assistant = mongoose.model('Assistant', assistantSchema);

function validateAssistant(assistant) {
    const schema = {
        name: Joi.string().required(),
        password: Joi.string().min(5).max(255).required()
    };

    return Joi.validate(assistant, schema);
}

module.exports = { Assistant, validateAssistant };
