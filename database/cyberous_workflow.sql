CREATE DATABASE IF NOT EXISTS cyberous_workflow;
USE cyberous_workflow;

CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL,
  description TEXT,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  department_name VARCHAR(100) NOT NULL,
  manager_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(30),
  department_id INT,
  role VARCHAR(80),
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_name VARCHAR(120) NOT NULL,
  contact_person VARCHAR(120),
  email VARCHAR(120),
  phone VARCHAR(30),
  company VARCHAR(120),
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_name VARCHAR(150) NOT NULL,
  client_id INT,
  manager_id INT,
  start_date DATE,
  deadline DATE,
  status ENUM('Not Started', 'In Progress', 'Completed', 'On Hold') DEFAULT 'Not Started',
  progress INT DEFAULT 0,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE project_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT,
  employee_id INT,
  role_in_project VARCHAR(80),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT,
  assigned_to INT,
  task_title VARCHAR(150) NOT NULL,
  description TEXT,
  priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
  status ENUM('To Do', 'In Progress', 'Review', 'Completed') DEFAULT 'To Do',
  start_date DATE,
  due_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (assigned_to) REFERENCES employees(id)
);

CREATE TABLE client_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT,
  request_title VARCHAR(150) NOT NULL,
  request_text TEXT,
  priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
  status ENUM('Open', 'In Progress', 'Completed', 'Closed') DEFAULT 'Open',
  request_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  title VARCHAR(120),
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  module_name VARCHAR(80),
  action_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE task_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT,
  user_id INT,
  comment_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE task_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT,
  file_name VARCHAR(255),
  file_path VARCHAR(255),
  uploaded_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

INSERT INTO roles (role_name, description) VALUES
('Admin', 'System Administrator'),
('Manager', 'Project Manager'),
('Employee', 'Staff Member'),
('Client', 'External Client');

INSERT INTO users (name, email, password_hash, role_id, status) VALUES
('Admin User', 'admin@cyberous.com', '$2a$10$8uM7rjYj8fFzCJ8O8k1PHe5e7K4vN49mPv6L3jhI8W0pD4vrm3C6G', 1, 'Active'),
('Rahul Sharma', 'rahul@cyberous.in', '$2a$10$8uM7rjYj8fFzCJ8O8k1PHe5e7K4vN49mPv6L3jhI8W0pD4vrm3C6G', 2, 'Active'),
('Priya Joshi', 'priya@cyberous.in', '$2a$10$8uM7rjYj8fFzCJ8O8k1PHe5e7K4vN49mPv6L3jhI8W0pD4vrm3C6G', 3, 'Active');

INSERT INTO departments (department_name, manager_id) VALUES
('Development', 2),
('Testing', 3),
('DevOps', 2),
('Security', 2),
('HR', 2);

INSERT INTO employees (user_id, full_name, email, phone, department_id, role, status) VALUES
(2, 'Rahul Sharma', 'rahul@cyberous.in', '+91 98765 43210', 1, 'Developer', 'Active'),
(3, 'Priya Joshi', 'priya@cyberous.in', '+91 91234 56789', 2, 'Tester', 'Active');

INSERT INTO clients (client_name, contact_person, email, phone, company, status) VALUES
('ABC Corp', 'Alicia Brown', 'info@abccorp.com', '+1 555 221 4455', 'ABC Corp', 'Active'),
('XYZ Pvt Ltd', 'Elena Wallace', 'hello@xyzpvt.com', '+91 99880 77888', 'XYZ Pvt Ltd', 'Active'),
('Tech Corp', 'Dan Lewis', 'sales@techcorp.com', '+44 7700 900123', 'Tech Corp', 'Active');

INSERT INTO projects (project_name, client_id, manager_id, start_date, deadline, status, progress, description) VALUES
('Cyber Security Audit', 1, 2, '2025-01-02', '2025-08-20', 'In Progress', 70, 'Penetration testing and remediation planning'),
('Website Development', 2, 3, '2025-05-03', '2025-09-15', 'In Progress', 45, 'Responsive redesign and CMS implementation'),
('VAPT Assessment', 3, 2, '2025-10-02', '2025-12-25', 'Completed', 100, 'Vulnerability assessment and remediation report');

INSERT INTO client_requests (client_id, request_title, request_text, priority, status, request_date) VALUES
(1, 'Penetration Testing', 'Need coverage for web platform and APIs.', 'High', 'In Progress', '2026-08-20'),
(2, 'Security Audit', 'Need audit for internal systems and access policies.', 'Medium', 'Open', '2026-08-21'),
(3, 'VAPT Assessment', 'Urgent vulnerability assessment and report.', 'High', 'In Progress', '2026-08-22');
