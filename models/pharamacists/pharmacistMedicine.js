const mongoose = require('mongoose');
const Joi = require('joi')
const {pharmacistSchema} = require('../../models/pharamacists/pharmacist')

const pharmacistMedicineSchema = new mongoose.Schema({
  brand_name: {
    type: String,
    required: true,
  },
  pharmacist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacist'
  }]
});

function validatePharmacistMedicine(medicine) {
  const schema = {
      brand_name: Joi.string().min(3).max(50).required(),
  } 
  return Joi.validate(medicine, schema);
}


const PharmacistMedicine = mongoose.model('PharmacistMedicine', pharmacistMedicineSchema);


module.exports = {
  PharmacistMedicine,
  validatePharmacistMedicine
}
    // const pharmacistMedicineSchema = new mongoose.Schema({
    //   brand_name: String,
    //   pharmacist: {
    //     type: Map,
    //     of: {
    //       _id: {
    //           type: mongoose.Schema.Types.ObjectId,
    //         },
    //         name: {
    //           type: String,
    //           required: true,
    //           minlength: 3,
    //           maxlength: 50
    //         }
    //       },
    //       default: {}
    //     }
    //   });
      
      
      // const pharmacyInfoSchema = new mongoose.Schema({
      //     name: {
      //         type: String,
      //         required: true,
      //         minlength: 3,
      //         maxlength: 50
      //     },
      
      // })
      
      // const pharmacistMedicineSchema = new mongoose.Schema({
        //     brand_name: String,
    //     pharmacist: {
    //         type: [{
    //             _id: {
    //                 type: mongoose.Schema.Types.ObjectId,
    //             },
    //             name: {
    //                 type: String,
    //                 required: true,
    //                 minlength: 3,
    //                 maxlength: 50
    //             }
    //         }],
    //         default: []
    //     }
    // })