const config = require('config')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const Joi = require('joi')

require('dotenv').config();
const private_key = process.env.med_jwtPrivateKey
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


const laboratorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
   
    isLaboratory: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    isConfirmed: {
        type: Boolean,
        default: true
    },
    municipality: {
        type: municipalitySchema,
        required: true,
    },

    state: {
        type: stateSchema,
        required: true,
    },
    labNameEnglish: {
        type: String,
        // required: true,
        trim: true,
    },
    labNameArabic: {
        type: String,
        // required: true,
        trim: true,
    },
    location: {
        lng: {
            type: Number,
        },
        lat: {
            type: Number,
        }
    },
    locationName: {
        type: String,
        maxlength: 255,
        default: '',
    },
    chosenMedicalAnalyses: [
        {
            medicalAnalysis: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MedicalAnalysis',
            },
        }
    ],
    goHome: {
        type: Boolean,
        default: false
    },
    address: {
        type: String,
        maxlength: 255,
        default: '',
    },
    openTime: {
        type: String,
        default: '00:00',
    },
    closeTime: {
        type: String,
        default: '00:00',
    }
});

laboratorySchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, isLaboratory: this.isLaboratory }, private_key)
    return token
}

laboratorySchema.index({ location: '2dsphere' });

const Laboratory = mongoose.model('Laboratory', laboratorySchema);

// Define a Joi schema for doctor validation
function validateLaboratory(laboratory) {
    const schema = {
        name: Joi.string().required(),
        password: Joi.string().min(5).max(255).required(),
        municipality: Joi.object({
            code: Joi.number().required(),
            name: Joi.string().required(),
            name_en: Joi.string().required(),
            name_ar: Joi.string().required(),
        }).required(),

        state: Joi.object({
            name: Joi.string().required(),
            name_en: Joi.string().required(),
            name_ar: Joi.string().required(),
            mattricule: Joi.number().required(),
        }).required(),
        phone: Joi.string().required(),
        email: Joi.string().email().required(),
        labNameEnglish: Joi.string().required(), 
        labNameArabic: Joi.string().required(), 
        location: Joi.object({
            lng: Joi.number(),
            lat: Joi.number()
        }),
    };

    return Joi.validate(laboratory, schema);
}

module.exports = { Laboratory, validateLaboratory };
