PHP login/register demo

Files added:
- `db.php` - simple JSON-backed user helper (load/save/find/add)
- `users.json` - initially empty user store
- `register.php` - registration form (creates users in `users.json`)
- `login.php` - login form and handler (redirects to `dashboard.php` on success)
- `dashboard.php` - protected page requiring login
- `logout.php` - clears session and redirects to login

How to test locally (Windows):
1. Ensure you have PHP installed and `php` available in PATH.
2. Start PHP built-in server in the project root:

```powershell
php -S localhost:8000
```

3. Open https://observx.netlify.app/adii/register.php to create a test user, then visit https://observx.netlify.app/adii/login.php to login.

Notes:
- This is a simple demo using `users.json` for storage. For production, switch to a proper database and secure configuration.
- Passwords are hashed with `password_hash()`.
