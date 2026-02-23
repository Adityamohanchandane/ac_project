import './style.css'
// Ensure Supabase client is available in the browser environment.
// Using the ESM bundle served by jsDelivr so `createClient` is defined.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Initialize Supabase if env vars are present; otherwise use null-safe stub
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
let supabase = null
try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  } else {
    console.warn('Supabase not configured — continuing without Supabase')
  }
} catch (e) {
  console.error('Failed to initialize Supabase client:', e)
  supabase = null
}

// Global state
let currentUser = null
let currentUserRole = null
let isLoading = false

// Add loading state management
const setLoading = (state) => {
  isLoading = state
  const loader = document.getElementById('page-loader')
  if (loader) {
    loader.style.display = state ? 'flex' : 'none'
  }
}

// Initialize page loader
const initLoader = () => {
  const loader = document.createElement('div')
  loader.id = 'page-loader'
  loader.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(5px);
  `
  loader.innerHTML = `
    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  `
  document.body.appendChild(loader)
}

// Initialize scroll animations
// Backend base URL detection: when running from a dev server (non-Apache port)
const backendBase = (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port && window.location.port !== '80') ? `http://${window.location.hostname}` : '';

const initScrollAnimations = () => {
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.animate-on-scroll')
    elements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top
      const windowHeight = window.innerHeight
      if (elementTop < windowHeight - 100) {
        element.classList.add('fade-in-up')
        element.style.opacity = '1'
      }
    })
  }

  // Initial check
  animateOnScroll()
  
  // Add scroll event listener
  window.addEventListener('scroll', animateOnScroll)
}

// Navbar scroll effect
const initNavbarScroll = () => {
  const navbar = document.getElementById('mainNav')
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled')
      } else {
        navbar.classList.remove('scrolled')
      }
    })
  }
}

// Initialize tooltips
const initTooltips = () => {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })
}

// Initialize all components
const initApp = () => {
  initLoader()
  initScrollAnimations()
  initNavbarScroll()
  initTooltips()
}

