const { MedicalReport, validateMedicalReport, validateMedicalReportManual } = require("../../models/doctors/medicalReport")
const { Doctor } = require("../../models/doctors/doctor")
const { User } = require('../../models/users/user')

async function createMedicalReport(req, res) {
    try {
        const { patient, medicalReport, patientInfo } = req.body;
        const doctor = req.doctor._id;
        if (patient) {
            const { error } = validateMedicalReport(req.body)
            if (error) {
                return res.status(400).json({ message: error.details[0].message })
            }

            const doctorInfo = await Doctor.findById(doctor, 'name phone');
            if (!doctorInfo) {
                return res.status(404).json({ message: 'Doctor not found' });
            }

            // Find the patient and doctor to get their additional information
            const patientInfo = await User.findById(patient, 'first_name last_name age gender');

            if (!patientInfo) {
                return res.status(404).json({ message: 'Patient not found' });
            }

            // Create a new prescription
            const rebort = new MedicalReport({
                doctor,
                patient,
                doctorInfo: {
                    name: doctorInfo.name,
                    phone: doctorInfo.phone,
                },
                patientInfo: {
                    first_name: patientInfo.first_name,
                    last_name: patientInfo.last_name,
                    age: patientInfo.age,
                    gender: patientInfo.gender
                },
                medicalReport
            });

            await rebort.save();

            return res.status(201).json({ message: 'Medical report created successfully' });


        } else {
            const { error } = validateMedicalReportManual(req.body)

            if (error) {
                return res.status(400).json({ message: error.details[0].message })
            }

            // const doctor = req.doctor._id;
            const doctorInfo = await Doctor.findById(doctor, 'name phone');
            if (!doctorInfo) {
                return res.status(404).json({ message: 'Doctor not found' });
            }

            // Find the patient and doctor to get their additional information

            // Create a new prescription
            const rebort = new MedicalReport({
                doctor,
                doctorInfo: {
                    name: doctorInfo.name,
                    phone: doctorInfo.phone,
                },
                patientInfo,
                medicalReport
            });

            await rebort.save();

            return res.status(201).json({ message: 'Medical report created successfully' });
        }


    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });

    }
}


async function getDoctorMedicalReport(req, res) {
    try {
        const doctorId = req.doctor._id;

        // Fetch all medical reports associated with the specified doctorId
        const medicalReports = await MedicalReport.find({ doctor: doctorId });

        // Return the medical reports as JSON
        return res.status(200).json(medicalReports);
    } catch (error) {
        // Handle errors
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getPatientMedicalReports(req, res) {
    try {
        const patientId = req.user._id;

        // Fetch prescriptions of the specified patient
        const medicalReports = await MedicalReport.find({ patient: patientId })
        // .populate({
        //     path: 'doctor',
        //     select: 'name specialization phone', // Specify the fields you want to include
        // })
        // .sort({ date: -1 });

        return res.status(200).json(medicalReports);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}



module.exports = {
    createMedicalReport,
    getDoctorMedicalReport,
    getPatientMedicalReports
}