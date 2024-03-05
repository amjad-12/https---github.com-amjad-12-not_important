const { User, validateUser } = require('../../models/users/user');
const { BloodDonor, validateBloodDonor } = require('../../models/services/bloodDonor');
const { AmbulanceDriver, validateAmbulanceDriver } = require('../../models/services/ambulanceDriver');
const { getWilayaByCode,getBaladyiatsForWilaya  } = require('@dzcode-io/leblad');
// async function  getMyRegisteredServices(req, res) {
//     try {
//         const userId = req.user._id
//         const user = await User.findById(userId)
//              // Assuming 'serviceName' is the field you want to retrieve

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }


//         const services = user.registeredServices.map(service => ({
//             serviceId: service.service,
//             serviceName: service.serviceName,
//         }));

//         return res.status(200).json({ services });
//     } catch (ex) {
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// }


async function getMyRegisteredServices(req, res) {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ code: 404, data: [], status: false , message: 'User not found'  });
        }

        const servicesData = [];

        for (const service of user.registeredServices) {
            const serviceName = service.serviceName;
            const userProfileRes = await getMyProfileServiceInternal(userId, serviceName);
            console.log(userProfileRes)
            if (userProfileRes.code === 200) {
                servicesData.push({
                    serviceName,
                    serviceId: service.service,
                    isConfirmed: userProfileRes.data.isConfirmed, // Assuming firstName is available in userProfile
                    isActive: userProfileRes.data.isActive
                });
            }
        }


        return res.status(200).json({
            code: 200,
            status: true,
            message: 'services retrived successfully',
            data: servicesData
        });
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

async function getMyProfileServiceInternal(userId, serviceName) {
    try {
        const user = await User.findById(userId);

        // if (!user) {
        //     return res.status(404).json({ code: 404, data: null, status: false , message: 'User not found'  });
        // }

        const serviceData = user.registeredServices.find(service =>
            service.serviceName.trim().toLowerCase() === serviceName.trim().toLowerCase()
        );

        // if (!serviceData) {
        //     return res.status(404).json({ status: false, data: null, message: `User is not registered in the ${serviceName} service`, code: 404 });
        // }

        let userProfile;



        switch (serviceName) {
            case 'BloodDonor':
                userProfile = await BloodDonor.findById(serviceData.service._id).select('isActive isConfirmed');
                break;
            case 'ambulance':
                userProfile = await AmbulanceDriver.findById(serviceData.service._id).select('isActive isConfirmed');
                break;
            default:
                return {  code: 404, data: [], status: false , message: 'Invalid service name' };
        }

        return { status: true, data: userProfile , message: 'data retrived successfully', code: 200 };
    } catch (ex) {
        console.error(ex);
        return res.status(500).json({ status: 500, data: { message: 'Internal server error' } });
    }
}

async function getMyProfileService(req, res) {
    try {
        const { serviceName } = req.params;
        const userId = req.user._id
        const language = req.headers['language'];

        const user = await User.findById(userId)
        // .populate({
        //     path: 'registeredServices.service',
        //     match: { serviceName }, // Filter services by serviceName
        // });

        if (!user) {
            return res.status(404).json({ code: 404, data: [], status: false , message: 'User not found'  });
        }


        const serviceData = user.registeredServices.find(service =>
            service.serviceName.trim().toLowerCase() === serviceName.trim().toLowerCase()
        );


        if (!serviceData) {
            
            return res.status(200).json({ status: true, data: [], message: `User is not registered in the ${serviceName} service`, code: 200 });
        }

        let userProfile;

        // Handle each service type individually
        switch (serviceName) {
            case 'BloodDonor':
                userProfile = await BloodDonor.findById(serviceData.service._id).select('firstName lastName state municipality phone email isActive bloodType');
                break;
            case 'ambulance':
                userProfile = await AmbulanceDriver.findById(serviceData.service._id).select('firstName lastName state municipality phone email isActive bloodType');
                break;
            // Add cases for other service types as needed
            // case 'OtherServiceType':
            //     userProfile = await OtherServiceType.findById(serviceData.service._id);
            //     break;
            default:
                return res.status(200).json({ status: true, data: [], message: `User is not registered in the ${serviceName} service`, code: 200 });
        }


        // Filter state and municipality based on the requested language
        let filteredUserProfile = userProfile.toObject(); // Convert Mongoose document to plain JavaScript object

        switch (language) {
            case 'ar':
                filteredUserProfile.state = filteredUserProfile.state.name_ar;
                filteredUserProfile.municipality = filteredUserProfile.municipality.name_ar;
                break;
            case 'fr':
                filteredUserProfile.state = filteredUserProfile.state.name;
                filteredUserProfile.municipality = filteredUserProfile.municipality.name;
                break;
            case 'en':
            default:
                filteredUserProfile.state = filteredUserProfile.state.name_en;
                filteredUserProfile.municipality = filteredUserProfile.municipality.name_en;
                break;
        }

        if (serviceName === 'BloodDonor') {
            return res.status(200).json({  code: 200, data:{ serviceName, 
                id: filteredUserProfile._id,
                firstName: filteredUserProfile.firstName,
                lastName: filteredUserProfile.lastName,
                isActive: filteredUserProfile.isActive,
                bloodType: filteredUserProfile.bloodType,
                phone: filteredUserProfile.phone,
                municipality: filteredUserProfile.municipality,
                state: filteredUserProfile.state,  }, status: true ,message:'data retrived successfully'  });
        } else if (serviceName === 'ambulance') {
            return res.status(200).json({  code: 200, data:{ serviceName, 
                id: filteredUserProfile._id,
                firstName: filteredUserProfile.firstName,
                lastName: filteredUserProfile.lastName,
                isActive: filteredUserProfile.isActive,
                phone: filteredUserProfile.phone,
                municipality: filteredUserProfile.municipality,
                state: filteredUserProfile.state,  }, status: true ,message:'data retrived successfully'  });
        }
        // return res.status(200).json({ userProfile });
    } catch (ex) {
        return res.status(500).json({
            code: 500,
            status: false,
            message: 'Internal server error',
            data: []
        });;
    }
}

