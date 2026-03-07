// ObservX Backend Server with bcrypt and file fallback
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adityachandane71_db_user:adityamch2007@observex.fcerr8w.mongodb.net/observx?retryWrites=true&w=majority';
const DATA_FILE = join(process.cwd(), 'data.json');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
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

// Request logging middleware
app.use((req, res, next) => {
  console.log('🔍 Incoming Request:');
  console.log('- Timestamp:', new Date().toISOString());
  console.log('- Method:', req.method);
  console.log('- URL:', req.url);
  console.log('- Full URL:', req.protocol + '://' + req.get('host') + req.url);
  console.log('- Headers:', req.headers);
  console.log('- Origin:', req.headers.origin);
  console.log('- IP:', req.ip || req.connection.remoteAddress || req.socket.remoteAddress);
  console.log('- Host:', req.headers.host);
  console.log('- User-Agent:', req.headers['user-agent']);
  console.log('- Referer:', req.headers.referer);
  console.log('- Content-Type:', req.headers['content-type']);
  console.log('- Content-Length:', req.headers['content-length']);
  console.log('---');
  next();
});

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
    if (client && client.topology && client.topology.isConnected()) {
      return db;
    }
    
    console.log('🔗 Attempting MongoDB connection...');
    
    // Simple connection without SSL validation for now
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('observx');
    console.log('✅ MongoDB connected successfully');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('📁 Using file-based storage as fallback');
    return null; // Return null to trigger file fallback
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

