const express = require("express");
const mysql = require("mysql2"); // Original import for callback connection
const mysqlPromise = require("mysql2/promise"); // REQUIRED for async/await routes
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// ------ MySQL connection setup (using original callback format) ------
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

// Create a connection pool using the promise-based client for async routes
const pool = mysqlPromise.createPool({
    host: "localhost",
    user: "notifyapp",
    password: "password",
    database: "notify_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// ------ API ENDPOINT: Add Song ------
// This route now expects a SongID from the frontend.
app.post('/api/add-song', async (req, res) => {
    // 1. Get data sent from the form in artist.html
    // NOTE: songId is now destructured from the request body
    const { songName, genre, length, artistId, songId } = req.body; 

    // Basic Validation - NOW CHECKING songId
    if (!songName || !genre || !length || !artistId || !songId) { 
        return res.status(400).json({ success: false, message: 'Missing required song fields, including Song ID.' });
    }
    
    // Ensure numeric fields are correctly parsed and are valid numbers
    const songLength = parseInt(length, 10);
    const id = parseInt(artistId, 10);
    const sId = parseInt(songId, 10); // Parse the new Song ID

    if (isNaN(songLength) || isNaN(id) || isNaN(sId) || songLength <= 0 || id <= 0 || sId <= 0) {
        return res.status(400).json({ success: false, message: 'ID and Length fields must be valid positive numbers.' });
    }

    try {
        // SQL query to insert the new song record - NOW INCLUDING SongID
        const sql = `
            INSERT INTO song 
            (SongID, SongName, Genre, ArtistID, Length, ReleaseDate) 
            VALUES (?, ?, ?, ?, ?, CURDATE())
        `;
        
        // Execute the query using the promise pool - NOW PASSING sId
        const [result] = await pool.execute(sql, [sId, songName, genre, id, songLength]);
        
        if (result.affectedRows === 1) {
            res.json({ 
                success: true, 
                message: 'Song added successfully!',
                newSongId: sId
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to insert song. Affected rows count was zero.' });
        }

    } catch (error) {
        console.error('Database Error during song insertion:', error);
        
        // Check for Foreign Key Constraint failure (ArtistID doesn't exist)
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ success: false, message: "Artist ID does not exist in the database." });
        }
        // NEW ERROR HANDLING: Duplicate Primary Key (when SongID is not unique)
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(400).json({ success: false, message: "Song ID already exists. Please choose a different, unused ID." });
        }

        res.status(500).json({ success: false, message: 'Server error processing your request. Check MySQL status and console logs.' });
    }
});


// ------ Simple artist info endpoint (Existing code) ------
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

// ------ Simple listener info endpoint (Existing code) ------
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

// ------ Login route (LoginID + Password) (Existing code) ------
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

// ------ Create New Listener Account ------
app.post("/api/create-listener",(req,res)=>{

  const { username, firstname, lastname, subType, password } = req.body;

  if(!username || !firstname || !lastname || !password)
      return res.json({success:false,message:"Missing required fields"});

  if(!/^[A-Za-z0-9]+$/.test(username))
      return res.json({success:false,message:"Username must be alphanumeric only"});

  // Insert new listener
  const insertListener = `
      INSERT INTO listener (FirstName, LastName, UserName, SubscriptionType)
      VALUES (?, ?, ?, ?)
  `;

  db.query(insertListener,[firstname,lastname,username,subType],(err,result)=>{
    if(err) return res.json({success:false,message:"Username already exists"});

    const newUserId = result.insertId;

    // Create login row using same UserID
    const createLogin = `
      INSERT INTO login (UserID, Password)
      VALUES (?, ?)
    `;

    db.query(createLogin,[newUserId,password], err2=>{
      if(err2) return res.json({success:false,message:"Error creating login row"});
      res.json({success:true,userId:newUserId});
    });
  });
});


