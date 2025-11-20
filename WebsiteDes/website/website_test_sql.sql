CREATE DATABASE Test;

USE Test;

-- CREATE USER 'testuser'@'localhost' IDENTIFIED BY 'password';
-- GRANT ALL PRIVILEGES ON test.* TO 'testuser'@'localhost';
-- FLUSH PRIVILEGES;

DROP TABLE users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    artistId INT,
    listenerId INT
);

INSERT INTO users (username, password, artistId, listenerId) VALUES ('Ethan', 'E', NULL, 1), ('Jenny', 'Big j', 1, NULL), ('Dwight', 'D-dog', 2, NULL);


