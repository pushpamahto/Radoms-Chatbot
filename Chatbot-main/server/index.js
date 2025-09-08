
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// API endpoint to save user data
app.post('/save-user', async (req, res) => {
  console.log("Hi");
  try {
    const { name, email, phone, countryCode } = req.body;
    
    if(!name || !email || !phone || !countryCode){
       res.status(401).json({message: 'All fields are required'})
    }


    const newUser = new User({ name, email, phone, countryCode });
    await newUser.save();
    res.status(201).json({ message: 'User saved successfully', user: newUser });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(400).json({ message: 'User session started' });
  }
});

// API endpoint to get all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});
// Start server
const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});