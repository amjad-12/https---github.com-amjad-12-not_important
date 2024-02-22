const mongoose = require('mongoose');
const Joi = require('joi')

const ourMedicineSchema = new mongoose.Schema({
    // name: String,
    // age: Number
    number: String,
    rigistration_number: String,
    code: String,
    dci: String,
    brand: String,
    form: String,
    dosage: String,
    cond: String,
    list: String,
    p_one: String,
    p_two: String,
    obs: String,
    lab_decision: String,
    country_lab_desicion: String,
    init_date: String,
    fina_date: String,
    type: String,
    status: String,
    duration: String
});

// Create a model for the Excel data
const OurMedicine = mongoose.model('OurMedicine', ourMedicineSchema);

module.exports = {
    OurMedicine
}
