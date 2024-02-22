const mongoose = require('mongoose');
const Joi = require('joi');

const stateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2, // Adjust the minimum length as needed
    maxlength: 50, // Adjust the maximum length as needed
    unique: true,
  },
  // You can add more fields specific to states if necessary
});

const State = mongoose.model('State', stateSchema);

function validateState(state) {
    const schema = {
        name: Joi.string().min(2).max(50).required(),
    }

    return Joi.validate(state, schema);
}
  
  

module.exports = { State, validateState };