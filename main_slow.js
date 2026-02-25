// Main JavaScript for ObservX Secure India
let currentUser = null
let currentUserRole = null

// Demo credentials
const DEMO_USERS = {
  user: [
    { email: 'user@observx.com', password: 'user123', role: 'user' },
    { email: 'citizen@observx.com', password: 'citizen123', role: 'user' },
    { email: 'test@observx.com', password: 'test123', role: 'user' }
  ],
  police: [
    { email: 'police@observx.com', password: 'police123', role: 'police' },
    { email: 'officer@observx.com', password: 'officer123', role: 'police' },
    { email: 'admin@observx.com', password: 'admin123', role: 'police' }
  ]
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  checkAuth()
  setupEventListeners()
})

// Check authentication
function checkAuth() {
  const userData = localStorage.getItem('currentUser')
  if (userData) {
    currentUser = JSON.parse(userData)
    currentUserRole = currentUser.role
    updateAuthMenu()
  }
}

// Setup event listeners
function setupEventListeners() {
  // Login forms
  const userLoginForm = document.getElementById('userLoginForm')
  const policeLoginForm = document.getElementById('policeLoginForm')
  
  if (userLoginForm) {
    userLoginForm.addEventListener('submit', handleUserLogin)
  }
  
  if (policeLoginForm) {
    policeLoginForm.addEventListener('submit', handlePoliceLogin)
  }
  
  // Registration form
  const registerForm = document.getElementById('registerForm')
  if (registerForm) {
    registerForm.addEventListener('submit', handleUserRegister)
  }
  
  // Complaint forms
  const complaintForm = document.getElementById('complaintForm')
  if (complaintForm) {
    complaintForm.addEventListener('submit', handleComplaintSubmit)
  }
  
  // Logout
  const logoutBtn = document.getElementById('logoutBtn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout)
  }
}

// Handle user login
async function handleUserLogin(e) {
  e.preventDefault()
  const email = document.getElementById('userEmail')?.value || ''
  const password = document.getElementById('userPassword')?.value || ''
  const alertDiv = document.getElementById('loginAlert')
  
  if (!email || !password) {
    alertDiv.innerHTML = `<div class="alert alert-danger">Please fill in all required fields</div>`
    return
  }
  
  try {
    const user = DEMO_USERS.user.find(u => u.email === email && u.password === password)
    
    if (user) {
      currentUser = {
        email: user.email,
        role: user.role,
        full_name: user.email.split('@')[0],
        id: 'user_' + Date.now()
      }
      
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
      currentUserRole = user.role
      
      alertDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>'
      
      setTimeout(() => {
        window.location.hash = '#/user-dashboard'
      }, 1000)
    } else {
      alertDiv.innerHTML = `<div class="alert alert-danger">Invalid credentials. Try: user@observx.com / user123</div>`
    }
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
  }
}

// Handle police login
async function handlePoliceLogin(e) {
  e.preventDefault()
  const email = document.getElementById('policeEmail')?.value || ''
  const password = document.getElementById('policePassword')?.value || ''
  const alertDiv = document.getElementById('policeLoginAlert')
  
  if (!email || !password) {
    alertDiv.innerHTML = `<div class="alert alert-danger">Please fill in all required fields</div>`
    return
  }
  
  try {
    const user = DEMO_USERS.police.find(u => u.email === email && u.password === password)
    
    if (user) {
      currentUser = {
        email: user.email,
        role: user.role,
        full_name: 'Police Officer',
        id: 'police_' + Date.now()
      }
      
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
      currentUserRole = user.role
      
      alertDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>'
      
      setTimeout(() => {
        window.location.hash = '#/police-dashboard'
      }, 1000)
    } else {
      alertDiv.innerHTML = `<div class="alert alert-danger">Invalid credentials. Try: police@observx.com / police123</div>`
    }
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
  }
}