// ------ Listener Page ------
// Update favorite song
app.post("/api/favorite-song", (req, res) => {
  const { userId, songId } = req.body;
  if (!userId || !songId) return res.json({ success:false, msg:"Missing data" });

  db.query(`UPDATE listener SET FavoriteSongID=? WHERE UserID=?`, [songId,userId], err=>{
    if(err) return res.json({success:false});

    // Return the song name back to the frontend to display
    db.query(`SELECT SongName FROM song WHERE SongID=?`, [songId], (e,r)=>{
      res.json({ success:true, songName: r[0]?.SongName || "Unknown Song" });
    });
  });
});

// Update favorite artist
app.post("/api/favorite-artist", (req,res)=>{
  const { userId, artistId } = req.body;
  if (!userId || !artistId) return res.json({ success:false, msg:"Missing fields" });

  db.query(`UPDATE listener SET FavoriteArtistID=? WHERE UserID=?`,[artistId,userId], err=>{
    if(err) return res.json({success:false});

    db.query(`SELECT StageName FROM artist WHERE ArtistID=?`,[artistId],(e,r)=>{
      res.json({ success:true, artistName: r[0]?.StageName || "Unknown Artist" });
    });
  });
});

// Increment song listen count
app.post("/api/play",(req,res)=>{
  const songId = parseInt(req.body.songId); // <<— critical fix

  db.query(`UPDATE song SET ListenCount = ListenCount + 1 WHERE SongID = ?`,[songId],err=>{
    if(err) return res.json({success:false});

    db.query(`SELECT SongName FROM song WHERE SongID = ?`,[songId],(e,r)=>{
      if(!r || r.length===0)
        return res.json({success:true, songName:"Not Found"});

      res.json({success:true, songName:r[0].SongName});
    });
  });
});


// Get user loyalty level
app.get("/api/loyalty-level", (req,res)=>{
  const id=req.query.userId;
  db.query(`SELECT UserLoyaltyLevel(?) AS Loyalty`,[id],
  (err,result)=> err?res.json({success:false}):res.json({success:true,level:result[0].Loyalty})
  );
});

// Get top 5 artists by listener count
app.get("/api/top-artists",(req,res)=>{
  const q=`SELECT A.ArtistID,A.StageName,F.ListenerCount
           FROM artist A JOIN (
             SELECT FavoriteArtistID AS ArtistID,COUNT(*) AS ListenerCount
             FROM listener WHERE FavoriteArtistID IS NOT NULL
             GROUP BY FavoriteArtistID ORDER BY ListenerCount DESC LIMIT 5
           ) F ON A.ArtistID=F.ArtistID`;

  db.query(q,(e,r)=> e?res.json({success:false}):res.json({success:true,data:r}));
});

// Get top 5 songs by listener count
app.get("/api/top-songs",(req,res)=>{
  const q=`SELECT S.SongID,S.SongName,F.ListenerCount
          FROM song S JOIN(
            SELECT FavoriteSongID AS SongID,COUNT(*)AS ListenerCount
            FROM listener WHERE FavoriteSongID IS NOT NULL
            GROUP BY FavoriteSongID ORDER BY ListenerCount DESC LIMIT 5
          ) F ON S.SongID=F.SongID`;

  db.query(q,(e,r)=> e?res.json({success:false}):res.json({success:true,data:r}));
});

// ------ Serve the login page (Existing code) ------
app.get("/", (req, res) => {
  // Assuming index.html is in a 'public' folder
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/artist.html", (req, res) => {
  // Assuming artist.html is in a 'public' folder
  res.sendFile(path.join(__dirname, "public", "artist.html"));
});
app.get("/listener.html", (req, res) => {
  // Assuming listener.html is in a 'public' folder
  res.sendFile(path.join(__dirname, "public", "listener.html"));
});
app.get("/queries.html", (req, res) => {
  // Assuming queries.html is in a 'public' folder
  res.sendFile(path.join(__dirname, "public", "queries.html"));
});

// ------ Start server (Existing code) ------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});