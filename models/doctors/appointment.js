// models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  slot: {
    type: Number,
    required: true,
  },
  appointmentDate: {
    type: Date,
    default: Date.now,
  },
  dateBookingHappened: {
    type: Date,
    default: Date.now,
  },
  approved: {
    type: Boolean,
    default: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  falseBookByDoctorForUser: {
    type: Boolean,
    default: false,
  },
  cancelledByUser: {
    type: Boolean,
    default: false,
  },
  cancelledByDoctor: {
    type: Boolean,
    default: false,
  },
  cancelled: {
    type: Boolean,
    default: false,
  },
  bookingTimeout: {
    type: Number,
    default: 5, // Default booking timeout in minutes
    min: 5,
    max: 60,
  },
  patientFirstName: {
    type: String,
    required: true,
    trim: true,
  },
  patientLastName: {
    type: String,
    required: true,
    trim: true,
  },
  patientAge: {
    type: Number,
    required: true,
    max: 150,
    min: 0,
    default: 5
  }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = {Appointment};