// Simple notification helper to show bootstrap alerts
function showNotification(type, message, timeout = 4000) {
  const containerId = 'global-notifications'
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    container.style.position = 'fixed'
    container.style.top = '1rem'
    container.style.right = '1rem'
    container.style.zIndex = '1060'
    document.body.appendChild(container)
  }

  const alert = document.createElement('div')
  alert.className = `alert alert-${type} alert-dismissible fade show`
  alert.role = 'alert'
  alert.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`
  container.appendChild(alert)

  if (timeout > 0) setTimeout(() => {
    try { bootstrap.Alert.getOrCreateInstance(alert).close() } catch (e) { alert.remove() }
  }, timeout)
}

const pages = {
  home: renderHome,
  about: renderAbout,
  contact: renderContact,
  'user-login': renderUserLogin,
  'police-login': renderPoliceLogin,
  'user-register': renderUserRegister,
  'user-dashboard': renderUserDashboard,
  'police-dashboard': renderPoliceDashboard,
  'file-complaint': renderFileComplaint,
  'view-complaint': renderViewComplaint,
  'my-complaints': renderMyComplaints,
  'view-complaints': renderViewComplaints,
  'update-complaint': renderUpdateComplaint,
}

window.addEventListener('hashchange', () => {
  const route = location.hash.slice(2) || 'home'
  loadPage(route)
})

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    setLoading(true)
    await checkAuth()
    const route = location.hash.slice(2) || 'home'
    await loadPage(route)
    initApp()
  } catch (error) {
    console.error('Error initializing app:', error)
    showNotification('error', 'Failed to initialize the application. Please try again.')
  } finally {
    setLoading(false)
  }
})

async function checkAuth() {
  if (!supabase) {
    return false
  }

  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) throw error

    if (data.session) {
      currentUser = data.session.user
      
      // Fetch user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, full_name, avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle()
        
      if (userError) throw userError
      
      currentUserRole = userData?.role || 'user'
      currentUser = { ...currentUser, ...userData }
      
      updateAuthMenu()
      
      // Update user avatar in navbar if exists
      if (userData?.avatar_url) {
        const userAvatar = document.getElementById('user-avatar')
        if (userAvatar) {
          userAvatar.src = userData.avatar_url
          userAvatar.alt = userData.full_name || 'User'
          userAvatar.style.display = 'block'
        }
      }
      
      return true
    }
    
    return false
    
  } catch (error) {
    console.error('Authentication error:', error)
    showNotification('error', 'Failed to check authentication status')
    return false
  }
}

function updateAuthMenu() {
  const authMenu = document.getElementById('authMenu')
  if (!authMenu) return

  if (currentUser) {
    // User is logged in
    authMenu.innerHTML = `
      <div class="dropdown">
        <a class="d-flex align-items-center text-decoration-none dropdown-toggle" 
           href="#" 
           role="button" 
           data-bs-toggle="dropdown" 
           aria-expanded="false"
           data-bs-offset="10,20">
          <img id="user-avatar" 
               src="${currentUser.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.email || 'U') + '&background=2563eb&color=fff'}" 
               alt="${currentUser.full_name || 'User'}" 
               class="rounded-circle me-2" 
               style="width: 36px; height: 36px; object-fit: cover; display: ${currentUser.avatar_url ? 'block' : 'none'};">
          <span class="d-none d-md-inline">${currentUser.full_name || currentUser.email || 'User'}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end shadow" style="min-width: 200px;">
          <li>
            <div class="dropdown-header d-flex align-items-center">
              <img id="user-avatar-menu" 
                   src="${currentUser.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.email || 'U') + '&background=2563eb&color=fff'}" 
                   alt="${currentUser.full_name || 'User'}" 
                   class="rounded-circle me-2" 
                   style="width: 40px; height: 40px; object-fit: cover;">
              <div>
                <h6 class="mb-0">${currentUser.full_name || 'User'}</h6>
                <small class="text-muted">${currentUser.email || ''}</small>
              </div>
            </div>
          </li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#/user-dashboard"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
          <li><a class="dropdown-item" href="#/my-profile"><i class="bi bi-person me-2"></i>My Profile</a></li>
          <li><a class="dropdown-item" href="#/settings"><i class="bi bi-gear me-2"></i>Settings</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" onclick="logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
        </ul>
      </div>
    `
  } else {
    // User is not logged in
    authMenu.innerHTML = `
      <div class="d-flex gap-2">
        <a href="#/user-register" class="btn btn-outline-primary d-none d-md-inline-flex">
          <i class="bi bi-person-plus me-1"></i> Register
        </a>
        <div class="dropdown">
          <button class="btn btn-primary px-3" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-box-arrow-in-right me-1"></i> Login
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow" style="min-width: 200px;">
            <li><a class="dropdown-item" href="#/user-login"><i class="bi bi-person me-2"></i>User Login</a></li>
            <li><a class="dropdown-item" href="#/police-login"><i class="bi bi-shield-lock me-2"></i>Police Login</a></li>
          </ul>
        </div>
      </div>
    `
  }
  
  // Re-initialize tooltips after updating the menu
  initTooltips()
}

async function loadPage(route) {
  const content = document.getElementById('page-content')
  if (!content) return

  try {
    setLoading(true)
    
    // Add fade out animation
    content.style.opacity = '0'
    content.style.transition = 'opacity 0.3s ease'
    
    // Small delay to allow fade out
    await new Promise(resolve => setTimeout(resolve, 200))
    
    if (pages[route]) {
      content.innerHTML = await pages[route]()
      // Add animation class to new content
      content.style.opacity = '0'
      content.style.animation = 'fadeIn 0.5s forwards'
      
      // Attach location capture button listener if on complaint form page
      if (route === 'file-complaint') {
        const captureBtn = document.getElementById('captureUserLocation')
        if (captureBtn) {
          captureBtn.addEventListener('click', async (e) => {
            e.preventDefault()
            captureBtn.disabled = true
            captureBtn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Capturing...'
            
            try {
              const location = await getUserLocation()
              const locationStr = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (±${location.accuracy.toFixed(0)}m)`
              document.getElementById('userLocation').value = locationStr
              document.getElementById('userLocation').setAttribute('data-location', JSON.stringify(location))
              showNotification('success', 'Location captured successfully!', 3000)
            } catch (error) {
              showNotification('error', `Error: ${error.message}`, 5000)
            } finally {
              captureBtn.disabled = false
              captureBtn.innerHTML = '<i class="bi bi-geo-alt"></i> Capture'
            }
          })
        }
      }
    } else {
      content.innerHTML = `
        <div class="container py-5 text-center">
          <div class="error-404">
            <h1 class="display-1 text-primary">404</h1>
            <h2 class="mb-4">Page Not Found</h2>
            <p class="lead mb-4">The page you are looking for doesn't exist or has been moved.</p>
            <a href="#/" class="btn btn-primary">
              <i class="bi bi-house-door me-2"></i>Back to Home
            </a>
          </div>
        </div>
      `
    }
    
    // Re-initialize components
    initTooltips()
    
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
  } catch (error) {
    console.error(`Error loading page ${route}:`, error)
    showNotification('error', 'Failed to load the page. Please try again.')
  } finally {
    setLoading(false)
    // Fade in the content
    content.style.opacity = '1'
  }
}

