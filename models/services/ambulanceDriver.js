const mongoose = require('mongoose');
const Joi = require('joi');

const municipalitySchema = new mongoose.Schema({
    code: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    name_en: {
        type: String,
        required: true,
    },
    name_ar: {
        type: String,
        required: true,
    },
});

const stateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    name_en: {
        type: String,
        required: true,
    },
    name_ar: {
        type: String,
        required: true,
    },
    mattricule: {
        type: Number,
        required: true,
    },
});

const ambulanceDriverSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    municipality: {
        type: municipalitySchema,
        required: true,
    },
    state: {
        type: stateSchema,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    isConfirmed: {
        type: Boolean,
        default: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },

    personalIdentificationImage: {
        type: String, // Assuming you store the image path or URL
        required: true,
    },

    // Add other fields specific to blood donation service
});

const AmbulanceDriver = mongoose.model('AmbulanceDriver', ambulanceDriverSchema);

function validateAmbulanceDriver(ambulanceDriver) {
    const schema = {
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),

        municipality: Joi.string().required(),
        state: Joi.string().required(),
        phone: Joi.string().required(),

    };

    return Joi.validate(ambulanceDriver, schema);
}

module.exports = { AmbulanceDriver, validateAmbulanceDriver };
