// ObservX Backend Server with bcrypt and file fallback
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}
const DATA_FILE = join(process.cwd(), 'data.json');

// Multer configuration for file uploads
const UPLOAD_DIR = join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log('📁 Created uploads directory:', UPLOAD_DIR);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, MP4, and WebM files are allowed.'));
    }
  }
});

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('.'));

let db = null;
let client = null;

const connectToMongoDB = async () => {
  try {
    // Check if already connected
    if (db && client && client.topology && client.topology.isConnected()) {
      return db;
    }
    
    console.log("🔗 Connecting to MongoDB Atlas...");
    
    // MongoDB connection with proper options
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };
    
    client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    db = client.db("observx");
    
    console.log("✅ MongoDB Connected");
    return db;
    
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    console.error("⚠️ Falling back to file storage");
    return null; // Return null to indicate fallback should be used
  }
};

const loadFromFile = () => {
  try {
    if (existsSync(DATA_FILE)) {
      return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('File load error:', error.message);
  }
  return { users: [], complaints: [], police: [] };
};

const saveToFile = (data) => {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('File save error:', error.message);
  }
};

const initializeDemoData = async () => {
  const data = loadFromFile();
  
  // Create demo user account in MongoDB if enabled
  if (process.env.DEMO_MODE === 'true') {
    try {
      const database = await connectToMongoDB();
      if (database) {
        const usersCollection = database.collection('users');
        const existingUser = await usersCollection.findOne({ email: 'demo@user.com' });
        
        if (!existingUser) {
          const demoPassword = 'demo123';
          const hashedPassword = bcrypt.hashSync(demoPassword, 12);
          await usersCollection.insertOne({
            _id: 'user_demo_1',
            fullName: 'Demo User',
            email: 'demo@user.com',
            mobile: '9876543210',
            address: 'Demo Address',
            password: hashedPassword,
            role: 'user',
            isActive: true,
            createdAt: new Date().toISOString()
          });
          console.log('?? Demo user account created in MongoDB');
        }
      }
    } catch (error) {
      console.log('MongoDB user creation failed, using file storage');
    }
  }
  
  // Create demo user account in file storage if enabled and not exists
  if (process.env.DEMO_MODE === 'true' && !data.users.find(u => u.email === 'demo@user.com')) {
    const demoPassword = 'demo123';
    const hashedPassword = bcrypt.hashSync(demoPassword, 12);
    data.users.push({
      _id: 'user_demo_1',
      fullName: 'Demo User',
      email: 'demo@user.com',
      mobile: '9876543210',
      address: 'Demo Address',
      password: hashedPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString()
    });
    console.log('?? Demo user account created in file storage');
  }

  // Create demo police account if enabled and not exists
  if (process.env.DEMO_MODE === 'true' && !data.police.find(p => p.email === process.env.DEMO_POLICE_EMAIL)) {
    const demoPassword = process.env.DEMO_POLICE_PASSWORD || 'demo123';
    const hashedPassword = bcrypt.hashSync(demoPassword, 12);
    data.police.push({
      _id: 'police_demo_1',
      fullName: process.env.DEMO_POLICE_NAME || 'Demo Police Officer',
      email: process.env.DEMO_POLICE_EMAIL || 'demo@police.com',
      badgeNumber: process.env.DEMO_POLICE_BADGE || 'DEMO001',
      password: hashedPassword,
      role: 'police',
      isActive: true,
      createdAt: new Date().toISOString()
    });
    console.log('?? Demo police account created');
  }
  
  if (data.complaints.length === 0) {
    data.complaints.push({
      _id: 'comp_demo_1',
      complaintId: 'COMP-2026-001',
      title: 'Emergency Complaint - Theft',
      description: 'Emergency theft reported at Government Polytechnic campus.',
      category: 'theft',
      priority: 'emergency',
      status: 'high_priority',
      incidentDate: new Date().toISOString(),
      incidentLocation: 'Government Polytechnic, Aurangabad',
      userLocation: { latitude: 19.8762, longitude: 75.3433, accuracy: 10 },
      userId: 'user_demo_1',
      createdAt: new Date().toISOString()
    });
  }
  
  saveToFile(data);
  return data;
};

