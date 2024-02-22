const config = require('config')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const Joi = require('joi')


const medicalAnalysisSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    laboratoriesHave: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Laboratory',
        }
    ],
});

const MedicalAnalysis = mongoose.model('MedicalAnalysis', medicalAnalysisSchema);

module.exports = {MedicalAnalysis};