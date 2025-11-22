const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// ------ MySQL connection ------
const db = mysql.createConnection({
  host: "localhost",
  user: "notifyapp",
  password: "password",
  database: "notify_db"
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
    return;
  }
  console.log("Connected to MySQL (notify_db)!");
});

// ------ Simple artist info endpoint ------
app.get("/api/artist-simple", (req, res) => {
  const artistId = req.query.artistId;
  console.log("/api/artist-simple called with artistId:", artistId);
  if (!artistId) {
    return res.status(400).json({ success: false, message: "Missing artistId" });
  }
  
  const sql = `
    SELECT StageName, FirstName, LastName, Email, DOB, ListenerCount, FollowerCount, MinutesListenedTo
    FROM artist
    WHERE ArtistID = ?
  `;

  db.query(sql, [artistId], (err, results) => {
    console.log("SQL results for artistId", artistId, ":", results);
    if (err) {
      console.error("DB error in /api/artist-simple:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (!results || results.length === 0) {
      console.warn("No artist found for artistId", artistId);
      return res.status(404).json({ success: false, message: "Artist not found" });
    }
    res.json({ success: true, data: results[0] });
  });
});

// ------ Simple listener info endpoint ------
app.get("/api/listener-simple", (req, res) => {
  const userId = req.query.userId;
  console.log("/api/listener-simple called with userId:", userId);
  if (!userId) {
    return res.status(400).json({ success: false, message: "Missing userId" });
  }
  const sql = `
    SELECT l.FirstName, l.LastName, l.UserName, l.MinutesListened, l.FavoriteSongID, s.SongName AS FavoriteSongName, l.FavoriteGenre, l.FavoriteArtistID, l.SubscriptionType, l.JoinDate
    FROM listener l
    LEFT JOIN song s ON l.FavoriteSongID = s.SongID
    WHERE l.UserID = ?
  `;
  db.query(sql, [userId], (err, results) => {
    console.log("SQL results for userId", userId, ":", results);
    if (err) {
      console.error("DB error in /api/listener-simple:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (!results || results.length === 0) {
      console.warn("No listener found for userId", userId);
      return res.status(404).json({ success: false, message: "Listener not found" });
    }
    res.json({ success: true, data: results[0] });
  });
});

// ------ Login route (LoginID + Password) ------
app.post("/api/login", (req, res) => {
  console.log("POST /api/login", req.body);

  const { loginId, password } = req.body || {};

  if (!loginId || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Missing loginId or password" });
  }

  // Look up row in login table by LoginID
  const sql =
    "SELECT LoginID AS loginId, UserID AS userId, ArtistID AS artistId, Password AS storedPassword FROM login WHERE LoginID = ?";
  db.query(sql, [loginId], (err, results) => {
    if (err) {
      console.error("DB error during login:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (!results || results.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "LoginID not found" });
    }

    const row = results[0];

    if (row.storedPassword !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    // Determine role based on which FK is set
    let role = null;
    if (row.artistId != null && row.userId == null) {
      role = "artist";
    } else if (row.userId != null && row.artistId == null) {
      role = "listener";
    } else {
      return res.status(500).json({
        success: false,
        message: "Login row has invalid linkage (both or neither IDs set)"
      });
    }

    return res.json({
      success: true,
      message: "Login successful",
      role,
      loginId: row.loginId,
      userId: row.userId,
      artistId: row.artistId
    });
  });
});

// ------ Serve the login page ------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ------ Start server ------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
