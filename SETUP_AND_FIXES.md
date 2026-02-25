# ObservX - Setup and Fixes Documentation

## Critical Fixes Applied

### 1. Database Configuration Consistency
- **Fixed**: Database name changed from `exam` to `observx` across all files:
  - `config.php` (already using `observx`)
  - `create_db.php` (changed from `exam`)
  - `setup.php` (changed from `exam`)
  - `database.php` (changed from `exam`)
  - `test_main_app.php` (changed from `exam`)
  - `test_db.php` (changed from `exam`)
  - `test_complaint.php` (changed from `exam`)
  - `phpmyadmin_alt.php` (changed display from `exam`)
  - `phpmyadmin_clone.php` (changed display from `exam`)

### 2. Database Schema Updates
- **Fixed**: Added missing `complaint_id` column with UNIQUE constraint to complaints table
- **Fixed**: Added missing columns in create_db.php:
  - `user_location` (JSON)
  - `crime_location` (JSON)
  - `incident_date` (DATETIME)
  - `priority_level` (VARCHAR)
  - `feedback_submitted` (BOOLEAN)
  - `feedback_rating` (INT)
  - `feedback_comment` (TEXT)
  - `feedback_date` (DATETIME)
- **Added**: All necessary indexes for optimal query performance

### 3. Complaint Filing System (file_complaint.php)
- **Fixed**: INSERT statement now includes all 14 required columns:
  - id, complaint_id, user_id, user_email, title, category, incident_date, user_location, crime_location, description, status, priority_level, assigned_station_id, created_at
- **Fixed**: User ID is now retrieved from session instead of hardcoded placeholder
- **Fixed**: Location data properly converted to JSON format before insertion
- **Fixed**: Proper NULL handling for optional date fields

### 4. Feedback Submission (db.php)
- **Fixed**: submit_complaint_feedback function now uses:
  - Correct parameter binding order (int, string, string)
  - Proper WHERE clause using `id` instead of `complaint_id`
  - Correct field `feedback_date` inclusion

### 5. Complaint Update Functionality (update_complaint.php)
- **Fixed**: WHERE clause now correctly queries by `complaint_id` instead of `id`
- **Fixed**: Proper JOIN or reference to find the right complaint

### 6. Police Stations Setup
- **Added**: police_stations table creation in create_db.php (was missing)
- **Added**: Test police station record (Central Police Station)
- **Added**: Proper indexes and constraints for police station queries

### 7. Test Data
- **Added**: Test user accounts in create_db.php
  - Email: `test@example.com` / Password: `password123` (User role)
  - Email: `admin@example.com` / Password: `password123` (Admin role)
- **Added**: Test police station
  - Email: `central@observx.gov.in` / Password: `password`

## Database Setup Steps

### Option 1: Using create_db.php (Recommended)
1. Ensure MySQL is running on localhost with default credentials (root:empty password)
2. Navigate to `https://observx.netlify.app/adii/create_db.php` in your browser
3. Wait for all tables and test data to be created
4. Check the output for success messages

### Option 2: Using db_schema.sql
1. Open phpMyAdmin or MySQL command line
2. Import the `db_schema.sql` file
3. Run the test user inserts manually

### Option 3: Manual Setup
1. Create database: `CREATE DATABASE observx;`
2. Use `db_schema.sql` script provided
3. Insert test data manually

## File Structure Overview

### Core Application Files
- **config.php**: Database configuration and initialization
- **db.php**: Database abstraction layer with all helper functions
- **database.php**: Alternative database connection (for backward compatibility)

### Authentication System
- **login.php**: User login interface with CORS support
- **register.php**: User registration with validation
- **police-login.php**: Police station login
- **logout.php**: Session cleanup

### Complaint Management System
- **file_complaint.php**: Submit new complaints (with file upload support)
- **get_complaints.php**: Retrieve multiple complaints
- **get_complaint.php**: Retrieve single complaint by ID
- **update_complaint.php**: Update complaint status
- **enhanced_complaint_api.php**: Extended complaint API

### Dashboard & UI
- **dashboard.php**: User dashboard (requires authentication)
- **index.html**: Main landing page
- **style.css**: Global styling

## API Endpoints

