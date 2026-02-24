import './style.css?v=2.0'
// Version: 2.0 - Force Refresh Update
console.log('🔄 ObservX v2.0 - Loading with force refresh...');

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
  'user-dashboard-enhanced': () => window.location.href = 'user_dashboard_enhanced.html',
  'police-dashboard': renderPoliceDashboard,
  'file-complaint': renderFileComplaint,
  'emergency-complaint': renderEmergencyComplaint,
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
    // Use PHP session check instead of Supabase
    try {
      const res = await fetch('http://localhost:8080/check_auth.php', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      })
      
      const data = await res.json()
      
      if (data.authenticated && data.user) {
        currentUser = data.user
        currentUserRole = data.user.role || 'user'
        updateAuthMenu()
        return true
      }
      
      return false
    } catch (error) {
      console.log('Auth check error:', error)
      return false
    }
  }

  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) throw error

    if (data.session) {
      currentUser = data.session.user
      
      // Fetch user role (only if Supabase is available)
      if (supabase) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, full_name, avatar_url')
          .eq('id', currentUser.id)
          .maybeSingle()
          
        if (userError) throw userError
        
        currentUserRole = userData?.role || 'user'
        currentUser = { ...currentUser, ...userData }
      } else {
        // Use PHP session fallback for role
        currentUserRole = 'user'
      }
      
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
      
      // Attach emergency location capture button listener if on emergency complaint page
      if (route === 'emergency-complaint') {
        const captureBtn = document.getElementById('captureEmergencyLocation')
        if (captureBtn) {
          captureBtn.addEventListener('click', async (e) => {
            e.preventDefault()
            captureBtn.disabled = true
            captureBtn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Capturing...'
            
            try {
              const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0
                })
              })
              
              const { latitude, longitude } = position.coords
              const locationInput = document.getElementById('emergencyUserLocation')
              locationInput.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              locationInput.setAttribute('data-location', JSON.stringify({
                lat: latitude,
                lng: longitude,
                captured_at: new Date().toISOString()
              }))
              
              captureBtn.innerHTML = '<i class="bi bi-check-circle"></i> Captured'
              captureBtn.classList.remove('btn-danger')
              captureBtn.classList.add('btn-success')
              
              setTimeout(() => {
                captureBtn.disabled = false
                captureBtn.innerHTML = '<i class="bi bi-geo-alt-fill"></i> Capture Location'
                captureBtn.classList.remove('btn-success')
                captureBtn.classList.add('btn-danger')
              }, 2000)
              
            } catch (error) {
              console.error('Emergency location capture failed:', error)
              captureBtn.innerHTML = '<i class="bi bi-x-circle"></i> Failed'
              captureBtn.classList.remove('btn-danger')
              captureBtn.classList.add('btn-outline-danger')
              
              setTimeout(() => {
                captureBtn.disabled = false
                captureBtn.innerHTML = '<i class="bi bi-geo-alt-fill"></i> Capture Location'
                captureBtn.classList.remove('btn-outline-danger')
                captureBtn.classList.add('btn-danger')
              }, 2000)
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
          <div class="mt-3">
            <a href="#/file-complaint" class="btn btn-outline-light me-2">
              <i class="bi bi-file-earmark-text"></i> File Normal Complaint
            </a>
            <a href="#/emergency-complaint" class="btn btn-danger">
              <i class="bi bi-exclamation-triangle-fill"></i> Emergency Complaint
            </a>
          </div>
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
            <input type="text" class="form-control" name="fullName" id="fullName" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" name="email" id="email" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Mobile Number</label>
            <input type="tel" class="form-control" name="mobile" id="mobile" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Address</label>
            <textarea class="form-control" name="address" id="address" rows="2"></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" name="password" id="password" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Confirm Password</label>
            <input type="password" class="form-control" name="password2" id="confirmPassword" required>
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
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow">
            <div class="card-body p-4">
              <div class="text-center mb-4">
                <div class="badge bg-success text-white p-2 mb-3">
                  <i class="bi bi-person-check me-2"></i>CITIZEN LOGIN
                </div>
                <h3 class="card-title">Welcome Back</h3>
                <p class="text-muted small">Login to file and track complaints</p>
              </div>
              
              <form id="loginForm">
                <div class="mb-3">
                  <label for="loginEmail" class="form-label">Email Address</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                    <input type="email" class="form-control" id="loginEmail" placeholder="Enter your email" required>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="loginPassword" class="form-label">Password</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-lock"></i></span>
                    <input type="password" class="form-control" id="loginPassword" placeholder="Enter your password" required>
                  </div>
                </div>
                
                <div id="loginAlert"></div>
                
                <div class="d-grid">
                  <button type="submit" class="btn btn-success btn-lg">
                    <i class="bi bi-box-arrow-in-right me-2"></i>Login
                  </button>
                </div>
              </form>
              
              <div class="text-center mt-4 pt-3 border-top">
                <p class="mb-2">Don't have an account? <a href="#/user-register" class="text-decoration-none">Register here</a></p>
                <p class="mb-0"><small>Police Officer? <a href="#/police-login" class="text-decoration-none">Login here</a></small></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderPoliceLogin() {
  if (currentUser && currentUserRole === 'police') {
    return `<div class="alert alert-warning text-center mt-5">You are already logged in. <a href="#/police-dashboard">Go to Dashboard</a></div>`
  }

  return `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow">
            <div class="card-body p-4">
              <div class="text-center mb-4">
                <div class="badge bg-primary text-white p-2 mb-3">
                  <i class="bi bi-shield-lock me-2"></i>POLICE PORTAL
                </div>
                <h3 class="card-title">Police Admin Login</h3>
                <p class="text-muted small">Authorized personnel only</p>
              </div>
              
              <div class="alert alert-info mb-3">
                <small><i class="bi bi-info-circle me-2"></i>This portal is exclusively for authorized police officers only.</small>
              </div>
              
              <div class="alert alert-success mb-3">
                <small><strong><i class="bi bi-key me-2"></i>Test Credentials:</strong><br>
                📧 Email: police@observx.com<br>
                🔑 Password: police123</small>
              </div>
              
              <form id="policeLoginForm">
                <div class="mb-3">
                  <label for="policeEmail" class="form-label">Police Email ID</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                    <input type="email" class="form-control" id="policeEmail" placeholder="police@observx.com" value="police@observx.com" required>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="policePassword" class="form-label">Password</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-lock"></i></span>
                    <input type="password" class="form-control" id="policePassword" placeholder="police123" value="police123" required>
                  </div>
                </div>
                
                <div id="policeLoginAlert"></div>
                
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary btn-lg">
                    <i class="bi bi-shield-check me-2"></i>Login to Portal
                  </button>
                </div>
              </form>
              
              <div class="text-center mt-4 pt-3 border-top">
                <p class="text-muted small mb-0">For access issues, contact your administrator</p>
                <p class="mb-0"><a href="#/" class="text-decoration-none">← Back to Home</a></p>
              </div>
            </div>
          </div>
        </div>
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
  // Temporarily remove login requirement for testing
  // if (!currentUser || currentUserRole === 'police') {
  //   return `<div class="container mt-5"><div class="alert alert-danger">Please login as a citizen to file a complaint. <a href="#/user-login">Login here</a></div></div>`
  // }

  return `
    <div class="container">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="form-section">
            <div class="text-center mb-4">
              <div class="btn-group" role="group">
                <a href="#/file-complaint" class="btn btn-outline-primary active">
                  <i class="bi bi-file-earmark-text"></i> Normal Complaint
                </a>
                <a href="#/emergency-complaint" class="btn btn-outline-danger">
                  <i class="bi bi-exclamation-triangle-fill"></i> Emergency Complaint
                </a>
              </div>
            </div>
            
            <h2><i class="bi bi-file-earmark-text"></i> File a Normal Complaint</h2>
            <p class="text-muted">For non-urgent complaints that will be processed within 24-48 hours</p>
            
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
                <input type="file" class="form-control" id="evidenceFile" accept=".pdf,.jpg,.jpeg,.png,.mp4,.gif">
                <small class="text-muted">Accepted: PDF, JPG, PNG, MP4, GIF (Max 10MB)</small>
              </div>
              <div id="complaintAlert"></div>
              <button type="submit" class="btn btn-primary w-100">
                <i class="bi bi-file-earmark-plus"></i> Submit Normal Complaint
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderEmergencyComplaint() {
  // Temporarily remove login requirement for testing
  // if (!currentUser || currentUserRole === 'police') {
  //   return `<div class="container mt-5"><div class="alert alert-danger">Please login as a citizen to file a complaint. <a href="#/user-login">Login here</a></div></div>`
  // }

  return `
    <div class="container">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="form-section emergency-section">
            <div class="alert alert-danger d-flex align-items-center mb-4">
              <i class="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
              <div>
                <strong>EMERGENCY COMPLAINT</strong>
                <div class="small">For urgent matters requiring immediate police attention</div>
              </div>
            </div>
            
            <div class="text-center mb-4">
              <div class="btn-group" role="group">
                <a href="#/file-complaint" class="btn btn-outline-primary">
                  <i class="bi bi-file-earmark-text"></i> Normal Complaint
                </a>
                <a href="#/emergency-complaint" class="btn btn-outline-danger active">
                  <i class="bi bi-exclamation-triangle-fill"></i> Emergency Complaint
                </a>
              </div>
            </div>
            
            <h2 class="text-danger"><i class="bi bi-exclamation-triangle-fill"></i> File an Emergency Complaint</h2>
            <p class="text-danger fw-bold">This will be prioritized for immediate action</p>
            
            <form id="emergencyComplaintForm">
              <div class="mb-3">
                <label class="form-label">Emergency Type <span class="text-danger">*</span></label>
                <select class="form-select border-danger" id="emergencyType" required>
                  <option value="">Select emergency type</option>
                  <option value="life-threatening">Life Threatening Situation</option>
                  <option value="crime-in-progress">Crime in Progress</option>
                  <option value="accident">Serious Accident</option>
                  <option value="fire">Fire Emergency</option>
                  <option value="medical-emergency">Medical Emergency</option>
                  <option value="missing-child">Missing Child</option>
                  <option value="domestic-violence">Domestic Violence</option>
                  <option value="other-emergency">Other Emergency</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Urgency Level <span class="text-danger">*</span></label>
                <div class="btn-group w-100" role="group">
                  <input type="radio" class="btn-check" name="urgency" id="urgency-critical" value="critical" required>
                  <label class="btn btn-outline-danger" for="urgency-critical">
                    <i class="bi bi-exclamation-triangle"></i> Critical
                  </label>
                  
                  <input type="radio" class="btn-check" name="urgency" id="urgency-high" value="high" required>
                  <label class="btn btn-outline-warning" for="urgency-high">
                    <i class="bi bi-exclamation-circle"></i> High
                  </label>
                  
                  <input type="radio" class="btn-check" name="urgency" id="urgency-medium" value="medium" required>
                  <label class="btn btn-outline-info" for="urgency-medium">
                    <i class="bi bi-info-circle"></i> Medium
                  </label>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Emergency Title <span class="text-danger">*</span></label>
                <input type="text" class="form-control border-danger" id="emergencyTitle" placeholder="Brief description of emergency" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Current Location (Auto-captured) <span class="text-danger">*</span></label>
                <div class="input-group">
                  <input type="text" class="form-control border-danger" id="emergencyUserLocation" placeholder="Waiting for GPS..." readonly>
                  <button class="btn btn-danger" type="button" id="captureEmergencyLocation">
                    <i class="bi bi-geo-alt-fill"></i> Capture Location
                  </button>
                </div>
                <small class="text-danger">Your exact location is crucial for emergency response</small>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Emergency Location <span class="text-danger">*</span></label>
                <input type="text" class="form-control border-danger" id="emergencyLocation" placeholder="Exact location of emergency" required>
                <small class="text-danger">Provide precise address or GPS coordinates</small>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Emergency Description <span class="text-danger">*</span></label>
                <textarea class="form-control border-danger" id="emergencyDescription" rows="5" placeholder="Describe the emergency situation in detail" required></textarea>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Contact Number <span class="text-danger">*</span></label>
                <input type="tel" class="form-control border-danger" id="emergencyContact" placeholder="Your mobile number for immediate contact" required>
                <small class="text-danger">Police may contact you immediately for more information</small>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Upload Evidence (Optional)</label>
                <input type="file" class="form-control" id="emergencyEvidenceFile" accept=".pdf,.jpg,.jpeg,.png,.mp4,.gif">
                <small class="text-muted">Accepted: PDF, JPG, PNG, MP4, GIF (Max 10MB)</small>
              </div>
              
              <div class="mb-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="confirmEmergency" required>
                  <label class="form-check-label text-danger" for="confirmEmergency">
                    I confirm this is a genuine emergency requiring immediate police attention
                  </label>
                </div>
              </div>
              
              <div id="emergencyComplaintAlert"></div>
              <button type="submit" class="btn btn-danger w-100 btn-lg">
                <i class="bi bi-exclamation-triangle-fill"></i> Submit Emergency Complaint
              </button>
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
        <div>
          <a href="#/emergency-complaint" class="btn btn-danger me-2">
            <i class="bi bi-exclamation-triangle-fill"></i> Emergency
          </a>
          <a href="#/file-complaint" class="btn btn-light">
            <i class="bi bi-file-earmark-plus"></i> File Complaint
          </a>
        </div>
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
  console.log('renderMyComplaints called')
  
  // Temporarily remove login requirement for testing
  if (currentUserRole === 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Unauthorized access.</div></div>`
  }

  const html = `
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
  
  console.log('Returning HTML for My Complaints')
  
  // Load complaints after a short delay
  setTimeout(() => {
    console.log('Loading complaints...')
    console.log('Current user:', currentUser)
    console.log('Current role:', currentUserRole)
    loadUserComplaints()
    
    // Add search functionality
    const searchInput = document.getElementById('searchInput')
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase()
        filterComplaints(searchTerm)
      })
    }
  }, 500)
  
  return html
}

let allComplaints = []

async function loadUserComplaints() {
  const container = document.getElementById('myComplaintsContainer')
  if (!container) return
  
  try {
    const res = await fetch('http://localhost:8080/get_complaints.php', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    })
    
    const data = await res.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load complaints')
    }
    
    allComplaints = data.complaints
    renderUserComplaintsList(allComplaints)
    
  } catch (error) {
    console.error('Error loading complaints:', error)
    container.innerHTML = `<div class="alert alert-danger">Failed to load complaints: ${error.message}</div>`
  }
}

function filterComplaints(searchTerm) {
  if (!searchTerm) {
    renderUserComplaintsList(allComplaints)
    return
  }
  
  const filtered = allComplaints.filter(complaint => 
    complaint.title.toLowerCase().includes(searchTerm) ||
    complaint.complaint_id.toLowerCase().includes(searchTerm) ||
    complaint.category.toLowerCase().includes(searchTerm)
  )
  
  renderUserComplaintsList(filtered)
}

function renderUserComplaintsList(complaints) {
  const container = document.getElementById('myComplaintsContainer')
  if (!container) return
  
  if (complaints.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info text-center">
        <i class="bi bi-info-circle"></i> No complaints found. 
        <a href="#/file-complaint" class="btn btn-primary btn-sm ms-2">File Your First Complaint</a>
      </div>
    `
    return
  }
  
  const complaintsHtml = complaints.map(complaint => `
    <div class="card mb-3">
      <div class="card-body">
        <div class="row">
          <div class="col-md-8">
            <h5 class="card-title">${complaint.title}</h5>
            <p class="card-text">${complaint.description.substring(0, 100)}${complaint.description.length > 100 ? '...' : ''}</p>
            <div class="mb-2">
              <span class="badge bg-${getStatusColor(complaint.status)}">${complaint.status}</span>
              <span class="badge bg-secondary ms-2">${complaint.category}</span>
            </div>
          </div>
          <div class="col-md-4 text-end">
            <div class="text-muted small">
              <div><strong>ID:</strong> ${complaint.complaint_id}</div>
              <div><strong>Date:</strong> ${new Date(complaint.created_at).toLocaleDateString()}</div>
            </div>
            <button class="btn btn-outline-primary btn-sm mt-2" onclick="viewComplaint('${complaint.complaint_id}')">
              <i class="bi bi-eye"></i> View
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('')
  
  container.innerHTML = complaintsHtml
}

function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'pending': return 'warning'
    case 'under_investigation': return 'info'
    case 'resolved': return 'success'
    case 'closed': return 'secondary'
    default: return 'secondary'
  }
}

window.viewComplaint = function(complaintId) {
  location.hash = `#/view-complaint?id=${complaintId}`
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
  // Temporarily remove login requirement for testing
  const urlParams = new URLSearchParams(window.location.search)
  const complaintId = urlParams.get('id') || ''
  
  if (!complaintId) {
    return `<div class="container mt-5"><div class="alert alert-danger">No complaint ID provided.</div></div>`
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
  
  // Load complaint details after rendering
  setTimeout(() => loadComplaintDetail(complaintId), 100)
}

async function loadComplaintDetail(complaintId) {
  const container = document.getElementById('complaintDetailContainer')
  if (!container) return
  
  try {
    const res = await fetch(`http://localhost/adii/get_complaint.php?id=${complaintId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    })
    
    const data = await res.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load complaint')
    }
    
    renderComplaintDetail(data.complaint)
    
  } catch (error) {
    console.error('Error loading complaint:', error)
    container.innerHTML = `<div class="alert alert-danger">Failed to load complaint: ${error.message}</div>`
  }
}

function renderComplaintDetail(complaint) {
  const container = document.getElementById('complaintDetailContainer')
  if (!container) return
  
  const html = `
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h4 class="mb-0"><i class="bi bi-file-text"></i> ${complaint.title}</h4>
      </div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-md-6">
            <strong>Complaint ID:</strong> ${complaint.complaint_id}
          </div>
          <div class="col-md-6 text-end">
            <strong>Status:</strong> 
            <span class="badge bg-${getStatusColor(complaint.status)}">${complaint.status}</span>
          </div>
        </div>
        
        <div class="row mb-3">
          <div class="col-md-6">
            <strong>Category:</strong> ${complaint.category}
          </div>
          <div class="col-md-6 text-end">
            <strong>Filed Date:</strong> ${new Date(complaint.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <div class="mb-3">
          <strong>Description:</strong>
          <p class="mt-2">${complaint.description}</p>
        </div>
        
        <div class="row">
          <div class="col-md-6">
            <strong>Last Updated:</strong> ${new Date(complaint.updated_at).toLocaleDateString()}
          </div>
          <div class="col-md-6 text-end">
            <button class="btn btn-outline-secondary" onclick="window.print()">
              <i class="bi bi-printer"></i> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  `
  
  container.innerHTML = html
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
  } else if (form.id === 'emergencyComplaintForm') {
    e.preventDefault()
    await handleEmergencyComplaintSubmit(form)
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
  const confirmPassword = document.getElementById('password2') ? document.getElementById('password2').value : (document.getElementById('confirmPassword') ? document.getElementById('confirmPassword').value : '')
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

    // For Vite dev server, use the PHP backend
    const tried = []
    const candidates = []
    // Try XAMPP URLs for PHP processing
    candidates.push('http://localhost:8080/register.php')
    candidates.push('http://127.0.0.1:8080/register.php')
    candidates.push('http://localhost/register.php')
    candidates.push('http://127.0.0.1/register.php')

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
          mode: 'cors'
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

          alertDiv.innerHTML = '<div class="alert alert-success">Registration successful! Redirecting to login...</div>'
          form.reset()
          // Redirect to login page after 2 seconds
          setTimeout(() => {
            window.location.hash = '#/user-login'
          }, 2000)
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

    // Try multiple login endpoints
    const candidates = [
      'http://localhost:8080/login.php',
      'http://127.0.0.1:8080/login.php',
      'http://localhost/login.php',
      'http://127.0.0.1/login.php'
    ]
    
    let handled = false
    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: payload,
          mode: 'cors'
        })

        const json = await res.json()
        if (!res.ok || !json.success) {
          alertDiv.innerHTML = `<div class="alert alert-danger">${json.message || 'Login failed'}</div>`
          handled = true
          break
        }

        alertDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>'
        
        // Set current user from login response
        currentUser = {
          email: email,
          role: 'user'
        }
        currentUserRole = 'user'
        
        // Update auth menu
        updateAuthMenu()
        
        setTimeout(() => {
          location.hash = '#/user-dashboard'
        }, 500)
        handled = true
        break
      } catch (error) {
        console.warn('Login attempt to', url, 'failed:', error)
        continue
      }
    }
    
    if (!handled) {
      alertDiv.innerHTML = `<div class="alert alert-danger">All login attempts failed</div>`
    }
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

    const res = await fetch('http://localhost:8080/police-login.php', {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload,
      mode: 'cors'
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      alertDiv.innerHTML = `<div class="alert alert-danger">${json.message || 'Login failed'}</div>`
      return
    }

    alertDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>'
    
    // Set current user from login response
    currentUser = {
      email: email,
      role: 'police'
    }
    currentUserRole = 'police'
    
    // Update auth menu
    updateAuthMenu()
    
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
  const evidenceFile = document.getElementById('evidenceFile').files[0]
  const alertDiv = document.getElementById('complaintAlert')

  try {
    // Parse user location from data attribute (optional for now)
    let userLocation = null
    const userLocationStr = userLocationInput.getAttribute('data-location')
    
    if (userLocationStr) {
      try {
        userLocation = JSON.parse(userLocationStr)
      } catch (e) {
        // If location parsing fails, continue without location
        console.warn('Invalid location format, continuing without location')
      }
    } else {
      // If no location captured, use dummy location for testing
      userLocation = {
        lat: 19.0760,
        lng: 72.8777,
        address: "Mumbai, Maharashtra"
      }
    }

    // Crime location (basic parsing - can be extended with geocoding)
    const crimeLocationData = {
      address: crimeLocation,
      captured_at: new Date().toISOString()
    }

    // Submit to backend with location data
    const payload = {
      title,
      category,
      incident_date: incidentDate,
      user_location: userLocation,
      crime_location: crimeLocationData,
      description
    }

    console.log('Submitting complaint:', payload)
    
    // Check if there's a file to upload
    const evidenceFile = document.getElementById('evidenceFile')?.files[0]
    
    let res
    if (evidenceFile) {
      // Use FormData for file upload
      const formData = new FormData()
      formData.append('evidence', evidenceFile)
      formData.append('title', title)
      formData.append('category', category)
      formData.append('incident_date', incidentDate)
      formData.append('user_location', userLocation)
      formData.append('crime_location', crimeLocationData)
      formData.append('description', description)
      
      res = await fetch('http://localhost:8080/file_complaint.php', {
        method: 'POST',
        body: formData,
        mode: 'cors'
      })
    } else {
      // Use JSON for requests without files
      res = await fetch('http://localhost:8080/file_complaint.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      })
    }

    console.log('Response status:', res.status)
    console.log('Response headers:', res.headers)
    
    const responseText = await res.text()
    console.log('Raw response:', responseText)
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('JSON parse error:', e)
      throw new Error('Server returned invalid response: ' + responseText)
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to file complaint')
    }

    let successMessage = `<div class="alert alert-success">
      Complaint filed successfully!<br>
      <strong>Complaint ID:</strong> ${data.complaint_id}<br>
      <small>Your location has been recorded for verification</small>`
    
    if (data.evidence_file) {
      successMessage += `<br><strong>Evidence File:</strong> ${data.evidence_file}<br>
      <small>File uploaded successfully</small>`
    }
    
    successMessage += `</div>`
    
    alertDiv.innerHTML = successMessage
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

async function handleEmergencyComplaintSubmit(form) {
  const emergencyType = document.getElementById('emergencyType').value
  const urgencyLevel = document.querySelector('input[name="urgency"]:checked')?.value
  const title = document.getElementById('emergencyTitle').value
  const userLocationInput = document.getElementById('emergencyUserLocation')
  const emergencyLocation = document.getElementById('emergencyLocation').value
  const description = document.getElementById('emergencyDescription').value
  const contactNumber = document.getElementById('emergencyContact').value
  const evidenceFile = document.getElementById('emergencyEvidenceFile').files[0]
  const confirmEmergency = document.getElementById('confirmEmergency').checked
  const alertDiv = document.getElementById('emergencyComplaintAlert')

  try {
    if (!confirmEmergency) {
      throw new Error('Please confirm this is a genuine emergency')
    }

    // Parse user location from data attribute
    let userLocation = null
    const userLocationStr = userLocationInput.getAttribute('data-location')
    
    if (userLocationStr) {
      try {
        userLocation = JSON.parse(userLocationStr)
      } catch (e) {
        console.warn('Invalid location format, continuing without location')
      }
    } else {
      // Use dummy location for testing
      userLocation = {
        lat: 19.0760,
        lng: 72.8777,
        address: "Mumbai, Maharashtra"
      }
    }

    // Emergency location data
    const emergencyLocationData = {
      address: emergencyLocation,
      captured_at: new Date().toISOString()
    }

    // Submit to backend with emergency data
    const payload = {
      title: `[EMERGENCY] ${title}`,
      category: emergencyType,
      incident_date: new Date().toISOString().split('T')[0],
      user_location: userLocation,
      crime_location: emergencyLocationData,
      description: `EMERGENCY TYPE: ${emergencyType}\nURGENCY: ${urgencyLevel}\nCONTACT: ${contactNumber}\n\n${description}`,
      emergency_type: emergencyType,
      urgency_level: urgencyLevel,
      contact_number: contactNumber,
      is_emergency: true
    }

    console.log('Submitting emergency complaint:', payload)
    
    // Create FormData for file upload
    const formData = new FormData()
    formData.append('title', payload.title)
    formData.append('category', payload.category)
    formData.append('incident_date', payload.incident_date)
    formData.append('user_location', JSON.stringify(payload.user_location))
    formData.append('crime_location', JSON.stringify(payload.crime_location))
    formData.append('description', payload.description)
    formData.append('emergency_type', payload.emergency_type)
    formData.append('urgency_level', payload.urgency_level)
    formData.append('contact_number', payload.contact_number)
    formData.append('is_emergency', payload.is_emergency)
    formData.append('user_id', currentUser?.id || 'anonymous')
    
    if (evidenceFile) {
      formData.append('evidence_file', evidenceFile)
    }

    const res = await fetch('http://localhost:8080/file_complaint.php', {
      method: 'POST',
      body: formData,
      mode: 'cors'
    })

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const responseText = await res.text()
    console.log('Raw response:', responseText)
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('JSON parse error:', e)
      throw new Error('Server returned invalid response: ' + responseText)
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to file emergency complaint')
    }

    let successMessage = `<div class="alert alert-success alert-dismissible">
      <strong><i class="bi bi-check-circle-fill"></i> Emergency Complaint Filed Successfully!</strong><br>
      <strong>Complaint ID:</strong> ${data.complaint_id}<br>
      <strong>Priority:</strong> ${urgencyLevel?.toUpperCase()}<br>
      <small>Your emergency complaint has been marked for immediate attention.<br>
      Police will contact you at ${contactNumber} if needed.</small>`
    
    if (data.evidence_file) {
      successMessage += `<br><strong>Evidence File:</strong> ${data.evidence_file}`
    }
    
    successMessage += `</div>`
    
    alertDiv.innerHTML = successMessage
    form.reset()
    document.getElementById('emergencyUserLocation').value = ''
    document.getElementById('emergencyUserLocation').removeAttribute('data-location')
    
    setTimeout(() => {
      location.hash = '#/my-complaints'
    }, 3000)
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert alert-danger alert-dismissible">
      <strong><i class="bi bi-exclamation-triangle-fill"></i> Error:</strong> ${error.message}
    </div>`
  }
}

async function handleUpdateComplaint(form) {
  const status = document.getElementById('updateStatus').value
  const remarks = document.getElementById('policeRemarks').value
  const alertDiv = document.getElementById('updateAlert')
  const complaintId = new URLSearchParams(location.hash).get('id')

  try {
    if (!supabase) {
      throw new Error('Database not available')
    }
    
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

// Load complaints from PHP backend (fallback for when Supabase is not available)
async function loadComplaintsFromPHP(container, statusFilter = '', categoryFilter = '') {
  try {
    const response = await fetch('http://localhost:8080/get_complaints.php', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    })
    
    if (!response.ok) {
      throw new Error('Failed to load complaints')
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load complaints')
    }
    
    const complaints = data.complaints || []
    
    if (!complaints || complaints.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No complaints found</div>'
      return
    }
    
    // Filter complaints based on user role and filters
    let filteredComplaints = complaints
    
    if (currentUserRole === 'user' && currentUser && currentUser.id) {
      filteredComplaints = complaints.filter(c => c && c.user_id === currentUser.id)
    }
    
    if (statusFilter) {
      filteredComplaints = filteredComplaints.filter(c => c && c.status === statusFilter)
    }
    
    if (categoryFilter) {
      filteredComplaints = filteredComplaints.filter(c => c && c.category === categoryFilter)
    }
    
    if (currentUserRole === 'police') {
      renderPoliceComplaintsTable(filteredComplaints)
    } else {
      renderUserComplaints(filteredComplaints)
    }
    
    updateStats(filteredComplaints)
    
  } catch (error) {
    console.error('Error loading complaints from PHP:', error)
    container.innerHTML = `<div class="alert alert-danger">Failed to load complaints: ${error.message}</div>`
  }
}

async function logout() {
  try {
    setLoading(true)
    
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
    
    // Use PHP logout as fallback
    fetch('http://localhost:8080/logout.php', { method: 'POST' })
    
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
    if (!supabase) {
      // Use PHP fallback for complaints
      container.innerHTML = '<div class="alert alert-info">Loading complaints from database...</div>'
      loadComplaintsFromPHP(container, statusFilter, categoryFilter)
      return
    }
    
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

  if (!complaints || complaints.length === 0) {
    container.innerHTML = '<div class="alert alert-info">No complaints found</div>'
    return
  }

  complaints.forEach(complaint => {
    const badgeClass = `badge-${complaint.status || 'pending'}`
    const statusText = complaint.status === 'investigating' ? 'Under Investigation' : 
                      complaint.status ? complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1) : 'Pending'

    html += `
      <div class="complaint-card ${complaint.status || 'pending'}">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h5 class="mb-1">${complaint.title || 'Untitled Complaint'}</h5>
            <small class="text-muted">ID: ${complaint.complaint_id || 'N/A'}</small>
          </div>
          <span class="badge ${badgeClass}">${statusText}</span>
        </div>
        <p class="mb-2"><strong>Category:</strong> ${complaint.category || 'Not specified'}</p>
        <p class="mb-2"><strong>Date:</strong> ${complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'Not specified'}</p>
        <p class="text-muted">${complaint.description ? complaint.description.substring(0, 100) + '...' : 'No description available'}</p>
        ${complaint.police_remarks ? `<p class="mt-2 p-2 bg-light rounded"><strong>Police Remarks:</strong> ${complaint.police_remarks}</p>` : ''}
        <button class="btn btn-sm btn-outline-primary mt-2" onclick="location.hash='#/view-complaint?id=${complaint.id || ''}'">View Details</button>
      </div>
    `
  })

  container.innerHTML = html
}

function renderPoliceComplaintsTable(complaints) {
  const container = document.getElementById('complaintsTableContainer')
  
  if (!complaints || complaints.length === 0) {
    container.innerHTML = '<div class="alert alert-info">No complaints found</div>'
    return
  }
  
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
    const badgeClass = `badge-${complaint.status || 'pending'}`
    const statusText = complaint.status === 'investigating' ? 'Under Investigation' : 
                      complaint.status ? complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1) : 'Pending'

    html += `
      <tr>
        <td><strong>${complaint.complaint_id || 'N/A'}</strong></td>
        <td>${complaint.user_id ? complaint.user_id.substring(0, 8) + '...' : 'Unknown'}</td>
        <td>${complaint.title || 'Untitled'}</td>
        <td>${complaint.category || 'Not specified'}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td>${complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'Not specified'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="location.hash='#/view-complaint?id=${complaint.id || ''}'">
            View
          </button>
          <button class="btn btn-sm btn-warning" onclick="location.hash='#/update-complaint?id=${complaint.id || ''}'">
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
