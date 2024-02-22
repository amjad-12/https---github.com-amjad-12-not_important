// const config = require('config')
// const jwt = require('jsonwebtoken')
// const mongoose = require('mongoose');
// const Joi = require('joi')

// const medicalAnalysisSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//         trim: true,
//     },
//     price: {
//         type: Number,
//         required: true,
//         min: 0,
//     },
//     requiresFasting: {
//         type: Boolean,
//         default: false,
//     },
//     laboratory: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Laboratory', // Reference the 'Laboratory' model
//         required: true,
//     },
    
// });

// const MedicalAnalysis = mongoose.model('MedicalAnalysis', medicalAnalysisSchema);

// function validateMedicalAnalysis(medicalAnalysis) {
//     const schema = {
//         name: Joi.string().required(),
//         price: Joi.number().min(0).required(),
//         requiresFasting: Joi.boolean().required(),
//         // You can use Joi.string() here for the laboratory reference
//     };

//     return Joi.validate(medicalAnalysis, schema);
// }

// module.exports = { MedicalAnalysis, validateMedicalAnalysis };