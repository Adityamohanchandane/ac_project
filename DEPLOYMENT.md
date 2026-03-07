# ObservX Police Complaint System - Deployment Guide

## 🚀 Render Deployment

### Prerequisites
- Render account (free tier available)
- MongoDB Atlas account (free tier available)
- GitHub repository with your code

### Step 1: Prepare Your Repository
1. Push all changes to GitHub
2. Ensure `.env.example` is included (but not `.env`)
3. Make sure `render.yaml` is in the root

### Step 2: Configure Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: observx-police-system
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`

### Step 3: Environment Variables
Set these in Render Dashboard → Environment Variables:

```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/observx?retryWrites=true&w=majority
JWT_SECRET=your_unique_secret_key_here
CORS_ORIGIN=*
```

### Step 4: MongoDB Atlas Setup
1. Create a free MongoDB Atlas account
2. Create a new cluster (free tier)
3. Create a database user
4. Get your connection string
5. Add your Render IP to whitelist (0.0.0.0/0 for Render)

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Test your application at the provided URL

## 🔧 Configuration Files

### vite.config.js
✅ Already configured for Render deployment
- `host: true` - Allows external connections
- `allowedHosts` - Includes your Render domain
- `preview` config for production builds

### render.yaml
✅ Render blueprint configuration
- Defines web service settings
- Sets build and start commands
- Configures health checks

### .env.example
✅ Environment variables template
- Copy to `.env` for local development
- Use values in Render dashboard

## 🐛 Troubleshooting

### "Host not allowed" Error
✅ **Fixed**: Added `ac-project-g7c0.onrender.com` to `allowedHosts`

### Database Connection Issues
- Check MongoDB URI format
- Ensure IP whitelisting in Atlas
- Verify environment variables

### Build Failures
- Check `package.json` scripts
- Verify all dependencies are installed
- Check build logs for specific errors

### 502 Bad Gateway
- Check health check endpoint: `/api/health`
- Verify server is listening on correct port
- Check server logs

## 📱 Testing Your Deployment

1. **Health Check**: Visit `https://your-app.onrender.com/api/health`
2. **Frontend**: Visit `https://your-app.onrender.com`
3. **Registration**: Test user registration
4. **Login**: Test user login
5. **Complaint Filing**: Test with and without files

## 🔒 Security Considerations

- Use strong JWT secret
- Enable MongoDB authentication
- Use HTTPS (automatic on Render)
- Don't commit `.env` file
- Regularly update dependencies

## 📊 Monitoring

Render provides built-in monitoring:
- Response times
- Error rates
- Resource usage
- Custom metrics

## 🔄 CI/CD

Render automatically deploys on:
- Push to main branch
- Pull requests (if enabled)
- Manual redeployment

## 💡 Pro Tips

1. **Use Render's free tier** for development
2. **Set up custom domain** for production
3. **Enable auto-deploy** for seamless updates
4. **Monitor logs** for debugging
5. **Use health checks** for reliability

## 🆘 Support

- Render Documentation: https://render.com/docs
- MongoDB Atlas Docs: https://docs.mongodb.com/atlas
- This project's GitHub Issues
