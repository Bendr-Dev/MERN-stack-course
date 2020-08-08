const express = require('express');
const router = express.Router();
const req = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
router.get('/me', auth, async (request, response) => {
    try {
        const profile = await Profile.findOne({ user: request.user.id }).populate('user',
        ['name', 'avatar']);

        if (!profile) {
            return response.status(400).json({ msg: 'There is no profile for this user' });
        }

        response.json(profile);
    } catch (err) {
        console.error(err.message);
        response.status(500).send('Server Error');
    }
});

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
router.post('/', [ auth, [
    check('status', 'Status is required')
    .not()
    .isEmpty(),
    check('skills', 'Skills is required')
    .not()
    .isEmpty()
    ] 
], async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = request.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = request.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
        const newSkills = skills.toString()
        profileFields.skills = newSkills.split(',').map(skill => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
        let profile = Profile.findOne({ user: request.user.id });
        
        if (profile) {
            // Update
            profile = await Profile.findOneAndUpdate(
                { user: request.user.id },
                { $set: profileFields },
                { new: true, upsert: true }
            );

            return response.json(profile);
        }

        // Create
        profile = new Profile(profileFields);

        await profile.save();
        response.json(profile);
    } catch (err) {
        console.error(err.message);
        response.status(500).send('Server Error')
    }
});

// @route   GET api/profiles
// @desc    Get all profiles
// @access  Public
router.get('/', async (request, response) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);

        response.json(profiles);
    } catch (error) {
        console.error(error);
        response.status(500).send('Server Error');
    }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', async (request, response) => {
    try {
        const profile = await Profile.find({ user: request.params.user_id }).populate('user', 
        ['name', 'avatar']);

        if (!profile) {
            return response.status(400).send('Profile not found');
        }

        response.json(profile);
    } catch (error) {
        console.error(error);
        if (error.kind == 'ObjectId') {
            return response.status(400).send('Profile not found');
        }
        response.status(500).send('Server Error');
    }
});

// @route   DELETE api/profile
// @desc    Delete profile, user and posts
// @access  Private
router.delete('/', auth, async (request, response) => {
    try {
        // Remove user posts
        await Post.deleteMany({ user: request.user.id});
        // Remove profile
        await Profile.findOneAndRemove({ user: request.user_id });
        // Remove user
        await User.findOneAndRemove({ _id: request.user_id });

        response.json({ msg: 'User deleted '});
    } catch (error) {
        console.error(error);
        response.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put('/experience', [auth, [
    check('title', 'Title is required')
    .not()
    .isEmpty(),
    check('company', 'Company is required')
    .not()
    .isEmpty(),
    check('from', 'From date is required')
    .not()
    .isEmpty(),
]
], async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = request.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: request.user.id });

        profile.experience.unshift(newExp);
        
        await profile.save();

        response.json(profile);
    } catch (error) {
        console.log(error.message);
        response.status(500).send('Server Error')
    }
});

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (request, response) => {
    try {
        const profile = await Profile.findOne({ user: request.user.id });

        // Get remove index
        const removeIndex = profile.experience
        .map(item => item.id)
        .indexOf(request.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        response.json(profile);
    } catch (error) {
        console.error(error.message);
        response.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put('/education', [auth, [
    check('school', 'School is required')
    .not()
    .isEmpty(),
    check('degree', 'Degree is required')
    .not()
    .isEmpty(),
    check('fieldofstudy', 'Field of study is required')
    .not()
    .isEmpty(),
    check('from', 'From date is required')
    .not()
    .isEmpty(),
]
], async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = request.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: request.user.id });

        profile.education.unshift(newEdu);
        
        await profile.save();

        response.json(profile);
    } catch (error) {
        console.log(error.message);
        response.status(500).send('Server Error')
    }
});

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:exp_id', auth, async (request, response) => {
    try {
        const profile = await Profile.findOne({ user: request.user.id });

        // Get remove index
        const removeIndex = profile.education
        .map(item => item.id)
        .indexOf(request.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        response.json(profile);
    } catch (error) {
        console.error(error.message);
        response.status(500).send('Server Error');
    }
});

// @route   GET api/profile/github/:username
// @desc    Get user repos from Github
// @access  Public
router.get('/github/:username', (request, response) => {
    try {
        const options = {
            uri: encodeURI(
                `https://api.github.com/users/${request.params.username}/repos?per_page=5&sort=created:asc`
            ),
            method: 'GET',
            headers: {
                'user-agent': 'node.js',
                Authorization: `token ${config.get('githubToken')}`
            }
        };

        req(options, (error, resp, body) => {
            if (error) {
                console.error(error);
            }

            if (resp.statusCode !== 200) {
               return response.status(404).json({ msg: 'No Github profile found' });
            }

            response.json(JSON.parse(body));
        })
    } catch (error) {
        console.error(error.message);
        response.status(500).send('Server Error');
    }
})

module.exports = router;