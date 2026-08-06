const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());

// Subdomain routing middleware: intercepts traffic hitting the admin subdomain
app.use((req, res, next) => {
  const host = req.headers.host || ''; 
  
  if (host.startsWith('admin.')) {
    if (req.url === '/' || req.url === '/admin.html') {
      return res.sendFile(path.join(__dirname, 'admin.html'));
    }
  }
  next();
});

// Serve static web pages (index.html, about.html, etc.) from your project folder
app.use(express.static(__dirname));

// MongoDB Atlas Connection
const mongoURI = 'mongodb+srv://zebracloudx_db_user:Vhn3Ki8swcqEVHN2@cluster0.uonzfzg.mongodb.net/?appName=Cluster0';

mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB Atlas!'))
  .catch(err => console.error('Connection error:', err));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});