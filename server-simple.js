// Production Backend Server for LAN Demo - Simplified Version
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Atlas connection with robust settings
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adityachandane71_db_user:adityamch2007@observex.fcerr8w.mongodb.net/observx?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true&connectTimeoutMS=30000&socketTimeoutMS=45000';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', /^http:\/\/192\.168\.\d+\.\d+:3000/, /^http:\/\/10\.\d+\.\d+\.\d+:3000/],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('dist'));

// File-based database setup
const DB_FILE = path.join(__dirname, 'data.json');

// Initialize database file
const initDB = async () => {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify({
      users: [],
      complaints: []
    }, null, 2));
  }
};

const readDB = async () => {
  await initDB();
  const data = await fs.readFile(DB_FILE, 'utf8');
  return JSON.parse(data);
};

const writeDB = async (data) => {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
};

// MongoDB connection management (fallback to file-based)
let db = null;
let client = null;
let useFileDB = false;

const connectToMongoDB = async () => {
  try {
    // Try local MongoDB first
    if (process.env.NODE_ENV === 'development') {
      try {
        client = new MongoClient('mongodb://localhost:27017/observx', {
          connectTimeoutMS: 5000,
          socketTimeoutMS: 10000
        });
        
        await client.connect();
        db = client.db('observx');
        console.log('✅ Local MongoDB connected successfully');
        return db;
      } catch (localError) {
        console.log('🔄 Local MongoDB failed, trying Atlas...');
      }
    }

    // Try Atlas if local fails or not in development
    if (client && client.isConnected()) {
      return db;
    }

    client = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    await client.connect();
    db = client.db('observx');
    console.log('✅ MongoDB Atlas connected successfully');
    return db;

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('📁 Using file-based database instead');
    useFileDB = true;
    await initDB();
    return null;
  }
};

// Demo user for fallback
const DEMO_USER = {
  id: 'demo_user_adii123',
  email: 'adii123@gmail.com',
  password: 'adii123',
  full_name: 'Adii User',
  mobile: '9876543210',
  address: 'Demo Address',
  role: 'user'
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    mongodb: db ? 'connected' : 'disconnected'
  });
});

// Registration endpoint
app.post('/api/registration', async (req, res) => {
  try {
    console.log('📝 Registration request:', req.body);

    const { email, password, full_name, mobile, address, role = 'user' } = req.body;

    // Validation
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required'
      });
    }

    // Try MongoDB first
    const database = await connectToMongoDB();
    
    if (database) {
      try {
        const users = database.collection('users');

        // Check if user exists
        const existingUser = await users.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'User with this email already exists'
          });
        }

        // Create new user
        const newUser = {
          email: email.toLowerCase().trim(),
          password, // In production, hash this password
          full_name: full_name.trim(),
          mobile: mobile || '',
          address: address || '',
          role,
          created_at: new Date(),
          updated_at: new Date()
        };

        const result = await users.insertOne(newUser);
        
        console.log('✅ User registered successfully:', email);
        
        return res.status(201).json({
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
        console.error('❌ MongoDB registration failed:', mongoError.message);
        // Fall through to file-based
      }
    }

    // File-based database fallback
    if (useFileDB) {
      try {
        const data = await readDB();
        
        // Check if user exists
        const existingUser = data.users.find(u => u.email === email.toLowerCase().trim());
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'User with this email already exists'
          });
        }

        // Create new user
        const newUser = {
          id: 'user_' + Date.now(),
          email: email.toLowerCase().trim(),
          password, // In production, hash this password
          full_name: full_name.trim(),
          mobile: mobile || '',
          address: address || '',
          role,
          created_at: new Date(),
          updated_at: new Date()
        };

        data.users.push(newUser);
        await writeDB(data);
        
        console.log('✅ User registered successfully (File DB):', email);
        
        return res.status(201).json({
          success: true,
          message: 'Registration successful',
          user_id: newUser.id,
          user: newUser
        });
      } catch (fileError) {
        console.error('❌ File DB registration failed:', fileError.message);
      }
    }

    // Demo mode fallback
    console.log('🔄 Using demo mode for registration');
    return res.status(201).json({
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

  } catch (error) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration: ' + error.message
    });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔐 Login request:', { email: req.body.email });

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check for demo credentials first
    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      console.log('✅ Demo login successful');
      return res.json({
        success: true,
        message: 'Login successful (Demo Mode)',
        user_id: DEMO_USER.id,
        user: {
          id: DEMO_USER.id,
          email: DEMO_USER.email,
          full_name: DEMO_USER.full_name,
          mobile: DEMO_USER.mobile,
          address: DEMO_USER.address,
          role: DEMO_USER.role
        }
      });
    }

    // Try MongoDB
    const database = await connectToMongoDB();
    
    if (database) {
      try {
        const users = database.collection('users');
        const user = await users.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'No account found with that email'
          });
        }

        // Simple password check (in production, use bcrypt)
        if (password === user.password) {
          const { password: _, ...userWithoutPassword } = user;
          
          console.log('✅ MongoDB login successful:', email);
          
          return res.json({
            success: true,
            message: 'Login successful',
            user_id: user._id.toString(),
            user: {
              id: user._id.toString(),
              email: user.email,
              full_name: user.full_name,
              mobile: user.mobile,
              address: user.address,
              role: user.role
            }
          });
        } else {
          return res.status(401).json({
            success: false,
            message: 'Incorrect password'
          });
        }

      } catch (mongoError) {
        console.error('❌ MongoDB login failed:', mongoError.message);
        // Fall through to demo check
      }
    }

    // If MongoDB fails and not demo credentials
    return res.status(401).json({
      success: false,
      message: `Invalid credentials. Use ${DEMO_USER.email} / ${DEMO_USER.password} for demo access`
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login: ' + error.message
    });
  }
});