function renderHome() {
  return `
    <div class="container">
      <div class="hero-section">
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
          <img src="https://img.freepik.com/premium-vector/eye-logo-vector-design_9999-14585.jpg" alt="ObservX" style="height: 80px; width: 80px; border-radius: 50%; object-fit: cover; margin-right: 1.5rem; background: white; padding: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
          <h1 style="margin: 0; font-size: 3.5rem;">ObservX</h1>
        </div>
        <p class="tagline">A Digital Platform for Public Safety & Justice</p>
        <p class="mb-4">File complaints securely and track their status in real-time</p>
        ${!currentUser ? `
          <a href="#/user-register" class="btn btn-light btn-lg me-2">Register Now</a>
          <a href="#/user-login" class="btn btn-outline-light btn-lg">Login</a>
        ` : `
          <a href="#/file-complaint" class="btn btn-light btn-lg me-2">File Complaint</a>
          <a href="#/my-complaints" class="btn btn-outline-light btn-lg">View Status</a>
        `}
      </div>

      <div class="row g-4 mb-5">
        <div class="col-md-4">
          <div class="feature-box">
            <i class="bi bi-file-text"></i>
            <h3>Easy Complaint Filing</h3>
            <p>File complaints with detailed information and evidence</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="feature-box">
            <i class="bi bi-shield-lock"></i>
            <h3>Secure & Confidential</h3>
            <p>Your information is protected with government-level security</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="feature-box">
            <i class="bi bi-clock-history"></i>
            <h3>Real-time Tracking</h3>
            <p>Track the status of your complaint instantly</p>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title"><i class="bi bi-info-circle"></i> For Citizens</h5>
              <p class="card-text">Register and file complaints for various incidents including theft, cyber crimes, and missing persons.</p>
              ${!currentUser ? `<a href="#/user-register" class="btn btn-sm btn-primary">Get Started</a>` : ''}
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title"><i class="bi bi-building"></i> For Police</h5>
              <p class="card-text">Login to view all complaints filed by citizens and manage investigations efficiently.</p>
              <a href="#/police-login" class="btn btn-sm btn-primary">Police Login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderAbout() {
  return `
    <div class="container">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="text-center mb-4">
            <img src="https://img.freepik.com/premium-vector/eye-logo-vector-design_9999-14585.jpg" alt="ObservX" style="height: 80px; margin-bottom: 1rem;">
          </div>
          <h1>About ObservX</h1>
          <p class="lead">ObservX is a national digital platform designed to bridge the gap between citizens and law enforcement agencies.</p>

          <h3>Our Mission</h3>
          <p>To provide a secure, transparent, and efficient system for filing and tracking police complaints across India.</p>

          <h3>Key Features</h3>
          <ul class="list-group list-group-flush mb-4">
            <li class="list-group-item"><i class="bi bi-check-circle text-success"></i> 24/7 complaint filing availability</li>
            <li class="list-group-item"><i class="bi bi-check-circle text-success"></i> Anonymous complaint option</li>
            <li class="list-group-item"><i class="bi bi-check-circle text-success"></i> Evidence upload support</li>
            <li class="list-group-item"><i class="bi bi-check-circle text-success"></i> Real-time status updates</li>
            <li class="list-group-item"><i class="bi bi-check-circle text-success"></i> Police officer assignment tracking</li>
            <li class="list-group-item"><i class="bi bi-check-circle text-success"></i> Secure data encryption</li>
          </ul>

          <h3>Complaint Categories</h3>
          <div class="row g-3">
            <div class="col-md-6">
              <strong>Theft & Property Crimes</strong>
              <p class="text-muted small">Burglary, theft, robbery, auto theft</p>
            </div>
            <div class="col-md-6">
              <strong>Cyber Crimes</strong>
              <p class="text-muted small">Online fraud, hacking, phishing</p>
            </div>
            <div class="col-md-6">
              <strong>Missing Persons</strong>
              <p class="text-muted small">Missing adult, missing child, runaway</p>
            </div>
            <div class="col-md-6">
              <strong>Violence & Harassment</strong>
              <p class="text-muted small">Assault, harassment, threats</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderContact() {
  return `
    <div class="container">
      <div class="row">
        <div class="col-lg-6 mx-auto">
          <h1>Contact Us</h1>

          <div class="alert alert-info">
            <strong>Emergency?</strong> Call 100 or your local police station immediately.
          </div>

          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title"><i class="bi bi-telephone"></i> Helpline</h5>
              <p class="card-text">1800-200-SECURE (7323873)</p>
              <small class="text-muted">Available 24/7</small>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title"><i class="bi bi-envelope"></i> Email</h5>
              <p class="card-text">support@secureindiapolice.gov.in</p>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <h5 class="card-title"><i class="bi bi-building"></i> Address</h5>
              <p class="card-text">
                Ministry of Public Safety & Justice<br>
                Government of India<br>
                New Delhi - 110001
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderUserRegister() {
  if (currentUser) {
    return `<div class="alert alert-warning text-center mt-5">You are already logged in. <a href="#/user-dashboard">Go to Dashboard</a></div>`
  }

  return `
    <div class="login-container">
      <div class="login-card">
        <h2><i class="bi bi-person-plus"></i> Register as Citizen</h2>
        <form id="registerForm">
          <div class="mb-3">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-control" name="cname" id="fullName" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" name="cemail" id="email" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Mobile Number</label>
            <input type="tel" class="form-control" name="cmobile" id="mobile" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Address</label>
            <textarea class="form-control" name="caddress" id="address" rows="2"></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" name="cpassword" id="password" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Confirm Password</label>
            <input type="password" class="form-control" name="cpass" id="confirmPassword" required>
          </div>
          <div id="registerAlert"></div>
          <button type="submit" class="btn btn-primary w-100">Register</button>
        </form>
        <p class="text-center mt-3">Already have an account? <a href="#/user-login">Login here</a></p>
      </div>
    </div>
  `
}

function renderUserLogin() {
  if (currentUser) {
    return `<div class="alert alert-warning text-center mt-5">You are already logged in. <a href="#/user-dashboard">Go to Dashboard</a></div>`
  }

  return `
    <div class="login-container">
      <div class="login-card">
        <h2><i class="bi bi-person-check"></i> Citizen Login</h2>
        <form id="loginForm">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" id="loginEmail" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" id="loginPassword" required>
          </div>
          <div id="loginAlert"></div>
          <button type="submit" class="btn btn-primary w-100">Login</button>
        </form>
        <p class="text-center mt-3">Don't have an account? <a href="#/user-register">Register here</a></p>
        <p class="text-center"><small>Police Officer? <a href="#/police-login">Login here</a></small></p>
      </div>
    </div>
  `
}

function renderPoliceLogin() {
  if (currentUser && currentUserRole === 'police') {
    return `<div class="alert alert-warning text-center mt-5">You are already logged in. <a href="#/police-dashboard">Go to Dashboard</a></div>`
  }

  return `
    <div class="login-container">
      <div class="login-card">
        <h2><i class="bi bi-shield-check"></i> Police Login</h2>
        <div class="alert alert-info mb-3">
          <small>This portal is exclusively for authorized police officers only.</small>
        </div>
        <form id="policeLoginForm">
          <div class="mb-3">
            <label class="form-label">Police Email ID</label>
            <input type="email" class="form-control" id="policeEmail" placeholder="officer@secureindiapolice.gov.in" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" id="policePassword" required>
          </div>
          <div id="policeLoginAlert"></div>
          <button type="submit" class="btn btn-secondary w-100">Login</button>
        </form>
        <p class="text-center mt-3"><a href="#/">Back to Home</a></p>
      </div>
    </div>
  `
}

// Capture user's current location using Geolocation API
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        resolve({
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString()
        })
      },
      (error) => {
        reject(error)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

function renderFileComplaint() {
  if (!currentUser || currentUserRole === 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Please login as a citizen to file a complaint. <a href="#/user-login">Login here</a></div></div>`
  }

  return `
    <div class="container">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="form-section">
            <h2><i class="bi bi-file-earmark-text"></i> File a Complaint</h2>
            <form id="complaintForm">
              <div class="mb-3">
                <label class="form-label">Complaint Title <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="complaintTitle" placeholder="Brief title of your complaint" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Category <span class="text-danger">*</span></label>
                <select class="form-select" id="category" required>
                  <option value="">Select a category</option>
                  <option value="theft">Theft & Robbery</option>
                  <option value="cyber-crime">Cyber Crime</option>
                  <option value="missing-person">Missing Person</option>
                  <option value="violence">Violence & Harassment</option>
                  <option value="fraud">Fraud & Forgery</option>
                  <option value="property">Property Damage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Incident Date <span class="text-danger">*</span></label>
                <input type="date" class="form-control" id="incidentDate" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Your Current Location (Auto-captured) <span class="text-danger">*</span></label>
                <div class="input-group">
                  <input type="text" class="form-control" id="userLocation" placeholder="Waiting for GPS..." readonly>
                  <button class="btn btn-outline-secondary" type="button" id="captureUserLocation">
                    <i class="bi bi-geo-alt"></i> Capture
                  </button>
                </div>
                <small class="text-muted">Your current location will be recorded for verification</small>
              </div>
              <div class="mb-3">
                <label class="form-label">Crime Location (Where incident happened) <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="crimeLocation" placeholder="Address or location of incident" required>
                <small class="text-muted">Optional: Provide GPS coordinates (latitude, longitude)</small>
              </div>
              <div class="mb-3">
                <label class="form-label">Description <span class="text-danger">*</span></label>
                <textarea class="form-control" id="description" rows="5" placeholder="Provide detailed information about the incident" required></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Upload Evidence (Optional)</label>
                <input type="file" class="form-control" id="evidence" accept=".pdf,.jpg,.jpeg,.png" help-text="Max 5MB">
                <small class="text-muted">Accepted: PDF, JPG, PNG (Max 5MB)</small>
              </div>
              <div id="complaintAlert"></div>
              <button type="submit" class="btn btn-primary w-100">Submit Complaint</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderUserDashboard() {
  if (!currentUser || currentUserRole === 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Unauthorized access. <a href="#/user-login">Login here</a></div></div>`
  }

  return `
    <div class="container">
      <div class="dashboard-header d-flex justify-content-between align-items-center">
        <div>
          <h2>Welcome, ${currentUser.email}</h2>
          <p class="mb-0">Citizen Dashboard</p>
        </div>
        <a href="#/file-complaint" class="btn btn-light">
          <i class="bi bi-file-earmark-plus"></i> File Complaint
        </a>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="stat-box">
            <div class="number" id="totalComplaints">-</div>
            <div class="label">Total Complaints</div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="stat-box">
            <div class="number" id="resolvedCount">-</div>
            <div class="label">Resolved</div>
          </div>
        </div>
      </div>

      <h3 class="mb-3">Your Recent Complaints</h3>
      <div id="complaintsContainer" class="mb-4">
        <div class="loading">
          <div class="spinner-border" role="status"></div>
        </div>
      </div>

      <div class="text-center">
        <a href="#/my-complaints" class="btn btn-outline-primary">View All Complaints</a>
      </div>
    </div>
  `
}