const initializeDemoData = () => {
  const data = loadFromFile();
  
  if (!data.users.find(u => u.email === 'adii123@gmail.com')) {
    const hashedPassword = bcrypt.hashSync('adii123', 12);
    data.users.push({
      _id: 'user_demo_1',
      fullName: 'Aditya Chandane',
      email: 'adii123@gmail.com',
      mobile: '9876543210',
      password: hashedPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString()
    });
  }
  
  if (!data.police.find(p => p.email === 'adii123@gmail.com')) {
    const hashedPassword = bcrypt.hashSync('adii123', 12);
    data.police.push({
      _id: 'police_demo_1',
      fullName: 'Police Officer',
      email: 'adii123@gmail.com',
      badgeNumber: 'POL001',
      password: hashedPassword,
      role: 'police',
      isActive: true,
      createdAt: new Date().toISOString()
    });
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
      // Fallback to file
      const data = loadFromFile();
      const user = data.users.find(u => u.email === email);
      if (user) {
        req.user = { id: user._id, email: user.email, role: user.role };
        return next();
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
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

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server running', mongodb: db ? 'connected' : 'disconnected' });
});

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
      // Fallback to file
      const data = loadFromFile();
      const user = data.users.find(u => u.email === email);
      if (user) {
        return res.json({ 
          success: true, 
          data: { user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } } 
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
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
  console.log('- Request body:', req.body);
  console.log('- Request timestamp:', new Date().toISOString());
  
  try {
    const { email, password } = req.body;
    console.log('- Extracted email:', email);
    console.log('- Password provided:', !!password);
    console.log('- Password length:', password ? password.length : 0);
    
    if (!email || !password) {
      console.log('- Missing email or password');
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    // Connect to MongoDB
    console.log('- Connecting to MongoDB...');
    const database = await connectToMongoDB();
    
    let user = null;
    let dataSource = 'unknown';
    
    if (database) {
      console.log('✅ MongoDB connected successfully');
      const usersCollection = database.collection('users');
      console.log('- Searching for user in MongoDB:', email);
      user = await usersCollection.findOne({ email });
      dataSource = 'mongodb';
      console.log('- User found in MongoDB:', !!user);
    } else {
      console.log('📁 MongoDB failed, using file-based storage');
      const data = loadFromFile();
      user = data.users.find(u => u.email === email);
      dataSource = 'file';
      console.log('- User found in file storage:', !!user);
    }
    
    if (user) {
      console.log('- User data from', dataSource, ':', { 
        id: user._id || user.id, 
        fullName: user.fullName, 
        email: user.email, 
        role: user.role,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      });
      
      if (dataSource === 'file') {
        // For file storage, passwords are plain text (for demo)
        const passwordMatch = (user.password === password);
        console.log('- File-based password comparison result:', passwordMatch);
        
        if (passwordMatch) {
          const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
          console.log('- Authentication token generated successfully');
          console.log('- Sending success response to client');
          res.json({
            success: true,
            data: { 
              user: { 
                id: user._id || user.id, 
                fullName: user.fullName, 
                email: user.email, 
                role: user.role 
              }, 
              token 
            }
          });
          console.log('✅ Login completed successfully via file storage');
          return;
        }
      } else {
        // For MongoDB, use bcrypt
        console.log('- Starting bcrypt password comparison...');
        const startTime = Date.now();
        const passwordMatch = await bcrypt.compare(password, user.password);
        const endTime = Date.now();
        console.log('- Password comparison completed in:', (endTime - startTime), 'ms');
        console.log('- Password match result:', passwordMatch);
        
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
      }
      
      console.log('- ❌ Password mismatch - authentication failed');
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    } else {
      console.log('- ❌ User not found in', dataSource, '- authentication failed');
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('- Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Login failed due to server error' });
  }
});

app.post('/api/police/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Connect to MongoDB
    const database = await connectToMongoDB();
    if (!database) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
    
    const policeCollection = database.collection('police');
    const police = await policeCollection.findOne({ email });
    
    if (police && await bcrypt.compare(password, police.password)) {
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      res.json({
        success: true,
        data: { police: { id: police._id, fullName: police.fullName, email: police.email, role: police.role }, token }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Police login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  console.log('📝 Registration Request Debug:');
  console.log('- Request body:', req.body);
  console.log('- Request timestamp:', new Date().toISOString());
  
  try {
    const { fullName, email, mobile, address, password } = req.body;
    console.log('- Extracted data:', { fullName, email, mobile, address, hasPassword: !!password, passwordLength: password ? password.length : 0 });
    
    if (!fullName || !email || !password) {
      console.log('- Missing required fields');
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    }
    
    // Connect to MongoDB
    console.log('- Connecting to MongoDB for registration...');
    const database = await connectToMongoDB();
    
    let existingUser = null;
    let dataSource = 'unknown';
    
    if (database) {
      console.log('✅ MongoDB connected for registration');
      const usersCollection = database.collection('users');
      
      // Check if user already exists
      console.log('- Checking if user already exists in MongoDB:', email);
      existingUser = await usersCollection.findOne({ email });
      dataSource = 'mongodb';
      console.log('- Existing user found in MongoDB:', !!existingUser);
      
      if (existingUser) {
        console.log('- ❌ User already exists with this email');
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }
      
      // Hash password
      console.log('- Starting password hashing...');
      const startTime = Date.now();
      const hashedPassword = await bcrypt.hash(password, 12);
      const endTime = Date.now();
      console.log('- Password hashing completed in:', (endTime - startTime), 'ms');
      console.log('- Hashed password length:', hashedPassword.length);
      
      // Create new user
      const newUser = {
        fullName,
        email,
        mobile,
        address,
        password: hashedPassword,
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      console.log('- Inserting new user into MongoDB...');
      const result = await usersCollection.insertOne(newUser);
      console.log('- ✅ User inserted successfully with ID:', result.insertedId);
      
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
      console.log('✅ Registration completed successfully via MongoDB');
    } else {
      console.log('📁 MongoDB failed, using file-based storage for registration');
      const data = loadFromFile();
      
      // Check if user already exists in file
      existingUser = data.users.find(u => u.email === email);
      dataSource = 'file';
      console.log('- Existing user found in file storage:', !!existingUser);
      
      if (existingUser) {
        console.log('- ❌ User already exists with this email');
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }
      
      // Create new user (plain text password for demo)
      const newUser = {
        _id: `user_${Date.now()}`,
        fullName,
        email,
        mobile,
        address,
        password: password, // Plain text for file storage demo
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      console.log('- Adding new user to file storage...');
      data.users.push(newUser);
      saveToFile(data);
      console.log('- ✅ User saved to file with ID:', newUser._id);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role
          }
        }
      });
      console.log('✅ Registration completed successfully via file storage');
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('- Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Registration failed due to server error' });
  }
});

app.get('/api/complaints', authenticateUser, async (req, res) => {
  try {
    const database = await connectToMongoDB();
    if (!database) {
      // Fallback to file
      const data = loadFromFile();
      const userComplaints = data.complaints.filter(c => c.userId === (req.user?.id || 'user_demo_1'));
      return res.json({ success: true, data: { complaints: userComplaints, total: userComplaints.length } });
    }
    
    const complaintsCollection = database.collection('complaints');
    const complaints = await complaintsCollection.find({ userId: req.user?.id || 'user_demo_1' }).toArray();
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
      // Fallback to file
      const data = loadFromFile();
      
      const newComplaint = {
        _id: `comp_${Date.now()}`,
        complaintId: `COMP-${new Date().getFullYear()}-${String(data.complaints.length + 1).padStart(3, '0')}`,
        title,
        description,
        category,
        priority,
        status: 'pending',
        incidentDate: new Date(incidentDate),
        incidentLocation,
        userLocation: JSON.parse(userLocation),
        userId: req.user?.id || 'user_demo_1',
        evidence: uploadedFiles,
        evidenceMetadata: evidenceMetadata,
        createdAt: new Date().toISOString()
      };
      
      data.complaints.unshift(newComplaint);
      saveToFile(data);
      
      console.log('✅ Complaint saved to file with geolocation evidence:', newComplaint.complaintId);
      
      return res.status(201).json({
        success: true,
        message: 'Complaint filed successfully with geolocation evidence',
        data: { 
          complaint: { 
            id: newComplaint._id, 
            complaintId: newComplaint.complaintId, 
            title: newComplaint.title, 
            status: newComplaint.status,
            evidenceCount: uploadedFiles.length,
            hasGeolocationEvidence: evidenceMetadata.length > 0
          } 
        }
      });
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

app.listen(PORT, '0.0.0.0', () => {
  initializeDemoData();
  console.log(`🌐 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Mobile access: http://<your-local-ip>:${PORT}`);
  
  // Render deployment info
  if (process.env.RENDER) {
    console.log(`🚀 Deployed on Render: https://${process.env.RENDER_EXTERNAL_HOSTNAME}`);
  }
});
