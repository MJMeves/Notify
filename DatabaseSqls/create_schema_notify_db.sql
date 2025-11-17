DROP DATABASE IF EXISTS `notify_db`;
CREATE DATABASE `notify_db`;
USE `notify_db`;

-- DDL

-- Artist Table
CREATE TABLE `artist` (
	`ArtistID` int NOT NULL,
    `FirstName` varchar(50) NOT NULL,
    `LastName` varchar(50) NOT NULL,
    `ListenerCount` int DEFAULT 0,
    `FollowerCount` int DEFAULT 0,
    `Email` varchar(50) NOT NULL,
    `DOB` date NOT NULL,
    `MinutesListenedTo` int DEFAULT 0,
    `StageName` varchar(50),
    PRIMARY KEY (`ArtistID`),
    UNIQUE KEY `Email_Unique`(`Email`)
);

-- Song Table
CREATE TABLE `song` (
	`SongID` int NOT NULL,
    `SongName` varchar(50) NOT NULL,
    `Genre` varchar(50) NOT NULL,
    `ArtistID` int NOT NULL,
    `AlbumName` varchar(50),
    `ReleaseDate` date DEFAULT (curdate()),
    `Length` int NOT NULL,
    `ListenCount` int DEFAULT 0,
    `SaveCount` int DEFAULT 0,
    PRIMARY KEY (`SongID`),
    KEY `ArtistID_idx` (`ArtistID`),
    CONSTRAINT `ArtistID` FOREIGN KEY (`ArtistID`) REFERENCES `artist` (`ArtistID`)
);

-- Listener Table
CREATE TABLE `listener` (
	`UserID` int NOT NULL,
    `FirstName` varchar(50) NOT NULL,
    `LastName` varchar(50) NOT NULL,
    `UserName` varchar(50) NOT NULL,
    `MinutesListened` int DEFAULT 0,
    `FavoriteSongID` int DEFAULT NULL,
    `FavoriteGenre` varchar(50) DEFAULT NULL,
    `FavoriteArtistID` int DEFAULT NULL,
    `SubscriptionType` varchar(50) DEFAULT 'Lite',
    `JoinDate` date DEFAULT (curdate()),
    PRIMARY KEY (`UserID`),
    UNIQUE KEY (`UserName`),
    KEY `FavoriteSongID_idx` (`FavoriteSongID`),
    KEY `FavoriteArtistID_idx` (`FavoriteArtistID`),
    CONSTRAINT `FavoriteSongID` FOREIGN KEY (`FavoriteSongID`) REFERENCES `song` (`SongID`),
	CONSTRAINT `FavoriteArtistID` FOREIGN KEY (`FavoriteArtistID`) REFERENCES `artist` (`ArtistID`)
);

-- Login Table
CREATE TABLE `login` (
	`LoginID` int NOT NULL,
    `UserID` int,
    `ArtistID` int,
    `Password` varchar(100) NOT NULL,
    PRIMARY KEY (`LoginID`),
    KEY `UserID_idx` (`UserID`),
    KEY `ArtistID_idx` (`ArtistID`),
    CONSTRAINT `ArtistID1` FOREIGN KEY (`ArtistID`) REFERENCES `artist` (`ArtistID`),
    CONSTRAINT `UserID1` FOREIGN KEY (`UserID`) REFERENCES `listener` (`UserID`),
    CONSTRAINT `checkID` CHECK (
		(`ArtistID` IS NOT NULL AND `UserID` IS NULL)
        OR
        (`UserID` IS NOT NULL AND `ArtistID` IS NULL)
	)
);

-- ListensTo relation
/*CREATE TABLE `listensto` (
	`UserID` int NOT NULL,
    `SongID` int NOT NULL,
    `PlayCount` int DEFAULT 1,
    PRIMARY KEY (`UserID`, `SongID`),
    FOREIGN KEY (`UserID`) REFERENCES `listener` (`UserID`),
    FOREIGN KEY (`SongID`) REFERENCES `song` (`SongID`)
)*/

-- DML

-- create artist tuples
INSERT INTO `artist` (ArtistID, FirstName, LastName, Email, DOB) 
VALUES
(1, 'John', 'Denver', 'jDenver@gmail.com', '1943-12-31'),
(2, 'Fake', 'Person', 'fperson@gmail.com', '2020-11-11'),
(3, 'Mark', 'Smith', 'msmith@gmail.com', '2015-11-11'),
(4, 'Matt', 'James', 'mjames@gmail.com', '2000-11-11');
INSERT INTO `artist` (ArtistID, FirstName,LastName, ListenerCount, FollowerCount, Email, DOB, MinutesListenedTo, StageName)
VALUES
(5, 'Joe', 'Marty', 1, 1, 'jmarty@gmail.com', '2011-11-11', 2, 'lil Marty');

-- create song tuples
INSERT INTO `song` (SongID, SongName, Genre, ArtistID, Length) 
VALUES
(1, 'Name', 'Pop', 2, 2),
(2, 'hello', 'blues', 3, 2),
(3, 'Name 2', 'Pop', 2, 3),
(4, 'Name', 'R&B' , 4, 5);
INSERT INTO `song` (SongID, SongName, Genre, ArtistID, AlbumName, ReleaseDate, Length, ListenCount, SaveCount)
VALUES
(5, 'Country Roads', 'Country', 1, 'Best Of', '1971-01-01', 3, 1000, 20);

-- create listener tuples
INSERT INTO `listener` (UserID, FirstName, LastName, UserName)
VALUES
(1, 'Matt', 'Pawl', 'MPawl'),
(2, 'Ella', 'James', 'EJ'),
(3, 'Logan', 'Stropich', 'lstrop'),
(4, 'Ema', 'Noll', 'Nolle');
INSERT INTO `listener` (USERID, FirstName, LastName, UserName, MinutesListened, FavoriteSongID, FavoriteGenre, FavoriteArtistID, SubscriptionType, JoinDate)
VALUES
(5, 'Miska', 'Vlad', 'MVlad', 10, 2, 'blues', 5, 'Premium', '2020-11-11');

-- create login tuples
INSERT INTO `login` (LoginID, UserID, ArtistID, Password)
VALUES
(1, NULL, 1, '1234'),
(2, NULL, 2, 'abcd'),
(3, NULL, 3, '12ab@@'),
(4, NULL, 4, '4321'),
(5, NULL, 5, '1234'),
(6, 1, NULL, 'abcd'),
(7, 2, NULL, '1243'),
(8, 3, NULL, 'hey'),
(9, 4, NULL, 'no'),
(10, 5, NULL, 'm#12');

    

    
    