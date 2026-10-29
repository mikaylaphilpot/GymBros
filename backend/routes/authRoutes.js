const express = require('express');
const router = express.Router();
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const User = require('../models/User.js');

router.post('/signup', async (req, res)=> {
    // Handle signup logic here
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if(typeof username !== "string" || username.trim().length === 0 || typeof email !== "string" || email.trim().length === 0|| typeof password !== "string" || password.trim().length === 0 ) {
        return res.status(400).json({ message: 'Please fill out all fields!' });
    }

    //username and email are case-insentive
    const normUsername = username.trim().toLowerCase();
    const normEmail =  email.trim().toLowerCase();

    if(!emailRegex.test(normEmail)){
        return res.status(400).json({ message: 'Invalid Email Format' })
    }

    if(!passwordRegex.test(password)){
        return res.status(400).json({message: 'Your Password does not meet requirements'})
    }

    try{
       const existingEmail = await User.findOne({email: normEmail})

        if(existingEmail !== null){
            return res.status(409).json({ message: 'Account already exists with this email' });
        }

        const existingUser = await User.findOne({username: normUsername})

        if(existingUser !== null){
            return res.status(409).json({ message: 'Username already in use' });
        }

    }catch(error){
        return res.status(500).json({message: 'Database/server connection error'})
    }
    

    res.json({ message: 'User signed up successfully!' });
});

module.exports = router;