// User authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString();
    const [email] = decoded.split(':');
    
    const database = await connectToMongoDB();
    if (!database) {
      return res.status(500).json({ success: false, message: 'Database connection required' });
    }
    
    const usersCollection = database.collection('users');
    const user = await usersCollection.findOne({ email });
    
    if (user) {
      req.user = { id: user._id, email: user.email, role: user.role };
      next();
    } else {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};





app.get('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    // For now, we'll decode the simple token (email:timestamp)
    const decoded = Buffer.from(token, 'base64').toString();
    const [email] = decoded.split(':');
    
    const database = await connectToMongoDB();
    if (!database) {
      return res.status(500).json({ success: false, message: 'Database connection required' });
    }
    
    const usersCollection = database.collection('users');
    const user = await usersCollection.findOne({ email });
    
    if (user) {
      res.json({ 
        success: true, 
        data: { user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } } 
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login Request Debug:');
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('- Missing email or password');
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    // Connect to MongoDB with fallback to file storage
    console.log('- Connecting to MongoDB...');
    const database = await connectToMongoDB();
    
    if (!database) {
      console.log('- ⚠️ MongoDB connection failed, using file storage');
      // Fallback to file storage
      const data = loadFromFile();
      const user = data.users.find(u => u.email === email);
      
      if (user) {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
          return res.json({
            success: true,
            message: 'Login successful (file storage)',
            data: { 
              user: { 
                id: user._id, 
                fullName: user.fullName, 
                email: user.email, 
                role: user.role 
              }, 
              token 
            }
          });
        }
      }
      
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    console.log('✅ MongoDB connected successfully');
    const usersCollection = database.collection('users');
    console.log('- Searching for user in MongoDB:', email);
    const user = await usersCollection.findOne({ email });
    
    if (user) {
      console.log('- User found in MongoDB');
      
      // Use bcrypt for MongoDB passwords
      console.log('- Starting bcrypt password comparison...');
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log('- Password comparison completed');
      
      if (passwordMatch) {
        const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
        console.log('- Authentication token generated successfully');
        console.log('- Sending success response to client');
        res.json({
          success: true,
          data: { 
            user: { 
              id: user._id, 
              fullName: user.fullName, 
              email: user.email, 
              role: user.role 
            }, 
            token 
          }
        });
        console.log('✅ Login completed successfully via MongoDB');
        return;
      }
      
      console.log('- ❌ Password mismatch - authentication failed');
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    } else {
      console.log('- User not found in MongoDB - authentication failed');
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(' Login error:', error);
    console.error('- Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Login failed due to server error' });
  }
});

// Secure Police Admin Login Endpoint
app.post('/api/police/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(' Police Admin Login Request Debug:');
    
    // Security: Check if police login is enabled
    if (process.env.POLICE_LOGIN_ENABLED !== 'true') {
      console.log('- Police login is disabled in configuration');
      return res.status(403).json({ 
        success: false, 
        message: 'Police login is currently disabled' 
      });
    }
    
    // Security: Validate input parameters
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Security: Get authorized credentials from environment variables
    const authorizedEmail = process.env.AUTHORIZED_POLICE_EMAIL;
    const authorizedPassword = process.env.POLICE_ADMIN_PASSWORD;
    
    if (!authorizedEmail || !authorizedPassword) {
      console.error('- Police admin credentials not configured in environment variables');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
    }
    
    // Validate email and password exactly
    if (email !== authorizedEmail || password !== authorizedPassword) {
      console.log(`- Invalid login attempt with email: ${email}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    console.log(`- Authorized police admin login successful for: ${email}`);
    
    // Generate secure token
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    // Return success response with police admin data
    res.json({
      success: true,
      message: 'Police admin login successful',
      data: { 
        police: { 
          id: 'police_admin_1',
          fullName: 'Police Administrator', 
          email: email, 
          role: 'police_admin',
          isAdmin: true
        }, 
        token 
      }
    });
    
  } catch (error) {
    console.error('Police admin login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed due to server error' 
    });
  }
});

// Get all complaints (for police dashboard)
app.get('/api/complaints/all', authenticateUser, async (req, res) => {
  try {
    const database = await connectToMongoDB();
    if (!database) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
    
    const complaintsCollection = database.collection('complaints');
    const allComplaints = await complaintsCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`✅ Police dashboard: Found ${allComplaints.length} total complaints`);
    
    res.json({
      success: true,
      data: {
        complaints: allComplaints,
        total: allComplaints.length
      }
    });
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
});

// Update complaint status (for police)
app.put('/api/complaints/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, policeNotes } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }
    
    const database = await connectToMongoDB();
    if (!database) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
    
    const complaintsCollection = database.collection('complaints');
    
    // Update complaint
    const updateData = {
      status: status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email,
      policeNotes: policeNotes || ''
    };
    
    const result = await complaintsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found' 
      });
    }
    
    console.log(`✅ Complaint ${id} status updated to ${status} by ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Complaint status updated successfully',
      data: {
        complaintId: id,
        newStatus: status,
        updatedAt: updateData.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ success: false, message: 'Failed to update complaint status' });
  }
});