// Handle user registration
async function handleUserRegister(e) {
  e.preventDefault()
  const formData = new FormData(e.target)
  const alertDiv = document.getElementById('registerAlert')
  
  try {
    const userData = {
      email: formData.get('email'),
      full_name: formData.get('full_name'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      role: 'user',
      id: 'user_' + Date.now(),
      created_at: new Date().toISOString()
    }
    
    // Store in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    users.push(userData)
    localStorage.setItem('users', JSON.stringify(users))
    
    alertDiv.innerHTML = '<div class="alert alert-success">Registration successful! Please login.</div>'
    
    setTimeout(() => {
      window.location.hash = '#/user-login'
    }, 2000)
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
  }
}

// Handle complaint submission
async function handleComplaintSubmit(e) {
  e.preventDefault()
  const title = document.getElementById('complaintTitle')?.value || ''
  const category = document.getElementById('category')?.value || ''
  const incidentDate = document.getElementById('incidentDate')?.value || ''
  const crimeLocation = document.getElementById('crimeLocation')?.value || ''
  const description = document.getElementById('description')?.value || ''
  const alertDiv = document.getElementById('complaintAlert')
  
  if (!title || !category || !incidentDate || !crimeLocation || !description) {
    alertDiv.innerHTML = `<div class="alert alert-danger">Please fill in all required fields</div>`
    return
  }
  
  try {
    const complaintData = {
      id: 'complaint_' + Date.now(),
      user_id: currentUser.id,
      title: title,
      category: category,
      description: description,
      incident_date: incidentDate,
      location: crimeLocation,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    
    // Store in localStorage
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]')
    complaints.push(complaintData)
    localStorage.setItem('complaints', JSON.stringify(complaints))
    
    alertDiv.innerHTML = '<div class="alert alert-success">Complaint filed successfully!</div>'
    
    // Safe form reset
    try {
      e.target.reset()
    } catch (e) {
      console.warn('Form reset failed:', e)
    }
    
    setTimeout(() => {
      window.location.hash = '#/my-complaints'
    }, 2000)
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
  }
}

// Handle emergency complaint submission
async function handleEmergencyComplaintSubmit(e) {
  e.preventDefault()
  const emergencyType = document.getElementById('emergencyType')?.value || ''
  const urgencyLevel = document.querySelector('input[name="urgency"]:checked')?.value || ''
  const title = document.getElementById('emergencyTitle')?.value || ''
  const photoLocation = document.getElementById('photoLocation')?.value || ''
  const description = document.getElementById('emergencyDescription')?.value || ''
  const contactNumber = document.getElementById('emergencyContact')?.value || ''
  const emergencyName = document.getElementById('emergencyName')?.value || ''
  const confirmEmergency = document.getElementById('confirmEmergency')?.checked || false
  const alertDiv = document.getElementById('emergencyComplaintAlert')
  
  if (!confirmEmergency) {
    alertDiv.innerHTML = `<div class="alert alert-danger">Please confirm this is a genuine emergency</div>`
    return
  }
  
  if (!emergencyType || !urgencyLevel || !title || !photoLocation || !description || !contactNumber || !emergencyName) {
    alertDiv.innerHTML = `<div class="alert alert-danger">Please fill in all required fields</div>`
    return
  }
  
  try {
    const emergencyComplaintData = {
      id: 'emergency_' + Date.now(),
      user_id: currentUser.id,
      emergency_type: emergencyType,
      urgency_level: urgencyLevel,
      title: title,
      description: description,
      photo_location: photoLocation,
      contact_number: contactNumber,
      emergency_name: emergencyName,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    
    // Store in localStorage
    const emergencyComplaints = JSON.parse(localStorage.getItem('emergencyComplaints') || '[]')
    emergencyComplaints.push(emergencyComplaintData)
    localStorage.setItem('emergencyComplaints', JSON.stringify(emergencyComplaints))
    
    alertDiv.innerHTML = '<div class="alert alert-success">Emergency complaint filed successfully!</div>'
    
    // Safe form reset
    try {
      e.target.reset()
    } catch (e) {
      console.warn('Form reset failed:', e)
    }
    
    setTimeout(() => {
      window.location.hash = '#/user-dashboard'
    }, 2000)
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
  }
}

// Logout function
async function logout() {
  try {
    localStorage.removeItem('currentUser')
    currentUser = null
    currentUserRole = null
    
    window.location.hash = '#/'
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Update auth menu
function updateAuthMenu() {
  const authMenu = document.getElementById('authMenu')
  if (!authMenu) return
  
  if (currentUser) {
    authMenu.innerHTML = `
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-circle"></i> ${currentUser.full_name}
        </a>
        <ul class="dropdown-menu">
          <li><a class="dropdown-item" href="#/dashboard">Dashboard</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" onclick="logout()">Logout</a></li>
        </ul>
      </li>
    `
  } else {
    authMenu.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="#/user-login">User Login</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#/police-login">Police Login</a>
      </li>
    `
  }
}

// Load complaints
function loadComplaints() {
  const container = document.getElementById('complaintsContainer')
  if (!container) return
  
  const complaints = JSON.parse(localStorage.getItem('complaints') || '[]')
  
  if (complaints.length === 0) {
    container.innerHTML = '<div class="alert alert-info">No complaints found</div>'
    return
  }
  
  let html = ''
  complaints.forEach(complaint => {
    html += `
      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">${complaint.title}</h5>
          <p class="card-text">${complaint.description}</p>
          <p class="card-text"><small class="text-muted">Status: ${complaint.status}</small></p>
        </div>
      </div>
    `
  })
  
  container.innerHTML = html
}

// Simple routing
window.addEventListener('hashchange', () => {
  const hash = window.location.hash
  const pageContent = document.getElementById('page-content')
  
  if (!pageContent) return
  
  switch(hash) {
    case '#/user-login':
      pageContent.innerHTML = getUserLoginPage()
      break
    case '#/police-login':
      pageContent.innerHTML = getPoliceLoginPage()
      break
    case '#/user-register':
      pageContent.innerHTML = getRegisterPage()
      break
    case '#/user-dashboard':
      pageContent.innerHTML = getUserDashboard()
      break
    case '#/police-dashboard':
      pageContent.innerHTML = getPoliceDashboard()
      break
    case '#/file-complaint':
      pageContent.innerHTML = getFileComplaintPage()
      break
    case '#/emergency-complaint':
      pageContent.innerHTML = getEmergencyComplaintPage()
      break
    case '#/my-complaints':
      pageContent.innerHTML = getMyComplaintsPage()
      break
    default:
      pageContent.innerHTML = getHomePage()
  }
})

// Page templates
function getUserLoginPage() {
  return `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h4>User Login</h4>
            </div>
            <div class="card-body">
              <div id="loginAlert"></div>
              <form id="userLoginForm">
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" id="userEmail" required>
                  <div class="form-text">Demo: user@observx.com</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Password</label>
                  <input type="password" class="form-control" id="userPassword" required>
                  <div class="form-text">Demo: user123</div>
                </div>
                <button type="submit" class="btn btn-primary">Login</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function getPoliceLoginPage() {
  return `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h4>Police Login</h4>
            </div>
            <div class="card-body">
              <div id="policeLoginAlert"></div>
              <form id="policeLoginForm">
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" id="policeEmail" required>
                  <div class="form-text">Demo: police@observx.com</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Password</label>
                  <input type="password" class="form-control" id="policePassword" required>
                  <div class="form-text">Demo: police123</div>
                </div>
                <button type="submit" class="btn btn-primary">Login</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function getRegisterPage() {
  return `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h4>User Registration</h4>
            </div>
            <div class="card-body">
              <div id="registerAlert"></div>
              <form id="registerForm">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-control" name="full_name" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" name="email" required>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-control" name="phone" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control" name="password" required>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Address</label>
                  <textarea class="form-control" name="address" rows="3" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Register</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function getUserDashboard() {
  return `
    <div class="container mt-5">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h4>User Dashboard</h4>
            </div>
            <div class="card-body">
              <h5>Welcome, ${currentUser?.full_name || 'User'}!</h5>
              <div class="row mt-4">
                <div class="col-md-4">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title">File Complaint</h5>
                      <p class="card-text">Submit a new complaint</p>
                      <a href="#/file-complaint" class="btn btn-primary">File Now</a>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title">My Complaints</h5>
                      <p class="card-text">View your complaints</p>
                      <a href="#/my-complaints" class="btn btn-secondary">View</a>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title">Emergency</h5>
                      <p class="card-text">File emergency complaint</p>
                      <a href="#/emergency-complaint" class="btn btn-danger">Emergency</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function getPoliceDashboard() {
  return `
    <div class="container mt-5">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h4>Police Dashboard</h4>
            </div>
            <div class="card-body">
              <h5>Welcome, ${currentUser?.full_name || 'Officer'}!</h5>
              <div class="row mt-4">
                <div class="col-md-6">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title">All Complaints</h5>
                      <p class="card-text">View all complaints</p>
                      <a href="#/all-complaints" class="btn btn-primary">View All</a>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card text-center">
                    <div class="card-body">
                      <h5 class="card-title">Emergency</h5>
                      <p class="card-text">View emergency complaints</p>
                      <a href="#/emergency-complaints" class="btn btn-danger">View Emergency</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function getFileComplaintPage() {
  return `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h4>File Complaint</h4>
            </div>
            <div class="card-body">
              <div id="complaintAlert"></div>
              <form id="complaintForm">
                <div class="mb-3">
                  <label class="form-label">Title</label>
                  <input type="text" class="form-control" id="complaintTitle" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Category</label>
                  <select class="form-control" id="category" required>
                    <option value="">Select Category</option>
                    <option value="theft">Theft</option>
                    <option value="fraud">Fraud</option>
                    <option value="harassment">Harassment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" id="description" rows="4" required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Incident Date</label>
                  <input type="date" class="form-control" id="incidentDate" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Location</label>
                  <input type="text" class="form-control" id="crimeLocation" required>
                </div>
                <button type="submit" class="btn btn-primary">Submit Complaint</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function getEmergencyComplaintPage() {
  return `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h4>Emergency Complaint</h4>
            </div>
            <div class="card-body">
              <div id="emergencyComplaintAlert"></div>
              <form id="emergencyComplaintForm">
                <div class="mb-3">
                  <label class="form-label">Emergency Type</label>
                  <select class="form-control" id="emergencyType" required>
                    <option value="">Select Emergency Type</option>
                    <option value="accident">Accident</option>
                    <option value="fire">Fire</option>
                    <option value="medical">Medical Emergency</option>
                    <option value="crime">Crime in Progress</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Urgency Level</label>
                  <div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="urgency" id="urgencyLow" value="low">
                      <label class="form-check-label" for="urgencyLow">Low</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="urgency" id="urgencyMedium" value="medium">
                      <label class="form-check-label" for="urgencyMedium">Medium</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="urgency" id="urgencyHigh" value="high">
                      <label class="form-check-label" for="urgencyHigh">High</label>
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Title</label>
                  <input type="text" class="form-control" id="emergencyTitle" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Photo Location</label>
                  <input type="text" class="form-control" id="photoLocation" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" id="emergencyDescription" rows="4" required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Contact Number</label>
                  <input type="tel" class="form-control" id="emergencyContact" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Your Name</label>
                  <input type="text" class="form-control" id="emergencyName" required>
                </div>
                <div class="mb-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="confirmEmergency">
                    <label class="form-check-label" for="confirmEmergency">I confirm this is a genuine emergency</label>
                  </div>
                </div>
                <button type="submit" class="btn btn-danger">Submit Emergency Complaint</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function getMyComplaintsPage() {
  const complaints = JSON.parse(localStorage.getItem('complaints') || '[]')
  const userComplaints = complaints.filter(c => c.user_id === currentUser?.id)
  
  return `
    <div class="container mt-5">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h4>My Complaints</h4>
            </div>
            <div class="card-body">
              <div id="complaintsContainer">
                ${userComplaints.length === 0 
                  ? '<div class="alert alert-info">No complaints found</div>'
                  : userComplaints.map(complaint => `
                    <div class="card mb-3">
                      <div class="card-body">
                        <h5 class="card-title">${complaint.title}</h5>
                        <p class="card-text">${complaint.description}</p>
                        <p class="card-text">
                          <small class="text-muted">
                            Category: ${complaint.category} | 
                            Status: ${complaint.status} | 
                            Date: ${new Date(complaint.created_at).toLocaleDateString()}
                          </small>
                        </p>
                      </div>
                    </div>
                  `).join('')
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function getHomePage() {
  return `
    <div class="container mt-5">
      <div class="row">
        <div class="col-12">
          <div class="jumbotron text-center">
            <h1 class="display-4">ObservX Secure India</h1>
            <p class="lead">Secure platform for filing complaints and emergency services</p>
            <hr class="my-4">
            <p>Choose your role to continue:</p>
            <div class="row justify-content-center">
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body text-center">
                    <h5 class="card-title">Citizen</h5>
                    <p class="card-text">File complaints and track status</p>
                    <a href="#/user-login" class="btn btn-primary">User Login</a>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body text-center">
                    <h5 class="card-title">New User</h5>
                    <p class="card-text">Register for new account</p>
                    <a href="#/user-register" class="btn btn-success">Register</a>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body text-center">
                    <h5 class="card-title">Police</h5>
                    <p class="card-text">Access police dashboard</p>
                    <a href="#/police-login" class="btn btn-danger">Police Login</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

// Initialize routing
window.addEventListener('load', () => {
  const hash = window.location.hash || '#/'
  window.dispatchEvent(new HashChangeEvent('hashchange'))
})
