const mongoose = require('mongoose');
const {isEmail} = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please enter a name']
    },
    email:{
        type:String,
        required:[true,'please enter email'],
        unique:[true,'Duplicate'],
        lowercase:true,
        validate:[isEmail,'enter proper email']
    },
    password:{
        type:String,
        required:[true,'enter password'],
        minlength:[5,'min should be 5']
    }
})

userSchema.pre('save', async function(next){
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    //console.log('before save',this); //this refers to the created user
    next();
})

//we are writing this function because mongoose doesnt have a login function.
userSchema.statics.login = async function(email,password) {
    //console.log(`received email ${email} and pwd ${password}`);
    const user = await this.findOne({email});
    //console.log(user);
    if (user) {
        const isAuthenticated = await bcrypt.compare(password, user.password);
        if (isAuthenticated) {
            return user;
        }
        throw Error('Incorrect password!');
    } else {
        throw Error('Incorrect email!');
    }
}
// userSchema.post('save',function(doc,next){
//     console.log('post save',doc);
//     next();
// })
const User = mongoose.model('User', userSchema);
module.exports = User;