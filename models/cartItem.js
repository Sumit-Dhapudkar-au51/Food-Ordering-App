const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const cartItemSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
  quantity: { type: Number, default: 1 },
  price: { type: Number }
});
const CartItem = mongoose.model('CartItem', cartItemSchema);

module.exports = CartItem;