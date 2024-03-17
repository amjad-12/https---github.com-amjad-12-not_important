const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs')
const _ = require('lodash');
// const Doctor = require('../models/Doctor');
const { Doctor, validateDoctor } = require('../../models/doctors/doctor')
const { Assistant, validateAssitantDoctor } = require('../../models/doctors/assistantDoctor')
const { Specialization } = require('../../models/doctors/specializations')
const Joi = require('joi');
const { func } = require('joi');
const geolib = require('geolib');
const { getWilayaByCode, getBaladyiatsForWilaya } = require('@dzcode-io/leblad');

// function validateDoctorSignup(req) {
//   const schema = {
//     name: Joi.string().min(3).max(50).required(),
//     specialization: Joi.string().required(),
//     maxPatients: Joi.number().integer().min(1).max(20).required(),
//     // Add more fields here as needed
//   };

//   return Joi.validate(req, schema);
// }

// Doctor signup
async function createDoctor(req, res) {
  try {
    const { error } = validateDoctor(req.body);
    if (error) return res.status(400).json({
      message: error.details[0].message,
      status: false,
      data: [],
      code: 400
    });

    // if (error) {
    //   return res.status(400).json({ error: error.details[0].message });
    // }

    let doctor = await Doctor.findOne({ $or: [{ email: req.body.email }, { phone: req.body.phone }] });
    if (doctor) {
      return res.status(409).json({ message: 'Doctor already registered', status: false, code: 500, data: [] });
    }


    const stateMattricule = parseInt(req.body.state)
    const municipalityCode = parseInt(req.body.municipality)

    const stateData = getWilayaByCode(stateMattricule)
    const municipalityData = getBaladyiatsForWilaya(stateMattricule)
    const filteredData = municipalityData.filter(item => item.code === municipalityCode);

    const state = {
      name_ar: stateData.name_ar,
      name_en: stateData.name_en,
      name: stateData.name,
      mattricule: stateData.mattricule
    }

    const municipality = {
      name_ar: filteredData[0].name_ar,
      name_en: filteredData[0].name_en,
      name: filteredData[0].name,
      code: filteredData[0].code
    }


    doctor = new Doctor({
      nameArabic: req.body.nameArabic,
      nameEnglish: req.body.nameEnglish,
      specialization: req.body.specialization,
      password: req.body.password,
      email: req.body.email,
      phone: req.body.phone,
      clinicName: req.body.clinicName,
      locationName: req.body.locationName,
      location: req.body.location,
      state: state,
      municipality: municipality
    });

    await doctor.save();

    const salt = await bcrypt.genSalt(10);
    doctor.password = await bcrypt.hash(doctor.password, salt);
    await doctor.save();
    const token = doctor.generateAuthToken();
    // const token = jwt.sign({ doctorId: doctor._id }, 'your-secret-key', { expiresIn: '1h' });

    return res.status(201).json({ status: true, code: 201, message: 'signed up successfully',  data: {token} });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal server error', status: false, code: 500, data: [] });
  }
};

async function getProfileDoctor(req, res) {
  try {
    console.log('sddddddddddddddd')
    // Get the doctor's ID from the authenticated token
    const doctorId = req.doctor._id;

    // Find the doctor in the database by ID and select the name and specialization fields
    const doctor = await Doctor.findById(doctorId).select('-location -locationName -isDoctor -priceOfExamination -password').populate({
      path: 'specialization',
      select: 'nameFrench',
  })
    if (!doctor) {
      return res.status(404).json({
        code: 404,
        status: true,
        message: "doctors not found",
        data: []
      });
    }

    // Respond with the doctor's name and specialization
    return res.status(200).json({
      code: 200,
      status: true,
      message: "doctor retrieved successfully",
      data: doctor
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      message: 'Internal server error.',
      data: []
    });
  }
}