function renderMyComplaints() {
  if (!currentUser || currentUserRole === 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Unauthorized access.</div></div>`
  }

  return `
    <div class="container">
      <h2 class="mb-4"><i class="bi bi-file-text"></i> My Complaints</h2>

      <div class="mb-3">
        <input type="text" class="form-control" id="searchInput" placeholder="Search by complaint ID or title...">
      </div>

      <div id="myComplaintsContainer">
        <div class="loading">
          <div class="spinner-border" role="status"></div>
        </div>
      </div>
    </div>
  `
}

function renderPoliceDashboard() {
  if (!currentUser || currentUserRole !== 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Unauthorized access. <a href="#/police-login">Police Login</a></div></div>`
  }

  return `
    <div class="container">
      <div class="dashboard-header">
        <h2>Police Dashboard</h2>
        <p class="mb-0">Officer ID: ${currentUser.email}</p>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="stat-box">
            <div class="number" id="pendingCount">-</div>
            <div class="label">Pending</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-box">
            <div class="number" id="investigatingCount">-</div>
            <div class="label">Investigating</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-box">
            <div class="number" id="resolvedCount2">-</div>
            <div class="label">Resolved</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-box">
            <div class="number" id="totalComplaints2">-</div>
            <div class="label">Total</div>
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-4">
          <label class="form-label">Filter by Status</label>
          <select class="form-select" id="statusFilter">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="investigating">Under Investigation</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Filter by Category</label>
          <select class="form-select" id="categoryFilter">
            <option value="">All Categories</option>
            <option value="theft">Theft & Robbery</option>
            <option value="cyber-crime">Cyber Crime</option>
            <option value="missing-person">Missing Person</option>
            <option value="violence">Violence & Harassment</option>
            <option value="fraud">Fraud & Forgery</option>
            <option value="property">Property Damage</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">&nbsp;</label>
          <button class="btn btn-primary w-100" onclick="loadComplaints()">Apply Filters</button>
        </div>
      </div>

      <h3 class="mb-3">All Complaints</h3>
      <div id="complaintsTableContainer">
        <div class="loading">
          <div class="spinner-border" role="status"></div>
        </div>
      </div>
    </div>
  `
}

