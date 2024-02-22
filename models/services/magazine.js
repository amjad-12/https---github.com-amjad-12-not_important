const mongoose = require('mongoose');
const Joi = require('joi');

const magazineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  }
});

const Magazine = mongoose.model('Magazine', magazineSchema);

function validateMagazine(magazine) {
  const schema = {
    title: Joi.string().required(),
    description: Joi.string().required(),
    content: Joi.string().required(),
  };

  return Joi.validate(magazine, schema);
}

module.exports = { Magazine, validateMagazine };
