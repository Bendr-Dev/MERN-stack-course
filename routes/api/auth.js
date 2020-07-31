const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get('/', auth, async (request, response) => {
    try {
        const user = await User.findById(request.user.id).select('-password');
        response.json(user);
    } catch (err) {
        console.error(err);
        response.status(500).send('Server Error');
    }
});


// @route   Post api/auth
// @desc    Authenticate user & user token
// @access  Public
router.post('/', [
    check('email', 'Please include a valid email').isEmail(), // Validators
    check(
        'password',
        'Password is required'
    ).exists()
], async (request, response) => {
    const errors = validationResult(request);

    const { email, password } = request.body;

    try {
        let user = await User.findOne({ email });
        
        if (!user) { // Check if user exists
            response.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return response.status(400).json({errors: [{ msg: 'Invalid credentials' }] });
        }

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
                if(err) throw err;
                response.json({ token });
            });
    } catch (err) {
        console.error(err.message);
        response.status(500).send('Server Error')
    }
});

module.exports = router;