function renderViewComplaint() {
  if (!currentUser) {
    return `<div class="container mt-5"><div class="alert alert-danger">Please login to view complaint details.</div></div>`
  }

  return `
    <div class="container">
      <a href="javascript:history.back()" class="btn btn-outline-secondary mb-3">
        <i class="bi bi-arrow-left"></i> Back
      </a>
      <div id="complaintDetailContainer">
        <div class="loading">
          <div class="spinner-border" role="status"></div>
        </div>
      </div>
    </div>
  `
}

function renderViewComplaints() {
  if (!currentUser || currentUserRole !== 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Unauthorized access.</div></div>`
  }

  return renderPoliceDashboard()
}

function renderUpdateComplaint() {
  if (!currentUser || currentUserRole !== 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Unauthorized access.</div></div>`
  }

  const complaintId = new URLSearchParams(location.hash).get('id')

  return `
    <div class="container">
      <a href="javascript:history.back()" class="btn btn-outline-secondary mb-3">
        <i class="bi bi-arrow-left"></i> Back
      </a>

      <div class="form-section">
        <h2>Update Complaint Status</h2>
        <form id="updateComplaintForm">
          <div class="mb-3">
            <label class="form-label">New Status <span class="text-danger">*</span></label>
            <select class="form-select" id="updateStatus" required>
              <option value="">Select Status</option>
              <option value="pending">Pending</option>
              <option value="investigating">Under Investigation</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Police Remarks</label>
            <textarea class="form-control" id="policeRemarks" rows="4" placeholder="Add remarks about the complaint"></textarea>
          </div>
          <div id="updateAlert"></div>
          <button type="submit" class="btn btn-primary">Update Status</button>
        </form>
      </div>
    </div>
  `
}

