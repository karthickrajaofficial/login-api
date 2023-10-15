const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../model/userModel');

// Function to generate JWT
const generateJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// User Registration
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  if (user) {
    const token = generateJWT(user.id);
    return res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token,
    });
  } else {
    return res.status(400).json({ message: 'Invalid user data' });
  }
});

// User Login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = generateJWT(user.id);
    return res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token,
    });
  } else {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Get Current User
const getMe = asyncHandler(async (req, res) => {
 res.status(200).json(req.user)
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
