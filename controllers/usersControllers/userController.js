const _ = require('lodash')
const { User, validateUser } = require('../../models/users/user');
const bcrypt = require('bcryptjs');
const user = require('../../middleware/user');
const jwt = require('jsonwebtoken')
const private_key = process.env.med_jwtPrivateKey
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "amjadbarchini40@gmail.com",
    pass: "wydn ooxi alqa yaiy",
  },
});

async function getProfileUser(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-password -isUser -_id');

    if (!user) {
      // If user is not found, return a 404 response
      return res.status(404).json({
        status: false,
        code: 404,
        message: 'User not found.',
        data: []
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
      data: []
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
        data: []
      });
    }


    if (req.body.phone) {
      const existingUser = await User.findOne({ phone: req.body.phone, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(409).json({ status: false, code: 409, message: 'Phone number is already registered', data: [] });
      }
    }

    if (req.body.email) {
      const existingUser = await User.findOne({ email: req.body.email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(409).json({ status: false, code: 409, message: 'Email is already registered', data: [] });
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
    return res.status(500).json({ status: false, code: 500, message: 'Internal server error.', data: [] });
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
        data: []
      });
    }
    const email = req.body.email

    let user = await User.findOne({ $or: [{ email: req.body.email }, { phone: req.body.phone }] });
    
    
    let userFind = await User.findOne({ $or: [{ email: req.body.email }, { phone: req.body.phone }] });
    
    if (user && !user?.verified) {
      return res.status(403).json({
        data: [],
        message: 'You registered but not verify your account yet ',
        status: false,
        code: 700
      });
    }

    if (user) {
      return res.status(409).json({
        status: false,
        code: 409,
        message: 'User already registered.',
        data: []
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

    const url = `https://api.medsyncdz.com/api/users/verify/${token}`

    transporter.sendMail({
      to: email,
      subject: 'Verify Account',
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome Email</title>
      </head>
      <body>
      <div style="text-align: center; padding: 20px;">
        <h1 style="color: #333;">Welcome to Our Community!</h1>
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">We're excited to have you on board.</p>
        <a href='${url}' style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a>
      </div>
      </body>
      </html>`
    })

    return res.status(201).header('x-auth-token', token).json({
      status: true,
      code: 201,
      message: 'User created successfully.',
      data: []
    });

  } catch (ex) {
    console.log(ex);
    return res.status(500).json({
      status: false,
      code: 500,
      message: 'Internal server error.',
      data: []
    });
  }
}

async function verifyUserByEmail(req, res) {
  const { id } = req.params
  console.log(id, req.params)
  // Check we have an id
  if (!id) {
    return res.status(422).send({
      message: "Missing Token"
    });
  }
  // Step 1 -  Verify the token from the URL
  let payload = null
  try {
    payload = jwt.verify(id, private_key);
  } catch (err) {
    return res.status(500).send(err);
  }
  try {
    const user = await User.findById(payload._id);
    if (!user) {
      return res.status(404).send({
        message: "User does not  exists"
      });
    }
    // Step 3 - Update user verification status to true
    user.verified = true;
    await user.save();
    return res.status(200).send({
      message: "Account Verified"
    });
  } catch (err) {
    console.log(err)
    return res.status(500).send(err);
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
    const user = await User.find({ phone: phoneAsNumber })
      .select('first_name last_name _id')

    if (user.length === 0 || !user) {
      return res.status(404).json({
        message: 'No users found matching the provided phone number.',
        data: [],
        status: false,
        code: 404
      });
    }


    const userPhone = await User.findById(user[0]._id).select('-password -isUser');

    const formattedData = {
      id: userPhone._id,
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
      data: [],
      status: false,
      code: 500
    });
  }
}




module.exports = {
  createUser,
  getProfileUser,
  editProfileUser,
  getSuggestionUsersByNumber,
  verifyUserByEmail
};