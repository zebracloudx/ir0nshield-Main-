const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());

// Subdomain routing middleware
app.use((req, res, next) => {
  const host = req.headers.host || ''; 
  if (host.startsWith('admin.')) {
    if (req.url === '/' || req.url === '/admin.html') {
      return res.sendFile(path.join(__dirname, 'admin.html'));
    }
  }
  next();
});

// Serve static web pages
app.use(express.static(__dirname));

const mongoURI = 'mongodb+srv://zebracloudx_db_user:Vhn3Ki8swcqEVHN2@cluster0.uonzfzg.mongodb.net/test?appName=Cluster0';

// Schemas & Models
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

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Routes
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

// Registration Route with strict Subneteer constraints
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 1. Enforce corporate email domain
    if (!email || !email.endsWith('@ironshield.io')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Access Denied: Please use your official domain (use user@ironshield.io).' 
      });
    }

    // 2. Check if an admin/user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Error: Admin / User account already exists!' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();
    
    res.status(201).json({ success: true, message: 'Subneteer operator account created successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 3000;

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('CRITICAL MongoDB Connection Error:', err);
  });