async function getProfileDoctorShowUser(req, res) {
  try {
    // Get the doctor's ID from the authenticated token
    const doctorId = req.params.doctorId;
    const language = req.headers['language'];
    // Find the doctor in the database by ID and select the name and specialization fields
    const doctor = await Doctor.findById(doctorId)
      .select('nameArabic nameEnglish location phone  clinicName bio address schedule bookingByUser')
    // .populate({
    //   path: 'specialization',
    //   select: 'nameArabic nameEnglish nameFrench imagePath ',
    // });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    let name;
    switch (language) {
      case 'ar':
        name = doctor.nameArabic;
        break;
      case 'fr':
        name = doctor.nameEnglish;
        break;
      case 'en':
      default:
        name = doctor.nameEnglish;
        break;
    }

    isDoctorOpen = false
    closingTime = 00
    // Get the current date and time
    const today = new Date();

    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    const doctorSchedule = doctor.schedule;
    // Check if the doctor is open on the current day


    const currentTime = new Date();

    // Extract hours and minutes from the current time
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);

    if (currentDaySchedule) {
      const [clinicClosingHours, clinicClosingMinutes] = currentDaySchedule.clinicHours.clinicClosingTime.split(':');
      const [clinicOpeningHours, clinicOpeningMinutes] = currentDaySchedule.clinicHours.clinicOpeningTime.split(':');

      // Convert all values to minutes for easier comparison
      const clinicClosingTimeInMinutes = parseInt(clinicClosingHours) * 60 + parseInt(clinicClosingMinutes);
      const clinicOpeningTimeInMinutes = parseInt(clinicOpeningHours) * 60 + parseInt(clinicOpeningMinutes);
      if (currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes) {
        isDoctorOpen = true
        closingTime = currentDaySchedule.clinicHours.clinicClosingTime
      } else {
        isDoctorOpen = false
      }
    } else {
      isDoctorOpen = false
    }


    const doctorData = {
      id: doctor._id,
      name,
      phone: doctor.phone,
      clinicName: doctor.clinicName,
      bio: doctor.bio,
      address: doctor.address,
      location: doctor.location,
      schedule: doctor.schedule,
      isOpen: isDoctorOpen,
      bookingByUser: doctor.bookingByUser,
      closingTime
    }

    // Respond with the doctor's name and specialization
    return res.status(200).json({
      message: 'data retrived successfully',
      data: doctorData,
      status: true,
      code: 200
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500
    });
  }
}

async function getProfileDoctorLikeUser(req, res) {
  try {
    // console.log(req.doctor,"ddddddddfddddddddddd")
    // Get the doctor's ID from the authenticated token
    const  doctorId  = req.doctor._id;
    const language = req.headers['language'];
    // Find the doctor in the database by ID and select the name and specialization fields
    const doctor = await Doctor.findById(doctorId)
      .select('nameArabic nameEnglish location phone  clinicName bio address schedule bookingByUser')
      // console.log(doctor,"fddddddddddddd")
    // .populate({
    //   path: 'specialization',
    //   select: 'nameArabic nameEnglish nameFrench imagePath ',
    // });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    let name;
    switch (language) {
      case 'ar':
        name = doctor.nameArabic;
        break;
      case 'fr':
        name = doctor.nameEnglish;
        break;
      case 'en':
      default:
        name = doctor.nameEnglish;
        break;
    }

    isDoctorOpen = false
    closingTime = 00
    // Get the current date and time
    const today = new Date();

    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    const doctorSchedule = doctor.schedule;
    // Check if the doctor is open on the current day


    const currentTime = new Date();

    // Extract hours and minutes from the current time
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);

    if (currentDaySchedule) {
      const [clinicClosingHours, clinicClosingMinutes] = currentDaySchedule.clinicHours.clinicClosingTime.split(':');
      const [clinicOpeningHours, clinicOpeningMinutes] = currentDaySchedule.clinicHours.clinicOpeningTime.split(':');

      // Convert all values to minutes for easier comparison
      const clinicClosingTimeInMinutes = parseInt(clinicClosingHours) * 60 + parseInt(clinicClosingMinutes);
      const clinicOpeningTimeInMinutes = parseInt(clinicOpeningHours) * 60 + parseInt(clinicOpeningMinutes);
      if (currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes) {
        isDoctorOpen = true
        closingTime = currentDaySchedule.clinicHours.clinicClosingTime
      } else {
        isDoctorOpen = false
      }
    } else {
      isDoctorOpen = false
    }


    const doctorData = {
      id: doctor._id,
      name,
      phone: doctor.phone,
      clinicName: doctor.clinicName,
      bio: doctor.bio,
      address: doctor.address,
      location: doctor.location,
      schedule: doctor.schedule,
      isOpen: isDoctorOpen,
      bookingByUser: doctor.bookingByUser,
      closingTime
    }

    // Respond with the doctor's name and specialization
    return res.status(200).json({
      message: 'data retrived successfully',
      data: doctorData,
      status: true,
      code: 200
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500
    });
  }
}


