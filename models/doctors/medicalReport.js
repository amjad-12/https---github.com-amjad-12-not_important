const config = require('config')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const Joi = require('joi')


const medicalReportSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    doctorInfo: {
        name:{
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
        first_name:{
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
            // \\required: true,
            min: 0,
            max: 200
        },
        gender: {
            type: String,
            required: true,
            enum: ['male', 'female']
        }
    },
    medicalReport: {
        type: String,
        maxlength: 1200,
    },
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
});


const MedicalReport = mongoose.model('MedicalReport', medicalReportSchema);

function validateMedicalReport(medicalReport) {
    const schema = {
        // doctor: Joi.string().required(),
        patient: Joi.string().required(),
        // doctorInfo: Joi.object({
        //     name: Joi.string().required(),
        //     phone: Joi.string().required(),
        // }),
        // patientInfo: Joi.object({
        //     first_name: Joi.string().required(),
        //     last_name: Joi.string().required(),
        //     phone: Joi.string().required(),
        //     age: Joi.number().required()
        // }),
        medicalReport: Joi.string().max(1200).required(),        
    };

    return Joi.validate(medicalReport, schema);
}

function validateMedicalReportManual(medicalReport) {
    const schema = {
        // doctor: Joi.string().required(),
        doctorInfo: Joi.object({
            name: Joi.string().required(),
            phone: Joi.string().required(),
        }),
        patientInfo: Joi.object({
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            // phone: Joi.string().required(),
            age: Joi.number(),
            gender: Joi.string().valid('male', 'female').required(),
        }),
        medicalReport: Joi.string().max(1200).required(),        
    };

    return Joi.validate(medicalReport, schema);
}

module.exports = {MedicalReport, validateMedicalReport, validateMedicalReportManual};
