// Initialize Supabase if env vars are present; otherwise use null-safe stub
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || null
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || null
let supabase = null

// Only initialize if explicitly configured and available
if (SUPABASE_URL && SUPABASE_ANON_KEY && typeof createClient !== 'undefined') {
  try {
    // Dynamic import to avoid errors if not available
    import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm').then(({ createClient }) => {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    }).catch(e => {
      console.warn('Supabase not available:', e)
    })
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e)
    supabase = null
  }
} else {
  console.warn('Supabase not configured — continuing without Supabase')
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
// Backend base URL - auto-detect for deployment (supports subdirectory installs)
const currentPath = window.location.pathname || '/'
const basePath = currentPath.substring(0, currentPath.lastIndexOf('/')) || ''
const backendBase = window.location.origin + basePath

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
  const hash = location.hash.slice(2) || 'home'
  const route = hash.split('?')[0] // Remove query parameters
  loadPage(route)
})

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    setLoading(true)
    await checkAuth()
    const hash = location.hash.slice(2) || 'home'
    const route = hash.split('?')[0] // Remove query parameters
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
      const res = await fetch(`${backendBase}/check_auth.php`, {
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
            <input type="email" class="form-control" id="email" placeholder="officer@secureindiapolice.gov.in" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" id="password" required>
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
            <h2><i class="bi bi-file-earmark-text"></i> Normal Complaint</h2>
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
    <style>
      .gov-dashboard {
        background-color: #f8f9fa;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 0;
      }
      .gov-header {
        background-color: #1a365d;
        color: white;
        padding: 20px 0;
        border-bottom: 3px solid #2c5282;
      }
      .gov-logo {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .gov-logo-icon {
        width: 40px;
        height: 40px;
        background-color: #2c5282;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 18px;
      }
      .gov-title {
        font-size: 24px;
        font-weight: 600;
        margin: 0;
      }
      .gov-subtitle {
        font-size: 14px;
        opacity: 0.9;
        margin: 0;
      }
      .welcome-section {
        background-color: white;
        padding: 20px;
        margin: 20px 0;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin: 20px 0;
      }
      .stat-card {
        background-color: white;
        padding: 20px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .stat-number {
        font-size: 32px;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 8px;
      }
      .stat-label {
        font-size: 14px;
        color: #718096;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .complaints-section {
        background-color: white;
        padding: 20px;
        margin: 20px 0;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
      }
      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 16px;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 8px;
      }
      .complaints-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
      }
      .complaints-table th {
        background-color: #f7fafc;
        padding: 12px;
        text-align: left;
        font-weight: 600;
        color: #4a5568;
        border-bottom: 1px solid #e2e8f0;
        font-size: 14px;
      }
      .complaints-table td {
        padding: 12px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 14px;
      }
      .complaints-table tr:hover {
        background-color: #f7fafc;
      }
      .status-badge {
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
      }
      .status-pending {
        background-color: #fef5e7;
        color: #d69e2e;
        border: 1px solid #f6e05e;
      }
      .status-resolved {
        background-color: #f0fff4;
        color: #38a169;
        border: 1px solid #9ae6b4;
      }
      .status-rejected {
        background-color: #fff5f5;
        color: #e53e3e;
        border: 1px solid #feb2b2;
      }
      .action-buttons {
        display: flex;
        gap: 12px;
        margin: 20px 0;
      }
      .btn-primary {
        background-color: #2c5282;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .btn-primary:hover {
        background-color: #2a4e7c;
        text-decoration: none;
        color: white;
      }
      .btn-outline {
        background-color: transparent;
        color: #2c5282;
        padding: 10px 20px;
        border: 1px solid #2c5282;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .btn-outline:hover {
        background-color: #2c5282;
        text-decoration: none;
        color: white;
      }
      .btn-danger {
        background-color: #c53030;
        color: white;
        padding: 12px 24px;
        border: none;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 600;
        font-size: 16px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .btn-danger:hover {
        background-color: #b91c1c;
        text-decoration: none;
        color: white;
      }
      .btn-outline {
        background-color: white;
        color: #2c5282;
        padding: 8px 16px;
        border: 1px solid #2c5282;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
      }
      .btn-outline:hover {
        background-color: #2c5282;
        color: white;
        text-decoration: none;
      }
      .loading {
        text-align: center;
        padding: 40px;
        color: #718096;
      }
    </style>

    <div class="gov-dashboard">
      <!-- Header -->
      <div class="gov-header">
        <div class="container">
          <div class="gov-logo">
            <div class="gov-logo-icon">OX</div>
            <div>
              <div class="gov-title">ObservX Citizen Portal</div>
              <div class="gov-subtitle">Ministry of Public Safety & Justice</div>
            </div>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <h3 style="margin: 0 0 8px 0; color: #2d3748;">Welcome, ${currentUser.email}</h3>
          <p style="margin: 0; color: #718096;">Citizen Services Dashboard</p>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <a href="#/file-complaint" class="btn-primary">
            <i class="bi bi-file-earmark-plus"></i> Normal Complaint
          </a>
          <a href="#/emergency-complaint" class="btn-danger">
            <i class="bi bi-exclamation-triangle"></i> Emergency Complaint
          </a>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number" id="totalComplaints">-</div>
            <div class="stat-label">Total Complaints</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="resolvedCount">-</div>
            <div class="stat-label">Resolved Complaints</div>
          </div>
        </div>

        <!-- Recent Complaints -->
        <div class="complaints-section">
          <div class="section-title">Recent Complaints</div>
          <div id="complaintsContainer">
            <div class="loading">Loading complaints...</div>
          </div>
        </div>

        <!-- View All Button -->
        <div style="text-align: center; margin: 20px 0;">
          <a href="#/my-complaints" class="btn-outline">View All Complaints</a>
        </div>
      </div>
    </div>

    <script>
      // Load dashboard complaints after render
      setTimeout(() => {
        loadDashboardComplaints();
        loadDashboardStats();
      }, 500);
    </script>
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
    // For now, use the hardcoded user_id since all complaints are saved with "user123"
    // In production, this would come from the logged-in user session
    const userId = "user123";
    const url = `${backendBase}/get_complaints.php?user_id=${encodeURIComponent(userId)}`;
    
    console.log('Loading complaints from:', url);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    console.log('Complaints response:', data);

    if (!data.success) {
      throw new Error(data.message || 'Failed to load complaints')
    }

    allComplaints = data.complaints || []
    
    if (allComplaints.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-inbox display-1 text-muted"></i>
          <h3 class="mt-3">No complaints found</h3>
          <p class="text-muted">You haven't filed any complaints yet.</p>
          <a href="#/file-complaint" class="btn btn-primary">File Your First Complaint</a>
        </div>
      `
      return
    }

    // Sort by creation date (newest first)
    allComplaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    
    renderUserComplaints(allComplaints)
    updateStats(allComplaints)
    
  } catch (error) {
    console.error('Error loading user complaints:', error)
    container.innerHTML = `
      <div class="alert alert-danger">
        <strong>Error:</strong> ${error.message}
        <br><small>Please try again or contact support if the problem persists.</small>
      </div>
    `
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

// Dashboard-specific functions
async function loadDashboardComplaints() {
  const container = document.getElementById('complaintsContainer');
  if (!container) return;
  
  try {
    // For now, use the hardcoded user_id since all complaints are saved with "user123"
    const userId = "user123";
    const url = `${backendBase}/get_complaints.php?user_id=${encodeURIComponent(userId)}`;
    
    console.log('Loading dashboard complaints from:', url);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    });
    
    const data = await res.json();
    console.log('Dashboard complaints response:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load complaints');
    }
    
    // Show only recent 5 complaints for dashboard
    const recentComplaints = data.complaints.slice(0, 5);
    renderDashboardComplaintsTable(recentComplaints);
    
  } catch (error) {
    console.error('Error loading dashboard complaints:', error);
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: #718096;">Unable to load complaints</div>`;
  }
}

function renderDashboardComplaintsTable(complaints) {
  const container = document.getElementById('complaintsContainer');
  if (!container) return;
  
  if (complaints.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #718096;">
        <p>No complaints found</p>
        <a href="#/file-complaint" class="btn-primary" style="margin-top: 12px;">File Your First Complaint</a>
      </div>
    `;
    return;
  }
  
  const tableHtml = `
    <table class="complaints-table">
      <thead>
        <tr>
          <th>Complaint ID</th>
          <th>Date</th>
          <th>Category</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${complaints.map(complaint => `
          <tr>
            <td><strong>${complaint.complaint_id}</strong></td>
            <td>${new Date(complaint.created_at).toLocaleDateString()}</td>
            <td>${complaint.category}</td>
            <td><span class="status-badge status-${complaint.status}">${complaint.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = tableHtml;
}

async function loadDashboardStats() {
  try {
    const res = await fetch(`${backendBase}/get_complaints.php`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    });
    
    const data = await res.json();
    
    if (data.success) {
      const totalElement = document.getElementById('totalComplaints');
      const resolvedElement = document.getElementById('resolvedCount');
      
      if (totalElement) totalElement.textContent = data.complaints.length;
      
      const resolvedCount = data.complaints.filter(c => c.status === 'resolved').length;
      if (resolvedElement) resolvedElement.textContent = resolvedCount;
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

function renderEmergencyComplaint() {
  if (!currentUser || currentUserRole === 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Please login as a citizen to file emergency complaint.</div></div>`
  }

  return `
    <style>
      .emergency-container {
        background-color: #f8f9fa;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        min-height: 100vh;
        padding: 20px 0;
      }
      .emergency-header {
        background-color: #1a365d;
        color: white;
        padding: 20px 0;
        border-bottom: 3px solid #c53030;
        text-align: center;
      }
      .emergency-title {
        font-size: 28px;
        font-weight: 600;
        margin: 0;
      }
      .emergency-subtitle {
        font-size: 16px;
        opacity: 0.9;
        margin: 5px 0 0 0;
      }
      .emergency-form {
        background-color: white;
        padding: 30px;
        margin: 20px auto;
        max-width: 600px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .location-section {
        background-color: #f7fafc;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 20px;
        border: 1px solid #e2e8f0;
      }
      .location-display {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .location-coords {
        font-family: monospace;
        color: #2d3748;
        font-size: 14px;
      }
      .map-preview {
        width: 100%;
        height: 200px;
        background-color: #e2e8f0;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #718096;
        margin-bottom: 10px;
      }
      .form-group {
        margin-bottom: 20px;
      }
      .form-label {
        display: block;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 8px;
      }
      .form-control {
        width: 100%;
        padding: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }
      .form-select {
        width: 100%;
        padding: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 14px;
        background-color: white;
        box-sizing: border-box;
      }
      .btn-emergency {
        width: 100%;
        background-color: #c53030;
        color: white;
        padding: 16px;
        border: none;
        border-radius: 4px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .btn-emergency:hover {
        background-color: #b91c1c;
      }
      .photo-upload {
        border: 2px dashed #e2e8f0;
        border-radius: 4px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        margin-bottom: 10px;
      }
      .photo-upload:hover {
        border-color: #c53030;
        background-color: #fff5f5;
      }
    </style>

    <div class="emergency-container">
      <!-- Header -->
      <div class="emergency-header">
        <div class="container">
          <div class="emergency-title">🚨 EMERGENCY COMPLAINT</div>
          <div class="emergency-subtitle">Fast Response System - Police Notified Immediately</div>
        </div>
      </div>

      <div class="container">
        <div class="emergency-form">
          <form id="emergencyComplaintForm">
            <!-- GPS Location -->
            <div class="location-section">
              <div class="form-label">📍 Your Current Location</div>
              <div class="map-preview" id="mapPreview">
                <div>
                  <i class="bi bi-geo-alt" style="font-size: 24px;"></i>
                  <p>Detecting GPS location...</p>
                </div>
              </div>
              <div class="location-display">
                <div class="location-coords" id="locationCoords">Lat: --, Lng: --</div>
                <div>
                  <button type="button" class="btn btn-outline-secondary btn-sm" onclick="detectLocation()">
                    <i class="bi bi-arrow-clockwise"></i> Refresh
                  </button>
                  <button type="button" class="btn btn-outline-primary btn-sm ms-2" onclick="enableMapPinSelection()">
                    <i class="bi bi-pin-map"></i> Select on Map
                  </button>
                </div>
              </div>
              <div id="mapPinSelector" style="display: none; margin-top: 15px;">
                <div class="form-label">📍 Click on map to set location</div>
                <div id="interactiveMap" style="width: 100%; height: 300px; background-color: #e2e8f0; border-radius: 4px; position: relative; cursor: crosshair;">
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #718096;">
                    <i class="bi bi-map" style="font-size: 48px;"></i>
                    <p>Click anywhere to set location</p>
                    <small>Coordinates will appear here</small>
                  </div>
                </div>
                <div class="mt-2">
                  <button type="button" class="btn btn-sm btn-secondary" onclick="disableMapPinSelection()">Cancel</button>
                </div>
              </div>
            </div>

            <!-- Emergency Type -->
            <div class="form-group">
              <label class="form-label">Emergency Type</label>
              <select class="form-select" id="emergencyType" required>
                <option value="">Select Emergency Type</option>
                <option value="accident">🚗 Accident</option>
                <option value="theft">💰 Theft</option>
                <option value="assault">👊 Assault</option>
                <option value="fire">🔥 Fire</option>
                <option value="medical">🚑 Medical</option>
                <option value="other">⚠️ Other</option>
              </select>
            </div>

            <!-- Photo Upload -->
            <div class="form-group">
              <label class="form-label">📷 Upload Photo Evidence</label>
              <div class="photo-upload" onclick="document.getElementById('emergencyPhoto').click()">
                <div>
                  <i class="bi bi-camera" style="font-size: 24px;"></i>
                  <p>Click to upload photo or take picture</p>
                </div>
              </div>
              <input type="file" id="emergencyPhoto" accept="image/*" style="display: none;">
            </div>

            <!-- Short Note -->
            <div class="form-group">
              <label class="form-label">Brief Description (Max 120 characters)</label>
              <textarea class="form-control" id="emergencyNote" rows="3" maxlength="120" placeholder="Brief details of emergency..."></textarea>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn-emergency">
              🚨 SEND EMERGENCY ALERT
            </button>

            <div id="emergencyAlert"></div>
          </form>
        </div>
      </div>
    </div>

    <script>
      // Auto-detect location on page load
      setTimeout(() => {
        detectLocation();
        setupEmergencyForm();
      }, 500);
    </script>
  `

  // Add event listener for normal complaint location capture
  setTimeout(() => {
    const captureBtn = document.getElementById('captureUserLocation');
    if (captureBtn) {
      captureBtn.addEventListener('click', detectUserLocation);
    }
  }, 500);
}

function renderPoliceDashboard() {
  if (!currentUser || currentUserRole !== 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Unauthorized access. <a href="#/police-login">Police Login</a></div></div>`
  }

  return `
    <div class="container">
      <div class="dashboard-header">
        <h2>Police Dashboard</h2>
        <p class="mb-0">Station: ${currentUser.station_name || 'Central Police Station'}</p>
        <p class="mb-0 text-muted small">Auto-refreshing emergency complaints every 10 seconds</p>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="stat-box emergency-stat">
            <div class="number" id="emergencyCount">-</div>
            <div class="label">🚨 Emergency</div>
          </div>
        </div>
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
      </div>

      <div class="row mb-3">
        <div class="col-md-4">
          <label class="form-label">Filter by Status</label>
          <select class="form-select" id="statusFilter">
            <option value="">All Status</option>
            <option value="high_priority">High Priority</option>
            <option value="pending">Pending</option>
            <option value="investigating">Under Investigation</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Filter by Category</label>
          <select class="form-select" id="categoryFilter">
            <option value="">All Categories</option>
            <option value="emergency">Emergency</option>
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
          <button class="btn btn-primary w-100" onclick="loadPoliceComplaints()">Apply Filters</button>
        </div>
      </div>

      <h3 class="mb-3">Assigned Complaints</h3>
      <div id="complaintsTableContainer">
        <div class="loading">
          <div class="spinner-border" role="status"></div>
        </div>
      </div>
    </div>

    <script>
      // Load station-specific complaints on page load
      setTimeout(() => {
        loadPoliceComplaints();
        // Auto-refresh emergency complaints every 10 seconds
        setInterval(() => {
          loadPoliceComplaints(true);
        }, 10000);
      }, 500);
    </script>
  `
}

function renderViewComplaint() {
  // Temporarily remove login requirement for testing
  const hash = window.location.hash
  const urlParams = new URLSearchParams(hash.split('?')[1] || '')
  const complaintId = urlParams.get('id') || ''
  
  console.log('Viewing complaint with ID:', complaintId)
  
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
          <span class="ms-2">Loading complaint details...</span>
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
    const res = await fetch(`${backendBase}/get_complaint.php?id=${complaintId}`, {
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
  
  const showFeedbackSection = complaint.status === 'resolved' && !complaint.feedback_submitted

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
            <strong>Last Updated:</strong> ${complaint.updated_at ? new Date(complaint.updated_at).toLocaleDateString() : new Date(complaint.created_at).toLocaleDateString()}
          </div>
          <div class="col-md-6 text-end">
            <button class="btn btn-outline-secondary" onclick="window.print()">
              <i class="bi bi-printer"></i> Print
            </button>
          </div>
        </div>

        ${showFeedbackSection ? `
        <hr class="my-4">
        <div class="mt-3">
          <h5>Rate Your Experience</h5>
          <form id="feedbackForm" class="mt-2">
            <div class="mb-2">
              <label class="form-label">Rating</label>
              <select class="form-select form-select-sm" id="feedbackRating" required>
                <option value="">Select rating</option>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Very Poor</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label">Comments (optional)</label>
              <textarea class="form-control" id="feedbackComment" rows="3" placeholder="Share details about your experience"></textarea>
            </div>
            <div id="feedbackAlert" class="mb-2"></div>
            <button type="submit" class="btn btn-sm btn-primary">Submit Feedback</button>
          </form>
        </div>
        ` : ''}
      </div>
    </div>
  `
  
  container.innerHTML = html

  // Attach feedback submit handler if form is present
  const feedbackForm = document.getElementById('feedbackForm')
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const rating = parseInt(document.getElementById('feedbackRating').value, 10)
      const comment = document.getElementById('feedbackComment').value
      const alertDiv = document.getElementById('feedbackAlert')

      if (!rating || rating < 1 || rating > 5) {
        alertDiv.innerHTML = '<div class="alert alert-danger">Please select a rating between 1 and 5.</div>'
        return
      }

      try {
        alertDiv.innerHTML = ''
        const res = await fetch(`${backendBase}/feedback.php`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            complaint_id: complaint.complaint_id,
            rating,
            comment,
          }),
          mode: 'cors',
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          alertDiv.innerHTML = `<div class="alert alert-danger">${data.message || 'Failed to submit feedback'}</div>`
          return
        }

        alertDiv.innerHTML = '<div class="alert alert-success">Thank you for your feedback.</div>'
        feedbackForm.querySelector('button[type="submit"]').disabled = true
      } catch (error) {
        console.error('Feedback error:', error)
        alertDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`
      }
    })
  }
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
    // Try multiple endpoints for deployment compatibility
    const candidates = [
      `${backendBase}/register.php`,
      `${backendBase}/api/register.php`
    ]

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

    // Try multiple login endpoints for deployment compatibility
    const candidates = [
      `${backendBase}/login.php`,
      `${backendBase}/api/login.php`
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
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const alertDiv = document.getElementById('policeLoginAlert')

  try {
    const payload = {
      email: email,
      password: password
    }

    const res = await fetch(`${backendBase}/police-login.php`, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      mode: 'cors'
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      alertDiv.innerHTML = `<div class="alert alert-danger">${json.message || 'Login failed'}</div>`
      return
    }

    alertDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>'
    
    // Set current user from login response (include station info when available)
    if (json.police) {
      currentUser = {
        id: json.police.id,
        email: json.police.email,
        role: 'police',
        police_id: json.police.police_id,
        station_name: json.police.station_name,
      }
    } else {
      currentUser = {
        email,
        role: 'police',
      }
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

  // Client-side validation
  if (!title || !category || !description) {
    alertDiv.innerHTML = `<div class="alert alert-danger">Please fill in all required fields (Title, Category, and Description).</div>`
    return
  }

  if (title.length < 5) {
    alertDiv.innerHTML = `<div class="alert alert-danger">Title must be at least 5 characters long.</div>`
    return
  }

  if (description.length < 20) {
    alertDiv.innerHTML = `<div class="alert alert-danger">Description must be at least 20 characters long.</div>`
    return
  }

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
      address: crimeLocation || "Not specified",
      captured_at: new Date().toISOString()
    }

    // Submit to backend with location data
    const payload = {
      title: title.trim(),
      category: category.trim(),
      incident_date: incidentDate,
      user_location: userLocation,
      crime_location: crimeLocationData,
      description: description.trim()
    }

    console.log('Submitting complaint:', payload)
    
    // Check if there's a file to upload
    const evidenceFile = document.getElementById('evidenceFile')?.files[0]
    
    let res
    if (evidenceFile) {
      // Validate file size (5MB limit)
      if (evidenceFile.size > 5 * 1024 * 1024) {
        alertDiv.innerHTML = `<div class="alert alert-danger">File size must be less than 5MB.</div>`
        return
      }

      // Use FormData for file upload
      const formData = new FormData()
      formData.append('evidence', evidenceFile)
      formData.append('title', payload.title)
      formData.append('category', payload.category)
      formData.append('incident_date', payload.incident_date)
      formData.append('user_location', JSON.stringify(payload.user_location))
      formData.append('crime_location', JSON.stringify(payload.crime_location))
      formData.append('description', payload.description)
      
      res = await fetch(`${backendBase}/file_complaint.php`, {
        method: 'POST',
        body: formData,
        mode: 'cors'
      })
    } else {
      // Use JSON for requests without files
      res = await fetch(`${backendBase}/file_complaint.php`, {
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
    
    if (data.evidence_uploaded) {
      successMessage += `<br><small>Evidence file uploaded successfully</small>`
    }
    
    successMessage += `</div>`
    
    alertDiv.innerHTML = successMessage
    
    // Reset form after successful submission
    form.reset()
    userLocationInput.setAttribute('data-location', '')
    
    // Reload complaints after a short delay
    setTimeout(() => {
      if (typeof loadComplaints === 'function') {
        loadComplaints()
      }
    }, 1000)
    
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

    // Prefer PHP session logout in this deployment
    try {
      await fetch(`${backendBase}/logout.php`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
      })
    } catch (e) {
      console.warn('Backend logout request failed:', e)
    }

    // Clear in-memory user state
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

  try {
    // Delegate to PHP-backed loaders instead of Supabase
    if (currentUserRole === 'police') {
      await loadPoliceComplaints()
    } else {
      await loadUserComplaints()
    }
  } catch (error) {
    console.error('Error loading complaints:', error)
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
  // Emergency complaint functions
let currentLocation = null;

function detectLocation() {
  const mapPreview = document.getElementById('mapPreview');
  const coordsDisplay = document.getElementById('locationCoords');
  
  if (!mapPreview || !coordsDisplay) return;
  
  mapPreview.innerHTML = `
    <div>
      <div class="spinner-border" role="status"></div>
      <p>Detecting GPS location...</p>
    </div>
  `;
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        
        // Reject location if accuracy > 50 meters
        if (accuracy > 50) {
          coordsDisplay.textContent = `Accuracy too low: ±${accuracy.toFixed(0)}m`;
          mapPreview.innerHTML = `
            <div>
              <i class="bi bi-exclamation-triangle" style="color: #d69e2e; font-size: 24px;"></i>
              <p>GPS accuracy too low (${accuracy.toFixed(0)}m). Please try again in open area.</p>
              <button type="button" class="btn btn-outline-secondary btn-sm mt-2" onclick="detectLocation()">
                <i class="bi bi-arrow-clockwise"></i> Retry
              </button>
            </div>
          `;
          return;
        }
        
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: accuracy,
          timestamp: new Date().toISOString()
        };
        
        coordsDisplay.textContent = `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`;
        
        mapPreview.innerHTML = `
          <div>
            <i class="bi bi-geo-alt-fill" style="color: #38a169; font-size: 32px;"></i>
            <p style="margin: 10px 0 0 0; color: #2d3748;">
              <strong>Location Detected</strong><br>
              Accuracy: ±${currentLocation.accuracy} meters<br>
              <small>Time: ${new Date(currentLocation.timestamp).toLocaleTimeString()}</small>
            </p>
          </div>
        `;
      },
      (error) => {
        coordsDisplay.textContent = 'Location detection failed';
        mapPreview.innerHTML = `
          <div>
            <i class="bi bi-exclamation-triangle" style="color: #d69e2e; font-size: 24px;"></i>
            <p>Unable to detect location. Please enable GPS.</p>
            <button type="button" class="btn btn-outline-secondary btn-sm mt-2" onclick="detectLocation()">
              <i class="bi bi-arrow-clockwise"></i> Retry
            </button>
          </div>
        `;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    coordsDisplay.textContent = 'GPS not supported';
    mapPreview.innerHTML = `
      <div>
        <i class="bi bi-x-circle" style="color: #e53e3e; font-size: 24px;"></i>
        <p>GPS not supported by your browser</p>
      </div>
    `;
  }
}

// Enhanced location detection for normal complaints
function detectUserLocation() {
  const locationInput = document.getElementById('userLocation');
  const captureBtn = document.getElementById('captureUserLocation');
  
  if (!locationInput || !captureBtn) return;
  
  captureBtn.disabled = true;
  captureBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Detecting...';
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        
        // Reject location if accuracy > 50 meters
        if (accuracy > 50) {
          locationInput.value = `Low accuracy: ±${accuracy.toFixed(0)}m - Try again in open area`;
          captureBtn.disabled = false;
          captureBtn.innerHTML = '<i class="bi bi-geo-alt"></i> Capture';
          return;
        }
        
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: accuracy,
          timestamp: new Date().toISOString()
        };
        
        locationInput.value = `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)} (±${accuracy.toFixed(0)}m)`;
        captureBtn.disabled = false;
        captureBtn.innerHTML = '<i class="bi bi-check-circle"></i> Captured';
        
        setTimeout(() => {
          captureBtn.innerHTML = '<i class="bi bi-geo-alt"></i> Capture';
        }, 2000);
      },
      (error) => {
        locationInput.value = 'GPS detection failed. Please enable location services.';
        captureBtn.disabled = false;
        captureBtn.innerHTML = '<i class="bi bi-geo-alt"></i> Capture';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    locationInput.value = 'GPS not supported by your browser';
    captureBtn.disabled = false;
    captureBtn.innerHTML = '<i class="bi bi-geo-alt"></i> Capture';
  }
}

// Map pin selection functions
function enableMapPinSelection() {
  const mapPinSelector = document.getElementById('mapPinSelector');
  const interactiveMap = document.getElementById('interactiveMap');
  
  if (!mapPinSelector || !interactiveMap) return;
  
  mapPinSelector.style.display = 'block';
  
  // Add click event listener to map
  interactiveMap.addEventListener('click', handleMapClick);
}

function disableMapPinSelection() {
  const mapPinSelector = document.getElementById('mapPinSelector');
  const interactiveMap = document.getElementById('interactiveMap');
  
  if (!mapPinSelector || !interactiveMap) return;
  
  mapPinSelector.style.display = 'none';
  interactiveMap.removeEventListener('click', handleMapClick);
}

function handleMapClick(event) {
  const interactiveMap = document.getElementById('interactiveMap');
  const coordsDisplay = document.getElementById('locationCoords');
  const mapPreview = document.getElementById('mapPreview');
  
  if (!interactiveMap) return;
  
  const rect = interactiveMap.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Convert click position to simulated coordinates (for demo purposes)
  // In real implementation, you'd use actual map coordinates
  const lat = 19.0760 + (y - 150) * 0.001; // Mumbai area simulation
  const lng = 72.8777 + (x - 200) * 0.001;
  
  currentLocation = {
    lat: lat,
    lng: lng,
    accuracy: 5, // Manual selection assumed accurate
    timestamp: new Date().toISOString(),
    source: 'manual'
  };
  
  // Update displays
  if (coordsDisplay) {
    coordsDisplay.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
  }
  
  if (mapPreview) {
    mapPreview.innerHTML = `
      <div>
        <i class="bi bi-geo-alt-fill" style="color: #38a169; font-size: 32px;"></i>
        <p style="margin: 10px 0 0 0; color: #2d3748;">
          <strong>Location Set Manually</strong><br>
          Accuracy: Manual selection<br>
          <small>Time: ${new Date(currentLocation.timestamp).toLocaleTimeString()}</small>
        </p>
      </div>
    `;
  }
  
  // Hide map selector
  disableMapPinSelection();
}

function setupEmergencyForm() {
  const form = document.getElementById('emergencyComplaintForm');
  if (!form) return;
  
  form.addEventListener('submit', handleEmergencySubmit);
  
  // Handle photo upload
  const photoInput = document.getElementById('emergencyPhoto');
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const uploadArea = document.querySelector('.photo-upload');
        uploadArea.innerHTML = `
          <div>
            <i class="bi bi-check-circle-fill" style="color: #38a169; font-size: 24px;"></i>
            <p><strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)</p>
          </div>
        `;
      }
    });
  }
}

async function handleEmergencySubmit(e) {
  e.preventDefault();
  
  const emergencyType = document.getElementById('emergencyType').value;
  const emergencyNote = document.getElementById('emergencyNote').value;
  const photoFile = document.getElementById('emergencyPhoto').files[0];
  const alertDiv = document.getElementById('emergencyAlert');
  
  if (!emergencyType) {
    if (alertDiv) {
      alertDiv.innerHTML = '<div style="color: #e53e3e; padding: 10px; background: #fff5f5; border-radius: 4px;">Please select emergency type</div>';
    }
    return;
  }
  
  if (!currentLocation) {
    if (alertDiv) {
      alertDiv.innerHTML = '<div style="color: #e53e3e; padding: 10px; background: #fff5f5; border-radius: 4px;">Location detection required for emergency complaints</div>';
    }
    return;
  }
  
  try {
    // Show loading state
    if (alertDiv) {
      alertDiv.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="spinner-border"></div><p>Sending emergency alert...</p></div>';
    }
    
    // Prepare emergency data
    const emergencyData = {
      title: `EMERGENCY: ${emergencyType.toUpperCase()}`,
      category: 'emergency',
      description: emergencyNote || `Emergency complaint - ${emergencyType}`,
      incident_date: new Date().toISOString(),
      user_location: currentLocation,
      crime_location: {
        address: 'Emergency location',
        captured_at: new Date().toISOString()
      },
      priority_level: 'emergency',
      status: 'high_priority'
    };
    
    // Submit to backend
    const formData = new FormData();
    formData.append('title', emergencyData.title);
    formData.append('category', emergencyData.category);
    formData.append('description', emergencyData.description);
    formData.append('incident_date', emergencyData.incident_date);
    formData.append('user_location', JSON.stringify(emergencyData.user_location));
    formData.append('crime_location', JSON.stringify(emergencyData.crime_location));
    formData.append('priority_level', emergencyData.priority_level);
    formData.append('status', emergencyData.status);
    
    if (photoFile) {
      formData.append('evidence', photoFile);
    }
    
    const res = await fetch(`${backendBase}/file_complaint.php`, {
      method: 'POST',
      body: formData,
      mode: 'cors'
    });
    
    const responseText = await res.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid server response');
    }
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to submit emergency complaint');
    }
    
    // Show success confirmation
    if (alertDiv) {
      alertDiv.innerHTML = `
        <div style="background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 4px; padding: 20px; text-align: center;">
          <div style="color: #38a169; font-size: 20px; font-weight: 600; margin-bottom: 15px;">
            🚨 Emergency Alert Sent Successfully
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Complaint ID:</strong> ${data.complaint_id}
          </div>
          <div style="margin-bottom: 15px; color: #2d3748;">
            <strong>👮 Police Notified:</strong> Nearest police station has been alerted and is responding to your location.
          </div>
          <div style="background: #fef5e7; border: 1px solid #f6e05e; border-radius: 4px; padding: 15px; margin-top: 15px;">
            <strong>🛡️ Stay Safe Instructions:</strong>
            <ul style="margin: 10px 0 0 20px; padding: 0;">
              <li>Stay on the phone with emergency services if needed</li>
              <li>Move to a safe location if possible</li>
              <li>Follow instructions from responding officers</li>
              <li>Keep your location services enabled</li>
            </ul>
          </div>
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Emergency submission error:', error);
    if (alertDiv) {
      alertDiv.innerHTML = `
        <div style="color: #e53e3e; padding: 10px; background: #fff5f5; border-radius: 4px;">
          Failed to send emergency alert: ${error.message}
          <br><button onclick="handleEmergencySubmit(event)" class="btn btn-danger btn-sm mt-2">Retry</button>
        </div>
      `;
    }
  }
}

