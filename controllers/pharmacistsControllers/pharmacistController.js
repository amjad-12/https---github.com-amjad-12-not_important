const _ = require('lodash')
const bcrypt = require('bcryptjs')
const { Pharmacist, validatePharmacist } = require('../../models/pharamacists/pharmacist')

async function createPharmacist(req, res) {
    try {
        const { error } = validatePharmacist(req.body);
        if (error) return res.status(400).json({
            message: error.details[0].message
        });

        let pharmacist = await Pharmacist.findOne({ $or: [{ email: req.body.email }, { phone: req.body.phone }] })
        if (pharmacist) return res.status(409).json({
            message: 'user already registered.'
        });

        pharmacist = new Pharmacist(_.pick(req.body, [
            'name',
            'email',
            'password',
            'phone',
            'cardIdNumber',
            'pharmacyLicenseNumber',
            'codeOfficine',
            'location',
            'municipality',
            'state'
        ]))

        const salt = await bcrypt.genSalt(10);
        pharmacist.password = await bcrypt.hash(pharmacist.password, salt)
        await pharmacist.save();

        
        return res.status(201).json({
            pharmacist: _.pick(pharmacist, [
                'name',
                'email', 
                'phone', 
                'cardIdNumber',
                'pharmacyLicenseNumber',
                'codeOfficine',
                'location'
            ])
        });
        // res.header('x-auth-token', token).send(_.pick(pharmacist, ['name', 'email', 'phone']))
    } catch (ex) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }

}

async function serachForPharmacy(req, res) {
    try {
        const { state, municipality } = req.query;

        const query = {
            isConfirmed: true,
            isOpen: true // Filter only confirmed doctors
        };

        if (state && municipality) {
            query.state = state;
            query.municipality = municipality;
        } else if (state) {
            query.state = state;
        }

        const projection = {
            password: 0, // Exclude the password field
            email: 0,
            isConfirmed: 0,
            isOpen: 0,
            isPharmacist:0,
            cardIdNumber: 0,
            codeOfficine: 0,
            pharmacyLicenseNumber: 0// Exclude the bookedPatients field
        };

        const pharmacy = await Pharmacist.find(query, projection);

        if (pharmacy.length === 0) {
            return res.status(404).json({ message: 'No pharmacy found' });
        }

        return res.status(200).json(pharmacy);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    createPharmacist,
    serachForPharmacy
}