// File complaint endpoint
app.post('/api/file-complaint', async (req, res) => {
  try {
    console.log('📋 Complaint request:', req.body);

    const { title, description, category, priority, location, user_id, user_name, user_contact } = req.body;

    // Validation
    if (!title || !description || !category || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and user ID are required'
      });
    }

    // Try MongoDB
    const database = await connectToMongoDB();
    
    if (database) {
      try {
        const complaints = database.collection('complaints');
        
        const newComplaint = {
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          priority: priority || 'medium',
          location: location || '',
          user_id,
          user_name: user_name || 'Anonymous',
          user_contact: user_contact || '',
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        };

        const result = await complaints.insertOne(newComplaint);
        
        console.log('✅ Complaint filed successfully:', result.insertedId.toString());
        
        return res.status(201).json({
          success: true,
          message: 'Complaint filed successfully',
          complaint_id: result.insertedId.toString(),
          complaint: {
            id: result.insertedId.toString(),
            ...newComplaint
          }
        });

      } catch (mongoError) {
        console.error('❌ MongoDB complaint failed:', mongoError.message);
        // Fall through to demo mode
      }
    }

    // Demo mode fallback
    const demoComplaintId = 'demo_' + Date.now();
    console.log('🔄 Using demo mode for complaint');
    
    return res.status(201).json({
      success: true,
      message: 'Complaint filed successfully (Demo Mode)',
      complaint_id: demoComplaintId,
      complaint: {
        id: demoComplaintId,
        title,
        description,
        category,
        priority: priority || 'medium',
        location: location || '',
        user_id,
        user_name: user_name || 'Anonymous',
        user_contact: user_contact || '',
        status: 'pending',
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Complaint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while filing complaint: ' + error.message
    });
  }
});

// Get complaints endpoint
app.get('/api/get-complaints', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Try MongoDB
    const database = await connectToMongoDB();
    
    if (database) {
      try {
        const complaints = database.collection('complaints');
        const userComplaints = await complaints.find({ user_id }).sort({ created_at: -1 }).toArray();
        
        console.log(`✅ Found ${userComplaints.length} complaints for user:`, user_id);
        
        return res.json({
          success: true,
          message: 'Complaints retrieved successfully',
          complaints: userComplaints.map(complaint => ({
            id: complaint._id.toString(),
            title: complaint.title,
            description: complaint.description,
            category: complaint.category,
            priority: complaint.priority,
            location: complaint.location,
            status: complaint.status,
            created_at: complaint.created_at
          }))
        });

      } catch (mongoError) {
        console.error('❌ MongoDB get complaints failed:', mongoError.message);
        // Fall through to demo mode
      }
    }

    // Demo mode fallback
    console.log('🔄 Using demo mode for complaints');
    const demoComplaints = [
      {
        id: 'demo_1',
        title: 'Demo Complaint 1',
        description: 'This is a sample complaint for demonstration',
        category: 'Infrastructure',
        priority: 'medium',
        location: 'Demo Location',
        status: 'pending',
        created_at: new Date()
      },
      {
        id: 'demo_2',
        title: 'Demo Complaint 2',
        description: 'Another sample complaint for testing',
        category: 'Security',
        priority: 'high',
        location: 'Demo Location 2',
        status: 'resolved',
        created_at: new Date(Date.now() - 86400000) // Yesterday
      }
    ];
    
    return res.json({
      success: true,
      message: 'Complaints retrieved successfully (Demo Mode)',
      complaints: demoComplaints
    });

  } catch (error) {
    console.error('❌ Get complaints error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving complaints: ' + error.message
    });
  }
});

// Start server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 === SERVER STARTED === 🚀');
  console.log(`📡 Server running on all interfaces (0.0.0.0:${PORT})`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  console.log(`🏠 LAN access: http://<YOUR_LOCAL_IP>:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Registration: http://localhost:${PORT}/api/registration`);
  console.log(`🔐 Login: http://localhost:${PORT}/api/login`);
  console.log(`📋 File Complaint: http://localhost:${PORT}/api/file-complaint`);
  console.log(`📱 Demo Login: ${DEMO_USER.email} / ${DEMO_USER.password}`);
  console.log('========================\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});
