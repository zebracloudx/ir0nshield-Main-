require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());

// Redirect legacy /admin.html to main terminal
app.get('/admin.html', (req, res) => {
  res.redirect('/#admin');
});

// Serve static web pages (index.html, about.html, etc.) from your project folder
app.use(express.static(__dirname));

// MongoDB Atlas Connection
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://zebracloudx_db_user:Vhn3Ki8swcqEVHN2@cluster0.uonzfzg.mongodb.net/?appName=Cluster0';

mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB Atlas!'))
  .catch(err => console.error('Connection error:', err));

// Schemas & Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const cyberlabSchema = new mongoose.Schema({
  username: String,
  score: Number,
  date: { type: Date, default: Date.now }
});
const CyberlabUser = mongoose.model('CyberlabUser', cyberlabSchema);

const adminLogSchema = new mongoose.Schema({
  user: String,
  action: String,
  timestamp: { type: Date, default: Date.now }
});
const AdminLog = mongoose.model('AdminLog', adminLogSchema);

// Routes

// User Registration Route
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, Email, and Password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Account with this email already exists!' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();
    res.status(201).json({ success: true, message: 'Account created successfully! You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Telemetry & Score Saving Route
app.post('/api/save-score', async (req, res) => {
  try {
    const { username, score } = req.body;
    const newUser = new CyberlabUser({ username, score });
    await newUser.save();
    res.status(201).json({ success: true, message: 'Score saved to MongoDB!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Sync Route
app.post('/api/test-sync', async (req, res) => {
  try {
    const { user, action, timestamp } = req.body;
    const newLog = new AdminLog({
      user: user || 'Unknown Admin',
      action: action || 'ADMIN_LOGIN_TIMESTAMP',
      timestamp: timestamp ? new Date(timestamp) : Date.now()
    });
    await newLog.save();
    res.status(200).json({ success: true, message: 'Synced and recorded in MongoDB successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});