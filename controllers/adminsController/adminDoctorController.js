const { Doctor } = require('../../models/doctors/doctor')

async function getAllDoctors(req, res) {
    try {
        // Query all doctors from the database
        const doctors = await Doctor.find()
            .populate({
                path: 'state',
                select: '-_id name',
            })
            .populate({
                path: 'municipality',
                select: '-_id name',
            })
            .select('name phone email isConfirmed registrationNumber state municipality');

        return res.status(200).json(doctors);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

async function doctorsNeedConfirmation(req, res) {
    try {
        // Query doctors with isConfirmed set to false from the database
        // const unconfirmedDoctors = await Doctor.find({ isConfirmed: false }).select('name phone email isConfirmed registrationNumber');
        const unconfirmedDoctors = await Doctor.find({ isConfirmed: false })
            .populate({
                path: 'state',
                select: '-_id name',
            })
            .populate({
                path: 'municipality',
                select: '-_id name',
            })
            .select('name phone email isConfirmed registrationNumber state municipality');


        return res.status(200).json(unconfirmedDoctors);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function toggleDoctorConirmation(req, res) {
    try {
        const { doctorId } = req.params;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Toggle the isConfirmed property
        doctor.isConfirmed = !doctor.isConfirmed;

        // Save the updated doctor
        await doctor.save();

        return res.status(200).json({ message: 'Doctor confirmation status toggled successfully', isConfirmed: doctor.isConfirmed });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getAllDoctors,
    doctorsNeedConfirmation,
    toggleDoctorConirmation
}