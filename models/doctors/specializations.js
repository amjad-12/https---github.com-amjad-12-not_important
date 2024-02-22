const mongoose = require('mongoose');
const Joi = require('joi')

// const specializationSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     // unique: true, // Ensures each specialization name is unique
//     trim: true,   // Removes leading/trailing whitespace
//   },
//   ourId: {
//     type: Number,
//     required: true,
//     min: 0,
//     max: 50
//   },
//   nameFrance: {
//     type: String,
//     required: true,
//     // unique: true, // Ensures each specialization name is unique
//     trim: true,   // Removes leading/trailing whitespace
//   },
//   nameArabic: {
//     type: String,
//     required: true,
//     // unique: true, // Ensures each specialization name is unique
//     trim: true,   // Removes leading/trailing whitespace
//   },
//   icon: {
//     type: Boolean,
//     default: false
//   }
// });

// const Specialization = mongoose.model('Specialization', specializationSchema);

const specializationSchema = new mongoose.Schema({
  nameArabic: {
      type: String,
      required: true,
      unique: true,
  },
  nameEnglish: {
      type: String,
      required: true,
      unique: true,
  },
  nameFrench: {
      type: String,
      required: true,
      unique: true,
  },
  imagePath: {
      type: String,
      required: true,
  },
  isFirst: {
    type: Boolean,
    default: false,
  }
});

const Specialization = mongoose.model('Specialization', specializationSchema);


module.exports = { Specialization };