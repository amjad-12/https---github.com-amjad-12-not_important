const { User, validateUser } = require('../../models/users/user');
const { AmbulanceDriver, validateAmbulanceDriver } = require('../../models/services/ambulanceDriver');
const { getWilayaByCode,getBaladyiatsForWilaya  } = require('@dzcode-io/leblad');
const _ = require('lodash')

// if (req.body.state) {
//     req.body.state = JSON.parse(req.body.state);
// }
// if (req.body.municipality) {
//     req.body.municipality = JSON.parse(req.body.municipality);
// }
async function registerAsAmbulanceDriver(req, res) {
    try {
        const { error } = validateAmbulanceDriver(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: error.details[0].message,
                data: []
            });
        }
        
        const existingDonor = await AmbulanceDriver.findOne({ phone: req.body.phone });
        if (existingDonor) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: 'Phone number already registered',
                data: []
            });
        }


        const userId = req.user._id;
        const user = await User.findById(userId);

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


        if (!user) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: 'User not found',
                data: []
            });
        }

        if (!user.registeredServices.some(service => service.serviceName === 'ambulance')) {
            const ambulanceDriverData = _.pick(req.body, [
                'firstName',
                'lastName',
                'phone',
                'isConfirmed',
                'isActive',
                'bloodType',
            ]);

            ambulanceDriverData.state = state
            ambulanceDriverData.municipality = municipality
            

            if (req.file) {
                ambulanceDriverData.personalIdentificationImage = req.file.filename;
            }

            ambulanceDriverData.userId = user._id;
            const ambulance = new AmbulanceDriver(ambulanceDriverData);
            await ambulance.save();

            user.registeredServices.push({
                service: ambulance._id,
                serviceName: 'ambulance',
            });
            await user.save();

            return res.status(201).json({
                code: 201,
                status: true,
                message: 'Thanks for your registration please wait until approve your service by admin',
                data: []
            });
        } else {
            return res.status(400).json({
                code: 400,
                status: false,
                message: 'User is already registered as a Ambulance driver',
                data: []
            });
        }
    } catch (ex) {
        console.error(ex);
        return res.status(500).json({
            code: 500,
            status: false,
            message: 'Internal server error',
            data: []
        });
    }
}


async function searchForAmbulanceDrivers(req, res) {
    try {
        const { municipality, state } = req.body;
        const language = req.headers['language'];

        const query = {
            isActive: true,
            isConfirmed: true // Filter only active blood donors
        };

        if (state) {
            query['state.mattricule'] = state;
        }

        if (municipality) {
            query['municipality.code'] = municipality;
        }

       

        const ambulanceDrivers = await AmbulanceDriver.find(query).select('firstName lastName municipality state phone');


        if (ambulanceDrivers.length === 0) {
            return res.status(404).json({
                code: 404,
                status: false,
                message: 'No Ambulance Driver found',
                data: []
            });
        }

        // Map the response based on the requested language
        const formattedAmbulanceDrivers = ambulanceDrivers.map(donor => {
            return {
                firstName: donor.firstName,
                lastName: donor.lastName,
                phone: donor.phone,
                // state: {

                //     name: language === 'ar' ? donor.state.name_ar : (language === 'en' ? donor.state.name_en : donor.state.name),
                // },
                // municipality: {

                //     name: language === 'ar' ? donor.municipality.name_ar : (language === 'en' ? donor.municipality.name_en : donor.municipality.name),
                // }
            };
        });

        return res.status(200).json({
            code: 200,
            status: true,
            message: 'Blood donors retrieved successfully',
            data: formattedAmbulanceDrivers
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            status: false,
            message: 'Internal server error',
            data: []
        });
    }
}



module.exports = {
    registerAsAmbulanceDriver,
    searchForAmbulanceDrivers
};