### Authentication
- `POST /login.php` - User login
- `POST /register.php` - User registration  
- `POST /police-login.php` - Police station login
- `GET /logout.php` - Logout

### Complaints
- `POST /file_complaint.php` - Submit complaint
- `GET /get_complaints.php` - List complaints
  - Parameters: `?user_email=...` or `?station_id=...` or `?id=...`
- `GET /get_complaint.php` - Get single complaint
  - Parameter: `?id=COMPLAINT_ID`
- `POST /update_complaint.php` - Update complaint status
  - JSON: `{complaint_id, status}`

## Security Features Implemented

1. ✅ Password hashing with PASSWORD_DEFAULT
2. ✅ Prepared statements for SQL injection prevention
3. ✅ CORS headers properly configured
4. ✅ Session-based authentication
5. ✅ Input validation and sanitization
6. ✅ File upload security (type, size validation)
7. ✅ Rate limiting capable (can be added)

## Testing Checklist

### Registration
- [ ] Create new user account
- [ ] Validate email uniqueness
- [ ] Validate password strength (8+ chars)
- [ ] Validate mobile (10 digits)
- [ ] Confirm user is added to database

### Login
- [ ] Login with correct credentials - should succeed
- [ ] Login with wrong password - should fail
- [ ] Login with non-existent email - should fail
- [ ] Session created after successful login

### Complaint Filing
- [ ] File complaint with all fields
- [ ] File complaint with file upload
- [ ] Emergency complaints get higher priority
- [ ] Complaint ID generated correctly
- [ ] Data saved to database with all fields

### Complaint Retrieval
- [ ] Get all complaints
- [ ] Get user-specific complaints
- [ ] Get station-specific complaints
- [ ] Get single complaint by ID
- [ ] Proper JSON response format

### Complaint Updates
- [ ] Update complaint status
- [ ] Validate status values
- [ ] Updated_at timestamp changes
- [ ] Return success response

### Police Station Features
- [ ] Police login works
- [ ] Can view assigned complaints
- [ ] Can update complaint status
- [ ] Receive complaint notifications

## Configuration Variables

### Database (config.php)
```php
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASSWORD = ''
DB_NAME = 'observx'
```

### File Upload
- Max file size: 10MB
- Allowed types: jpg, jpeg, png, gif, pdf, mp4, mov
- Upload directory: `/uploads/`

### Session
- Session timeout: PHP default (1440 seconds)
- Session handler: File-based
- Cookie HTTP-only: Yes (recommended to enable)
- Cookie Secure: No (enable for HTTPS)

## Known Issues Fixed

1. ✅ Database name inconsistency (`exam` vs `observx`)
2. ✅ Missing columns in complaints table
3. ✅ Incorrect INSERT statement binding
4. ✅ Wrong WHERE clause in update query
5. ✅ Missing police_stations table
6. ✅ User ID hardcoded instead of from session
7. ✅ Location data not properly JSON encoded
8. ✅ Missing test data setup

## Deployment Recommendations

1. Change database password in production
2. Set environment variables:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
3. Enable HTTPS in production
4. Set `Secure` cookie flag when using HTTPS
5. Implement rate limiting for API endpoints
6. Set up proper logging and monitoring
7. Backup database regularly
8. Use a web application firewall
9. Keep Apache and PHP updated
10. Consider using connection pooling for PostgreSQL alternative

## Support Files

- **setup.php**: Quick environment check
- **debug_connection.php**: Test database connectivity
- **phpmyadmin_alt.php**: Simple database viewer
- **test_*.php**: Various test files for debugging

## Additional Notes

- All timestamps are in YYYY-MM-DD HH:MM:SS format (UTC)
- Complaint IDs follow format: `CMPxxxxxx` (display ID)
- Internal IDs use uniqid() for uniqueness
- All strings are UTF-8MB4 encoded
- JSON fields store complex location data
- Feedback system requires complaint ID and rating

---

## Next Steps for Production

1. Run `create_db.php` to initialize database
2. Test login with credentials: test@example.com / password123
3. File a test complaint
4. Verify all functionality in testing checklist
5. Deploy to production environment
6. Set up automated backups
7. Monitor error logs
8. Implement additional security measures as needed