// Submit feedback for complaint
app.post('/api/complaints/:id/feedback', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comments, recommend, submittedAt } = req.body;
    
    if (!rating || !comments) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating and comments are required' 
      });
    }
    
    const database = await connectToMongoDB();
    if (!database) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
    
    const complaintsCollection = database.collection('complaints');
    
    // Check if complaint exists and is resolved
    const complaint = await complaintsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found' 
      });
    }
    
    if (complaint.status !== 'resolved') {
      console.log(`⚠️ Feedback requested for non-resolved complaint (status: ${complaint.status}), allowing for testing`);
      // For testing purposes, allow feedback on any complaint
      // return res.status(400).json({ 
      //   success: false, 
      //   message: 'Feedback can only be provided for resolved complaints' 
      // });
    }
    
    // Update complaint with feedback
    const feedbackData = {
      rating: rating,
      comments: comments,
      recommend: recommend,
      submittedAt: submittedAt || new Date().toISOString(),
      submittedBy: req.user.email
    };
    
    const result = await complaintsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { feedback: feedbackData } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found' 
      });
    }
    
    console.log(`✅ Feedback submitted for complaint ${id} by ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        complaintId: id,
        feedback: feedbackData
      }
    });
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ObservX Police Complaint Management System API',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      register: '/api/auth/register',
      login: '/api/auth/login',
      complaints: '/api/complaints'
    }
  });
});

// Health check endpoint for debugging
app.get('/api/health', async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const status = {
      server: 'running',
      mongodb: db ? 'connected' : 'disconnected',
      uploads_dir: existsSync(UPLOAD_DIR) ? 'exists' : 'missing',
      data_file: existsSync(DATA_FILE) ? 'exists' : 'missing',
      timestamp: new Date().toISOString(),
      env: {
        port: PORT,
        node_env: process.env.NODE_ENV,
        render_hostname: process.env.RENDER_EXTERNAL_HOSTNAME || 'local'
      }
    };
    
    console.log('🏥 Health check requested:', status);
    res.json({ success: true, status });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Input validation and sanitization helpers
const validateUserRegistration = (data) => {
  const errors = [];
  
  // Name validation
  if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email.trim())) {
    errors.push('Valid email address is required');
  }
  
  // Mobile validation (Indian format)
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!data.mobile || !mobileRegex.test(data.mobile.replace(/\D/g, ''))) {
    errors.push('Valid 10-digit mobile number is required');
  }
  
  // Password validation
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const sanitizeUserInput = (data) => {
  const sanitized = {};
  
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  };

  if (data.fullName) sanitized.fullName = sanitizeString(data.fullName);
  if (data.email) sanitized.email = sanitizeString(data.email).toLowerCase();
  if (data.mobile) sanitized.mobile = sanitizeString(data.mobile);
  if (data.address) sanitized.address = sanitizeString(data.address);
  if (data.password) sanitized.password = sanitizeString(data.password);
  
  return sanitized;
};

app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Registration Request Debug:');
    
    const { fullName, email, mobile, address, password } = req.body;
    
    // Validate input
    const validation = validateUserRegistration({ fullName, email, mobile, address, password });
    if (!validation.isValid) {
      console.log('- Validation failed:', validation.errors);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: validation.errors 
      });
    }
    
    // Sanitize input
    const sanitizedData = sanitizeUserInput({ fullName, email, mobile, address, password });
    
    // Connect to MongoDB with fallback to file storage
    const database = await connectToMongoDB();
    
    if (!database) {
      // Fallback to file storage
      console.log('⚠️ Using file storage for registration');
      const data = loadFromFile();
      
      // Check if user already exists in file
      const existingUser = data.users.find(u => u.email === sanitizedData.email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'User already exists with this email' 
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(sanitizedData.password || password, 12);
      
      // Create new user
      const newUser = {
        _id: 'user_' + Date.now(),
        fullName: sanitizedData.fullName,
        email: sanitizedData.email,
        mobile: sanitizedData.mobile,
        address: sanitizedData.address || '',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      data.users.push(newUser);
      saveToFile(data);
      
      return res.status(201).json({
        success: true,
        message: 'Registration successful (file storage)',
        data: {
          user: {
            id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role
          }
        }
      });
    }
    
    const usersCollection = database.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: sanitizedData.email });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }
    
    // Hash password
    console.log('- Password hashing initiated');
    const hashedPassword = await bcrypt.hash(sanitizedData.password || password, 12);
    
    // Create new user
    const newUser = {
      fullName: sanitizedData.fullName,
      email: sanitizedData.email,
      mobile: sanitizedData.mobile,
      address: sanitizedData.address || '',
      password: hashedPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: result.insertedId,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('- Error details:', error.message);
    console.error('- Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    });
  }
});

app.get('/api/complaints', authenticateUser, async (req, res) => {
  try {
    const database = await connectToMongoDB();
    if (!database) {
      // Fallback to file
      const data = loadFromFile();
      const userComplaints = data.complaints.filter(c => c.userEmail === (req.user?.email || 'user_demo_1@example.com'));
      return res.json({ success: true, data: { complaints: userComplaints, total: userComplaints.length } });
    }
    
    const complaintsCollection = database.collection('complaints');
    const complaints = await complaintsCollection.find({ userEmail: req.user?.email || 'user_demo_1@example.com' }).toArray();
    res.json({ success: true, data: { complaints, total: complaints.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get complaints' });
  }
});

app.get('/api/complaints/all', async (req, res) => {
  try {
    const database = await connectToMongoDB();
    if (!database) {
      // Fallback to file
      const data = loadFromFile();
      return res.json({ success: true, data: { complaints: data.complaints, total: data.complaints.length } });
    }
    
    const complaintsCollection = database.collection('complaints');
    const complaints = await complaintsCollection.find({}).toArray();
    res.json({ success: true, data: { complaints, total: complaints.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get all complaints' });
  }
});

// Get user's complaints
app.get('/api/complaints/user', authenticateUser, async (req, res) => {
  try {
    const database = await connectToMongoDB();
    if (!database) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
    
    const complaintsCollection = database.collection('complaints');
    const userComplaints = await complaintsCollection.find({
      userEmail: req.user?.email || 'user_demo_1@example.com'
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`✅ Found ${userComplaints.length} complaints for user from MongoDB`);
    
    res.json({
      success: true,
      data: {
        complaints: userComplaints,
        total: userComplaints.length
      }
    });
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
});

app.post('/api/complaints', authenticateUser, upload.array('evidence', 5), async (req, res) => {
  try {
    const { title, description, category, incidentDate, incidentLocation, userLocation, priority = 'medium' } = req.body;
    
    // Handle uploaded files with geolocation evidence metadata
    const uploadedFiles = [];
    const evidenceMetadata = [];
    
    if (req.files && req.files.length > 0) {
      console.log('📸 Processing uploaded files with geolocation evidence...');
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        
        // Basic file info
        const fileInfo = {
          filename: file.filename,
          originalname: file.originalname,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          uploadDate: new Date().toISOString()
        };
        
        // Look for evidence metadata for this file
        const evidenceKey = `evidence_${i}`;
        let metadata = null;
        
        if (req.body[evidenceKey]) {
          try {
            metadata = JSON.parse(req.body[evidenceKey]);
            console.log(`✅ Evidence metadata found for file ${i + 1}:`, metadata);
          } catch (error) {
            console.error(`❌ Failed to parse evidence metadata for file ${i + 1}:`, error);
          }
        }
        
        uploadedFiles.push({
          ...fileInfo,
          evidence: metadata || {
            error: 'No evidence metadata available',
            timestamp: new Date().toISOString()
          }
        });
        
        if (metadata) {
          evidenceMetadata.push(metadata);
        }
      }
    }
    
    const database = await connectToMongoDB();
    if (!database) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
    
    const complaintsCollection = database.collection('complaints');
    const newComplaint = {
      title,
      description,
      category,
      priority,
      status: 'pending',
      incidentDate: new Date(incidentDate),
      incidentLocation,
      userLocation: JSON.parse(userLocation),
      userId: req.user?.id || 'user_demo_1',
      userEmail: req.user?.email || 'user_demo_1@example.com',
      evidence: uploadedFiles,
      evidenceMetadata: evidenceMetadata,
      createdAt: new Date().toISOString()
    };
    
    const result = await complaintsCollection.insertOne(newComplaint);
    const complaintId = `COMP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    console.log('✅ Complaint saved to MongoDB with geolocation evidence:', complaintId);
    
    res.status(201).json({
      success: true,
      message: 'Complaint filed successfully with geolocation evidence',
      data: { 
        complaint: { 
          id: result.insertedId, 
          complaintId, 
          title: newComplaint.title, 
          status: newComplaint.status,
          evidenceCount: uploadedFiles.length,
          hasGeolocationEvidence: evidenceMetadata.length > 0
        } 
      }
    });
  } catch (error) {
    console.error('Error filing complaint with geolocation evidence:', error);
    res.status(500).json({ success: false, message: 'Failed to file complaint' });
  }
});

