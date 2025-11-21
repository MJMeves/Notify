USE notify_db;
-- Query 1 (JOIN - all usernames/emails and passwords for all users and artists)
SELECT DISTINCT U.UserName, L.Password
FROM listener U, login L
WHERE L.UserID = U.UserID
UNION
SELECT DISTINCT A.Email, L.Password
FROM artist A, login L
WHERE L.ArtistID = A.ArtistID;

-- Query 2 (JOIN & VIEW - all artists ranked by most listened and then by most listened song for each)
DROP VIEW IF EXISTS ArtistStats;
CREATE VIEW ArtistStats AS
SELECT A.ArtistID, A.MinutesListenedTo, S.SongID, S.ListenCount
FROM artist A
JOIN song S ON A.ArtistID = S.ArtistID
ORDER BY A.MinutesListenedTo DESC, S.ListenCount DESC, A.ArtistID;
SELECT * FROM ArtistStats;

-- Query 3 (JOIN & VIEW & SUBQUERY & AGGREGATION - show the top 5 favorited artists by listeners)
DROP VIEW IF EXISTS TopFavArtists;
CREATE VIEW TopFavArtists AS
SELECT A.ArtistID, A.FirstName, A.LastName, A.StageName, L.ListenerCount
FROM artist A
JOIN (
	SELECT FavoriteArtistID, COUNT(*) AS ListenerCount
    FROM listener
    GROUP BY FavoriteArtistID
    ORDER BY ListenerCount DESC
    LIMIT 5
) L ON A.ArtistID = L.FavoriteArtistID
ORDER BY L.ListenerCount DESC;
SELECT * FROM TopFavArtists;

-- Query 4 (JOIN & VIEW & SUBQUERY & AGGREGATION - show the top 5 favorited songs by listeners)
DROP VIEW IF EXISTS TopFavSongs;
CREATE VIEW TopFavSongs AS
SELECT S.SongID, S.SongName, L.ListenerCount
FROM song S
JOIN (
	SELECT FavoriteSongID, COUNT(*) AS ListenerCount
    FROM listener
    GROUP BY FavoriteSongID
    ORDER BY ListenerCount DESC
    LIMIT 5
) L ON S.SongID = L.FavoriteSongID
ORDER BY L.ListenerCount DESC;
SELECT * FROM TopFavSongs;

-- Query 5 (AGGREGATION & VIEW - show the top 5 favorited genres by listeners)
DROP VIEW IF EXISTS TopFavGenres;
CREATE VIEW TopFavGenres AS
SELECT FavoriteGenre, COUNT(*) AS NumFavs
FROM listener
WHERE FavoriteGenre IS NOT NULL
GROUP BY FavoriteGenre
ORDER BY NumFavs DESC
LIMIT 5;
SELECT * FROM TopFavGenres;
