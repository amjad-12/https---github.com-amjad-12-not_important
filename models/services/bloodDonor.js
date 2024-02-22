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

const bloodDonorSchema = new mongoose.Schema({
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
    bloodType: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'AB-', 'AB+', 'O+', 'O-', 'B-', 'B+'],
    },
    personalIdentificationImage: {
        type: String, // Assuming you store the image path or URL
        required: true,
    },

    // Add other fields specific to blood donation service
});

const BloodDonor = mongoose.model('BloodDonor', bloodDonorSchema);

function validateBloodDonor(bloodDonor) {
    const schema = {
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        // municipality: Joi.object({
        //     code: Joi.number().required(),
        //     name: Joi.string().required(),
        //     name_en: Joi.string().required(),
        //     name_ar: Joi.string().required(),
        // }).required(),
        // state: Joi.object({
        //     name: Joi.string().required(),
        //     name_en: Joi.string().required(),
        //     name_ar: Joi.string().required(),
        //     mattricule: Joi.number().required(),
        // }).required(),
        municipality: Joi.string().required(),
        state: Joi.string().required(),
        phone: Joi.string().required(),
        bloodType: Joi.string().valid('A+', 'A-', 'AB-', 'AB+', 'O+', 'O-', 'B-', 'B+').required(),
        // personalIdentificationImage: Joi.string().required(),
        // Add validation for other blood donor fields here
    };

    return Joi.validate(bloodDonor, schema);
}

module.exports = { BloodDonor, validateBloodDonor };
