const { Laboratory, validateLaboratory } = require("../../models/laboratories/laboratory");
const _ = require('lodash')
const bcrypt = require('bcryptjs')
const geolib = require('geolib');



async function createLaboratory(req, res) {
  try {
    // Validate the request body
    const { error } = validateLaboratory(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if a laboratory with the same phone number or email already exists
    let laboratory = await Laboratory.findOne({ $or: [{ email: req.body.email }, { phone: req.body.phone }] });
    if (laboratory) {
      return res.status(409).json({ message: 'Laboratory already registered with this email or phone number' });
    }

    // Create a new laboratory object
    laboratory = new Laboratory(_.pick(req.body, [
      'name',
  
      'isLaboratory',
      'password',
      'phone',
      'email',
      'municipality',
      'state',
      'labNameEnglish',
      'labNameArabic',
      'location',
      'registrationNumber',
    ]));

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    laboratory.password = await bcrypt.hash(laboratory.password, salt);

    // Save the laboratory to the database
    await laboratory.save();

    // Generate an authentication token

    // Respond with the laboratory details and token
    return res.status(201).json({ message: 'Laboratory created successfully' });
  } catch (error) {
    // Handle errors
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getLaboratoryProfile(req, res) {
  try {
    const labId = req.laboratory._id;

    // Find the laboratory by ID from the decoded token
    const laboratory = await Laboratory.findById(labId).select('name labNameEnglish labNameArabic -_id');

    if (!laboratory) {
      return res.status(404).json({ message: 'Laboratory not found.' });
    }

    return res.status(200).json(laboratory);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function serachForLaboratory(req, res) {
  try {
    const { state, municipality, labName } = req.query;
    const language = req.headers['language'];

    const query = {
      isConfirmed: true, // Filter only confirmed laboratories
    };

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

    if (labName) {
      query.$or = [
        { 'labNameArabic': { $regex: labName, $options: 'i' } },
        { 'labNameEnglish': { $regex: labName, $options: 'i' } },
        
      ];
    }

    const projection = {
      password: 0, // Exclude the password field
      email: 0,
      isConfirmed: 0,
      isLaboratory: 0,
      registrationNumber: 0 // Exclude other fields as necessary
    };

    const laboratories = await Laboratory.find(query, projection);

    if (laboratories.length === 0) {
      return res.status(200).json({
        data: [],
        message: 'No laboratories found',
        code: 200,
        status: true
      });
    }

    // Map the response based on the requested language
    const formattedLaboratories = laboratories.map(lab => {
      let labName;
      switch (language) {
        case 'ar':
          labName = lab.labNameArabic;
          break;
        case 'fr':
          labName = lab.labNameEnglish;
          break;
        case 'en':
        default:
          labName = lab.labNameEnglish;
          break;
      }

      return {
        _id: lab._id,
        labName: labName,
        location: lab.location
        // Include other fields as necessary
      };
    });

    return res.status(200).json({
      data: formattedLaboratories,
      message: "Laboratories retrieved successfully",
      code: 200,
      status: true
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      data: [],
      message: 'Internal server error',
      code: 500,
      status: false
    });
  }
}

async function getLaboratoriesNearMe(req, res) {
  try {
    const { lat, lng } = req.body;
    const language = req.headers['language'];

    if (!lat || !lng) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: 'Latitude and longitude are required.',
        data: []
      });
    }

    // Search for laboratories within a 5km radius
    const laboratories = await Laboratory.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: 5000, // 5km in meters
        },
      },
      isConfirmed: true
    });

    if (laboratories.length === 0) {
      return res.status(200).json({
        code: 200,
        status: true,
        message: 'No laboratories found near this location.',
        data: []
      });
    }

    // Calculate the distance of each laboratory from the specified location
    const laboratoriesWithDistance = laboratories.map(laboratory => {
      const distance = geolib.getDistance(
        { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        { latitude: laboratory.location.lat, longitude: laboratory.location.lng }
      );

      let labName, stateName, municipalityName;
      switch (language) {
        case 'ar':
          labName = laboratory.labNameArabic;
          stateName = laboratory.state.name_ar;
          municipalityName = laboratory.municipality.name_ar;
          break;
        case 'en':
        case 'fr':
        default:
          labName = laboratory.labNameEnglish;
          stateName = laboratory.state.name_en;
          municipalityName = laboratory.municipality.name_en;
          break;
      }

      return {
        _id: laboratory._id,
        labName: labName,
        location: laboratory.location,
        state: stateName,
        municipality:  municipalityName ,
        distance: (distance / 1000).toFixed(1), // Convert distance to kilometers
      };
    });

    return res.status(200).json({
      code: 200,
      status: true,
      message: "Laboratories retrieved successfully",
      data: laboratoriesWithDistance
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      status: false,
      message: 'Internal server error.',
      data: []
    });
  }
}


async function getLaboratoryProfileForUser(req, res){
  try {
      const labId = req.params.id;
      const language = req.headers['language'];

      const laboratory = await Laboratory.findById(labId);

      if (!laboratory) {
          return res.status(200).json({
              code: 200,
              status: true,
              message: 'Laboratory not found.',
              data: []
          });
      }

      let labName;
      switch (language) {
          case 'ar':
              labName = laboratory.labNameArabic;

              break;
          case 'en':
          case 'fr':
          default:
              labName = laboratory.labNameEnglish;

              break;
      }

      const responseData = {
          phone: laboratory.phone,
          labName: labName,
          openTime: laboratory.openTime,
          closeTime: laboratory.closeTime,
          location: laboratory.location,
          goHome: laboratory.goHome,
          address: laboratory.address
      };

      return res.status(200).json({
          code: 200,
          status: true,
          message: "Laboratory profile retrieved successfully",
          data: responseData
      });
  } catch (error) {
      console.error(error);
      return res.status(500).json({
          code: 500,
          status: false,
          message: 'Internal server error.',
          data: []
      });
  }
}

module.exports = {
  createLaboratory,
  getLaboratoryProfile,
  serachForLaboratory,
  getLaboratoriesNearMe,
  getLaboratoryProfileForUser
}