document.addEventListener('submit', async (e) => {
  const form = e.target

  if (form.id === 'registerForm') {
    e.preventDefault()
    await handleUserRegister(form)
  } else if (form.id === 'loginForm') {
    e.preventDefault()
    await handleUserLogin(form)
  } else if (form.id === 'policeLoginForm') {
    e.preventDefault()
    await handlePoliceLogin(form)
  } else if (form.id === 'complaintForm') {
    e.preventDefault()
    await handleComplaintSubmit(form)
  } else if (form.id === 'updateComplaintForm') {
    e.preventDefault()
    await handleUpdateComplaint(form)
  }
})

async function handleUserRegister(form) {
  const fullName = document.getElementById('fullName').value
  const email = document.getElementById('email').value
  const mobile = document.getElementById('mobile').value
  const address = document.getElementById('address').value
  const password = document.getElementById('password').value
  const confirmPassword = document.getElementById('confirmPassword').value
  const alertDiv = document.getElementById('registerAlert')

  if (password !== confirmPassword) {
    alertDiv.innerHTML = '<div class="alert alert-danger">Passwords do not match</div>'
    return
  }

  try {
    // Submit to server-side PHP register endpoint
    const payload = new URLSearchParams()
    payload.append('email', email)
    payload.append('password', password)
    payload.append('password2', confirmPassword)
    payload.append('fullName', fullName)
    payload.append('mobile', mobile)
    payload.append('address', address)

    // Try multiple possible backend endpoints to avoid dev-server vs Apache routing issues
    const tried = []
    const candidates = []
    candidates.push('http://localhost/register.php')
    candidates.push('http://127.0.0.1/register.php')
    if (backendBase) candidates.push(`${backendBase}/register.php`)
    candidates.push(`${window.location.protocol}//${window.location.hostname}/register.php`)

    let lastError = null
    let handled = false

    for (const url of candidates) {
      if (tried.includes(url)) continue
      tried.push(url)
      console.log('Attempting registration POST to', url)
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: payload,
        })

        const responseText = await res.text()
        console.log('Raw response from', url, responseText)

        try {
          const json = JSON.parse(responseText)
          if (!res.ok || !json.success) {
            alertDiv.innerHTML = `<div class="alert alert-danger">${json.message || 'Registration failed'}</div>`
            handled = true
            break
          }

          alertDiv.innerHTML = '<div class="alert alert-success">Registration successful! <a href="#/user-login">Login here</a></div>'
          form.reset()
          handled = true
          break
        } catch (jsonError) {
          // not JSON — show raw text
          alertDiv.innerHTML = `<div class="alert alert-danger">Server error: ${responseText}</div>`
          handled = true
          break
        }
      } catch (err) {
        console.warn('Fetch to', url, 'failed:', err)
        lastError = err
        continue
      }
    }

    if (!handled) {
      alertDiv.innerHTML = `<div class="alert alert-danger">${lastError ? lastError.message : 'Failed to reach server'}</div>`
    }
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
  }
}

