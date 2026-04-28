-- ============================================================
-- MyDigitalAura Portfolio Database Schema
-- Run this in MySQL Workbench BEFORE starting the Spring Boot app
-- ============================================================

CREATE DATABASE IF NOT EXISTS portfolio_db;
USE portfolio_db;

-- Users table (students + admins)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Student profiles (One-to-One with users)
CREATE TABLE IF NOT EXISTS student_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    gender VARCHAR(20),
    dob VARCHAR(20),
    identification VARCHAR(100),
    languages VARCHAR(255),
    contact VARCHAR(20),
    linkedin VARCHAR(500),
    github VARCHAR(500),
    summary TEXT,
    photo_path VARCHAR(500),
    resume_path VARCHAR(500),
    education_level VARCHAR(50),
    post_grad_type VARCHAR(50),
    post_grad_specialization VARCHAR(100),
    post_grad_institution VARCHAR(255),
    post_grad_cgpa VARCHAR(10),
    grad_type VARCHAR(50),
    grad_specialization VARCHAR(100),
    grad_institution VARCHAR(255),
    grad_cgpa VARCHAR(10),
    pre_uni_type VARCHAR(50),
    pre_uni_institution VARCHAR(255),
    pre_uni_marks VARCHAR(50),
    secondary_board VARCHAR(50),
    secondary_institution VARCHAR(255),
    secondary_marks VARCHAR(50),
    department VARCHAR(100),
    year VARCHAR(20),
    gpa DOUBLE,
    student_status VARCHAR(50) DEFAULT 'Active',
    last_active VARCHAR(30),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Projects (Many-to-One with users)
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    technologies VARCHAR(500),
    role VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(30) DEFAULT 'not-started',
    progress INT DEFAULT 0,
    deadline VARCHAR(20),
    demo VARCHAR(500),
    github_link VARCHAR(500),
    subject VARCHAR(100),
    screenshot_path VARCHAR(500),
    project_file_path VARCHAR(500),
    grade VARCHAR(5),
    milestones TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feedback (Many-to-One with projects and users)
CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    admin_id BIGINT NOT NULL,
    message TEXT,
    rating INT,
    grade VARCHAR(5),
    strengths TEXT,
    improve TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Skills (Many-to-One with users)
CREATE TABLE IF NOT EXISTS skills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category VARCHAR(100),
    skills TEXT,
    cert_link VARCHAR(500),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Hackathons (Many-to-One with users)
CREATE TABLE IF NOT EXISTS hackathons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    summary TEXT,
    website VARCHAR(500),
    certificate_path VARCHAR(500),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Internships (Many-to-One with users)
CREATE TABLE IF NOT EXISTS internships (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    duration VARCHAR(100),
    work TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Certifications (Many-to-One with users)
CREATE TABLE IF NOT EXISTS certifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    issue_date VARCHAR(20),
    expiry_date VARCHAR(20),
    license_id VARCHAR(100),
    link VARCHAR(500),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Sample Admin User (password: admin123)
-- BCrypt hash of "admin123"
-- ============================================================
INSERT IGNORE INTO users (first_name, last_name, email, password, role)
VALUES ('Dr. Sarah', 'Johnson', 'admin@techuniversity.edu',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN');
