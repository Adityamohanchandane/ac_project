// ObservX Police Complaint Management System - Frontend
// Clean version without PHP references and hardcoded URLs

// Global variables
const getBackendUrl = () => {
  const { protocol, hostname } = window.location;
  
  console.log('🔍 getBackendUrl Debug:');
  console.log('- protocol:', protocol);
  console.log('- hostname:', hostname);
  
  // Handle localhost development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const backendUrl = "http://localhost:3000";
    console.log('- Localhost detected, backendUrl:', backendUrl);
    return backendUrl;
  }
  
  // Handle Render deployment
  if (hostname.includes('onrender.com')) {
    const backendUrl = `${protocol}//${hostname}`;
    console.log('- Render deployment detected, backendUrl:', backendUrl);
    return backendUrl;
  }
  
  // Handle local network access (like your IP)
  if (hostname.includes('10.172.176.108') || !hostname.includes('localhost')) {
    const backendUrl = `${protocol}//${hostname}:3000`;
    console.log('- Local network detected, backendUrl:', backendUrl);
    return backendUrl;
  }
  
  // Fallback
  const backendUrl = `${protocol}//${hostname}:3000`;
  console.log('- Fallback, backendUrl:', backendUrl);
  return backendUrl;
};

const BASE_URL = getBackendUrl();
let currentUser = null;
let currentUserRole = null;
let isLoading = false;

// Demo mode state
let demoMode = {
  enabled: false, // Disable demo mode for production
  demoUser: {
    email: 'adii123@gmail.com',
    password: 'adii123',
    fullName: 'Aditya Chandane',
    role: 'user'
  },
  demoPolice: {
    email: 'adii123@gmail.com',
    password: 'adii123',
    fullName: 'Police Officer',
    role: 'police',
    badgeNumber: 'POL001'
  },
  demoComplaints: []
};

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

  animateOnScroll()
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

// Simple notification helper
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

// API helper functions
const apiCall = async (endpoint, options = {}) => {
  try {
    const fullUrl = `${BASE_URL}${endpoint}`;
    console.log('🔍 API Call Debug:');
    console.log('- BASE_URL:', BASE_URL);
    console.log('- endpoint:', endpoint);
    console.log('- fullUrl:', fullUrl);
    console.log('- options:', options);
    console.log('- window.location:', window.location);
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    console.log('- Response status:', response.status);
    console.log('- Response ok:', response.ok);
    console.log('- Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('- Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('- Response data:', result);
    return result;
  } catch (error) {
    console.error('❌ API call failed:', error);
    console.error('- Error details:', error.message);
    console.error('- Stack trace:', error.stack);
    throw error;
  }
};

// Authentication functions
const checkAuth = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) return false;

  try {
    const data = await apiCall('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (data.success) {
      currentUser = data.data.user;
      currentUserRole = data.data.user.role;
      updateAuthMenu();
      return true;
    }
  } catch (error) {
    localStorage.removeItem('authToken');
  }
  
  return false;
};

const login = async (email, password, role = 'user') => {
  try {
    setLoading(true);
    const endpoint = role === 'police' ? '/api/police/login' : '/api/auth/login';
    const data = await apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.success) {
      const userData = role === 'police' ? data.data.police : data.data.user;
      currentUser = userData;
      currentUserRole = userData.role;
      localStorage.setItem('authToken', data.data.token);
      updateAuthMenu();
      
      // Redirect based on role
      const dashboardRoute = role === 'police' ? '#/police-dashboard' : '#/user-dashboard';
      window.location.hash = dashboardRoute;
      
      showNotification('success', 'Login successful!');
      return true;
    } else {
      showNotification('error', data.message || 'Login failed');
      return false;
    }
  } catch (error) {
    console.error('Login error:', error);
    showNotification('error', 'Login failed. Please check your credentials and try again.');
    return false;
  } finally {
    setLoading(false);
  }
};

const logout = () => {
  localStorage.removeItem('authToken');
  currentUser = null;
  currentUserRole = null;
  updateAuthMenu();
  window.location.hash = '#/';
  showNotification('info', 'Logged out successfully');
};

