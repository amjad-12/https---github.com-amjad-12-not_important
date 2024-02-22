const _ = require('lodash')
const { User, validateUser } = require('../../models/users/user');
const bcrypt = require('bcryptjs');
const user = require('../../middleware/user');


async function getProfileUser(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-password -isUser -_id');

    if (!user) {
      // If user is not found, return a 404 response
      return res.status(404).json({
        status: false,
        code: 404,
        message: 'User not found.',
        data: null
      });
    }

    console.log(user.age)

    const formattedData = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      gender: user.gender,
      age: user.age,
      phone: user.phone
    }

    // If user is found, return a success response
    return res.status(200).json({
      status: true,
      code: 200,
      message: 'User profile retrieved successfully.',
      data: formattedData
    });

  } catch (ex) {
    // Handle other errors with a 500 response
    return res.status(500).json({
      status: false,
      code: 500,
      message: 'Internal server error.',
      data: null
    });
  }
}

async function editProfileUser(req, res) {
  try {

    // Check if the email and phone are already registered
    // let existingUser = await User.findOne({ $or: [{ email: req.body.email }, { phone: req.body.phone }] });
    // if (existingUser) {
    //   if (existingUser.email === req.body.email && existingUser.phone === req.body.phone) {
    //     return res.status(400).json({ error: 'Phone and email already registered.' });
    //   } else if (existingUser.email === req.body.email) {
    //     return res.status(400).json({ error: 'Email already registered.' });
    //   } else if (existingUser.phone === req.body.phone) {
    //     return res.status(400).json({ error: 'Phone already registered.' });
    //   }
    // }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: false,
        code: 404,
        message: 'User not found.',
        data: null
      });
    }


    if (req.body.phone) {
      const existingUser = await User.findOne({ phone: req.body.phone, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(409).json({ status: false, code: 409, message: 'Phone number is already registered', data: null });
      }
    }
    
    if (req.body.email) {
      const existingUser = await User.findOne({ email: req.body.email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(409).json({ status: false, code: 409, message: 'Email is already registered', data: null });
      }
    }

    const { first_name, last_name, phone, email, password, medical_history, allergies, current_medications, gender, birthdate } = req.body;
    


    user.first_name = first_name || user.first_name;
    user.last_name = last_name || user.last_name;
    user.phone = phone || user.phone;
    user.email = email || user.email;
    user.medical_history = medical_history || user.medical_history;
    user.allergies = allergies || user.allergies;
    user.current_medications = current_medications || user.current_medications;
    user.gender = gender || user.gender;
    user.birthdate = birthdate || user.birthdate;
    if (password) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)
      user.password = hashedPassword
    }

    await user.save();
    return res.status(200).json({
      status: true,
      code: 200,
      message: 'User profile updated successfully.',
      data: user
    });

  } catch (ex) {
    console.log(ex)
    return res.status(500).json({ status: false, code: 500, message: 'Internal server error.', data: null });
  }
}

async function createUser(req, res) {
  try {
    const { error } = validateUser(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        code: 400,
        message: error.details[0].message,
        data: null
      });
    }

    let user = await User.findOne({ $or: [{ email: req.body.email }, { phone: req.body.phone }] });

    if (user) {
      return res.status(409).json({
        status: false,
        code: 409,
        message: 'User already registered.',
        data: null
      });
    }

    user = new User(_.pick(req.body, [
      'first_name',
      'last_name',
      'phone',
      'email',
      'password',
      'birthdate',
      'gender'
    ]));

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    const token = user.generateAuthToken();
    return res.status(201).header('x-auth-token', token).json({
      status: true,
      code: 201,
      message: 'User created successfully.',
      data: null
    });

  } catch (ex) {
    console.log(ex);
    return res.status(500).json({
      status: false,
      code: 500,
      message: 'Internal server error.',
      data: null
    });
  }
}

async function getSuggestionUsersByNumber(req, res) {
  try {
    const { phoneNumber } = req.params;

        // Convert the string phone number to a number
    const phoneAsNumber = parseInt(phoneNumber);

    // Check if the conversion is successful
    if (isNaN(phoneAsNumber)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }
    // Extract the first 7 digits from the input phone number
    // const firstSevenDigits = phoneNumber.substring(0, 7);

    // Use a regular expression to search for users whose phone numbers match the first 7 digits
    const user = await User.find({ phone: phoneAsNumber  })
      .select('first_name last_name _id')

      if (user.length === 0 || !user) {
        return res.status(404).json({
          message: 'No users found matching the provided phone number.',
          data: null,
          status: false,
          code: 404
        });
      }
  

    const userPhone = await User.findById(user[0]._id).select('-password -isUser -_id');

    const formattedData = {
      first_name: userPhone.first_name,
      last_name: userPhone.last_name,
      age: userPhone.age,
      phone: userPhone.phone
    }

    // Return the matched users
    return res.status(200).json({
      message: 'Users retrieved successfully.',
      data: formattedData,
      status: true,
      code: 200
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: null,
      status: false,
      code: 500
    });
  }
}




module.exports = {
  createUser,
  getProfileUser,
  editProfileUser,
  getSuggestionUsersByNumber
};