async function toggleStatusOfProfileService(req, res) {
    try {
        const { serviceName } = req.params;
        const userId = req.user._id
        const language = req.headers['language'];
        const user = await User.findById(userId)
        // .populate({
        //     path: 'registeredServices.service',
        //     match: { serviceName }, // Filter services by serviceName
        // });

        if (!user) {
            return res.status(404).json({ code: 404, data: [], status: false , message: 'User not found'  });
        }


        const serviceData = user.registeredServices.find(service =>
            service.serviceName.trim().toLowerCase() === serviceName.trim().toLowerCase()
        );


        if (!serviceData) {
            return res.status(404).json({ status: false, data: [], message: `User is not registered in the ${serviceName} service`, code: 404 });
        }

        let userProfile;

        // Handle each service type individually
        switch (serviceName) {
            case 'BloodDonor':
                userProfile = await BloodDonor.findById(serviceData.service._id);
                userProfile.isActive = !userProfile.isActive
                await userProfile.save()
                break;
            case 'ambulance':
                userProfile = await AmbulanceDriver.findById(serviceData.service._id);
                userProfile.isActive = !userProfile.isActive
                await userProfile.save()
                break;
            // Add cases for other service types as needed
            // case 'OtherServiceType':
            //     userProfile = await OtherServiceType.findById(serviceData.service._id);
            //     break;
            default:
                return res.status(404).json({ status: false, data: [] , code: 404, message: `invalid ${serviceName}` });
        }

        let filteredUserProfile = userProfile.toObject(); // Convert Mongoose document to plain JavaScript object

        switch (language) {
            case 'ar':
                filteredUserProfile.state = filteredUserProfile.state.name_ar;
                filteredUserProfile.municipality = filteredUserProfile.municipality.name_ar;
                break;
            case 'fr':
                filteredUserProfile.state = filteredUserProfile.state.name;
                filteredUserProfile.municipality = filteredUserProfile.municipality.name;
                break;
            case 'en':
            default:
                filteredUserProfile.state = filteredUserProfile.state.name_en;
                filteredUserProfile.municipality = filteredUserProfile.municipality.name_en;
                break;
        }

        return res.status(200).json({ data: filteredUserProfile , status: false , message:'data retrived successfully', code: 200 });
    } catch (ex) {
        return res.status(500).json({
            code: 500,
            status: false,
            message: 'Internal server error',
            data: []
        });
    }
}

