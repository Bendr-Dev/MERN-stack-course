const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User'); // User model

// @route   Post api/users
// @desc    Register user
// @access  Public
router.post('/', [
    check('name', 'Name is required')   // Validators
    .not()
    .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
        'password',
        'Please enter a password with atleast 6 characters'
    ).isLength({ min: 6 })
], async (request, response) => {
    const errors = validationResult(request);

    const { name, email, password } = request.body;

    try {
        let user = await User.findOne({ email });
        
        if (user) { // Check if user exists
            response.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }
        
        const avatar = gravatar.url(email, { // Get users gravatar
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        user = new User({
            name,
            email,
            password,
            avatar
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Return jsonwebtoken

        response.send('User registered');
    } catch (err) {
        console.error(err.message);
        response.status(500).send('Server Error')
    }
});

module.exports = router;