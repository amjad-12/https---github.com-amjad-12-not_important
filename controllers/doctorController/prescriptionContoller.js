const { Prescription, validatePrescription, validatePrescriptionManual } = require("../../models/doctors/prescription")
const { Doctor } = require("../../models/doctors/doctor")
const { User } = require('../../models/users/user')

async function createPrescription(req, res) {
    try {

        const { patient, medications, patientInfo } = req.body;
        const doctor = req.doctor._id;
        console.log(medications)
        // Find the patient and doctor to get their additional information
        if (patient) {

            const { error } = validatePrescription(req.body)
            console.log(error)

            if (error) {
                return res.status(400).json({ message: error.details[0].message })
            }

            const doctorInfo = await Doctor.findById(doctor, 'name phone');
            if (!doctorInfo) {
                return res.status(404).json({ message: 'Doctor not found' });
            }

            const patientInfo = await User.findById(patient, 'first_name last_name age gender');
            if (!patientInfo) {
                return res.status(404).json({ message: 'Patient not found' });
            }

            // Create a new prescription
            const prescription = new Prescription({
                doctor,
                patient,
                doctorInfo: {
                    name: doctorInfo.name,
                    phone: doctorInfo.phone,
                },
                patientInfo: {
                    first_name: patientInfo.first_name,
                    last_name: patientInfo.last_name,
                    // phone: patientInfo.phone,
                    age: patientInfo.age,
                    gender: patientInfo.gender
                },
                // patientSituation,
                medications,
            });

            await prescription.save();

            return res.status(201).json({ message: 'Prescription created successfully' });
        } else {
            
            const { error } = validatePrescriptionManual(req.body)

            if (error) {
                return res.status(400).json({ message: error.details[0].message })
            }

            const doctorInfo = await Doctor.findById(doctor, 'name phone');
            if (!doctorInfo) {
                return res.status(404).json({ message: 'Doctor not found' });
            }

            // Create a new prescription

            const prescription = new Prescription({
                doctor,
                doctorInfo: {
                    name: doctorInfo.name,
                    phone: doctorInfo.phone,
                },
                patientInfo,
                // patientSituation,
                medications,
            });

            await prescription.save();

            return res.status(201).json({ message: 'Prescription created successfully' });
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Internal server error' });
    }
}


async function getDoctorPrescription(req, res) {
    try {
        const doctorId = req.doctor._id;

        // Fetch prescriptions of the specified doctor
        const prescriptions = await Prescription.find({ doctor: doctorId })

        // .populate('doctor', 'name')

        return res.status(200).json(prescriptions);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getPatientPrescription(req, res) {
    try {
        const  patientId  = req.user._id;

        // Fetch prescriptions of the specified patient
        const prescriptions = await Prescription.find({ patient: patientId })
        // .populate({
        //     path: 'doctor',
        //     select: 'name specialization phone', // Specify the fields you want to include
        // })
        // .sort({ date: -1 });

        return res.status(200).json(prescriptions);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports = {
    createPrescription,
    getDoctorPrescription,
    getPatientPrescription
}