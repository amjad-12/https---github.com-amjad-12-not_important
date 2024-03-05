const { User, validateUser } = require('../../models/users/user');
const { BloodDonor, validateBloodDonor } = require('../../models/services/bloodDonor');
const { getWilayaByCode,getBaladyiatsForWilaya  } = require('@dzcode-io/leblad');
const _ = require('lodash')

// if (req.body.state) {
//     req.body.state = JSON.parse(req.body.state);
// }
// if (req.body.municipality) {
//     req.body.municipality = JSON.parse(req.body.municipality);
// }
async function registerAsBloodDonor(req, res) {
    try {
        const { error } = validateBloodDonor(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
                status: false,
                message: error.details[0].message,
                data: []
            });
        }
        
        const existingDonor = await BloodDonor.findOne({ phone: req.body.phone });
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

        if (!user.registeredServices.some(service => service.serviceName === 'BloodDonor')) {
            const bloodDonorData = _.pick(req.body, [
                'firstName',
                'lastName',
                'phone',
                'isConfirmed',
                'isActive',
                'bloodType',
            ]);

            bloodDonorData.state = state
            bloodDonorData.municipality = municipality
            

            if (req.file) {
                bloodDonorData.personalIdentificationImage = req.file.filename;
            }

            bloodDonorData.userId = user._id;
            const bloodDonor = new BloodDonor(bloodDonorData);
            await bloodDonor.save();

            user.registeredServices.push({
                service: bloodDonor._id,
                serviceName: 'BloodDonor',
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
                message: 'User is already registered as a Blood Donor',
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


async function searchForBloodDonors(req, res) {
    try {
        const { municipality, state, bloodType } = req.body;
        const language = req.headers['language'];

        const allowedBloodTypes = ['A+', 'A-', 'AB-', 'AB+', 'O+', 'O-', 'B-', 'B+'];
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

        if (bloodType) {
            if (!allowedBloodTypes.includes(bloodType)) {
                return res.status(400).json({
                    code: 400,
                    status: false,
                    message: 'Invalid blood type',
                    data: []
                });
            }
            query.bloodType = bloodType;
        }

        const bloodDonors = await BloodDonor.find(query).select('firstName lastName municipality state phone');

        if (bloodDonors.length === 0) {
            return res.status(200).json({
                code: 200,
                status: true,
                message: 'No blood donors found',
                data: []
            });
        }

        // Map the response based on the requested language
        const formattedBloodDonors = bloodDonors.map(donor => {
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
            data: formattedBloodDonors
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
    registerAsBloodDonor,
    searchForBloodDonors
};

