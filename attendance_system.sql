-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS attendance_system;
USE attendance_system;

-- Create Students table
CREATE TABLE IF NOT EXISTS Students (
    StudentID INT PRIMARY KEY AUTO_INCREMENT,
    StudentName VARCHAR(255) NOT NULL
);

-- Create Attendance table
CREATE TABLE IF NOT EXISTS Attendance (
    AttendanceID INT PRIMARY KEY AUTO_INCREMENT,
    StudentID INT,
    StudentName VARCHAR(255),
    Time_In TIME,
    Time_Out TIME,
    Date DATE,
    Status ENUM('Present', 'Late', 'Absent'),
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
);

-- Insert sample student data
INSERT INTO Students (StudentName) VALUES
    ('Agustin, Vrenelli'),
    ('De Guzman, Marie Joy'),
    ('Rotugal, Jasmine');