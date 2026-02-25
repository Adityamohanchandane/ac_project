# ObservX Deployment Guide

## Quick Setup for Production Hosting

### 1. Database Configuration

Edit `config.php` and update the database settings:

```php
$host = "YOUR_HOST";           // Usually "localhost" for shared hosting
$user = "YOUR_USERNAME";       // Your database username
$password = "YOUR_PASSWORD";   // Your database password
$database = "YOUR_DATABASE";   // Your database name
```

### 2. Database Import

Import the database schema from `db_schema.sql`:
```sql
-- Import this file into your MySQL database
-- Creates users, police_stations, and complaints tables
```

### 3. File Permissions

Ensure the following directories have write permissions:
- `uploads/` (for file uploads)

### 4. Environment Variables (Optional)

You can use environment variables instead of editing config.php:

```bash
export DB_HOST="localhost"
export DB_USER="username"
export DB_PASSWORD="password"
export DB_NAME="observx"
```

### 5. Upload Files

Upload all files to your hosting server:
- All PHP files
- All JavaScript files
- All CSS files
- The `uploads/` directory (empty)

### 6. Test the Application

1. Visit your domain
2. Test user registration
3. Test police login
4. Test complaint filing
5. Test file uploads

## Default Police Account

Email: `police@observx.gov`
Password: `Police@123`

## Features Enabled

✅ **GPS Location Tracking** - Works on HTTPS
✅ **File Uploads** - Max 10MB, images and PDFs
✅ **Police Station Assignment** - Automatic via Haversine formula
✅ **Emergency Complaints** - Priority handling
✅ **User Dashboard** - View and manage complaints
✅ **Police Dashboard** - Station-specific complaints with auto-refresh

## Troubleshooting

### File Upload Issues
- Check `uploads/` directory permissions (755)
- Ensure PHP upload limits are sufficient

### Database Connection
- Verify database credentials in config.php
- Check if database exists and tables are imported

### GPS Not Working
- Ensure site is served over HTTPS
- Check browser location permissions

### Blank Pages
- Check PHP error logs
- Ensure all required files are uploaded

## Security Notes

- Change default police password immediately
- Use HTTPS in production
- Regularly update database passwords
- Monitor file uploads for security

## Support

For issues, check:
1. Browser console for JavaScript errors
2. PHP error logs for server issues
3. Database connection status
