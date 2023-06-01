//Dependancy 
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/user');
const multer = require('multer');
const path = require('path');
const MenuItem = require('./models/menuItem');
const Product = require('./models/product');
const CartItem = require('./models/cartItem');
const Loginp = require('./models/loginp');
const nodemailer = require('nodemailer');
const PORT = process.env.PORT || 9000;

//mongodb connect
mongoose.connect('mongodb+srv://shubham:sthunder1350@indianaccent.hmlzpnd.mongodb.net/foodapp?retryWrites=true&w=majority',
 { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

const app = express();

app.set('view engine', 'hbs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('images'));
app.use(express.static('public/uploads'));


app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


app.get('/', (req, res) => {
    res.render('index');
  });


  app.get('/signup', (req, res) => {
    res.render('signup');
  });
  
  app.post('/signup', async (req, res) => {
    const { username, email, mobile, password, address } = req.body;
  
    try {
      // Validate input fields
      if (!username || !email || !mobile || !password || !address) {
        return res.status(400).send('All fields are required');
      }
  
      // Check if user with same email exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(409).send('Email already exists');
      }
  
      // Create new user
      const user = new User({
        username,
        email,
        mobile,
        password,
        address
      });

      await user.save();
      res.redirect('/login');

    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username });
      if (!user) {
        throw new Error();
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error();
      }
     req.session.user = user;
      res.redirect('/menu');
    } catch (err) {
        return res.status(409).send('Invalid username or password');
    //   return res.render('login', { error: 'Invalid username or password' });
    }
  });
  
  app.get('/menu', async (req, res) => {
    try {
      const menuItems = await MenuItem.find({});
      res.render('menu', { menuItems });
    } catch (err) {
      console.log(err);
      res.status(500).send('Error retrieving menu items');
    }
  });

  //route handler for cart
app.get('/cart', async (req, res) => {
  try {
    const cartItems = await CartItem.find({});
    let totalPrice = 0;
    const menuItems = await Promise.all(cartItems.map(async cartItem => {
      const menuItem = await MenuItem.findById(cartItem.itemId);
      if (!menuItem) {
        // Handle the case where menuItem is null or undefined
        return null;
      }
      const price = menuItem.price * cartItem.quantity;
      totalPrice += price;
      return { ...menuItem.toObject(), quantity: cartItem.quantity, price };
    }));
    // Filter out any null values from the menuItems array
    const validMenuItems = menuItems.filter(item => item !== null);
    res.render('cart', { menuItems: validMenuItems, totalPrice });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error retrieving cart items');
  }
});

app.post('/cart', async (req, res) => {
  const { itemId, quantity } = req.body;
  try {
    const item = await MenuItem.findById(itemId);
    const cartItem = new CartItem({
      itemId: item._id,
      quantity: quantity,
      price: item.price * quantity
    });
    await cartItem.save();
    res.redirect('/cart');
  } catch (err) {
    console.log(err);
    res.status(500).send('Error adding item to cart');
  }
});


   app.post('/cart/:id/updateQuantity', async (req, res) => {
  const { id } = req.params;
  const { quantity} = req.body;
  // console.log(id , quantity, req.body);
  try {
    const cartItem = await CartItem.findOne({itemId: id});
    // console.log('cartitem',cartItem);
    const menuItem = await MenuItem.findById(cartItem.itemId);
    // console.log('menuitem',menuItem);
    if (!menuItem) {
      // Handle the case where menuItem is null or undefined
      return res.status(404).send('Item not found');
    }
    cartItem.quantity = quantity;
    cartItem.price = menuItem.price * quantity;
    await cartItem.save();
    res.redirect('/cart');
  } catch (err) {
    console.log(err);
    res.status(500).send('Error updating cart item quantity');
  }
});

app.get('/cart/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    await CartItem.findOneAndDelete({ itemId: id });
    res.redirect('/cart');
  } catch (err) {
    console.log(err);
    res.status(500).send('Error deleting cart item');
  }
});


app.get('/checkout', async (req, res) => {
  // Retrieve cart items from database
  const cartItems = await CartItem.find({});

  // Calculate total price of cart items
  const totalPrice = cartItems.reduce((total, item) => {
    const itemPrice = item.price;
    return total + itemPrice;
  }, 0);

  // Render checkout view with cart items and total price
  res.render('checkout', { cartItems, totalPrice });
});


app.get('/payment', (req, res) => {
  // Handle GET request to /payment endpoint here
});

app.post('/payment', (req, res) => {
  // Process payment logic goes here
 
  // Send confirmation email
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'rodolfo.dubuque@ethereal.email',
        pass: 'QHNsBXgS5guaUAEaaN'
    }
});

  let mailOptions = {
    from: '"Indian Accent" <eugene6@ethereal.email>',
    to: req.body.email,
    subject: 'Payment Confirmation',
    text: 'Thank you for your payment. We have received your order and will process it soon.'
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('Error sending email');
    } else {
      console.log('Email sent: ' + info.response);
      res.send('Payment processed and confirmation email sent');
      // Set the headers before rendering the view
      res.setHeader('Content-Type', 'text/html');
      //render the view 
      res.render('payment');
    }
  });
});


  app.get('/product', async (req, res) => {
    const products = await Product.find();
    res.render('main', { products });
  });

  
  app.get('/add', (req, res) => {
    res.render('add');
  });
  
  app.post('/add', upload.single('image'), async (req, res) => {
    const { name, description, price  } = req.body;
    const product = new Product({
        name,
        description,
        price,
        image: req.file.filename
    });
    await product.save();
    res.redirect('/product');
  });

  app.get('/loginp', (req, res) => {
    res.render('loginp');
  });
  
  
  app.post('/loginp', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await Loginp.findOne({ username });
      if (!user) {
        throw new Error();
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error();
      }
      req.session.user = user;
      res.redirect('/add');
    } catch (err) {
      return res.status(409).send('Invalid username or password');
    }
  });

  
  

  mongoose.connection.once('open', () => {
    console.log('Connected to database');
    app.listen(PORT, () => {
      console.log('Server started on port 9000');
    });
  });