async function handleUserLogin(form) {
  const email = document.getElementById('loginEmail').value
  const password = document.getElementById('loginPassword').value
  const alertDiv = document.getElementById('loginAlert')

  try {
    // First try PHP backend
    const payload = new URLSearchParams()
    payload.append('email', email)
    payload.append('password', password)

    const res = await fetch('http://localhost/login.php', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: payload,
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      alertDiv.innerHTML = `<div class="alert alert-danger">${json.message || 'Login failed'}</div>`
      return
    }

    alertDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>'
    setTimeout(() => {
      location.hash = '#/user-dashboard'
    }, 500)
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
  }
}

async function handlePoliceLogin(form) {
  const email = document.getElementById('policeEmail').value
  const password = document.getElementById('policePassword').value
  const alertDiv = document.getElementById('policeLoginAlert')

  try {
    const payload = new URLSearchParams()
    payload.append('email', email)
    payload.append('password', password)

    const res = await fetch('http://localhost/police-login.php', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: payload,
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      alertDiv.innerHTML = `<div class="alert alert-danger">${json.message || 'Login failed'}</div>`
      return
    }

    alertDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>'
    setTimeout(() => {
      location.hash = '#/police-dashboard'
    }, 500)
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
  }
}

async function handleComplaintSubmit(form) {
  const title = document.getElementById('complaintTitle').value
  const category = document.getElementById('category').value
  const incidentDate = document.getElementById('incidentDate').value
  const userLocationInput = document.getElementById('userLocation')
  const crimeLocation = document.getElementById('crimeLocation').value
  const description = document.getElementById('description').value
  const evidenceFile = document.getElementById('evidence').files[0]
  const alertDiv = document.getElementById('complaintAlert')

  try {
    // Validate user location captured
    if (!userLocationInput.value) {
      throw new Error('Please capture your current location using the GPS button')
    }

    // Parse user location from data attribute
    const userLocationStr = userLocationInput.getAttribute('data-location')
    let userLocation = null
    try {
      userLocation = JSON.parse(userLocationStr)
    } catch (e) {
      throw new Error('Invalid location format. Try capturing again.')
    }

    // Crime location (basic parsing - can be extended with geocoding)
    const crimeLocationData = {
      address: crimeLocation,
      captured_at: new Date().toISOString()
    }

    let evidencePath = null

    if (evidenceFile) {
      const fileSize = evidenceFile.size / 1024 / 1024
      if (fileSize > 5) {
        throw new Error('File size must be less than 5MB')
      }

      // For now, just store file info locally (no Supabase)
      // In production, you'd use proper storage
      evidencePath = evidenceFile.name
    }

    // Submit to backend with location data
    const payload = {
      user_id: currentUser.id,
      title,
      category,
      incident_date: incidentDate,
      user_location: userLocation,
      crime_location: crimeLocationData,
      description
    }

    const res = await fetch('/file-complaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.message || 'Failed to file complaint')
    }

    alertDiv.innerHTML = `<div class="alert alert-success">
      Complaint filed successfully!<br>
      <strong>Complaint ID:</strong> ${data.complaint_id}<br>
      <small>Your location has been recorded for verification</small>
    </div>`
    form.reset()
    document.getElementById('userLocation').value = ''
    document.getElementById('userLocation').removeAttribute('data-location')
    
    setTimeout(() => {
      location.hash = '#/my-complaints'
    }, 2000)
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
  }
}

