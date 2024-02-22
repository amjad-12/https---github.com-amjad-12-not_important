const { Laboratory } = require("../../models/laboratories/laboratory");


async function getAllLaboratories(req, res) {
    try {
        // Find all laboratories in the database
        const laboratories = await Laboratory.find()
            .populate({
                path: 'state',
                select: '-_id name',
            })
            .populate({
                path: 'municipality',
                select: '-_id name',
            }).select('name phone email isConfirmed state municipality');

        if (!laboratories || laboratories.length === 0) {
            return res.status(404).json({ message: 'No laboratories found' });
        }

        // Return the list of laboratories
        return res.status(200).json(laboratories);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function laboratoriesNeedConfirmation(req, res) {
    try {
        // Find all unconfirmed laboratories in the database
        // const unconfirmedLaboratories = await Laboratory.find({ isConfirmed: false }).select('name phone email isConfirmed');
        const unconfirmedLaboratories = await Laboratory.find({ isConfirmed: false })
            .populate({
                path: 'state',
                select: '-_id name',
            })
            .populate({
                path: 'municipality',
                select: '-_id name',
            })
            .select('name phone email isConfirmed registrationNumber state municipality');

        // if (!unconfirmedLaboratories || unconfirmedLaboratories.length === 0) {
        //     return res.status(404).json({ message: 'No unconfirmed laboratories found' });
        // }

        // Return the list of unconfirmed laboratories
        return res.status(200).json(unconfirmedLaboratories);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function toggleLaboratoryConirmation(req, res) {
    try {
        const { labId } = req.params;

        // Find the laboratory by ID
        const laboratory = await Laboratory.findById(labId);

        if (!laboratory) {
            return res.status(404).json({ message: 'Laboratory not found' });
        }

        

        // Toggle the confirmation status
        laboratory.isConfirmed = !laboratory.isConfirmed;

        // Save the updated laboratory
        await laboratory.save();
        // Return the updated laboratory with the new confirmation status
        return res.status(200).json({ message: 'Laboratory confirmation status toggled successfully', isConfirmed: laboratory.isConfirmed });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getAllLaboratories,
    laboratoriesNeedConfirmation,
    toggleLaboratoryConirmation
}