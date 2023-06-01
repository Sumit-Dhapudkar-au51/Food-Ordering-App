const mongoose = require('mongoose');

const menuItemSchema2 = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    image: String
});

module.exports = mongoose.model('menuItem', menuItemSchema2);