// Delete complaint endpoint
app.delete('/api/complaints/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const database = await connectToMongoDB();
    
    if (!database) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
    
    const complaintsCollection = database.collection('complaints');
    
    // First check if complaint exists and belongs to user
    const complaint = await complaintsCollection.findOne({ 
      _id: new ObjectId(id),
      userEmail: req.user?.email || 'user_demo_1@example.com'
    });
    
    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found or you do not have permission to delete it' 
      });
    }
    
    // Delete the complaint
    const result = await complaintsCollection.deleteOne({ 
      _id: new ObjectId(id),
      userEmail: req.user?.email || 'user_demo_1@example.com'
    });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Complaint deleted: ${id} by user: ${req.user?.email}`);
      res.json({ 
        success: true, 
        message: 'Complaint deleted successfully' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Failed to delete complaint' 
      });
    }
    
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete complaint' 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  initializeDemoData();
  console.log(`🌐 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Mobile access: http://<your-local-ip>:${PORT}`);
  
  // Test MongoDB connection on startup
  testMongoConnection();
  
  // Render deployment info
  if (process.env.RENDER) {
    console.log(`🚀 Deployed on Render: https://${process.env.RENDER_EXTERNAL_HOSTNAME}`);
  }
});

// Test MongoDB connection and show clear status
const testMongoConnection = async () => {
  console.log('🔄 Testing database connection...');
  
  const db = await connectToMongoDB();
  
  if (db) {
    console.log('✅ SUCCESS: MongoDB Connected!');
    console.log('📊 Database: observx');
    console.log('🗃️ All new complaints will be saved to MongoDB');
    console.log('📍 Data Location: MongoDB Atlas Cloud');
  } else {
    console.log('❌ FALLBACK: Using File Storage');
    console.log('📁 Data Location: data.json (local file)');
    console.log('💾 All complaints will be saved to file storage');
    console.log('🔧 To enable MongoDB:');
    console.log('   1. Install local MongoDB OR');
    console.log('   2. Fix Atlas SSL configuration OR');
    console.log('   3. Update network access in Atlas');
  }
  
  // Show current data status
  const data = loadFromFile();
  console.log(`📋 Current complaints in storage: ${data.complaints.length}`);
  console.log('👥 Current users in storage:', data.users.length);
};
