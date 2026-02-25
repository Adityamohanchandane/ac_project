import express from 'express'
import bodyParser from 'body-parser'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { fileURLToPath } from 'url'
import multer from 'multer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3002

const USERS_FILE = path.join(__dirname, 'users.json')
const COMPLAINTS_FILE = path.join(__dirname, 'complaints.json')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept images and documents
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF, PDF, DOC, DOCX files are allowed.'))
    }
  }
})

// Middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Helper functions
async function hashPassword(password) {
  return await bcrypt.hash(password, 10)
}

async function verifyPassword(plain, hash) {
  return await bcrypt.compare(plain, hash)
}

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return []
  }
  const data = fs.readFileSync(USERS_FILE, 'utf8')
  return JSON.parse(data || '[]')
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

function loadComplaints() {
  if (!fs.existsSync(COMPLAINTS_FILE)) {
    return []
  }
  const data = fs.readFileSync(COMPLAINTS_FILE, 'utf8')
  return JSON.parse(data || '[]')
}

function saveComplaints(complaints) {
  fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(complaints, null, 2))
}

function findUserByEmail(email) {
  const users = loadUsers()
  return users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null
}

// Routes
app.post('/register.php', async (req, res) => {
  const { email, password, password2, fullName, mobile, address } = req.body

  if (!email || !password || !password2) {
    return res.json({ success: false, message: 'All fields are required.' })
  }

  if (password !== password2) {
    return res.json({ success: false, message: 'Passwords do not match.' })
  }

  if (findUserByEmail(email)) {
    return res.json({ success: false, message: 'An account with that email already exists.' })
  }

  const users = loadUsers()
  const newUser = {
    id: crypto.randomUUID(),
    email,
    password: await hashPassword(password),
    role: 'user',
    full_name: fullName,
    mobile,
    address,
    user_location: null, // Will be set when filing complaint
    created_at: new Date().toISOString(),
  }

  users.push(newUser)
  saveUsers(users)

  res.json({ success: true, message: 'Registration successful' })
})

// File complaint route - handles both JSON and FormData
app.post('/file_complaint.php', upload.single('evidence'), (req, res) => {
  try {
    // Extract data from either JSON body or FormData
    let title, category, description, incident_date, user_location, crime_location, priority_level
    
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      // FormData request
      title = req.body.title
      category = req.body.category
      description = req.body.description
      incident_date = req.body.incident_date
      priority_level = req.body.priority_level || 'normal'
      
      // Parse JSON fields from FormData
      try {
        user_location = req.body.user_location ? JSON.parse(req.body.user_location) : null
        crime_location = req.body.crime_location ? JSON.parse(req.body.crime_location) : null
      } catch (e) {
        console.warn('Error parsing location fields:', e)
        user_location = null
        crime_location = null
      }
    } else {
      // JSON request
      ({ title, category, description, incident_date, user_location, crime_location, priority_level } = req.body)
      priority_level = priority_level || 'normal'
    }

    // Validation
    if (!title || !category || !description) {
      return res.json({ success: false, message: 'Title, category, and description are required.' })
    }

    if (!req.body && !req.headers['content-type']?.includes('multipart/form-data')) {
      return res.json({ success: false, message: 'No data received.' })
    }

    const complaints = loadComplaints()
    const newComplaint = {
      id: crypto.randomUUID(),
      complaint_id: 'CMP' + Date.now(),
      title,
      category,
      description,
      incident_date: incident_date || new Date().toISOString().split('T')[0],
      user_location: user_location || null,
      crime_location: crime_location || null,
      priority_level: priority_level || 'normal',
      status: 'pending',
      created_at: new Date().toISOString(),
      user_id: 'user123', // This would come from session in production
      evidence_file: req.file ? req.file.filename : null // Store uploaded file name if any
    }

    complaints.push(newComplaint)
    saveComplaints(complaints)

    console.log('Complaint filed successfully:', newComplaint.complaint_id)

    res.json({ 
      success: true, 
      message: 'Complaint filed successfully',
      complaint_id: newComplaint.complaint_id,
      evidence_uploaded: req.file ? true : false
    })
  } catch (error) {
    console.error('Error filing complaint:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error while filing complaint. Please try again.' 
    })
  }
})

app.post('/login.php', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.json({ success: false, message: 'Email and password are required.' })
  }

  const user = findUserByEmail(email)

  if (!user) {
    return res.json({ success: false, message: 'No account found with that email.' })
  }

  if (!(await verifyPassword(password, user.password))) {
    return res.json({ success: false, message: 'Incorrect password.' })
  }

  res.json({ success: true, message: 'Login successful', user_id: user.id })
})