// Update auth menu
function updateAuthMenu() {
  const authMenu = document.getElementById('authMenu')
  if (!authMenu) return

  if (currentUser) {
    authMenu.innerHTML = `
      <div class="dropdown">
        <a class="d-flex align-items-center text-decoration-none dropdown-toggle" 
           href="#" 
           role="button" 
           data-bs-toggle="dropdown" 
           aria-expanded="false"
           data-bs-offset="10,20">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName || 'User')}&background=2563eb&color=fff" 
               alt="${currentUser.fullName || 'User'}" 
               class="rounded-circle me-2" 
               style="width: 36px; height: 36px; object-fit: cover;">
          <span class="d-none d-md-inline">${currentUser.fullName || 'User'}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end shadow" style="min-width: 200px;">
          <li>
            <div class="dropdown-header d-flex align-items-center">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName || 'User')}&background=2563eb&color=fff" 
                   alt="${currentUser.fullName || 'User'}" 
                   class="rounded-circle me-2" 
                   style="width: 40px; height: 40px; object-fit: cover;">
              <div>
                <h6 class="mb-0">${currentUser.fullName || 'User'}</h6>
                <small class="text-muted">${currentUser.email || ''}</small>
              </div>
            </div>
          </li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#/${currentUserRole}-dashboard"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
          <li><a class="dropdown-item" href="#/my-profile"><i class="bi bi-person me-2"></i>My Profile</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" onclick="logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
        </ul>
      </div>
    `
  } else {
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
  
  initTooltips()
}

// Secure Geolocation API with proper error handling and user interaction requirement
const secureGeolocationAPI = {
  // Check if geolocation is supported
  isSupported() {
    return 'geolocation' in navigator;
  },

  // Get current position with user interaction
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        const error = new Error('Geolocation is not supported by this browser');
        console.error('❌ Geolocation not supported:', error.message);
        reject(error);
        return;
      }

      console.log('📍 Requesting geolocation permission...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            },
            timestamp: new Date(position.timestamp).toISOString(),
            device: navigator.userAgent,
            method: 'gps'
          };
          
          console.log('✅ GPS location captured successfully:', locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          let errorMessage = '';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied by user';
              console.log('🚫 User denied location permission');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              console.log('❌ Location unavailable');
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              console.log('⏰ Location request timeout');
              break;
            default:
              errorMessage = 'Unknown geolocation error';
              console.log('❓ Unknown geolocation error');
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  },

  // Fallback to IP-based location
  async getIPLocation() {
    try {
      console.log('🌐 Getting IP-based location fallback...');
      
      const services = [
        'https://ipapi.co/json/',
        'https://ipinfo.io/json'
      ];
      
      for (const service of services) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          
          if (data.latitude && data.longitude) {
            const locationData = {
              location: {
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: 1000 // IP location is less accurate
              },
              timestamp: new Date().toISOString(),
              device: navigator.userAgent,
              method: 'ip',
              city: data.city,
              region: data.region,
              country: data.country_name || data.country,
              ip: data.ip
            };
            
            console.log('✅ IP location captured:', locationData);
            return locationData;
          }
        } catch (error) {
          console.log(`❌ IP service ${service} failed:`, error.message);
          continue;
        }
      }
      
      // Final fallback
      const fallbackLocation = {
        location: {
          latitude: 0,
          longitude: 0,
          accuracy: 9999
        },
        timestamp: new Date().toISOString(),
        device: navigator.userAgent,
        method: 'fallback',
        error: 'All location services failed'
      };
      
      console.log('⚠️ Using fallback location:', fallbackLocation);
      return fallbackLocation;
      
    } catch (error) {
      console.error('❌ IP location fallback failed:', error);
      throw error;
    }
  }
};

// Secure Camera API with proper error handling and user interaction requirement
const secureCameraAPI = {
  // Check if camera is supported
  isSupported() {
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  },

  // Check if specific camera type is supported
  isCameraTypeSupported(type = 'user') {
    if (!this.isSupported()) {
      return false;
    }
    
    const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    return supportedConstraints.facingMode && supportedConstraints.video;
  },

  // Access camera with user interaction
  async accessCamera(constraints = { video: { facingMode: 'user' }, audio: false }) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        const error = new Error('Camera API is not supported by this browser');
        console.error('❌ Camera not supported:', error.message);
        reject(error);
        return;
      }

      console.log('📸 Requesting camera permission...');
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          const cameraData = {
            stream: stream,
            timestamp: new Date().toISOString(),
            device: navigator.userAgent,
            constraints: constraints,
            method: 'camera'
          };
          
          console.log('✅ Camera access granted:', cameraData);
          resolve(cameraData);
        })
        .catch((error) => {
          console.error('❌ Camera error:', error);
          let errorMessage = '';
          
          switch(error.name) {
            case 'NotAllowedError':
              errorMessage = 'Camera permission denied by user';
              console.log('🚫 User denied camera permission');
              break;
            case 'NotFoundError':
              errorMessage = 'No camera device found';
              console.log('❌ No camera found');
              break;
            case 'NotReadableError':
              errorMessage = 'Camera is already in use by another application';
              console.log('🔒 Camera already in use');
              break;
            case 'OverconstrainedError':
              errorMessage = 'Camera constraints cannot be satisfied';
              console.log('⚠️ Camera constraints not supported');
              break;
            case 'SecurityError':
              errorMessage = 'Camera access blocked due to security restrictions';
              console.log('🔒 Camera access blocked (HTTPS required)');
              break;
            default:
              errorMessage = 'Unknown camera error';
              console.log('❓ Unknown camera error');
              break;
          }
          
          reject(new Error(errorMessage));
        });
    });
  },

  // Stop camera stream
  stopCamera(stream) {
    if (stream && stream.getTracks) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Camera track stopped');
      });
    }
  }
};

