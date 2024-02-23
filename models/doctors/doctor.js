const config = require('config')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const Joi = require('joi')
require('dotenv').config();
const private_key = process.env.med_jwtPrivateKey
const daySchema = new mongoose.Schema({
    dayOfWeek: {
        type: String,
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    maxPatients: {
        type: Number,
        default: 0,
    },
    clinicHours: {
        clinicOpeningTime: {
            type: String,
            default: '00:00',
        },
        clinicClosingTime: {
            type: String,
            default: '00:00',
        },
    },
});

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


const doctorSchema = new mongoose.Schema({
    schedule: [daySchema],
    nameArabic: {
        type: String,
        required: true,
        trim: true,
    },
    nameEnglish: {
        type: String,
        required: true,
        trim: true,
    },

    specialization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialization',
        required: true,
    },
    isDoctor: {
        type: Boolean,
        default: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
    },
    priceOfExamination: {
        type: Number,
        default: 0,
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
        default: true,
    },
    municipality: {
        type: municipalitySchema,
        required: true,
    },

    state: {
        type: stateSchema,
        required: true,
    },
    clinicName: {
        type: String,
        trim: true,
        default: '',
    },
    location: {
        lng: {
            type: Number,

        },
        lat: {
            type: Number,

        },
    },
    currentNumber: {
        type: Number,
        default: 1,
    },
    bio: {
        type: String,
        maxlength: 1200,
        default: '',
    },
    bookingStartTime: {
        type: String,
        default: '00:00',
    },
    address: {
        type: String,
        maxlength: 255,
        default: '',
    },
    locationName: {
        type: String,
        maxlength: 255,
        default: '',
    },
    bookingByUser: {
        type: Boolean,
        default: true,
    }
});


doctorSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, isDoctor: this.isDoctor }, private_key)
    return token
}

doctorSchema.index({ location: '2dsphere' });

const Doctor = mongoose.model('Doctor', doctorSchema);

// Define a Joi schema for doctor validation
function validateDoctor(doctor) {
    const schema = {
        nameArabic: Joi.string().required(),
        nameEnglish: Joi.string().required(),
        password: Joi.string().min(5).max(255).required(),
        specialization: Joi.string().required(), // Validate as an ObjectId
        municipality: Joi.string().required(),
        state: Joi.string().required(),
        phone: Joi.string().required(),
        email: Joi.string().email().required(),
        clinicName: Joi.string(),
        location: Joi.object({
            lng: Joi.number(),
            lat: Joi.number()
        }),
        locationName: Joi.string()
    };

    return Joi.validate(doctor, schema);
}

module.exports = { Doctor, validateDoctor };


//     const daySchema = new mongoose.Schema({
//         dayOfWeek: {
//           type: String,
//           enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
//         },
//         maxPatients: {
//           type: Number,
//           default: 0,
//         },
//         bookingStartTime: {
//           type: String,
//           default: '00:00', // Default value for bookingStartTime
//         },
//         bookingEndTime: {
//           type: String,
//           default: '00:00', // Default value for bookingEndTime
//         },
//         clinicClosingTime: {
//           type: String,
//           default: '00:00', // Default value for clinicClosingTime
//         },
//       });

// const doctorSchema = new mongoose.Schema({
//     schedule: [daySchema],
//     name: {
//         type: String,
//         required: true,
//         trim: true,
//     },
//     specialization: {
//         type: mongoose.Schema.Types.ObjectId, // Reference to the Specialization schema
//         ref: 'Specialization', // Refers to the 'Specialization' model
//         required: true,
//     },

//     isDoctor: {
//         type: Boolean,
//         default: true
//     },
//     password: {
//         type: String,
//         required: true,
//         minlength: 5,
//         maxlength: 255
//     },
//     priceOfExamination: {
//         type: Number,
//         // required: true,
//         default: 0
//     },
//     phone: {
//         type: String,
//         required: true,
//         unique: true,
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//     },
//     isConfirmed: {
//         type: Boolean,
//         default: false
//     },
//     municipality: {
//         type: mongoose.Schema.Types.ObjectId, // Reference to the Specialization schema
//         ref: 'Municipality', // Refers to the 'Specialization' model
//         required: true,
//     },
//     state: {
//         type: mongoose.Schema.Types.ObjectId, // Reference to the Specialization schema
//         ref: 'State', // Refers to the 'Specialization' model
//         required: true,
//     },
//     bookingStartTime: {
//         type: String,
//         default: '00:00', // Default value for bookingStartTime
//     },
//     bookingEndTime: {
//         type: String,
//         default: '00:00', // Default value for bookingEndTime
//     },
//     clinicName: {
//         type: String,
//         // required: true,
//         trim: true,
//         default: ''
//     },
//     location: {
//         lng: {
//             type: Number,
//             required: true
//         },
//         lat: {
//             type: Number,
//             required: true
//         }
//     },
//     registrationNumber: {
//         type: String,
//         required: true,
//         minlength: 5,
//         maxlength: 255
//     },
//     currentNumber: {
//         type: Number,
//         default: 1,
//     },
//     bio: {
//         type: String,
//         maxlength: 1200,
//         default: ''
//     },
// });