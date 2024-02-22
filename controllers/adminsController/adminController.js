const _ = require('lodash')
const { Admin, validateAdmin } = require('../../models/admins/admin');
const bcrypt = require('bcryptjs')


async function getProfileAdmin(req, res) {
    try {
        const admin = await Admin.findById(req.admin._id)
        return res.send(admin)
    } catch (ex) {
        return res.status(500).send('Internal server error.')
    }
}

async function editProfileAdmin(req, res) {
    try {
        const { first_name, last_name, phone, email, password} = req.body;
        const admin = await Admin.findById(req.admin._id);

        admin.first_name = first_name || admin.first_name;
        admin.last_name = last_name || admin.last_name;
        admin.phone = phone || admin.phone;
        admin.email = email || admin.email;
        if (password) {
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            admin.password = hashedPassword
        }

        await admin.save();
        return res.send(admin);

    } catch (ex) {
        return res.status(500).send('Internal server error.')
    }
}

async function createAdmin(req, res) {
    try {
        const { error } = validateAdmin(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        let admin = await Admin.findOne({ $or: [{ email: req.body.email }, { phone: req.body.phone }] })
        if (admin) return res.status(400).send('Admin already registered.');

        admin = new Admin(_.pick(req.body, [
            'first_name',
            'last_name',
            'phone',
            'email',
            'password'
        ]))
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt)
        await admin.save();

        // here we got the method (generateAuthToken) from user object because we add it
        // in the schema of it
        
        return res.send(_.pick(admin, ['_id', 'first_name', 'last_name', 'email', 'phone']));

    } catch (ex) {
        return res.status(500).send('Internal server error')
    }
}

async function getAllAdmins(req, res) {
    try {
        // Query all doctors from the database
        const doctors = await Admin.find().select('first_name last_name phone email isAdmin');

        return res.status(200).json(doctors);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};


async function toggleAdminConirmation(req, res) {
    try {
        const { adminId } = req.params;

        // Find the doctor by ID
        const admin = await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Toggle the isConfirmed property
        admin.isAdmin = !admin.isAdmin;

        // Save the updated doctor
        await admin.save();

        return res.status(200).json({ message: 'admin confirmation status toggled successfully', isAdmin: admin.isAdmin });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports = {
    createAdmin,
    getProfileAdmin,
    editProfileAdmin,
    getAllAdmins,
    toggleAdminConirmation
};