async function getAllDoctors(req, res) {
  try {
    const doctors = await Doctor.find({}, 'name priceOfExamination').sort({ name: 1 });

    if (doctors.length === 0) {
      return res.json({ message: 'No doctors found' });
    }

    return res.json(doctors);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function serachForDoctor(req, res) {
  try {
    const { name, specialization, state, municipality } = req.query;
    const language = req.headers['language'];
    const query = {
    };
    //   isConfirmed: true, // Filter only confirmed doctors

    if (name) {
      query.$or = [
        { 'nameFrance': { $regex: name, $options: 'i' } },
        { 'nameArabic': { $regex: name, $options: 'i' } },
        { 'nameEnglish': { $regex: name, $options: 'i' } },
      ];
    }

    if (specialization) {
      query.specialization = specialization;
    }

    if (state && municipality) {
      query['state.mattricule'] = state;
      query['municipality.code'] = municipality;
    } else {
      if (state) {
        query['state.mattricule'] = state;
      }

      if (municipality) {
        query['municipality.code'] = municipality;
      }
    }

    const projection = {
      password: 0, // Exclude the password field
      bookedPatients: 0,
      priceOfExamination: 0,
      email: 0,
      isConfirmed: 0,
      isDoctor: 0 // Exclude other fields as necessary
    };

    const doctors = await Doctor.find(query, projection);

    if (doctors.length === 0) {
      return res.status(200).json({
        message: 'No doctors founded',
        data: [],
        status: true,
        code: 200
      });
    }

    // Map the response based on the requested language
    const formattedDoctors = doctors.map(doctor => {
      return {
        id: doctor._id,
        location: doctor.location,
        name: language === 'ar' ? doctor.nameArabic : doctor.nameEnglish,

        // Include other fields as necessary
      };
    });

    return res.status(200).json({
      message: "Doctors retrieved successfully",
      data: formattedDoctors,
      status: true,
      code: 200
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500
    });
  }
}


async function getDoctorsNearMe(req, res) {
  try {
    const { lat, lng, specialization } = req.body;
    const language = req.headers['language'];

    if (!lat || !lng || !specialization) {
      return res.status(400).json({
        message: 'Latitude, longitude, and specialization are required.',
        data: [],
        status: false,
        code: 400
      });
    }

    // Search for doctors within a 5km radius
    const doctors = await Doctor.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: 5000, // 5km in meters
        },
      },
      specialization,
      isConfirmed: true
    });

    if (doctors.length === 0) {
      return res.status(200).json({
        message: 'No doctors found near this location.',
        data: [],
        status: true,
        code: 200
      });
    }

    // Calculate the distance of each doctor from the specified location
    const doctorsWithDistance = doctors.map(doctor => {
      const distance = geolib.getDistance(
        { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        { latitude: doctor.location.lat, longitude: doctor.location.lng }
      );

      let name, stateName, municipalityName;
      switch (language) {
        case 'ar':
          name = doctor.nameArabic;
          stateName = doctor.state.name_ar;
          municipalityName = doctor.municipality.name_ar;
          break;
        case 'fr':
          name = doctor.nameEnglish;
          stateName = doctor.state.name; // Assuming you have name_fr in state
          municipalityName = doctor.municipality.name; // Assuming you have name_fr in municipality
          break;
        case 'en':
        default:
          name = doctor.nameEnglish;
          stateName = doctor.state.name_en;
          municipalityName = doctor.municipality.name_en;
          break;
      }

      return {
        _id: doctor._id,
        name: name,
        location: doctor.location,
        state: { name: stateName },
        municipality: { name: municipalityName },
        distance: (distance / 1000).toFixed(1), // Convert distance to kilometers
      };
    });

    return res.status(200).json({
      message: "Doctors retrieved successfully",
      data: doctorsWithDistance,
      status: true,
      code: 200
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error.',
      data: [],
      status: false,
      code: 500
    });
  }
}



