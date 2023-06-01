// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  mobile: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  }
});

userSchema.pre('save', async function (next) {
    const user = this;
  
    // Hash the password before saving it to the database
    if (user.isModified('password')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  
    next();
  });
  
  userSchema.methods.comparePassword = async function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
  };
const User = mongoose.model('User', userSchema);

module.exports = User;