// Enhanced location capture function for complaint forms
async function captureUserLocation(buttonElement) {
  if (!buttonElement) {
    console.error('❌ Button element not provided');
    return null;
  }

  // Ensure this is triggered by user interaction
  const originalText = buttonElement.innerHTML;
  buttonElement.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Capturing...';
  buttonElement.disabled = true;

  try {
    console.log('📍 Starting secure location capture...');
    
    // Try GPS first
    const location = await secureGeolocationAPI.getCurrentPosition();
    
    // Format location for display
    const locationStr = `${location.location.latitude.toFixed(6)}, ${location.location.longitude.toFixed(6)} (±${location.location.accuracy.toFixed(0)}m)`;
    
    console.log('✅ Location captured successfully:', location);
    
    return {
      location,
      locationStr,
      success: true
    };
    
  } catch (error) {
    console.error('❌ GPS location failed, trying IP fallback:', error.message);
    
    try {
      // Fallback to IP location
      const location = await secureGeolocationAPI.getIPLocation();
      const locationStr = `${location.location.latitude.toFixed(6)}, ${location.location.longitude.toFixed(6)} (±${location.location.accuracy.toFixed(0)}m)`;
      
      console.log('✅ Fallback location captured:', location);
      
      return {
        location,
        locationStr,
        success: true,
        fallback: true
      };
      
    } catch (fallbackError) {
      console.error('❌ All location methods failed:', fallbackError.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  } finally {
    // Restore button
    buttonElement.innerHTML = originalText;
    buttonElement.disabled = false;
  }
}

// Enhanced camera capture function
async function captureCamera(buttonElement, videoElement, constraints = { video: { facingMode: 'user' }, audio: false }) {
  if (!buttonElement) {
    console.error('❌ Button element not provided');
    return null;
  }

  // Ensure this is triggered by user interaction
  const originalText = buttonElement.innerHTML;
  buttonElement.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Accessing Camera...';
  buttonElement.disabled = true;

  try {
    console.log('📸 Starting secure camera capture...');
    
    const cameraData = await secureCameraAPI.accessCamera(constraints);
    
    if (videoElement) {
      videoElement.srcObject = cameraData.stream;
      videoElement.play();
      console.log('📹 Camera feed started');
    }
    
    console.log('✅ Camera access successful');
    
    return {
      stream: cameraData.stream,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Camera access failed:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Restore button
    buttonElement.innerHTML = originalText;
    buttonElement.disabled = false;
  }
}

// Legacy function for backward compatibility
async function getUserLocation() {
  try {
    const result = await captureUserLocation({ innerText: 'Legacy' });
    if (result.success) {
      return result.location.location;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    throw error;
  }
}

// Enhanced Geolocation Evidence Capture (updated for security)
const captureGeolocationEvidence = async () => {
  try {
    console.log('📍 Starting geolocation evidence capture...');
    
    // Use the secure API
    const location = await secureGeolocationAPI.getCurrentPosition();
    console.log('✅ Geolocation evidence captured:', location);
    return location;
    
  } catch (error) {
    console.error('❌ GPS evidence capture failed, trying IP fallback:', error.message);
    
    try {
      const ipLocation = await secureGeolocationAPI.getIPLocation();
      console.log('✅ IP-based evidence captured:', ipLocation);
      return ipLocation;
    } catch (fallbackError) {
      console.error('❌ All evidence capture methods failed:', fallbackError);
      throw fallbackError;
    }
  }
};

// Create evidence metadata object
const createEvidenceMetadata = async (photoFile) => {
  try {
    console.log('📸 Creating evidence metadata for photo...');
    
    const location = await captureGeolocationEvidence();
    
    const evidence = {
      photo: photoFile ? {
        name: photoFile.name,
        size: photoFile.size,
        type: photoFile.type,
        lastModified: new Date(photoFile.lastModified).toISOString()
      } : null,
      location: location,
      timestamp: new Date().toISOString(),
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        vendor: navigator.vendor
      },
      browser: {
        appName: navigator.appName,
        appVersion: navigator.appVersion,
        vendor: navigator.vendor
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
      }
    };
    
    console.log('✅ Evidence metadata created:', evidence);
    return evidence;
    
  } catch (error) {
    console.error('❌ Failed to create evidence metadata:', error);
    throw error;
  }
};

// API functions for complaints
const fetchUserComplaints = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const data = await apiCall('/api/complaints', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return data.success ? data.data.complaints : [];
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return [];
  }
};

const fetchAllComplaints = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const data = await apiCall('/api/complaints/all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return data.success ? data.data.complaints : [];
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    return [];
  }
};

// Page routing
const pages = {
  home: renderHome,
  about: renderAbout,
  contact: renderContact,
  'user-login': renderUserLogin,
  'police-login': renderPoliceLogin,
  'user-register': renderUserRegister,
  'user-dashboard': renderUserDashboard,
  'police-dashboard': renderPoliceDashboard,
  'complaint-type-selection': renderComplaintTypeSelection,
  'file-complaint': renderFileComplaint,
  'emergency-complaint': renderEmergencyComplaint,
  'view-complaint': renderViewComplaint,
  'my-complaints': renderMyComplaints,
  'view-complaints': renderViewComplaints,
  'update-complaint': renderUpdateComplaint,
}

window.addEventListener('hashchange', () => {
  const hash = location.hash.slice(2) || 'home'
  const route = hash.split('?')[0]
  loadPage(route)
})

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    setLoading(true)
    await checkAuth()
    const hash = location.hash.slice(2) || 'home'
    const route = hash.split('?')[0]
    await loadPage(route)
    initApp()
  } catch (error) {
    console.error('Error initializing app:', error)
    showNotification('error', 'Failed to initialize the application. Please try again.')
  } finally {
    setLoading(false)
  }
})

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

// Clean registration form handler
function attachRegisterFormListener() {
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault(); // Prevent page refresh

      const fullName = document.getElementById("fullName").value;
      const email = document.getElementById("email").value;
      const mobile = document.getElementById("mobile").value;
      const address = document.getElementById("address").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        showNotification("error", "Passwords do not match");
        return;
      }

      if (!fullName || !email || !password) {
        showNotification("error", "Please fill in all required fields");
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullName,
            email,
            mobile,
            address,
            password
          })
        });

        const data = await res.json();

        if (data.success) {
          showNotification("success", "Registration successful!");
          window.location.hash = "#/user-login";
        } else {
          showNotification("error", data.message || "Registration failed");
        }

      } catch (err) {
        console.error('Registration error:', err);
        showNotification("error", "Server error. Please try again.");
      } finally {
        setLoading(false);
      }
    });
  }
}