async function editProfileDoctor(req, res) {
  try {

    const doctorId = req.doctor._id;
    if (!doctorId) {
      return res.status(400).json({ message: 'doctorId is required', status: false, data:[], code:500 })
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found', status: false, data:[], code:404 });
    }

    const updates = req.body;


    // Check if the updated phone number conflicts with other doctors
    // if (updates.phone) {
    //   const existingDoctor = await Doctor.findOne({ phone: updates.phone, _id: { $ne: doctor._id } });
    //   if (existingDoctor) {
    //     return res.status(409).json({ message: 'Phone number is already registered' });
    //   }
    // }

    // if (updates.email) {
    //   const existingDoctor = await Doctor.findOne({ email: updates.email, _id: { $ne: doctor._id } });
    //   if (existingDoctor) {
    //     return res.status(409).json({ message: 'Email is already registered' });
    //   }
    // }

    // if (updates.password) {
    //   const salt = await bcrypt.genSalt(10);
    //   updates.password = await bcrypt.hash(updates.password, salt);
    // }

    for (const key in updates) {
      if (doctor[key] !== undefined) {
        doctor[key] = updates[key];
      }
    }

    await doctor.save();

    return res.status(200).json({ message: 'Doctor profile updated successfully', status: true, data:[], code:200 });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', status: false, data:[], code:500 });
  }
}

// async function addAssistantDoctor(req, res) {
//   try {

//     const { error } = validateAssitantDoctor(req.body);
//     if (error) return res.status(400).json({
//       message: error.details[0].message
//     });

//     let assistantCheck = await Assistant.findOne({ name: req.body.name });

//     if (assistantCheck) {
//       return res.status(409).json({ message: 'Assistant already registered' });
//     }

//     const registeredByDoctor = req.doctor._id;

//     // console.log('pl')
//     const { name, password, examControl, bookControl } = req.body;


//     // Check if the doctor exists
//     const doctor = await Doctor.findById(registeredByDoctor);
//     if (!doctor) {
//       return res.status(404).json({ message: 'Doctor not found' });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create and save the assistant
//     const assistant = new Assistant({
//       name,
//       password: hashedPassword,
//       registeredByDoctor,
//       examControl,
//       bookControl
//     });
//     await assistant.save();

//     // Associate the assistant with the doctor
//     // doctor.assistants.push(assistant._id);
//     // await doctor.save();

//     return res.status(201).json({ message: 'Assistant registered successfully' });
//   } catch (error) {
//     console.log(error)
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// }

// async function getAllAssitantForDoctor(req, res) {
//   try {
//     const doctorId = req.doctor._id;

//     if (!doctorId) {
//       return res.status(400).json({ message: "doctorId is required" })
//     }
//     // Find all assistants registered by the specified doctor
//     const assistants = await Assistant.find({ registeredByDoctor: doctorId });

//     if (assistants.length === 0) {
//       return res.status(404).json({ message: 'No assistants found for the specified doctor' });
//     }

//     return res.status(200).json(assistants);
//   } catch (error) {
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// }

// async function deleteAssistantForDoctor(req, res) {
//   try {
//     const doctorId = req.doctor._id;
//     if (!doctorId) {
//       return res.status(400).json({ message: "doctorId is required" })
//     }

//     const assistantId = req.params.assistantId;

//     if (!assistantId) {
//       return res.status(400).json({ message: "assistantId is required" })
//     }
//     // const assistantId = req.params.assistantId;

//     // Find the assistant by its ID and the doctor's ID
//     const assistant = await Assistant.findOne({ _id: assistantId, registeredByDoctor: doctorId });

//     if (!assistant) {
//       return res.status(404).json({ message: 'Assistant not found' });
//     }

//     // Delete the assistant
//     await Assistant.findByIdAndRemove(assistantId);

//     return res.status(200).json({ message: 'Assistant deleted successfully' });
//   } catch (error) {
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// }


module.exports = {
  createDoctor,
  getAllDoctors,
  serachForDoctor,
  editProfileDoctor,
  // addAssistantDoctor,
  // getAllAssitantForDoctor,
  // deleteAssistantForDoctor,

  getProfileDoctor,
  getDoctorsNearMe,
  getProfileDoctorShowUser,
  getProfileDoctorLikeUser
}
