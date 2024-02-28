const mongoose = require('mongoose');
const Joi = require('joi');

const MedicalReportFileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userInfo: {
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
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laboratory',
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  file: {
    // Additional information about the file
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
  },
});

const MedicalReportFile = mongoose.model('MedicalReportFile', MedicalReportFileSchema);

function MedicalReportFileValidate(file) {
  const schema = {
    userId: Joi.string().required(),
  };

  return Joi.validate(file, schema);
}

module.exports = {
    MedicalReportFile,
    MedicalReportFileValidate,
};