async function loadPage(route) {
  const content = document.getElementById('page-content')
  if (!content) return

  try {
    setLoading(true)
    
    content.style.opacity = '0'
    content.style.transition = 'opacity 0.3s ease'
    
    await new Promise(resolve => setTimeout(resolve, 200))
    
    if (pages[route]) {
      content.innerHTML = await pages[route]()
      content.style.opacity = '0'
      content.style.animation = 'fadeIn 0.5s forwards'
      
      // Attach event listeners based on route
      if (route === 'file-complaint') {
        attachComplaintFormListeners()
      } else if (route === 'user-register') {
        attachRegisterFormListener()
      } else if (route === 'user-login') {
        attachLoginListeners()
      } else if (route === 'police-login') {
        attachLoginListeners()
      } else if (route === 'emergency-complaint') {
        attachComplaintFormListeners()
      } else if (route === 'user-dashboard') {
        setTimeout(loadDashboardData, 100); // Load data after DOM is ready
      } else if (route === 'my-complaints') {
        setTimeout(loadMyComplaintsDataAndRender, 100); // Load complaints after DOM is ready
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
    
    initTooltips()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
  } catch (error) {
    console.error(`Error loading page ${route}:`, error)
    showNotification('error', 'Failed to load the page. Please try again.')
  } finally {
    setLoading(false)
    content.style.opacity = '1'
  }
}

// Page render functions
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
          <a href="#/complaint-type-selection" class="btn btn-light btn-lg me-2">File Complaint</a>
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
              <p class="card-text">support@observx.gov.in</p>
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
            <input type="email" class="form-control" id="loginEmail" value="adii123@gmail.com" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" id="loginPassword" value="adii123" required>
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
            <input type="email" class="form-control" id="email" value="adii123@gmail.com" placeholder="officer@observx.gov.in" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" id="password" value="adii123" required>
          </div>
          <div id="policeLoginAlert"></div>
          <button type="submit" class="btn btn-secondary w-100">Login</button>
        </form>
        <p class="text-center mt-3"><a href="#/">Back to Home</a></p>
      </div>
    </div>
  `
}

function renderComplaintTypeSelection() {
  if (!currentUser || currentUserRole === 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Unauthorized access. <a href="#/user-login">Login here</a></div></div>`
  }

  return `
    <div class="container mt-4">
      <div class="row justify-content-center">
        <div class="col-md-10">
          <div class="complaint-type-header text-center mb-5">
            <h2 class="mb-3"><i class="bi bi-clipboard-plus me-2"></i>File a Complaint</h2>
            <p class="lead text-muted">Please select the type of complaint you want to file</p>
          </div>

          <div class="row g-4">
            <!-- Normal Complaint -->
            <div class="col-md-6">
              <div class="card complaint-type-card h-100 border-primary shadow-sm">
                <div class="card-body text-center">
                  <div class="complaint-icon mb-3">
                    <i class="bi bi-file-text display-1 text-primary"></i>
                  </div>
                  <h3 class="card-title mb-3">Normal Complaint</h3>
                  <p class="card-text text-muted">
                    File a regular complaint for non-urgent issues. These will be processed within standard timeframes.
                  </p>
                  <ul class="text-start mb-4">
                    <li><i class="bi bi-check-circle text-success me-2"></i>Theft reports</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Property disputes</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Harassment complaints</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Other non-urgent issues</li>
                  </ul>
                  <a href="#/file-complaint" class="btn btn-primary btn-lg w-100">
                    <i class="bi bi-plus-circle me-2"></i>File Normal Complaint
                  </a>
                </div>
              </div>
            </div>

            <!-- Emergency Complaint -->
            <div class="col-md-6">
              <div class="card complaint-type-card h-100 border-danger shadow-sm">
                <div class="card-body text-center">
                  <div class="complaint-icon mb-3">
                    <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
                  </div>
                  <h3 class="card-title mb-3">Emergency Complaint</h3>
                  <p class="card-text text-muted">
                    File an emergency complaint for urgent situations requiring immediate attention.
                  </p>
                  <ul class="text-start mb-4">
                    <li><i class="bi bi-exclamation-triangle text-danger me-2"></i>Life-threatening situations</li>
                    <li><i class="bi bi-exclamation-triangle text-danger me-2"></i>Violent crimes in progress</li>
                    <li><i class="bi bi-exclamation-triangle text-danger me-2"></i>Medical emergencies</li>
                    <li><i class="bi bi-exclamation-triangle text-danger me-2"></i>Fire emergencies</li>
                  </ul>
                  <a href="#/emergency-complaint" class="btn btn-danger btn-lg w-100">
                    <i class="bi bi-exclamation-triangle me-2"></i>File Emergency Complaint
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="text-center mt-4">
            <a href="#/user-dashboard" class="btn btn-outline-secondary">
              <i class="bi bi-arrow-left me-2"></i>Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>

    <style>
      .complaint-type-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
      }
      
      .complaint-type-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
      }
      
      .complaint-icon {
        padding: 20px;
        border-radius: 50%;
        background: rgba(0,0,0,0.05);
        display: inline-block;
      }
      
      .display-1 {
        font-size: 3rem;
      }
      
      .card-text {
        min-height: 80px;
      }
    </style>
  `
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
    <div class="container">
      <div class="row">
        <div class="col-12">
          <h2><i class="bi bi-speedometer2"></i> User Dashboard</h2>
          <p class="text-muted">Welcome back, ${currentUser.fullName}!</p>
          
          <div class="row g-4 mb-4" id="dashboard-stats">
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h5 class="card-title text-primary" id="total-complaints">0</h5>
                  <p class="card-text">Total Complaints</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h5 class="card-title text-warning" id="pending-complaints">0</h5>
                  <p class="card-text">Pending</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h5 class="card-title text-info" id="investigation-complaints">0</h5>
                  <p class="card-text">Under Investigation</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h5 class="card-title text-success" id="resolved-complaints">0</h5>
                  <p class="card-text">Resolved</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h5><i class="bi bi-file-text"></i> Recent Complaints</h5>
            </div>
            <div class="card-body">
              <div id="complaints-loading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading your complaints...</p>
              </div>
              <div class="table-responsive" id="complaints-table" style="display: none;">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="complaints-tbody">
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="text-center mt-4">
            <a href="#/complaint-type-selection" class="btn btn-primary">
              <i class="bi bi-plus-circle"></i> File New Complaint
            </a>
            <a href="#/my-complaints" class="btn btn-outline-primary">
              <i class="bi bi-list"></i> View All Complaints
            </a>
          </div>
        </div>
      </div>
    </div>
  `
}

// Load dashboard data
const loadDashboardData = async () => {
  try {
    const complaints = await fetchUserComplaints();
    
    // Update stats
    const totalComplaints = complaints.length;
    const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
    const investigationComplaints = complaints.filter(c => c.status === 'under-investigation').length;
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
    
    document.getElementById('total-complaints').textContent = totalComplaints;
    document.getElementById('pending-complaints').textContent = pendingComplaints;
    document.getElementById('investigation-complaints').textContent = investigationComplaints;
    document.getElementById('resolved-complaints').textContent = resolvedComplaints;
    
    // Update complaints table
    const complaintsTbody = document.getElementById('complaints-tbody');
    complaintsTbody.innerHTML = complaints.map(complaint => `
      <tr>
        <td>${complaint.complaintId}</td>
        <td>${complaint.title}</td>
        <td>${complaint.category}</td>
        <td><span class="badge bg-${getStatusColor(complaint.status)}">${complaint.status}</span></td>
        <td>${new Date(complaint.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="viewComplaint('${complaint._id}')">
            <i class="bi bi-eye"></i> View
          </button>
        </td>
      </tr>
    `).join('');
    
    // Hide loading and show table
    document.getElementById('complaints-loading').style.display = 'none';
    document.getElementById('complaints-table').style.display = 'block';
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    document.getElementById('complaints-loading').innerHTML = `
      <div class="alert alert-danger">
        Failed to load complaints. Please try refreshing the page.
      </div>
    `;
  }
};

function renderPoliceDashboard() {
  if (!currentUser || currentUserRole !== 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Unauthorized access. <a href="#/police-login">Login here</a></div></div>`
  }

  return `
    <div class="container">
      <div class="row">
        <div class="col-12">
          <h2><i class="bi bi-shield-check"></i> Police Dashboard</h2>
          <p class="text-muted">Welcome back, Officer ${currentUser.fullName}!</p>
          
          <div class="row g-4 mb-4">
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h5 class="card-title text-primary">${demoMode.demoComplaints.length}</h5>
                  <p class="card-text">Total Complaints</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h5 class="card-title text-danger">${demoMode.demoComplaints.filter(c => c.priority_level === 'emergency').length}</h5>
                  <p class="card-text">Emergency</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h5 class="card-title text-warning">${demoMode.demoComplaints.filter(c => c.status === 'pending').length}</h5>
                  <p class="card-text">Pending</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h5 class="card-title text-info">${demoMode.demoComplaints.filter(c => c.status === 'under-investigation').length}</h5>
                  <p class="card-text">Under Investigation</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h5><i class="bi bi-list-check"></i> All Complaints</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Reported By</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${demoMode.demoComplaints.map(complaint => `
                      <tr>
                        <td>${complaint.complaint_id}</td>
                        <td>${complaint.title}</td>
                        <td>${complaint.category}</td>
                        <td><span class="badge bg-${getPriorityColor(complaint.priority_level)}">${complaint.priority_level}</span></td>
                        <td><span class="badge bg-${getStatusColor(complaint.status)}">${complaint.status}</span></td>
                        <td>${complaint.user_email}</td>
                        <td>${new Date(complaint.created_at).toLocaleDateString()}</td>
                        <td>
                          <button class="btn btn-sm btn-outline-primary" onclick="viewComplaint('${complaint.id}')">
                            <i class="bi bi-eye"></i> View
                          </button>
                          <button class="btn btn-sm btn-outline-success" onclick="updateComplaint('${complaint.id}')">
                            <i class="bi bi-pencil"></i> Update
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderMyComplaints() {
  if (!currentUser || currentUserRole === 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Unauthorized access. <a href="#/user-login">Login here</a></div></div>`
  }

  return `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="complaints-header p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center">
              <h2 class="mb-0"><i class="bi bi-list-ul me-2"></i>My Complaints</h2>
              <button class="btn btn-light" onclick="window.location.hash='#/complaint-type-selection'">
                <i class="bi bi-plus-circle me-2"></i>File New Complaint
              </button>
            </div>
          </div>
          
          <!-- Statistics Cards -->
          <div class="row mb-4" id="complaintsStats">
            <div class="col-md-3">
              <div class="card stats-card border-primary">
                <div class="card-body text-center">
                  <h5 class="card-title text-primary" id="totalCount">0</h5>
                  <p class="card-text">Total Complaints</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card stats-card border-success">
                <div class="card-body text-center">
                  <h5 class="card-title text-success" id="resolvedCount">0</h5>
                  <p class="card-text">Resolved</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card stats-card border-warning">
                <div class="card-body text-center">
                  <h5 class="card-title text-warning" id="pendingCount">0</h5>
                  <p class="card-text">Pending</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card stats-card border-info">
                <div class="card-body text-center">
                  <h5 class="card-title text-info" id="investigationCount">0</h5>
                  <p class="card-text">Under Investigation</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Complaints Table -->
          <div class="card complaints-table shadow-sm">
            <div class="card-header bg-white border-bottom">
              <h5 class="mb-0"><i class="bi bi-file-text me-2"></i>Complaint History</h5>
            </div>
            <div class="card-body p-0">
              <div id="complaintsTableContainer">
                <div class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="mt-3 text-muted">Loading your complaints...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

// Function to render complaints table with real data
function renderComplaintsTable(complaints) {
  console.log('🎨 Rendering complaints table with data:', complaints);
  console.log('- Number of complaints:', complaints.length);
  
  const totalCount = complaints.length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const investigationCount = complaints.filter(c => c.status === 'under-investigation').length;

  console.log('- Statistics:', { totalCount, resolvedCount, pendingCount, investigationCount });

  // Update statistics
  const totalElement = document.getElementById('totalCount');
  const resolvedElement = document.getElementById('resolvedCount');
  const pendingElement = document.getElementById('pendingCount');
  const investigationElement = document.getElementById('investigationCount');
  
  if (totalElement) totalElement.textContent = totalCount;
  if (resolvedElement) resolvedElement.textContent = resolvedCount;
  if (pendingElement) pendingElement.textContent = pendingCount;
  if (investigationElement) investigationElement.textContent = investigationCount;

  // Render table
  const tableHTML = `
    <div class="table-responsive">
      <table class="table table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th><i class="bi bi-hash me-1"></i>Complaint ID</th>
            <th><i class="bi bi-card-text me-1"></i>Title</th>
            <th><i class="bi bi-tag me-1"></i>Category</th>
            <th><i class="bi bi-flag me-1"></i>Priority</th>
            <th><i class="bi bi-info-circle me-1"></i>Status</th>
            <th><i class="bi bi-calendar me-1"></i>Date Filed</th>
            <th><i class="bi bi-gear me-1"></i>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${complaints.map(complaint => `
            <tr>
              <td>
                <span class="badge bg-secondary">${complaint.complaintId || complaint._id}</span>
              </td>
              <td>
                <div class="complaint-title">${complaint.title}</div>
                <small class="complaint-description">${complaint.description.substring(0, 50)}...</small>
              </td>
              <td>
                <span class="badge bg-light text-dark">
                  <i class="bi bi-folder me-1"></i>${complaint.category}
                </span>
              </td>
              <td>
                <span class="badge bg-${getPriorityColor(complaint.priority)}">
                  <i class="bi bi-exclamation-triangle me-1"></i>${complaint.priority}
                </span>
              </td>
              <td>
                <span class="badge bg-${getStatusColor(complaint.status)}">
                  ${getStatusIcon(complaint.status)} ${complaint.status}
                </span>
              </td>
              <td>
                <small>${new Date(complaint.createdAt || complaint.created_at).toLocaleDateString()}</small>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-outline-primary btn-sm" onclick="viewComplaint('${complaint._id}')" title="View Details">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" onclick="downloadComplaint('${complaint._id}')" title="Download">
                    <i class="bi bi-download"></i>
                  </button>
                  ${complaint.status === 'pending' ? `
                    <button class="btn btn-outline-warning btn-sm" onclick="editComplaint('${complaint._id}')" title="Edit">
                      <i class="bi bi-pencil"></i>
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    ${complaints.length === 0 ? `
      <div class="empty-state">
        <i class="bi bi-inbox display-1 text-muted"></i>
        <h5 class="mt-3 text-muted">No Complaints Found</h5>
        <p class="text-muted">You haven't filed any complaints yet.</p>
        <button class="btn btn-primary" onclick="window.location.hash='#/complaint-type-selection'">
          <i class="bi bi-plus-circle me-2"></i>File Your First Complaint
        </button>
      </div>
    ` : ''}
  `;

  const tableContainer = document.getElementById('complaintsTableContainer');
  if (tableContainer) {
    tableContainer.innerHTML = tableHTML;
    console.log('✅ Table HTML inserted into container');
  } else {
    console.error('❌ Table container element not found!');
  }
}

// Load real complaints data from API
async function loadMyComplaintsData() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('❌ No auth token found');
      return [];
    }

    console.log('📋 Fetching user complaints from API...');
    console.log('- Token exists:', !!token);
    console.log('- Token length:', token.length);
    console.log('- BASE_URL:', BASE_URL);
    
    const response = await fetch(`${BASE_URL}/api/complaints/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('- Response status:', response.status);
    console.log('- Response ok:', response.ok);

    const result = await response.json();
    console.log('- Full API response:', result);
    
    if (result.success && result.data && result.data.complaints) {
      console.log('✅ User complaints loaded:', result.data.complaints.length);
      console.log('- Complaints details:', result.data.complaints);
      return result.data.complaints;
    } else {
      console.log('⚠️ No complaints found or API error:', result.message);
      console.log('- Result structure:', result);
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading complaints:', error);
    console.error('- Error details:', error.message);
    console.error('- Stack trace:', error.stack);
    return [];
  }
}

// Helper functions for status and priority
function getStatusIcon(status) {
  const icons = {
    'pending': '<i class="bi bi-clock"></i>',
    'under-investigation': '<i class="bi bi-search"></i>',
    'resolved': '<i class="bi bi-check-circle"></i>',
    'rejected': '<i class="bi bi-x-circle"></i>',
    'high_priority': '<i class="bi bi-exclamation-triangle-fill"></i>'
  };
  return icons[status] || '<i class="bi bi-info-circle"></i>';
}

// Load and render complaints data
async function loadMyComplaintsDataAndRender() {
  try {
    console.log('📋 Loading and rendering user complaints...');
    
    // Load complaints data
    const complaints = await loadMyComplaintsData();
    
    // Render the complaints table
    renderComplaintsTable(complaints);
    
    console.log('✅ Complaints data loaded and rendered successfully');
    
  } catch (error) {
    console.error('❌ Error loading and rendering complaints:', error);
    
    // Show error message in the table container
    const tableContainer = document.getElementById('complaintsTableContainer');
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="text-center py-5">
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Failed to load complaints. Please try refreshing the page.
          </div>
        </div>
      `;
    }
  }
}

function downloadComplaint(complaintId) {
  // Placeholder for download functionality
  showNotification('info', 'Download feature coming soon!', 3000);
}

function editComplaint(complaintId) {
  // Placeholder for edit functionality
  showNotification('info', 'Edit feature coming soon!', 3000);
}

function renderEmergencyComplaint() {
  if (!currentUser || currentUserRole === 'police') {
    return `<div class="container mt-5"><div class="alert alert-danger">Please login as a citizen to file an emergency complaint. <a href="#/user-login">Login here</a></div></div>`
  }

  return `
    <div class="container">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="form-section emergency-form">
            <h2><i class="bi bi-exclamation-triangle-fill text-danger"></i> Emergency Complaint</h2>
            <div class="alert alert-danger">
              <strong>For emergencies only!</strong> If you are in immediate danger, call 100 first.
            </div>
            <form id="emergencyComplaintForm">
              <div class="mb-3">
                <label class="form-label">Emergency Title <span class="text-muted">(Optional)</span></label>
                <input type="text" class="form-control" id="emergencyTitle" placeholder="Brief description of emergency (optional)">
              </div>
              <div class="mb-3">
                <label class="form-label">Category <span class="text-danger">*</span></label>
                <select class="form-select" id="emergencyCategory" required>
                  <option value="">Select emergency type</option>
                  <option value="theft">Theft/Robbery in Progress</option>
                  <option value="violence">Violence/Assault</option>
                  <option value="accident">Accident</option>
                  <option value="medical-emergency">Medical Emergency</option>
                  <option value="fire">Fire</option>
                  <option value="cyber-attack">Cyber Attack</option>
                  <option value="other">Other Emergency</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Your Current Location (Auto-captured) <span class="text-danger">*</span></label>
                <div class="input-group">
                  <input type="text" class="form-control" id="emergencyUserLocation" placeholder="Waiting for GPS..." readonly>
                  <button class="btn btn-danger" type="button" id="captureEmergencyLocation">
                    <i class="bi bi-geo-alt"></i> Capture
                  </button>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Emergency Location <span class="text-muted">(Optional - Auto-captured from GPS)</span></label>
                <input type="text" class="form-control" id="emergencyLocation" placeholder="Where is the emergency happening? (optional)">
              </div>
              <div class="mb-3">
                <label class="form-label">Description <span class="text-danger">*</span></label>
                <textarea class="form-control" id="emergencyDescription" rows="4" placeholder="Describe emergency situation" required></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Emergency Photo Evidence <span class="text-info">(Optional but recommended)</span></label>
                <div class="emergency-photo-section">
                  <div class="photo-preview" id="emergencyPhotoPreview" style="display: none;">
                    <img id="emergencyPhotoImg" src="" alt="Emergency photo" style="max-width: 100%; max-height: 200px; border-radius: 8px; margin-bottom: 10px;">
                    <div class="photo-actions">
                      <button type="button" class="btn btn-sm btn-outline-danger" onclick="clearEmergencyPhoto()">
                        <i class="bi bi-trash"></i> Remove Photo
                      </button>
                      <button type="button" class="btn btn-sm btn-outline-primary" onclick="retakeEmergencyPhoto()">
                        <i class="bi bi-camera"></i> Retake Photo
                      </button>
                    </div>
                  </div>
                  <div class="photo-capture" id="emergencyPhotoCapture">
                    <button type="button" class="btn btn-outline-danger btn-lg w-100" onclick="captureEmergencyPhoto()">
                      <i class="bi bi-camera-fill"></i> Capture Emergency Photo
                    </button>
                    <small class="text-muted">Take a photo of the emergency situation (if safe to do so)</small>
                  </div>
                  <input type="file" id="emergencyPhotoInput" accept="image/*" capture="environment" style="display: none;">
                </div>
              </div>
              <div id="emergencyComplaintAlert"></div>
              <button type="submit" class="btn btn-danger btn-lg w-100">
                <i class="bi bi-exclamation-triangle"></i> Submit Emergency Complaint
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
}

// Emergency photo capture functions
function captureEmergencyPhoto() {
  document.getElementById('emergencyPhotoInput').click();
}

function clearEmergencyPhoto() {
  document.getElementById('emergencyPhotoImg').src = '';
  document.getElementById('emergencyPhotoPreview').style.display = 'none';
  document.getElementById('emergencyPhotoCapture').style.display = 'block';
  document.getElementById('emergencyPhotoInput').value = '';
}

function retakeEmergencyPhoto() {
  clearEmergencyPhoto();
  captureEmergencyPhoto();
}

// Helper functions
function getStatusColor(status) {
  const colors = {
    'pending': 'warning',
    'under-investigation': 'info',
    'resolved': 'success',
    'closed': 'secondary',
    'rejected': 'danger',
    'high_priority': 'danger'
  };
  return colors[status] || 'secondary';
}

function getPriorityColor(priority) {
  const colors = {
    'low': 'success',
    'medium': 'warning',
    'high': 'danger',
    'emergency': 'danger'
  };
  return colors[priority] || 'secondary';
}

function viewComplaint(complaintId) {
  window.location.hash = `#/view-complaint?id=${complaintId}`;
}

function updateComplaint(complaintId) {
  window.location.hash = `#/update-complaint?id=${complaintId}`;
}

// Event listeners
function attachComplaintFormListeners() {
  const captureBtn = document.getElementById('captureUserLocation');
  if (captureBtn) {
    captureBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Use the secure location capture function
      const result = await captureUserLocation(captureBtn);
      
      if (result.success) {
        document.getElementById('userLocation').value = result.locationStr;
        document.getElementById('userLocation').setAttribute('data-location', JSON.stringify(result.location));
        
        if (result.fallback) {
          showNotification('warning', 'Location captured using IP-based fallback (less accurate)', 4000);
        } else {
          showNotification('success', 'Location captured successfully!', 3000);
        }
      } else {
        showNotification('error', `Location capture failed: ${result.error}`, 5000);
      }
    });
  }

  const emergencyCaptureBtn = document.getElementById('captureEmergencyLocation');
  if (emergencyCaptureBtn) {
    emergencyCaptureBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Use the secure location capture function
      const result = await captureUserLocation(emergencyCaptureBtn);
      
      if (result.success) {
        document.getElementById('emergencyUserLocation').value = result.locationStr;
        document.getElementById('emergencyUserLocation').setAttribute('data-location', JSON.stringify(result.location));
        
        if (result.fallback) {
          showNotification('warning', 'Location captured using IP-based fallback (less accurate)', 4000);
        } else {
          showNotification('success', 'Location captured successfully!', 3000);
        }
      } else {
        showNotification('error', `Location capture failed: ${result.error}`, 5000);
      }
    });
  }

  // Emergency photo capture functions
  
  const emergencyPhotoInput = document.getElementById('emergencyPhotoInput');
  const emergencyPhotoCapture = document.getElementById('emergencyPhotoCapture');
  
  if (emergencyPhotoInput && emergencyPhotoCapture) {
    emergencyPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          document.getElementById('emergencyPhotoImg').src = e.target.result;
          document.getElementById('emergencyPhotoPreview').style.display = 'block';
          emergencyPhotoCapture.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const complaintForm = document.getElementById('complaintForm');
  if (complaintForm) {
    complaintForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        title: document.getElementById('complaintTitle').value,
        category: document.getElementById('category').value,
        incidentDate: document.getElementById('incidentDate').value,
        crimeLocation: document.getElementById('crimeLocation').value,
        description: document.getElementById('description').value,
        userLocation: document.getElementById('userLocation').getAttribute('data-location')
      };

      if (!formData.userLocation) {
        showNotification('error', 'Please capture your location first');
        return;
      }

      try {
        setLoading(true);
        
        // Get form data including files
        const complaintForm = document.getElementById('complaintForm');
        const formData = new FormData(complaintForm);
        
        // Add complaint data
        formData.append('title', document.getElementById('complaintTitle').value);
        formData.append('category', document.getElementById('category').value);
        formData.append('incidentDate', document.getElementById('incidentDate').value);
        formData.append('incidentLocation', document.getElementById('crimeLocation').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('userLocation', document.getElementById('userLocation').getAttribute('data-location'));
        formData.append('priority', 'normal');

        // Add geolocation evidence metadata for each uploaded file
        const fileInput = complaintForm.querySelector('input[type="file"]');
        if (fileInput && fileInput.files.length > 0) {
          console.log('📸 Processing uploaded files with geolocation evidence...');
          
          for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            console.log(`📸 Processing file ${i + 1}: ${file.name}`);
            
            try {
              const evidenceMetadata = await createEvidenceMetadata(file);
              formData.append(`evidence_${i}`, JSON.stringify(evidenceMetadata));
              console.log(`✅ Evidence metadata added for file ${i + 1}`);
            } catch (error) {
              console.error(`❌ Failed to create evidence metadata for file ${i + 1}:`, error);
              // Continue with other files even if one fails
            }
          }
        }

        const token = localStorage.getItem('authToken');
        const response = await fetch(`${BASE_URL}/api/complaints`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type for FormData - browser sets it automatically with boundary
          },
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          showNotification('success', 'Complaint filed successfully with geolocation evidence!');
          window.location.hash = '#/my-complaints';
        } else {
          showNotification('error', result.message || 'Failed to file complaint');
        }
        
      } catch (error) {
        console.error('Error filing complaint:', error);
        showNotification('error', 'Failed to file complaint. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  }

  const emergencyComplaintForm = document.getElementById('emergencyComplaintForm');
  if (emergencyComplaintForm) {
    emergencyComplaintForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        title: document.getElementById('emergencyTitle').value || 'Emergency Report',
        category: document.getElementById('emergencyCategory').value,
        emergencyLocation: document.getElementById('emergencyLocation').value || 'Location captured by GPS',
        description: document.getElementById('emergencyDescription').value,
        userLocation: document.getElementById('emergencyUserLocation').getAttribute('data-location')
      };

      if (!formData.userLocation) {
        showNotification('error', 'Please capture your location first');
        return;
      }

      try {
        setLoading(true);
        
        // Get form data including files
        const emergencyComplaintForm = document.getElementById('emergencyComplaintForm');
        const formData = new FormData(emergencyComplaintForm);
        
        // Add emergency complaint data
        formData.append('title', document.getElementById('emergencyTitle').value || 'Emergency Report');
        formData.append('category', document.getElementById('emergencyCategory').value);
        formData.append('incidentDate', new Date().toISOString());
        formData.append('incidentLocation', document.getElementById('emergencyLocation').value || 'Location captured by GPS');
        formData.append('description', document.getElementById('emergencyDescription').value);
        formData.append('userLocation', document.getElementById('emergencyUserLocation').getAttribute('data-location'));
        formData.append('priority', 'emergency');

        // Add geolocation evidence metadata for each uploaded file
        const fileInput = emergencyComplaintForm.querySelector('#emergencyPhotoInput');
        if (fileInput && fileInput.files.length > 0) {
          console.log('📸 Processing uploaded files with geolocation evidence for emergency complaint...');
          
          for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            console.log(`📎 Processing emergency file ${i + 1}:`, file.name);
            
            // Add file to FormData (it will be processed by multer on backend)
            formData.append('evidence', file);
            
            // Add metadata for this file
            const metadata = {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadType: 'emergency',
              timestamp: new Date().toISOString(),
              userLocation: JSON.parse(document.getElementById('emergencyUserLocation').getAttribute('data-location')),
              emergencyType: document.getElementById('emergencyCategory').value
            };
            
            formData.append(`evidenceMetadata_${i}`, JSON.stringify(metadata));
          }
        }

        const token = localStorage.getItem('authToken');
        const response = await fetch(`${BASE_URL}/api/complaints`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          showNotification('success', 'Emergency complaint filed successfully with geolocation evidence! Help is on the way.');
          window.location.hash = '#/my-complaints';
        } else {
          showNotification('error', result.message || 'Failed to file emergency complaint');
        }
        
      } catch (error) {
        console.error('Error filing emergency complaint:', error);
        showNotification('error', 'Failed to file emergency complaint. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  }
}

// Login form listeners
function attachLoginListeners() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      await login(email, password, 'user');
    });
  }

  const policeLoginForm = document.getElementById('policeLoginForm');
  if (policeLoginForm) {
    policeLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      await login(email, password, 'police');
    });
  }
}

// Placeholder functions for missing pages
function renderViewComplaint() {
  return `<div class="container mt-5"><div class="alert alert-info">Complaint details view - Feature coming soon</div></div>`;
}

function renderViewComplaints() {
  return `<div class="container mt-5"><div class="alert alert-info">View all complaints - Feature coming soon</div></div>`;
}

function renderUpdateComplaint() {
  return `<div class="container mt-5"><div class="alert alert-info">Update complaint - Feature coming soon</div></div>`;
}