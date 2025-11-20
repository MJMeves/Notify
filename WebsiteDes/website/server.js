const express = require("express");
const mysql = require("mysql2");
const path = require("path");
// const cors = require("cors");

const app = express();
app.use(express.json());
// app.use(cors());
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   next();
// });
app.use(express.static("public"));

// ------ MySQL connection ------
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "CClarkNeedsNoSQL18!",
  database: "test"
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
    return;
  }
  console.log("Connected to MySQL!");
});

// ------ Login route ------
app.post('/api/users', (req, res) => {
  console.log('POST /api/users', req.body);
  const { username, password, role } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'Missing username, password, or role' });
  }
  if (!['artist', 'listener'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  // Select the password and the role id columns (note ListenerID column name)
  db.query('SELECT password, ArtistId, ListenerID FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (!results || results.length === 0) return res.status(401).json({ success: false, message: 'User not found' });

    const row = results[0];
    const stored = row.password;
    // Plaintext comparison — replace with bcrypt.compare if passwords are hashed
    if (stored !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check role-specific id presence. client uses lowercase 'artist'/'listener'
    if (role === 'artist') {
      if (row.ArtistId == null) {
        return res.status(401).json({ success: false, message: 'Account is not an artist' });
      }
    } else if (role === 'listener') {
      if (row.ListenerID == null) {
        return res.status(401).json({ success: false, message: 'Account is not a listener' });
      }
    }

    return res.json({ success: true, message: 'Login successful' });
  });
});

// ------ Serve the website ------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ------ Start server ------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});