import express from 'express';
import path from 'path';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('dist'));

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb+srv://adityachandane71_db_user:adityamch2007@observex.fcerr8w.mongodb.net/observx?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true';

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Registration endpoint
app.post('/api/registration', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { email, password, full_name, mobile, address, role = 'user' } = req.body;
    
    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, and full name are required' 
      });
    }

    // Try MongoDB connection with fallback
    try {
      const client = new MongoClient(uri);
      await client.connect();
      const database = client.db('observx');
      const users = database.collection('users');

      // Check if user already exists
      const existingUser = await users.findOne({ email });
      if (existingUser) {
        await client.close();
        return res.status(409).json({ 
          success: false, 
          message: 'User with this email already exists' 
        });
      }

      // Create new user
      const newUser = {
        email,
        password,
        full_name,
        mobile: mobile || '',
        address: address || '',
        role,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await users.insertOne(newUser);
      await client.close();

      return res.json({
        success: true,
        message: 'Registration successful',
        user_id: result.insertedId.toString(),
        user: {
          id: result.insertedId.toString(),
          email,
          full_name,
          mobile,
          address,
          role
        }
      });

    } catch (mongoError) {
      console.error('MongoDB connection error:', mongoError.message);
      
      // Fallback for demo when MongoDB is not available
      return res.json({
        success: true,
        message: 'Registration successful (Demo Mode)',
        user_id: 'demo_' + Date.now(),
        user: {
          id: 'demo_' + Date.now(),
          email,
          full_name,
          mobile,
          address,
          role
        }
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during registration: ' + error.message 
    });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Try MongoDB connection with fallback
    try {
      const client = new MongoClient(uri);
      await client.connect();
      const database = client.db('observx');
      const users = database.collection('users');

      const user = await users.findOne({ email });
      
      if (!user) {
        await client.close();
        return res.status(404).json({ 
          success: false, 
          message: 'No account found with that email' 
        });
      }

      // Simple password check for demo
      if (password === user.password) {
        const { password: _, ...userWithoutPassword } = user;
        await client.close();

        return res.json({
          success: true,
          message: 'Login successful',
          user_id: user._id.toString(),
          user: userWithoutPassword
        });
      } else {
        await client.close();
        return res.status(401).json({ 
          success: false, 
          message: 'Incorrect password' 
        });
      }

    } catch (mongoError) {
      console.error('MongoDB connection error:', mongoError.message);
      
      // Fallback for demo when MongoDB is not available
      return res.json({
        success: true,
        message: 'Login successful (Demo Mode)',
        user_id: 'demo_' + Date.now(),
        user: {
          id: 'demo_' + Date.now(),
          email,
          full_name: 'Demo User',
          role: 'user'
        }
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during login: ' + error.message 
    });
  }
});

// Serve static files - catch all route
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Registration: http://localhost:${PORT}/api/registration`);
  console.log(`🔐 Login: http://localhost:${PORT}/api/login`);
  console.log(`🌐 Website: http://localhost:${PORT}`);
});