app.post('/police-login.php', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.json({ success: false, message: 'Email and password are required.' })
  }

  const user = findUserByEmail(email)

  if (!user) {
    return res.json({ success: false, message: 'No account found with that email.' })
  }

  if (user.role !== 'police') {
    return res.json({ success: false, message: 'This account is not authorized for police portal.' })
  }

  if (!verifyPassword(password, user.password)) {
    return res.json({ success: false, message: 'Incorrect password.' })
  }

  res.json({ success: true, message: 'Login successful', user_id: user.id })
})

// File complaint with location tracking
app.post('/file-complaint', (req, res) => {
  const { 
    user_id, 
    title, 
    category, 
    incident_date, 
    user_location, // New: User's current location
    crime_location, // New: Location of crime
    description 
  } = req.body

  if (!user_id || !title || !category || !user_location || !crime_location) {
    return res.json({ success: false, message: 'All fields are required.' })
  }

  const complaints = loadComplaints()
  const newComplaint = {
    id: crypto.randomUUID(),
    user_id,
    title,
    category,
    incident_date,
    user_location, // {latitude, longitude, accuracy, timestamp}
    crime_location, // {latitude, longitude, accuracy, address}
    description,
    status: 'pending',
    created_at: new Date().toISOString(),
    assigned_to: null,
  }

  complaints.push(newComplaint)
  saveComplaints(complaints)

  // Update user's latest location
  const users = loadUsers()
  const userIndex = users.findIndex(u => u.id === user_id)
  if (userIndex !== -1) {
    users[userIndex].user_location = user_location
    saveUsers(users)
  }

  res.json({ success: true, message: 'Complaint filed successfully', complaint_id: newComplaint.id })
})

// Get all complaints for police
app.get('/get-all-complaints', (req, res) => {
  const complaints = loadComplaints()
  res.json({ success: true, complaints })
})

// Get complaints (with optional user filter)
app.get('/get_complaints.php', (req, res) => {
  const complaints = loadComplaints()
  const { user_email, user_id } = req.query
  
  let filteredComplaints = complaints
  
  // Filter by user email if provided
  if (user_email) {
    filteredComplaints = complaints.filter(c => {
      // Check if complaint has user_email field
      if (c.user_email) {
        return c.user_email === user_email
      }
      // If no user_email, check if we can find user by user_id and match email
      const users = loadUsers()
      const user = users.find(u => u.id === c.user_id)
      return user && user.email === user_email
    })
  }
  
  // Filter by user_id if provided
  if (user_id) {
    filteredComplaints = complaints.filter(c => c.user_id === user_id)
  }
    
  res.json({ success: true, complaints: filteredComplaints })
})

// Get complaints by user
app.get('/user-complaints/:user_id', (req, res) => {
  const { user_id } = req.params
  const complaints = loadComplaints()
  const userComplaints = complaints.filter(c => c.user_id === user_id)
  res.json({ success: true, complaints: userComplaints })
})

// Get specific complaint with location info (PHP-style endpoint for frontend compatibility)
app.get('/get_complaint.php', (req, res) => {
  const { id } = req.query
  
  if (!id) {
    return res.json({ success: false, message: 'Complaint ID is required' })
  }
  
  const complaints = loadComplaints()
  const complaint = complaints.find(c => c.id === id || c.complaint_id === id)
  
  if (!complaint) {
    return res.json({ success: false, message: 'Complaint not found' })
  }

  // Get user info
  const users = loadUsers()
  const user = users.find(u => u.id === complaint.user_id)

  res.json({ success: true, complaint, user })
})

// Get specific complaint with location info (REST-style endpoint)
app.get('/complaint/:complaint_id', (req, res) => {
  const { complaint_id } = req.params
  const complaints = loadComplaints()
  const complaint = complaints.find(c => c.id === complaint_id)
  
  if (!complaint) {
    return res.json({ success: false, message: 'Complaint not found' })
  }

  // Get user info
  const users = loadUsers()
  const user = users.find(u => u.id === complaint.user_id)

  res.json({ success: true, complaint, user })
})

// Update complaint status (for police)
app.post('/update-complaint-status', (req, res) => {
  const { complaint_id, status, assigned_to } = req.body

  if (!complaint_id || !status) {
    return res.json({ success: false, message: 'Missing required fields' })
  }

  const complaints = loadComplaints()
  const complaintIndex = complaints.findIndex(c => c.id === complaint_id)

  if (complaintIndex === -1) {
    return res.json({ success: false, message: 'Complaint not found' })
  }

  complaints[complaintIndex].status = status
  if (assigned_to) {
    complaints[complaintIndex].assigned_to = assigned_to
  }
  complaints[complaintIndex].updated_at = new Date().toISOString()

  saveComplaints(complaints)
  res.json({ success: true, message: 'Complaint updated' })
})

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(__dirname))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File size too large. Maximum size is 5MB.' })
    }
    return res.status(400).json({ success: false, message: 'File upload error: ' + err.message })
  }
  
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error. Please try again later.' 
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' })
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
