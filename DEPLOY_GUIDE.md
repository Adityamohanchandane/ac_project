# 🚀 ObservX Deployment Guide

## 📋 DEPLOYMENT CHECKLIST

### ✅ **BEFORE YOU DEPLOY**

1. **Database Setup**
   - [ ] Create MySQL database named `observx`
   - [ ] Import `db_schema.sql` into database
   - [ ] Create database user with permissions

2. **Configuration**
   - [ ] Update database credentials in `db.php` (line 49-55)
   - [ ] Test database connection

3. **Files Ready**
   - [ ] All PHP files uploaded
   - [ ] `uploads/` directory created (755 permissions)
   - [ ] `index.html` as main entry point

## 🌐 DEPLOYMENT OPTIONS

### **OPTION 1: Shared Hosting (cPanel, Plesk, etc.)**

1. **Upload Files**
   ```
   Upload all files to public_html/adii/
   or your-domain.com/
   ```

2. **Set Permissions**
   ```
   uploads/ directory → 755
   All PHP files → 644
   ```

3. **Database Setup**
   ```
   1. Go to hosting control panel
   2. Create MySQL database: observx
   3. Import db_schema.sql
   4. Update db.php with your credentials
   ```

4. **Test Application**
   ```
   Visit: https://your-domain.com/
   ```

### **OPTION 2: VPS/Dedicated Server**

1. **Install Requirements**
   ```bash
   sudo apt update
   sudo apt install apache2 mysql-server php php-mysql
   ```

2. **Configure Apache**
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

3. **Setup Database**
   ```bash
   mysql -u root -p
   CREATE DATABASE observx;
   EXIT;
   mysql -u root -p observx < db_schema.sql
   ```

4. **Deploy Files**
   ```bash
   sudo cp -r /path/to/adii/* /var/www/html/
   sudo chown -R www-data:www-data /var/www/html/
   sudo chmod -R 755 /var/www/html/
   ```

### **OPTION 3: Cloud Platform (Heroku, DigitalOcean, etc.)**

1. **Create App**
   - Choose PHP platform
   - Add MySQL addon

2. **Deploy**
   - Connect Git repository
   - Push code
   - Set environment variables

## 🔧 CONFIGURATION UPDATES

### **Update db.php**
```php
// Line 49-55 in db.php
$host = "YOUR_DATABASE_HOST";     // Usually "localhost"
$user = "YOUR_DATABASE_USER";     // Your MySQL username
$pass = "YOUR_DATABASE_PASSWORD"; // Your MySQL password
$db   = "observx";             // Database name
```

### **Update URLs (if needed)**
All URLs are relative - should work automatically
If you need absolute URLs, update in `main.js`:
```javascript
const backendBase = 'https://your-domain.com';
```

## 🧪 DEPLOYMENT TESTING

### **After Deployment - Test These URLs:**

1. **Main Application**
   ```
   https://your-domain.com/
   ```

2. **Registration**
   ```
   https://your-domain.com/register.php
   ```

3. **Login**
   ```
   https://your-domain.com/login.php
   ```

4. **Police Login**
   ```
   https://your-domain.com/police-login.php
   ```

5. **API Tests**
   ```
   https://your-domain.com/get_complaints.php
   https://your-domain.com/file_complaint.php
   ```

## 🚨 COMMON DEPLOYMENT ISSUES

### **Database Connection Failed**
- Check database credentials in db.php
- Verify database exists
- Check user permissions

### **404 Errors**
- Ensure .htaccess is uploaded
- Check file permissions
- Verify Apache mod_rewrite enabled

### **File Upload Issues**
- Set uploads/ directory to 755 permissions
- Check PHP upload limits in php.ini
- Verify disk space

### **Session Issues**
- Check PHP session path
- Ensure cookies enabled
- Verify HTTPS/HTTP consistency

## 📱 MOBILE RESPONSIVENESS

The application is fully responsive and will work on:
- ✅ Desktop browsers
- ✅ Tablets
- ✅ Mobile phones
- ✅ All modern browsers

## 🔒 SECURITY NOTES

1. **Change Default Passwords**
   - Police login: `police@observx.gov` / `Police@123`
   - Update in database after first login

2. **HTTPS Required**
   - Enable SSL certificate
   - Geolocation requires HTTPS

3. **File Upload Security**
   - Files go to uploads/ directory
   - Max size: 10MB
   - Allowed: jpg, png, pdf, mp4

## 📊 MONITORING

### **Check These After Deployment:**
- User registration works
- Login/logout functions
- Complaint submission
- File uploads
- Police dashboard
- Mobile responsiveness

## 🆘 SUPPORT

If issues occur:
1. Check browser console (F12)
2. Check server error logs
3. Test individual PHP files
4. Verify database connection

---

**🎯 Your application is ready for deployment!**