window.detectLocation = detectLocation;
window.handleEmergencySubmit = handleEmergencySubmit;
window.enableMapPinSelection = enableMapPinSelection;
window.disableMapPinSelection = disableMapPinSelection;

// Police dashboard functions
async function loadPoliceComplaints(isAutoRefresh = false) {
  const container = document.getElementById('complaintsTableContainer');
  if (!container) return;
  
  try {
    // Get station ID from current user
    const stationId = currentUser?.id;
    if (!stationId) {
      container.innerHTML = '<div class="alert alert-warning">Station ID not found. Please login again.</div>';
      return;
    }
    
    const url = `${backendBase}/get_complaints.php?station_id=${encodeURIComponent(stationId)}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    });
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load complaints');
    }
    
    // Update statistics
    updatePoliceStats(data.complaints);
    
    // Render complaints table
    renderPoliceComplaintsTable(data.complaints, isAutoRefresh);
    
  } catch (error) {
    console.error('Error loading police complaints:', error);
    if (!isAutoRefresh) {
      container.innerHTML = `<div class="alert alert-danger">Failed to load complaints: ${error.message}</div>`;
    }
  }
}

function updatePoliceStats(complaints) {
  const emergencyCount = document.getElementById('emergencyCount');
  const pendingCount = document.getElementById('pendingCount');
  const investigatingCount = document.getElementById('investigatingCount');
  const resolvedCount2 = document.getElementById('resolvedCount2');
  
  if (emergencyCount) {
    const emergency = complaints.filter(c => c.priority_level === 'emergency').length;
    emergencyCount.textContent = emergency;
    if (emergency > 0) {
      emergencyCount.parentElement.classList.add('emergency-pulse');
    }
  }
  
  if (pendingCount) {
    pendingCount.textContent = complaints.filter(c => c.status === 'pending').length;
  }
  
  if (investigatingCount) {
    investigatingCount.textContent = complaints.filter(c => c.status === 'investigating').length;
  }
  
  if (resolvedCount2) {
    resolvedCount2.textContent = complaints.filter(c => c.status === 'resolved').length;
  }
}

function renderPoliceComplaintsTable(complaints, isAutoRefresh = false) {
  const container = document.getElementById('complaintsTableContainer');
  if (!container) return;
  
  if (complaints.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info text-center">
        <i class="bi bi-info-circle"></i> No complaints assigned to your station.
      </div>
    `;
    return;
  }
  
  // Apply filters
  const statusFilter = document.getElementById('statusFilter')?.value || '';
  const categoryFilter = document.getElementById('categoryFilter')?.value || '';
  
  let filteredComplaints = complaints;
  
  if (statusFilter) {
    filteredComplaints = filteredComplaints.filter(c => c.status === statusFilter);
  }
  
  if (categoryFilter) {
    filteredComplaints = filteredComplaints.filter(c => c.category === categoryFilter);
  }
  
  const tableHtml = `
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Complaint ID</th>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filteredComplaints.map(complaint => `
            <tr class="${complaint.priority_level === 'emergency' ? 'table-danger' : ''}">
              <td><strong>${complaint.complaint_id}</strong></td>
              <td>${complaint.title}</td>
              <td>${complaint.category}</td>
              <td><span class="badge bg-${getPoliceStatusColor(complaint.status)}">${complaint.status}</span></td>
              <td>
                ${complaint.priority_level === 'emergency' 
                  ? '<span class="badge bg-danger">🚨 Emergency</span>' 
                  : '<span class="badge bg-secondary">Normal</span>'}
              </td>
              <td>${new Date(complaint.created_at).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewComplaint('${complaint.complaint_id}')">
                  <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="updateComplaintStatus('${complaint.id}', 'investigating')">
                  <i class="bi bi-play-circle"></i> Start
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="updateComplaintStatus('${complaint.id}', 'resolved')">
                  <i class="bi bi-check-circle"></i> Resolve
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = tableHtml;
}

function getPoliceStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'high_priority': return 'danger';
    case 'pending': return 'warning';
    case 'investigating': return 'info';
    case 'resolved': return 'success';
    default: return 'secondary';
  }
}

async function updateComplaintStatus(complaintId, newStatus) {
  try {
    const res = await fetch(`${backendBase}/update_complaint.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        complaint_id: complaintId,
        status: newStatus
      }),
      mode: 'cors'
    });
    
    const data = await res.json();
    
    if (data.success) {
      // Reload complaints
      loadPoliceComplaints();
    } else {
      alert('Failed to update status: ' + data.message);
    }
  } catch (error) {
    console.error('Error updating complaint status:', error);
    alert('Failed to update status. Please try again.');
  }
}

window.loadPoliceComplaints = loadPoliceComplaints;
window.updateComplaintStatus = updateComplaintStatus;

  const observer = new MutationObserver(() => {
    if (document.getElementById('myComplaintsContainer') || document.getElementById('complaintsTableContainer')) {
      loadComplaints()
    }
  })

  observer.observe(document.getElementById('page-content'), { childList: true })
})