async function handleUpdateComplaint(form) {
  const status = document.getElementById('updateStatus').value
  const remarks = document.getElementById('policeRemarks').value
  const alertDiv = document.getElementById('updateAlert')
  const complaintId = new URLSearchParams(location.hash).get('id')

  try {
    const { error } = await supabase
      .from('complaints')
      .update({
        status,
        police_remarks: remarks,
        assigned_to: currentUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', complaintId)

    if (error) throw error

    alertDiv.innerHTML = '<div class="alert alert-success">Complaint updated successfully!</div>'
    setTimeout(() => {
      location.hash = '#/police-dashboard'
    }, 1500)
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
  }
}

async function logout() {
  try {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error
    
    currentUser = null
    currentUserRole = null
    updateAuthMenu()
    
    showNotification('success', 'You have been successfully logged out.')
    
    // Redirect to home after a short delay
    setTimeout(() => {
      window.location.hash = '/'
    }, 1000)
    
  } catch (error) {
    console.error('Logout error:', error)
    showNotification('error', 'Failed to log out. Please try again.')
  } finally {
    setLoading(false)
  }
}

window.logout = logout

async function loadComplaints() {
  if (!currentUser) return

  const container = currentUserRole === 'police'
    ? document.getElementById('complaintsTableContainer')
    : document.getElementById('myComplaintsContainer')

  if (!container) return

  const statusFilter = document.getElementById('statusFilter')?.value || ''
  const categoryFilter = document.getElementById('categoryFilter')?.value || ''

  try {
    let query = supabase.from('complaints').select('*')

    if (currentUserRole === 'user') {
      query = query.eq('user_id', currentUser.id)
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    if (categoryFilter) {
      query = query.eq('category', categoryFilter)
    }

    query = query.order('created_at', { ascending: false })

    const { data: complaints, error } = await query

    if (error) throw error

    if (!complaints || complaints.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No complaints found</div>'
      return
    }

    if (currentUserRole === 'police') {
      renderPoliceComplaintsTable(complaints)
    } else {
      renderUserComplaints(complaints)
    }

    updateStats(complaints)
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
  }
}

function updateStats(complaints) {
  const total = complaints.length
  const resolved = complaints.filter(c => c.status === 'resolved').length
  const pending = complaints.filter(c => c.status === 'pending').length
  const investigating = complaints.filter(c => c.status === 'investigating').length

  const totalEl = document.getElementById('totalComplaints')
  const resolvedEl = document.getElementById('resolvedCount')
  const pendingEl = document.getElementById('pendingCount')
  const investigatingEl = document.getElementById('investigatingCount')
  const totalEl2 = document.getElementById('totalComplaints2')
  const resolvedEl2 = document.getElementById('resolvedCount2')

  if (totalEl) totalEl.textContent = total
  if (resolvedEl) resolvedEl.textContent = resolved
  if (pendingEl) pendingEl.textContent = pending
  if (investigatingEl) investigatingEl.textContent = investigating
  if (totalEl2) totalEl2.textContent = total
  if (resolvedEl2) resolvedEl2.textContent = resolved
}

function renderUserComplaints(complaints) {
  const container = document.getElementById('myComplaintsContainer')
  let html = ''

  complaints.forEach(complaint => {
    const badgeClass = `badge-${complaint.status}`
    const statusText = complaint.status === 'investigating' ? 'Under Investigation' : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)

    html += `
      <div class="complaint-card ${complaint.status}">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h5 class="mb-1">${complaint.title}</h5>
            <small class="text-muted">ID: ${complaint.complaint_id}</small>
          </div>
          <span class="badge ${badgeClass}">${statusText}</span>
        </div>
        <p class="mb-2"><strong>Category:</strong> ${complaint.category}</p>
        <p class="mb-2"><strong>Location:</strong> ${complaint.location}</p>
        <p class="mb-2"><strong>Date:</strong> ${new Date(complaint.incident_date).toLocaleDateString()}</p>
        <p class="text-muted">${complaint.description.substring(0, 100)}...</p>
        ${complaint.police_remarks ? `<p class="mt-2 p-2 bg-light rounded"><strong>Police Remarks:</strong> ${complaint.police_remarks}</p>` : ''}
        <button class="btn btn-sm btn-outline-primary mt-2" onclick="location.hash='#/view-complaint?id=${complaint.id}'">View Details</button>
      </div>
    `
  })

  container.innerHTML = html
}

function renderPoliceComplaintsTable(complaints) {
  const container = document.getElementById('complaintsTableContainer')
  let html = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Complaint ID</th>
            <th>Citizen</th>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
  `

  complaints.forEach(complaint => {
    const badgeClass = `badge-${complaint.status}`
    const statusText = complaint.status === 'investigating' ? 'Under Investigation' : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)

    html += `
      <tr>
        <td><strong>${complaint.complaint_id}</strong></td>
        <td>${complaint.user_id.substring(0, 8)}...</td>
        <td>${complaint.title}</td>
        <td>${complaint.category}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td>${new Date(complaint.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="location.hash='#/view-complaint?id=${complaint.id}'">
            View
          </button>
          <button class="btn btn-sm btn-warning" onclick="location.hash='#/update-complaint?id=${complaint.id}'">
            Update
          </button>
        </td>
      </tr>
    `
  })

  html += `
        </tbody>
      </table>
    </div>
  `

  container.innerHTML = html
}

window.loadComplaints = loadComplaints

document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver(() => {
    if (document.getElementById('myComplaintsContainer') || document.getElementById('complaintsTableContainer')) {
      loadComplaints()
    }
  })

  observer.observe(document.getElementById('page-content'), { childList: true })
})
