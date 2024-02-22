const mongoose = require('mongoose');
const Joi = require('joi');

// Define the Municipality Schema
const municipalitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State', // Reference to the State model
    required: true,
  },
});

// Create the Municipality model
const Municipality = mongoose.model('Municipality', municipalitySchema);

// Define a Joi schema for municipality validation
function validateMunicipality(municipality) {
  const schema = {
    name: Joi.string().required(),
    state: Joi.string().required(), // Assuming the state is sent as a string (state name or ID)
  };

  return Joi.validate(municipality, schema);
}

module.exports = {
  Municipality,
  validateMunicipality,
};
