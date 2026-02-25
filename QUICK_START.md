# ObservX - Quick Start Guide

## Pre-Deployment Checklist

### System Requirements
- ✅ PHP 7.4 or higher
- ✅ MySQL 5.7+ or MariaDB
- ✅ Apache with mod_rewrite enabled
- ✅ cURL PHP extension (for API calls)
- ✅ JSON PHP extension (standard)

### Directory Permissions
Run these commands in your project directory:
```bash
chmod 755 .
chmod 755 uploads/
chmod 644 *.php *.html *.css *.js
```

## Step 1: Database Initialization (IMPORTANT!)

### Method A: Automatic Setup (Recommended)
1. Open browser: `http://localhost/adii/create_db.php`
2. Wait for setup to complete
3. Should see success messages for each table
4. Note the test credentials displayed

### Method B: Manual Setup
1. Open phpMyAdmin or MySQL CLI
2. Execute `db_schema.sql`:
   ```bash
   mysql -u root -p < db_schema.sql
   ```
3. Verify all tables created
4. Run test user inserts manually

## Step 2: Configuration

### Basic Configuration (No Changes Needed - Uses Defaults)
File: `config.php`

Default values:
- Host: localhost
- User: root
- Password: (empty)
- Database: observx

### For Custom Configuration
Set environment variables:
```bash
export DB_HOST=your_host
export DB_USER=your_user
export DB_PASSWORD=your_pass
export DB_NAME=your_db
```

## Step 3: File Permissions

Create uploads directory if it doesn't exist:
```bash
mkdir -p uploads
chmod 755 uploads
```

## Step 4: Test the Installation

### Test 1: Database Connection
Open: `http://localhost/adii/setup.php`

Should see:
- ✅ PHP: Running
- ✅ Required Extensions: Available
- ✅ MySQL: Connected to 'observx' database
- ✅ Tables: users, complaints, police_stations, sonu

### Test 2: User Registration
1. Go to: `http://localhost/adii/register.php`
2. Fill form with:
   - Full Name: Test User
   - Email: testuser@example.com
   - Password: TestPass123!
   - Password Confirm: TestPass123!
   - Mobile: 9876543210
   - Address: Test Address
3. Click Register
4. Should see success message

### Test 3: User Login
1. Go to: `http://localhost/adii/login.php`
2. Use either:
   - Email: test@example.com
   - Email: testuser@example.com (if just created)
   - Password: password123 (for test account)
   - Password: TestPass123! (if just created)
3. Should be redirected to `dashboard.php`
4. Should see welcome message

### Test 4: File Complaint
1. Ensure logged in on dashboard
2. Go to complaint filing form
3. Fill all fields:
   - Title: Test incidents
   - Category: Other
   - Description: Test complaint description
   - Priority: Normal
4. Submit
5. Should get complaint ID
6. Check database to verify entry

## Step 5: Verify Core Functionality

### API Endpoints Test
Using curl or Postman:

#### Get All Complaints
```bash
curl http://localhost/adii/get_complaints.php
```

#### Get User Complaints
```bash
curl "http://localhost/adii/get_complaints.php?user_email=test@example.com"
```

#### Get Single Complaint
```bash
curl "http://localhost/adii/get_complaint.php?id=COMPLAINT_ID"
```

#### Update Complaint Status
```bash
curl -X POST http://localhost/adii/update_complaint.php \
  -H "Content-Type: application/json" \
  -d '{"complaint_id":"CMPxxxxxx","status":"investigating"}'
```

## Step 6: Production Deployment

### Before Going Live

