import express from 'express'
import bodyParser from 'body-parser'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 8000

const USERS_FILE = path.join(__dirname, 'users.json')
const COMPLAINTS_FILE = path.join(__dirname, 'complaints.json')

// Middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static(__dirname))

// Helper functions
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function verifyPassword(plain, hash) {
  return hashPassword(plain) === hash
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
app.post('/register.php', (req, res) => {
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
    password: hashPassword(password),
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

app.post('/login.php', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.json({ success: false, message: 'Email and password are required.' })
  }

  const user = findUserByEmail(email)

  if (!user) {
    return res.json({ success: false, message: 'No account found with that email.' })
  }

  if (!verifyPassword(password, user.password)) {
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

// Get complaints by user
app.get('/user-complaints/:user_id', (req, res) => {
  const { user_id } = req.params
  const complaints = loadComplaints()
  const userComplaints = complaints.filter(c => c.user_id === user_id)
  res.json({ success: true, complaints: userComplaints })
})

// Get specific complaint with location info
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