async function deleteServiceOfRegister(req, res) {
    try {
        const userId = req.user._id; // Assuming user ID is available in request
        const { serviceId } = req.params;

        // Find the user
        const user = await User.findById(userId);

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found',data: [], status: false, code:404  });
        }

        // Find the service entry in the registeredServices array
        const serviceIndex = user.registeredServices.findIndex(service => service.id.toString() === serviceId);


        // Check if the service is registered
        if (serviceIndex === -1) {
            return res.status(404).json({ message: 'Service not found in registered services',data: [], status: false, code:404 });
        }

        // Get the serviceName to determine which model to use
        const serviceName = user.registeredServices[serviceIndex].serviceName;
        const serviceIdInServiceCollection = user.registeredServices[serviceIndex].service;

        // Remove the service from the registeredServices array
        user.registeredServices.splice(serviceIndex, 1);

        // Save the user after removing the service
        await user.save();

        // Delete the service from its respective collection
        switch (serviceName) {
            case 'BloodDonor':
                await BloodDonor.findByIdAndDelete(serviceIdInServiceCollection);
                break;
            case 'ambulance':
                await AmbulanceDriver.findByIdAndDelete(serviceIdInServiceCollection);
                break;
            // Add other cases for additional services as needed
            default:
                return res.status(400).json({ message: 'Invalid service name',data: [], status: false, code:400  });
        }

        return res.status(200).json({ message: 'Service deleted successfully',data: [], status: true, code:200  });
    } catch (error) {
        console.error('Error deleting service:', error);
        return res.status(500).json({ message: 'Internal server error', data: [], status: false, code:500  });
    }
}

async function editMyServiceStateAndMunicipality(req, res) {
    try {
        const { serviceId } = req.params;
        const language = req.headers['language'];

        if (!req.body.state) {
            return res.status(404).json({status: false, data: [] , code: 404,  message: 'State is required' });
        }

        if (!req.body.municipality) {
            return res.status(404).json({status: false, data: [] , code: 404,  message: 'Municipality is required' });
        }

        const userId = req.user._id
        const user = await User.findById(userId)


        if (!user) {
            return res.status(404).json({status: false, data: [] , code: 404,  message: 'User not found' });
        }

        const serviceData = user.registeredServices.find(service =>
            service.service.toString() === serviceId
        );

        if (!serviceData) {
            return res.status(404).json({status: false, data: [] , code: 404,  message: `User is not registered in the service` });
        }

        let userProfileService
        let serviceName = serviceData.serviceName
        console.log(serviceName)

        switch (serviceName) {
            case 'BloodDonor':
                userProfileService = await BloodDonor.findById(serviceData.service._id).select('-personalIdentificationImage -isConfirmed');    
                break;
            case 'ambulance':
                userProfileService = await AmbulanceDriver.findById(serviceData.service._id).select('-personalIdentificationImage -isConfirmed');    
                break;
            // Add cases for other service types as needed
            // case 'OtherServiceType':
            //     userProfile = await OtherServiceType.findById(serviceData.service._id);
            //     break;
            default:
                return res.status(400).json({status: false, data: [] , code: 404,  message: 'Invalid service name' });
        }

        if (!userProfileService) {
            return res.status(400).json({status: false, data: [] , code: 404,  message: 'The service details not stored' });
        }


        
    
        const stateMattricule = parseInt(req.body.state)
        const municipalityCode = parseInt(req.body.municipality)

        const stateData = getWilayaByCode(stateMattricule)
        
        if (!stateData) {
            return res.status(404).json({status: false, data: [] , code: 404,  message: `State is not correct` });
        }

        const municipalityData = getBaladyiatsForWilaya(stateMattricule)

        if (!municipalityData) {
            return res.status(404).json({status: false, data: [] , code: 404,  message: `Municipality is not correct` });
        }


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

        userProfileService.state = state;
        userProfileService.municipality = municipality;

        userProfileService.save()

        let filteredUserProfile = userProfileService.toObject(); // Convert Mongoose document to plain JavaScript object

        switch (language) {
            case 'ar':
                filteredUserProfile.state = filteredUserProfile.state.name_ar;
                filteredUserProfile.municipality = filteredUserProfile.municipality.name_ar;
                break;
            case 'fr':
                filteredUserProfile.state = filteredUserProfile.state.name;
                filteredUserProfile.municipality = filteredUserProfile.municipality.name;
                break;
            case 'en':
            default:
                filteredUserProfile.state = filteredUserProfile.state.name_en;
                filteredUserProfile.municipality = filteredUserProfile.municipality.name_en;
                break;
        }



        return res.status(200).json({ data: {filteredUserProfile, serviceName: serviceData?.serviceName}, status: false , message:'data retrived successfully', code: 200 });


    } catch (ex) {
        return res.status(500).json({
            code: 500,
            status: false,
            message: 'Internal server error',
            data: []
        });
    }
}


module.exports = {
    getMyRegisteredServices,
    getMyProfileService,
    toggleStatusOfProfileService,
    editMyServiceStateAndMunicipality,
    deleteServiceOfRegister
}