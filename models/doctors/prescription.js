const config = require('config')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const Joi = require('joi')


const prescriptionSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true,
    },
    doctorInfo: {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
    },
    patientInfo: {
        first_name: {
            type: String,
            required: true,
            trim: true,
        },
        last_name: {
            type: String,
            required: true,
            trim: true,
        },
        // phone: {
        //     type: String,
        //     required: true,
        //     trim: true,
        // },
        age: {
            type: Number,
            required: true,
            min: 0,
            max: 200
        },
        gender: {
            type: String,
            required: true,
            enum: ['male', 'female']
        }
    },
    // patientSituation: {
    //     type: String,
    //     maxlength: 800,
    // },
    date: {
        type: String,
        default: () => {
            // Create a new date in the format 'YYYY-MM-DD'
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-based
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    },
    medications: [{
        name: {
            type: String,
            required: true,
            trim: true,
        },
        dosage: {
            type: String, // You can specify the data type that makes sense for dosage (e.g., Number)
            required: true,
        },
        type: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
    }],
});


const Prescription = mongoose.model('Prescription', prescriptionSchema);

function validatePrescription(prescription) {
    const schema = {
        patient: Joi.string().required(),
        // doctorInfo: Joi.object({
        //     name: Joi.string().required(),
        //     phone: Joi.string().required(),
        // }),
        // patientInfo: Joi.object({
        //     first_name: Joi.string(),
        //     last_name: Joi.string(),
        //     phone: Joi.string(),
        //     age: Joi.number()
        // }),
        // patientSituation: Joi.string().max(2000),
        medications: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                dosage: Joi.string().required(),
                type: Joi.string().required(),
                description: Joi.string().required(),
            })
        ).required(),
    };

    return Joi.validate(prescription, schema);
}

function validatePrescriptionManual(prescription) {
    const schema = {
        doctorInfo: Joi.object({
            name: Joi.string().required(),
            phone: Joi.string().required(),
        }),
        patientInfo: Joi.object({
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            // phone: Joi.string().required(),
            age: Joi.number().min(1).required(),
            gender: Joi.string().valid('male', 'female').required(),
        }),
        // patientSituation: Joi.string().max(2000),
        medications: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                dosage: Joi.string().required(),
                type: Joi.string().required(),
                description: Joi.string().required(),
            })
        ).required(),
    };

    return Joi.validate(prescription, schema);
}

module.exports = { Prescription, validatePrescription, validatePrescriptionManual };
