# Database Setup Guide - ObservX

## Project Overview
ObservX is a user authentication and dashboard application. It supports both JSON-based (file) storage and MySQL database backends.

## Quick Start - JSON Based (Default)

The app is pre-configured to use JSON file storage (`users.json`) for user data. This requires no external database setup.

### Test Credentials
Use these credentials to login:

**Test User Account:**
- Email: `test@example.com`
- Password: `password123`

**Admin Account:**
- Email: `admin@example.com`
- Password: `password123`

## MySQL Database Setup (Optional)

If you want to use MySQL instead of JSON, follow these steps:

### 1. Create Database
```sql
CREATE DATABASE exam;
USE exam;
```

### 2. Create Tables

```sql
-- Users table (for authentication)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    full_name VARCHAR(255),
    mobile VARCHAR(20),
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages/Contact table
CREATE TABLE sonu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Update Configuration
Update `database.php` with your MySQL credentials:
```php
$host = "localhost";    // MySQL host
$user = "root";         // MySQL username
$pass = "";             // MySQL password
$db   = "exam";         // Database name
```

### 4. Migrate Users to MySQL
If switching from JSON to MySQL, import users from `users.json`:
```sql
INSERT INTO users (id, email, password, role, full_name, mobile, address, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);
```

## Project Structure

- `login.php` - User login page
- `register.php` - User registration page
- `dashboard.php` - Dashboard (protected, requires login)
- `logout.php` - Logout functionality
- `db.php` - Database abstraction layer (JSON-based)
- `database.php` - MySQL connection (optional)
- `users.json` - User data storage (JSON-based)

## Key Features

✅ User Registration with validation
✅ Secure Login with session management
✅ Password hashing with PHP PASSWORD_DEFAULT
✅ Role-based access (user/admin)
✅ Protected dashboard
✅ Session-based authentication

## Requirements

- PHP 7.4+
- For JSON storage: No additional requirements
- For MySQL: MySQL 5.7+ or MariaDB

## Testing the App

### Using JSON Storage (Default)
1. Navigate to `http://localhost/ac_project/login.php`
2. Login with test@example.com / password123
3. View dashboard at `dashboard.php`

### Using MySQL
1. Set up MySQL database as per instructions above
2. Update connection in `database.php`
3. Follow login steps above

## Security Notes

- Passwords are hashed using PHP's password_hash (bcrypt)
- Session-based authentication with login/logout
- CSRF protection ready (implement if needed)
- Use prepared statements for MySQL queries
- Enable HTTPS in production

## Troubleshooting

**"No database found" error:**
- Ensure MySQL server is running
- Check credentials in `database.php`
- Create database and tables

**Login not working:**
- Verify users.json exists and contains user data
- Check session_start() is called in all auth pages
- Clear browser cookies/sessions and retry

**Registration errors:**
- Check users.json permissions (must be writable)
- Verify email format validation

---
Database ready for use! 🎉