1. **Change Database Password**
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'strong_password';
   FLUSH PRIVILEGES;
   ```
   Update `config.php`:
   ```php
   $password = getenv('DB_PASSWORD') ?: 'your_new_password';
   ```

2. **Enable HTTPS**
   - Get SSL certificate (Let's Encrypt)
   - Update `config.php`:
   ```php
   $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
   ```

3. **Disable Error Display**
   - In `config.php`, remove:
   ```php
   error_reporting(E_ALL);
   ini_set('display_errors', 1);
   ```
   Replace with:
   ```php
   error_reporting(E_ALL);
   ini_set('display_errors', 0);
   ini_set('log_errors', 1);
   ini_set('error_log', '/var/log/php_errors.log');
   ```

4. **Create .htaccess for Security**
   ```apache
   # Prevent direct access to sensitive files
   <FilesMatch "\.(?:config|database|db)\.php$">
       Order Deny,Allow
       Deny from all
   </FilesMatch>
   
   # Force HTTPS in production
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

5. **Set Up Regular Backups**
   ```bash
   # Daily backup script
   mysqldump -u root -p observx > /backup/observx_$(date +%Y%m%d).sql
   ```

6. **Monitor Logs**
   ```bash
   tail -f /var/log/apache2/error.log
   tail -f /var/log/php_errors.log
   ```

## Troubleshooting

### Database Connection Failed
**Error**: "Connection failed: Unknown database 'observx'"

**Solution**:
1. Run `create_db.php` again
2. Check MySQL is running: `mysql -u root -p`
3. Verify database name: `SHOW DATABASES;`
4. Check credentials in `config.php`

### Session Not Working
**Error**: "Session not started" / Redirected to login

**Solution**:
1. Check PHP session.save_path: `php -r "echo ini_get('session.save_path');"`
2. Create session directory if needed: `mkdir -p /var/lib/php/sessions`
3. Set permissions: `chmod 777 /var/lib/php/sessions`

### File Upload Failed
**Error**: "File too large" or "Invalid file type"

**Solution**:
1. Check file size limit: `php.ini` → `upload_max_filesize`
2. Check MIME type: Ensure file is actually jpg/pdf/mp4 etc.
3. Check uploads directory permissions: `chmod 755 uploads/`

### CORS Error in Browser Console
**Error**: "No 'Access-Control-Allow-Origin' header"

**Solution**:
1. Verify CORS headers in PHP files (already configured)
2. Clear browser cache: Ctrl+Shift+Delete
3. For development: Use browser extension to disable CORS temporarily

### Login Page Shows Blank
**Error**: Complaint form submits but redirects to blank page

**Solution**:
1. Check browser console for errors (F12)
2. Check PHP logs: `tail -f /var/log/apache2/error.log`
3. Run setup.php to verify all extensions available
4. Check database has tables: `show tables;` in MySQL

## Security Best Practices

1. ✅ Never commit database credentials
2. ✅ Use environment variables for sensitive data
3. ✅ Keep Apache & PHP updated
4. ✅ Use prepared statements (already implemented)
5. ✅ Validate all user inputs (already implemented)
6. ✅ Use HTTPS in production
7. ✅ Set secure session cookies
8. ✅ Implement rate limiting
9. ✅ Regular security audits
10. ✅ Backup database daily

## Performance Optimization

1. Add indexes (done: user_email, status, priority_level)
2. Use database connection pooling
3. Cache frequently accessed data
4. Compress static assets
5. Use CDN for images
6. Enable gzip compression
7. Implement query caching
8. Monitor slow queries

## Support & Debugging

### Enable Debug Mode
Add to any PHP file to debug:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### Check Database
```bash
# Connect to database
mysql -u root -p observx

# List tables
SHOW TABLES;

# Check users
SELECT * FROM users;

# Check complaints
SELECT * FROM complaints LIMIT 5;
```

### View Error Logs
```bash
# Apache errors
tail -f /var/log/apache2/error.log

# PHP errors
tail -f /var/log/php_errors.log

# MySQL errors
tail -f /var/log/mysql/error.log
```

## Contact & Resources

- **Project Name**: ObservX
- **Database**: MySQL/MariaDB with observx database
- **API Format**: JSON
- **Authentication**: Session-based

---

**Last Updated**: February 25, 2026
**Status**: Production Ready
