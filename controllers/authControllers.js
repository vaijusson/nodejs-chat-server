const User = require('../models/User');
const jwt = require('jsonwebtoken');
const maxAge = 5*24*60*60;
const createJWT = id => {
    return jwt.sign({id},'chatroom secret',{expiresIn:maxAge})
}

const alertError = (err) => {
    let errors = {name:'',email:'',password:''};
    //console.log(`error msg: ${err.message}`);
    //console.log(`error code: ${err.code}`);
    console.log('error!',err);
    console.log('error!',err.message);
    console.log('error code:', err.code);
    // if (err.message.includes('duplicate key')) {
    //     errors['name'] = 'Enter a name!';
    //     errors['email'] = 'Enter a email!';
    //     errors['password'] = 'Enter a password!';
    //     // Object.values(err.errors).forEach(({ properties }) => {
    //     //     errors[properties.path] = properties.message
    //     // })
    // }
    if (err.code === 11000) {
        errors.email = 'This email already exists!'
        //return errors;
    }
    if (err.message === 'Incorrect email!')
    {
        errors.email = 'Incorrect email!';
    }
    if (err.message === 'Incorrect password!')
    {
        errors.password = 'Incorrect password!';
    }
    return errors;
}

module.exports.signup = async (req,res) => {
    const {name,email,password} = req.body;
    try {
        console.log('signup request received:',req.body);        
        const user = await User.create({name,email,password});
        const token = createJWT(user._id);
        res.cookie('jwt',token,{httpOnly: true, maxAge: maxAge*1000})
            //here we multiply maxage * 1000 because for cookies the units is in mSec.
        res.status(201).json({user});
    }
    catch (error) {
        let errors = alertError(error);
        res.status(400).json({errors});
        //res.status(400).send('failed to create user')
    }
    //res.send('signup');
}

module.exports.login = async (req,res) => {
    const {email,password} = req.body;
    try {
        console.log('login request received:',req.body);        
        const user = await User.login(email,password);
        const token = createJWT(user._id);
        res.cookie('jwt',token,{httpOnly: true, maxAge: maxAge*1000})
            //here we multiply maxage * 1000 because for cookies the units is in mSec.
        res.status(201).json({user});
    }
    catch (error) {
        let errors = alertError(error);
        res.status(400).json({errors});
        //res.status(400).send('failed to create user')
    }
}
module.exports.verifyuser = (req,res,next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token,'chatroom secret', async(err,decodedToken) => {
            console.log('decodedToken:',decodedToken);
            if (err) {
                console.log(err.message);
            } else {
                let user = await User.findById(decodedToken.id);
                res.json(user);
                next();
            }
        })
    }
    else {
        next();
    }
}

module.exports.logout = (req,res) => {
    res.cookie('jwt',"",{maxAge:1});
    res.status(200).json({logout: true});
}