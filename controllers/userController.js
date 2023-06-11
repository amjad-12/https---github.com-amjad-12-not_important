const _ = require('lodash')
const { User, validateUser } = require('../models/user');
const bcrypt = require('bcryptjs')


async function getProfileUser(req, res) {
    try {
        const user = await User.findById(req.user._id)
        res.send(user)
    } catch (ex) {
        res.status(500).send('Internal server error.')
    }
}

async function editProfileUser(req, res) {
    try {
        const { first_name, last_name, phone, email, password, medical_history, allergies, current_medications } = req.body;
        const user = await User.findById(req.user._id);

        user.first_name = first_name || user.first_name;
        user.last_name = last_name || user.last_name;
        user.phone = phone || user.phone;
        user.email = email || user.email;
        user.medical_history = medical_history || user.medical_history;
        user.allergies = allergies || user.allergies;
        user.current_medications = current_medications || user.current_medications;
        if (password) {
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            user.password = hashedPassword
        }
        
        await user.save();
        res.send(user);

    } catch (ex) {
        console.log(ex)
        res.status(500).send('Internal server error.')
    }
}

async function createUser(req, res) {
    try {
        const { error } = validateUser(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        let user = await User.findOne({ $or: [{ email: req.body.email }, { phone: req.body.phone }] })
        if (user) return res.status(400).send('User already registered.');

        user = new User(_.pick(req.body, [
            'first_name',
            'last_name',
            'phone',
            'email',
            'password'
        ]))
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt)
        await user.save();

        // here we got the method (generateAuthToken) from user object because we add it
        // in the schema of it
        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send(_.pick(user, ['_id', 'first_name', 'email', 'phone']));
    
    } catch (ex) {
        res.status(500).send('Internal server error')
    }
}





module.exports = {
    createUser,
    getProfileUser,
    editProfileUser
};