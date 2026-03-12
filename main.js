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
  enabled: true, // Enable demo mode temporarily for testing
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
  demoComplaints: [
    {
      _id: '69ac022824867e72d1588a62',
      complaintId: 'COMP001',
      title: 'Noise Complaint',
      description: 'Loud music from neighboring apartment after 10 PM',
      category: 'Noise',
      status: 'pending',
      priority: 'medium',
      incidentLocation: 'Apartment 4B, Building A',
      createdAt: new Date('2024-01-15'),
      evidence: []
    },
    {
      _id: '69ac022824867e72d1588a63',
      complaintId: 'COMP002',
      title: 'Theft Report',
      description: 'Bicycle stolen from parking area',
      category: 'Theft',
      status: 'under-investigation',
      priority: 'high',
      incidentLocation: 'Parking Lot B',
      createdAt: new Date('2024-01-16'),
      evidence: []
    },
    {
      _id: '69ad3c490f306cd39e5df71c',
      complaintId: 'COMP003',
      title: 'Cyber Harassment',
      description: 'Receiving threatening messages on social media',
      category: 'cyber-crime',
      status: 'pending',
      priority: 'high',
      incidentLocation: 'Online - Social Media Platform',
      createdAt: new Date('2024-01-17'),
      evidence: []
    }
  ]
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

// Profile page helper functions
function editProfile() {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div class="modal fade" id="editProfileModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-pencil me-2"></i>Edit Profile</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="editProfileForm">
              <div class="mb-3">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" id="editFullName" value="${currentUser.fullName}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-control" id="editEmail" value="${currentUser.email}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Mobile Number</label>
                <input type="tel" class="form-control" id="editMobile" placeholder="Enter mobile number">
              </div>
              <div class="mb-3">
                <label class="form-label">Address</label>
                <textarea class="form-control" id="editAddress" rows="2" placeholder="Enter your address"></textarea>
              </div>
              <div id="editProfileAlert"></div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveProfileChanges()">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  const modalInstance = new bootstrap.Modal(document.getElementById('editProfileModal'));
  modalInstance.show();
  
  // Remove modal from DOM after it's hidden
  document.getElementById('editProfileModal').addEventListener('hidden.bs.modal', function() {
    modal.remove();
  });
}

function changePassword() {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div class="modal fade" id="changePasswordModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-key me-2"></i>Change Password</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="changePasswordForm">
              <div class="mb-3">
                <label class="form-label">Current Password</label>
                <input type="password" class="form-control" id="currentPassword" required>
              </div>
              <div class="mb-3">
                <label class="form-label">New Password</label>
                <input type="password" class="form-control" id="newPassword" required minlength="6">
                <small class="text-muted">Password must be at least 6 characters long</small>
              </div>
              <div class="mb-3">
                <label class="form-label">Confirm New Password</label>
                <input type="password" class="form-control" id="confirmNewPassword" required>
              </div>
              <div id="changePasswordAlert"></div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="savePasswordChanges()">Change Password</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  const modalInstance = new bootstrap.Modal(document.getElementById('changePasswordModal'));
  modalInstance.show();
  
  // Remove modal from DOM after it's hidden
  document.getElementById('changePasswordModal').addEventListener('hidden.bs.modal', function() {
    modal.remove();
  });
}

// Save profile changes
async function saveProfileChanges() {
  const fullName = document.getElementById('editFullName').value;
  const email = document.getElementById('editEmail').value;
  const mobile = document.getElementById('editMobile').value;
  const address = document.getElementById('editAddress').value;
  const alertDiv = document.getElementById('editProfileAlert');

  // Validation
  if (!fullName || !email) {
    alertDiv.innerHTML = '<div class="alert alert-danger">Full name and email are required</div>';
    return;
  }

  if (!isValidEmail(email)) {
    alertDiv.innerHTML = '<div class="alert alert-danger">Please enter a valid email address</div>';
    return;
  }

  try {
    setLoading(true);
    alertDiv.innerHTML = '';

    // Update current user object for demo mode
    if (demoMode.enabled) {
      currentUser.fullName = fullName;
      currentUser.email = email;
      currentUser.mobile = mobile;
      currentUser.address = address;
      
      // Update demo user data
      if (currentUserRole === 'user') {
        demoMode.demoUser.fullName = fullName;
        demoMode.demoUser.email = email;
        demoMode.demoUser.mobile = mobile;
        demoMode.demoUser.address = address;
      } else {
        demoMode.demoPolice.fullName = fullName;
        demoMode.demoPolice.email = email;
        demoMode.demoPolice.mobile = mobile;
        demoMode.demoPolice.address = address;
      }
      
      updateAuthMenu();
      showNotification('success', 'Profile updated successfully!');
      
      // Close modal and refresh profile page
      const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
      modal.hide();
      
      // Refresh profile page if currently on profile
      if (window.location.hash === '#/my-profile') {
        setTimeout(() => loadPage('my-profile'), 500);
      }
      return;
    }

    // API call for production
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fullName, email, mobile, address })
    });

    const result = await response.json();

    if (result.success) {
      currentUser = result.data.user;
      updateAuthMenu();
      showNotification('success', 'Profile updated successfully!');
      
      // Close modal and refresh profile page
      const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
      modal.hide();
      
      if (window.location.hash === '#/my-profile') {
        setTimeout(() => loadPage('my-profile'), 500);
      }
    } else {
      alertDiv.innerHTML = `<div class="alert alert-danger">${result.message || 'Failed to update profile'}</div>`;
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alertDiv.innerHTML = '<div class="alert alert-danger">Error updating profile. Please try again.</div>';
  } finally {
    setLoading(false);
  }
}

// Save password changes
async function savePasswordChanges() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  const alertDiv = document.getElementById('changePasswordAlert');

  // Validation
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    alertDiv.innerHTML = '<div class="alert alert-danger">All password fields are required</div>';
    return;
  }

  if (newPassword.length < 6) {
    alertDiv.innerHTML = '<div class="alert alert-danger">New password must be at least 6 characters long</div>';
    return;
  }

  if (newPassword !== confirmNewPassword) {
    alertDiv.innerHTML = '<div class="alert alert-danger">New passwords do not match</div>';
    return;
  }

  if (currentPassword === newPassword) {
    alertDiv.innerHTML = '<div class="alert alert-danger">New password must be different from current password</div>';
    return;
  }

  try {
    setLoading(true);
    alertDiv.innerHTML = '';

    // Update password for demo mode
    if (demoMode.enabled) {
      // Verify current password (in demo mode, check against demo passwords)
      const demoPassword = currentUserRole === 'police' ? demoMode.demoPolice.password : demoMode.demoUser.password;
      
      if (currentPassword !== demoPassword) {
        alertDiv.innerHTML = '<div class="alert alert-danger">Current password is incorrect</div>';
        return;
      }
      
      // Update demo password
      if (currentUserRole === 'user') {
        demoMode.demoUser.password = newPassword;
      } else {
        demoMode.demoPolice.password = newPassword;
      }
      
      showNotification('success', 'Password changed successfully!');
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
      modal.hide();
      return;
    }

    // API call for production
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const result = await response.json();

    if (result.success) {
      showNotification('success', 'Password changed successfully!');
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
      modal.hide();
    } else {
      alertDiv.innerHTML = `<div class="alert alert-danger">${result.message || 'Failed to change password'}</div>`;
    }
  } catch (error) {
    console.error('Error changing password:', error);
    alertDiv.innerHTML = '<div class="alert alert-danger">Error changing password. Please try again.</div>';
  } finally {
    setLoading(false);
  }
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
    
    // Check if demo mode is enabled and credentials match
    if (demoMode.enabled) {
      console.log('🎭 Demo mode enabled, checking credentials...');
      
      if (role === 'user' && email === demoMode.demoUser.email && password === demoMode.demoUser.password) {
        console.log('✅ Demo user login successful');
        currentUser = demoMode.demoUser;
        currentUserRole = demoMode.demoUser.role;
        localStorage.setItem('authToken', 'demo-token-user');
        updateAuthMenu();
        
        window.location.hash = '#/user-dashboard';
        showNotification('success', 'Demo login successful!');
        return true;
      }
      
      if (role === 'police' && email === demoMode.demoPolice.email && password === demoMode.demoPolice.password) {
        console.log('✅ Demo police login successful');
        currentUser = demoMode.demoPolice;
        currentUserRole = 'police';
        localStorage.setItem('authToken', 'demo-token-police');
        updateAuthMenu();
        
        window.location.hash = '#/police-dashboard';
        showNotification('success', 'Demo login successful!');
        return true;
      }
      
      console.log('❌ Demo credentials not matched');
    }
    
    // Normal API login
    const endpoint = role === 'police' ? '/api/police/login' : '/api/auth/login';
    const data = await apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.success) {
      const userData = role === 'police' ? data.data.police : data.data.user;
      currentUser = userData;
      // For police login, force role to 'police' regardless of database role
      currentUserRole = role === 'police' ? 'police' : userData.role;
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
  'my-profile': renderMyProfile,
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
              <p class="card-text">112</p>
              <small class="text-muted">Available 24/7</small>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title"><i class="bi bi-envelope"></i> Email</h5>
              <p class="card-text">aditya71@observx.gov.in</p>
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
            <input type="email" class="form-control" id="loginEmail" value="" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" id="loginPassword" value="" required>
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
            <input type="email" class="form-control" id="email" value="" placeholder="" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" id="password" value="" required>
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
    
    if (complaints.length === 0) {
      // Show "No Complaints Found" message
      complaintsTbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <div class="text-muted">
              <i class="bi bi-inbox fs-1 d-block mb-2"></i>
              <h5>No Complaints Found</h5>
              <p class="mb-0">You haven't filed any complaints yet. Click the button below to file your first complaint.</p>
              <a href="#/complaint-type-selection" class="btn btn-primary mt-3">
                <i class="bi bi-plus-circle me-2"></i>File a Complaint
              </a>
            </div>
          </td>
        </tr>
      `;
    } else {
      // Show complaints table
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
    }
    
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

function renderMyProfile() {
  if (!currentUser) {
    return `<div class="container mt-5"><div class="alert alert-danger">Please login to view your profile. <a href="#/user-login">Login here</a></div></div>`
  }

  return `
    <div class="container mt-5">
      <div class="row">
        <div class="col-md-8 mx-auto">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h3 class="mb-0"><i class="bi bi-person-circle me-2"></i>My Profile</h3>
            </div>
            <div class="card-body">
              <div class="text-center mb-4">
                <div class="profile-avatar">
                  <i class="bi bi-person-circle" style="font-size: 80px; color: #0d6efd;"></i>
                </div>
                <h4 class="mt-3">${currentUser.fullName}</h4>
                <span class="badge bg-${currentUserRole === 'police' ? 'danger' : 'primary'} fs-6">
                  ${currentUserRole === 'police' ? 'Police Officer' : 'Citizen'}
                </span>
              </div>
              
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label text-muted">Email Address</label>
                    <p class="form-control-plaintext fw-semibold">${currentUser.email}</p>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label text-muted">Account Type</label>
                    <p class="form-control-plaintext fw-semibold">
                      ${currentUserRole === 'police' ? 'Police Officer' : 'Citizen User'}
                    </p>
                  </div>
                </div>
              </div>
              
              ${currentUserRole === 'police' && currentUser.badgeNumber ? `
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label text-muted">Badge Number</label>
                    <p class="form-control-plaintext fw-semibold">${currentUser.badgeNumber}</p>
                  </div>
                </div>
              </div>
              ` : ''}
              
              <div class="row">
                <div class="col-12">
                  <div class="mb-3">
                    <label class="form-label text-muted">Account Status</label>
                    <p class="form-control-plaintext">
                      <span class="badge bg-success">Active</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <hr>
              
              <div class="d-flex justify-content-between">
                <div>
                  <button class="btn btn-outline-primary" onclick="editProfile()">
                    <i class="bi bi-pencil me-2"></i>Edit Profile
                  </button>
                  <button class="btn btn-outline-secondary ms-2" onclick="changePassword()">
                    <i class="bi bi-key me-2"></i>Change Password
                  </button>
                </div>
                <button class="btn btn-outline-danger" onclick="logout()">
                  <i class="bi bi-box-arrow-right me-2"></i>Logout
                </button>
              </div>
            </div>
          </div>
          
          <div class="card mt-4">
            <div class="card-header">
              <h5 class="mb-0"><i class="bi bi-shield-check me-2"></i>Security Information</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p class="text-muted"><small>Last Login: Today</small></p>
                </div>
                <div class="col-md-6">
                  <p class="text-muted"><small>Account created: Recently</small></p>
                </div>
              </div>
              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Security Tip:</strong> Always keep your password secure and never share your login credentials with anyone.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderPoliceDashboard() {
  console.log('🚔 Police Dashboard Render Called');
  console.log('- Current User:', currentUser);
  console.log('- Current Role:', currentUserRole);
  console.log('- Is Police:', currentUserRole === 'police');
  
  if (!currentUser || currentUserRole !== 'police') {
    console.log('❌ Police Dashboard: Unauthorized');
    return `<div class="container mt-5"><div class="alert alert-danger">Unauthorized access. <a href="#/police-login">Login here</a></div></div>`
  }

  console.log('✅ Police Dashboard: Authorized, rendering...');
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
                  <h5 class="card-title text-primary" id="totalComplaintsCount">0</h5>
                  <p class="card-text">Total Complaints</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h5 class="card-title text-danger" id="emergencyComplaintsCount">0</h5>
                  <p class="card-text">Emergency</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h5 class="card-title text-warning" id="pendingComplaintsCount">0</h5>
                  <p class="card-text">Pending</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h5 class="card-title text-info" id="investigationComplaintsCount">0</h5>
                  <p class="card-text">Under Investigation</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="bi bi-list-check"></i> All Complaints</h5>
              <button class="btn btn-sm btn-success" onclick="loadPoliceDashboardData()">
                <i class="bi bi-arrow-clockwise"></i> Refresh
              </button>
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
                  <tbody id="policeComplaintsTableBody">
                    <tr>
                      <td colspan="8" class="text-center">
                        <div class="spinner-border text-primary" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2">Loading complaints...</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      // Load police dashboard data when page loads
      setTimeout(() => loadPoliceDashboardData(), 100);
    </script>
  `
}

// Load police dashboard data from MongoDB
async function loadPoliceDashboardData() {
  console.log('📊 Loading Police Dashboard Data...');
  try {
    const token = localStorage.getItem('authToken');
    console.log('- Token exists:', !!token);
    
    if (!token) {
      console.error('❌ No auth token found for police dashboard');
      return;
    }

    // Load all complaints (police can see all complaints)
    console.log('- Fetching from:', `${BASE_URL}/api/complaints/all`);
    const response = await fetch(`${BASE_URL}/api/complaints/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('- Response status:', response.status);
    console.log('- Response ok:', response.ok);

    if (response.ok) {
      const result = await response.json();
      console.log('- API Response:', result);
      
      if (result.success && result.data && result.data.complaints) {
        const complaints = result.data.complaints;
        console.log(`✅ Found ${complaints.length} complaints`);
        
        // Update statistics
        const totalCount = complaints.length;
        const emergencyCount = complaints.filter(c => c.priority === 'emergency').length;
        const pendingCount = complaints.filter(c => c.status === 'pending').length;
        const investigationCount = complaints.filter(c => c.status === 'under-investigation').length;
        
        console.log('- Statistics:', { totalCount, emergencyCount, pendingCount, investigationCount });
        
        document.getElementById('totalComplaintsCount').textContent = totalCount;
        document.getElementById('emergencyComplaintsCount').textContent = emergencyCount;
        document.getElementById('pendingComplaintsCount').textContent = pendingCount;
        document.getElementById('investigationComplaintsCount').textContent = investigationCount;
        
        // Render complaints table
        renderPoliceComplaintsTable(complaints);
        
        console.log(`✅ Police dashboard loaded: ${totalCount} complaints`);
      } else {
        console.error('❌ Failed to load police dashboard data:', result.message);
        showEmptyState();
      }
    } else {
      console.error('❌ Failed to fetch police dashboard data');
      showEmptyState();
    }
  } catch (error) {
    console.error('❌ Error loading police dashboard:', error);
    showEmptyState();
  }
}

// Render police complaints table
function renderPoliceComplaintsTable(complaints) {
  const tableBody = document.getElementById('policeComplaintsTableBody');
  
  if (!tableBody) return;
  
  if (complaints.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted">
          <i class="bi bi-inbox display-4 d-block mb-3"></i>
          <p>No complaints found</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = complaints.map(complaint => `
    <tr>
      <td><span class="badge bg-secondary">${complaint.complaintId || complaint._id}</span></td>
      <td>${complaint.title}</td>
      <td>${complaint.category}</td>
      <td><span class="badge bg-${getPriorityColor(complaint.priority)}">${complaint.priority}</span></td>
      <td><span class="badge bg-${getStatusColor(complaint.status)}">${complaint.status.replace(/_/g, ' ')}</span></td>
      <td>${complaint.userId || 'Unknown'}</td>
      <td>${new Date(complaint.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="viewComplaint('${complaint._id}')" title="View Details">
          <i class="bi bi-eye"></i> View
        </button>
        <button class="btn btn-sm btn-outline-success" onclick="updatePoliceComplaint('${complaint._id}', '${complaint.status}')" title="Update Status">
          <i class="bi bi-pencil"></i> Update
        </button>
        ${complaint.feedback ? `
          <button class="btn btn-sm btn-outline-info" onclick="viewFeedback('${complaint._id}')" title="View Feedback">
            <i class="bi bi-star"></i> Feedback
          </button>
        ` : `
          <button class="btn btn-sm btn-outline-secondary" onclick="viewFeedback('${complaint._id}')" title="View Feedback (Test)">
            <i class="bi bi-star"></i> Feedback
          </button>
        `}
      </td>
    </tr>
  `).join('');
}

// Fill Feedback (User function)
function fillFeedback(complaintId) {
  console.log(`🌟 Fill Feedback Called with ID: ${complaintId}`);
  console.log('- Current User Role:', currentUserRole);
  console.log('- Checking if feedback button should show...');
  
  try {
    // Create feedback modal
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Provide Feedback</h5>
              <button type="button" class="btn-close" onclick="closeFeedbackModal()"></button>
            </div>
            <div class="modal-body">
              <form id="feedbackForm">
                <div class="mb-4">
                  <label class="form-label">⭐ Rate Your Experience ⭐</label>
                  <div class="d-flex justify-content-center gap-2" style="max-width: 500px; margin: 0 auto;">
                    <input type="radio" class="btn-check" name="rating" id="rating1" value="1">
                    <label class="btn btn-outline-warning star-single" for="rating1">★</label>
                    
                    <input type="radio" class="btn-check" name="rating" id="rating2" value="2">
                    <label class="btn btn-outline-warning star-single" for="rating2">★</label>
                    
                    <input type="radio" class="btn-check" name="rating" id="rating3" value="3" checked>
                    <label class="btn btn-outline-warning star-single" for="rating3">★</label>
                    
                    <input type="radio" class="btn-check" name="rating" id="rating4" value="4">
                    <label class="btn btn-outline-warning star-single" for="rating4">★</label>
                    
                    <input type="radio" class="btn-check" name="rating" id="rating5" value="5">
                    <label class="btn btn-outline-warning star-single" for="rating5">★</label>
                  </div>
                  <small class="text-muted d-block text-center mt-2">Click to select your rating (1-5 stars)</small>
                </div>
                <div class="mb-3">
                  <label class="form-label">Feedback Comments</label>
                  <textarea class="form-control" id="feedbackComments" rows="4" placeholder="Please share your experience with the complaint resolution process... (Optional)"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Would you recommend this service?</label>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="recommend" id="recommendYes" value="yes" checked>
                    <label class="form-check-label" for="recommendYes">Yes</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="recommend" id="recommendNo" value="no">
                    <label class="form-check-label" for="recommendNo">No</label>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeFeedbackModal()">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="submitFeedback('${complaintId}')">Submit Feedback</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    window.currentComplaintId = complaintId;
    
  } catch (error) {
    console.error('Error opening feedback modal:', error);
    showNotification('error', 'Failed to open feedback form');
  }
}

// Close feedback modal
function closeFeedbackModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
  }
}

// Submit feedback
async function submitFeedback(complaintId) {
  try {
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const comments = document.getElementById('feedbackComments').value;
    const recommend = document.querySelector('input[name="recommend"]:checked')?.value;
    
    if (!rating) {
      showNotification('error', 'Please provide a rating');
      return;
    }
    
    setLoading(true);
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BASE_URL}/api/complaints/${complaintId}/feedback`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating: parseInt(rating),
        comments: comments,
        recommend: recommend === 'yes',
        submittedAt: new Date().toISOString()
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('success', 'Feedback submitted successfully!');
      closeFeedbackModal();
      // Reload complaints data
      setTimeout(() => loadMyComplaintsDataAndRender(), 500);
    } else {
      showNotification('error', result.message || 'Failed to submit feedback');
    }
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showNotification('error', 'Error submitting feedback');
  } finally {
    setLoading(false);
  }
}

// View Feedback (Police function)
function viewFeedback(complaintId) {
  try {
    // Get complaint details to show feedback
    const token = localStorage.getItem('authToken');
    
    fetch(`${BASE_URL}/api/complaints/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(result => {
      if (result.success && result.data && result.data.complaints) {
        const complaint = result.data.complaints.find(c => c._id === complaintId);
        
        if (complaint && complaint.feedback) {
          showFeedbackModal(complaint);
        } else {
          showNotification('info', 'No feedback available for this complaint');
        }
      }
    })
    .catch(error => {
      console.error('Error loading feedback:', error);
      showNotification('error', 'Failed to load feedback');
    });
    
  } catch (error) {
    console.error('Error viewing feedback:', error);
    showNotification('error', 'Failed to view feedback');
  }
}

// Show feedback modal (Police)
function showFeedbackModal(complaint) {
  const feedback = complaint.feedback;
  const stars = '⭐'.repeat(feedback.rating);
  
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Complaint Feedback</h5>
            <button type="button" class="btn-close" onclick="closeFeedbackModal()"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <h6>Complaint Details</h6>
              <p><strong>ID:</strong> ${complaint.complaintId || complaint._id}</p>
              <p><strong>Title:</strong> ${complaint.title}</p>
              <p><strong>Status:</strong> <span class="badge bg-success">${complaint.status}</span></p>
            </div>
            <div class="mb-3">
              <h6>User Feedback</h6>
              <div class="mb-2">
                <strong>Rating:</strong> ${stars} (${feedback.rating}/5)
              </div>
              <div class="mb-2">
                <strong>Comments:</strong>
                <p class="mt-1">${feedback.comments}</p>
              </div>
              <div class="mb-2">
                <strong>Would Recommend:</strong> ${feedback.recommend ? '✅ Yes' : '❌ No'}
              </div>
              <div class="mb-2">
                <strong>Submitted:</strong> ${new Date(feedback.submittedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeFeedbackModal()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Update complaint status (Police function)
function updatePoliceComplaint(complaintId, currentStatus) {
  try {
    // Create status update modal
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Update Complaint Status</h5>
              <button type="button" class="btn-close" onclick="closeStatusModal()"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Current Status: <span class="badge bg-${getStatusColor(currentStatus)}">${currentStatus.replace(/_/g, ' ')}</span></label>
              </div>
              <div class="mb-3">
                <label class="form-label">New Status</label>
                <select class="form-select" id="newStatus">
                  <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="under-investigation" ${currentStatus === 'under-investigation' ? 'selected' : ''}>Under Investigation</option>
                  <option value="resolved" ${currentStatus === 'resolved' ? 'selected' : ''}>Resolved</option>
                  <option value="rejected" ${currentStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Notes (Optional)</label>
                <textarea class="form-control" id="statusNotes" rows="3" placeholder="Add any notes about this status update..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeStatusModal()">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="saveStatusUpdate('${complaintId}')">Update Status</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    window.currentComplaintId = complaintId;
    
  } catch (error) {
    console.error('Error opening status update modal:', error);
    showNotification('error', 'Failed to open status update');
  }
}

// Close status modal
function closeStatusModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
  }
}

// Save status update
async function saveStatusUpdate(complaintId) {
  try {
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('statusNotes').value;
    
    if (!newStatus) {
      showNotification('error', 'Please select a status');
      return;
    }
    
    setLoading(true);
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BASE_URL}/api/complaints/${complaintId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus,
        policeNotes: notes,
        updatedAt: new Date().toISOString()
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('success', 'Complaint status updated successfully!');
      closeStatusModal();
      // Reload dashboard data
      setTimeout(() => loadPoliceDashboardData(), 500);
    } else {
      showNotification('error', result.message || 'Failed to update status');
    }
    
  } catch (error) {
    console.error('Error updating complaint status:', error);
    showNotification('error', 'Error updating complaint status');
  } finally {
    setLoading(false);
  }
}

// Show empty state for police dashboard
function showEmptyState() {
  const tableBody = document.getElementById('policeComplaintsTableBody');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted">
          <i class="bi bi-inbox display-4 d-block mb-3"></i>
          <p>No complaints found</p>
        </td>
      </tr>
    `;
  }
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
                  ${complaint.status === 'resolved' ? `
                    <button class="btn btn-outline-success btn-sm" onclick="fillFeedback('${complaint._id}')" title="Give Feedback">
                      <i class="bi bi-star"></i> Feedback
                    </button>
                  ` : `
                    <button class="btn btn-outline-success btn-sm" onclick="fillFeedback('${complaint._id}')" title="Give Feedback (Test)">
                      <i class="bi bi-star"></i> Feedback
                    </button>
                  `}
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
  try {
    console.log('📥 Downloading complaint:', complaintId);
    
    // For demo mode, use demo complaints
    if (demoMode.enabled) {
      console.log('🎭 Demo mode: Using demo complaints for download');
      const complaint = demoMode.demoComplaints.find(c => c._id === complaintId || c.complaintId === complaintId);
      
      if (complaint) {
        console.log('✅ Demo complaint found for download:', complaint);
        
        // Create a formatted report
        const reportContent = `
COMPLAINT REPORT
================

Complaint ID: ${complaint.complaintId || complaint._id}
Date Filed: ${new Date(complaint.createdAt).toLocaleDateString()}
Status: ${complaint.status.replace(/_/g, ' ')}
Priority: ${complaint.priority}
Category: ${complaint.category}

TITLE:
${complaint.title}

DESCRIPTION:
${complaint.description}

INCIDENT LOCATION:
${complaint.incidentLocation || 'Not specified'}

EVIDENCE FILES:
${complaint.evidence && complaint.evidence.length > 0 
  ? complaint.evidence.map((file, index) => `${index + 1}. ${file.originalname || file.filename || 'Evidence ' + (index + 1)}`).join('\n')
  : 'No evidence files attached'
}

Generated on: ${new Date().toLocaleDateString()}
Generated by: ObservX System
        `;
        
        // Create and download the report
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Complaint_Report_${complaint.complaintId || complaint._id}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('success', 'Complaint report downloaded successfully!');
        return;
      }
    }
    
    const token = localStorage.getItem('authToken');
    
    // Get complaint details first
    fetch(`${BASE_URL}/api/complaints/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(result => {
      if (result.success && result.data && result.data.complaints) {
        const complaint = result.data.complaints.find(c => c._id === complaintId || c.complaintId === complaintId);
        
        if (complaint) {
          // Create a formatted report
          const reportContent = `
COMPLAINT REPORT
================

Complaint ID: ${complaint.complaintId || complaint._id}
Date Filed: ${new Date(complaint.createdAt).toLocaleDateString()}
Status: ${complaint.status.replace(/_/g, ' ')}
Priority: ${complaint.priority}
Category: ${complaint.category}

TITLE:
${complaint.title}

DESCRIPTION:
${complaint.description}

INCIDENT LOCATION:
${complaint.incidentLocation || 'Not specified'}

EVIDENCE FILES:
${complaint.evidence && complaint.evidence.length > 0 
  ? complaint.evidence.map((file, index) => `${index + 1}. ${file.originalname || file.filename || 'Evidence ' + (index + 1)}`).join('\n')
  : 'No evidence files attached'
}

Generated on: ${new Date().toLocaleDateString()}
Generated by: ObservX System
          `;
          
          // Create and download the report
          const blob = new Blob([reportContent], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Complaint_Report_${complaint.complaintId || complaint._id}.txt`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          showNotification('success', 'Complaint report downloaded successfully!');
        } else {
          showNotification('error', 'Complaint not found');
        }
      } else {
        showNotification('error', 'Failed to load complaint details');
      }
    })
    .catch(error => {
      console.error('Error downloading complaint:', error);
      showNotification('error', 'Error downloading complaint report');
    });
    
  } catch (error) {
    console.error('Error in downloadComplaint:', error);
    showNotification('error', 'Error downloading complaint report');
  }
}

function editComplaint(complaintId) {
  try {
    console.log('✏️ Editing complaint:', complaintId);
    
    // For demo mode, use demo complaints
    if (demoMode.enabled) {
      console.log('🎭 Demo mode: Using demo complaints for edit');
      const complaint = demoMode.demoComplaints.find(c => c._id === complaintId || c.complaintId === complaintId);
      
      if (complaint) {
        console.log('✅ Demo complaint found for edit:', complaint);
        
        if (complaint.status !== 'pending') {
          showNotification('warning', 'Only pending complaints can be edited', 4000);
          return;
        }
        
        // Store complaint data for editing
        localStorage.setItem('editComplaintData', JSON.stringify(complaint));
        
        // Redirect to edit page
        window.location.hash = `#/update-complaint?id=${complaintId}`;
        return;
      }
    }
    
    const token = localStorage.getItem('authToken');
    
    // Get complaint details first
    fetch(`${BASE_URL}/api/complaints/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(result => {
      if (result.success && result.data && result.data.complaints) {
        const complaint = result.data.complaints.find(c => c._id === complaintId || c.complaintId === complaintId);
        
        if (complaint) {
          if (complaint.status !== 'pending') {
            showNotification('warning', 'Only pending complaints can be edited', 4000);
            return;
          }
          
          // Store complaint data for editing
          localStorage.setItem('editComplaintData', JSON.stringify(complaint));
          
          // Redirect to edit page
          window.location.hash = `#/update-complaint?id=${complaintId}`;
        } else {
          showNotification('error', 'Complaint not found');
        }
      } else {
        showNotification('error', 'Failed to load complaint details');
      }
    })
    .catch(error => {
      console.error('Error loading complaint for edit:', error);
      showNotification('error', 'Error loading complaint for editing');
    });
    
  } catch (error) {
    console.error('Error in editComplaint:', error);
    showNotification('error', 'Error loading complaint for editing');
  }
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

// Load complaint details from API
async function loadComplaintDetail(complaintId) {
  try {
    console.log('🔍 loadComplaintDetail called with ID:', complaintId);
    
    const token = localStorage.getItem('authToken');
    console.log('🔍 Token check:', {
      exists: !!token,
      length: token ? token.length : 0,
      startsWithBearer: token ? token.startsWith('Bearer ') : false
    });
    
    if (!token) {
      document.getElementById('complaintDetailContent').innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Please login to view complaint details
        </div>
      `;
      return;
    }

    // Use different endpoint for police vs user
    const endpoint = currentUserRole === 'police' ? '/api/complaints/all' : '/api/complaints/user';
    console.log(`🔍 Loading complaint details from: ${BASE_URL}${endpoint}`);
    console.log('🔍 Current user role:', currentUserRole);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🔍 API Response status:', response.status);
    console.log('🔍 API Response ok:', response.ok);

    const result = await response.json();
    console.log('📋 Complaint details response:', result);
    
    if (result.success && result.data && result.data.complaints) {
      console.log('🔍 Available complaints:', result.data.complaints.map(c => ({ 
        _id: c._id, 
        complaintId: c.complaintId, 
        title: c.title 
      })));
      
      const complaint = result.data.complaints.find(c => c._id === complaintId || c.complaintId === complaintId);
      
      console.log('🔍 Looking for complaint with ID:', complaintId);
      console.log('🔍 Found complaint:', complaint);
      
      if (complaint) {
        console.log('✅ Complaint found:', complaint);
        // Hide loading spinner
        const loadingElement = document.querySelector('#complaintDetailContent .spinner-border');
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }
        const loadingText = document.querySelector('#complaintDetailContent p');
        if (loadingText) {
          loadingText.style.display = 'none';
        }
        displayComplaintDetail(complaint);
      } else {
        console.log('❌ Complaint not found');
        document.getElementById('complaintDetailContent').innerHTML = `
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Complaint not found
            <br><small>Looking for ID: ${complaintId}</small>
          </div>
        `;
      }
    } else {
      console.log('❌ Failed to load complaint details:', result.message);
      console.log('❌ Full result object:', result);
      document.getElementById('complaintDetailContent').innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Failed to load complaint details: ${result.message || 'Unknown error'}
        </div>
      `;
    }
  } catch (error) {
    console.error('❌ Error loading complaint detail:', error);
    console.error('❌ Error stack:', error.stack);
    document.getElementById('complaintDetailContent').innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Error loading complaint details. Please try again.
        <br><small>Details: ${error.message}</small>
      </div>
    `;
  }
}

// Display complaint details in the UI
function displayComplaintDetail(complaint) {
  console.log('🎨 displayComplaintDetail called with:', complaint);
  
  const statusColor = getStatusColor(complaint.status);
  const priorityColor = getPriorityColor(complaint.priority);
  
  console.log('🎨 Status color:', statusColor, 'Priority color:', priorityColor);
  
  const detailHTML = `
    <div class="complaint-detail-content">
      <!-- Status and Priority -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="detail-item">
            <label class="detail-label">Status</label>
            <span class="badge bg-${statusColor} fs-6">${complaint.status.replace(/_/g, ' ')}</span>
          </div>
        </div>
        <div class="col-md-6">
          <div class="detail-item">
            <label class="detail-label">Priority</label>
            <span class="badge bg-${priorityColor} fs-6">${complaint.priority}</span>
          </div>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="detail-section">
        <h5><i class="bi bi-info-circle me-2"></i>Basic Information</h5>
        <div class="row">
          <div class="col-md-6">
            <div class="detail-item">
              <label class="detail-label">Complaint ID</label>
              <p class="detail-value">${complaint.complaintId || complaint._id}</p>
            </div>
          </div>
          <div class="col-md-6">
            <div class="detail-item">
              <label class="detail-label">Date Filed</label>
              <p class="detail-value">${new Date(complaint.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <div class="detail-item">
              <label class="detail-label">Title</label>
              <p class="detail-value">${complaint.title}</p>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <div class="detail-item">
              <label class="detail-label">Description</label>
              <p class="detail-value">${complaint.description}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Location Information -->
      <div class="detail-section">
        <h5><i class="bi bi-geo-alt me-2"></i>Location Information</h5>
        <div class="row">
          <div class="col-md-6">
            <div class="detail-item">
              <label class="detail-label">Incident Location</label>
              <p class="detail-value">${complaint.incidentLocation || 'Not specified'}</p>
            </div>
          </div>
          <div class="col-md-6">
            <div class="detail-item">
              <label class="detail-label">Category</label>
              <p class="detail-value">${complaint.category}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Evidence Files -->
      ${complaint.evidence && complaint.evidence.length > 0 ? `
        <div class="detail-section">
          <h5><i class="bi bi-paperclip me-2"></i>Evidence Files</h5>
          <div class="evidence-list">
            ${complaint.evidence.map((file, index) => `
              <div class="evidence-item">
                <i class="bi bi-file-earmark me-2"></i>
                <span>${file.originalname || file.filename || `Evidence ${index + 1}`}</span>
                <button class="btn btn-sm btn-outline-primary ms-2" onclick="downloadEvidence('${complaint._id}', '${file.filename || file.originalname}')">
                  <i class="bi bi-download"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Action Buttons -->
      <div class="detail-actions mt-4">
        <button class="btn btn-primary" onclick="downloadComplaint('${complaint._id}')">
          <i class="bi bi-download me-2"></i>Download Full Report
        </button>
        ${complaint.status === 'pending' ? `
          <button class="btn btn-warning" onclick="editComplaint('${complaint._id}')">
            <i class="bi bi-pencil me-2"></i>Edit Complaint
          </button>
        ` : ''}
        <button class="btn btn-danger" onclick="deleteComplaint('${complaint._id}', '${complaint.title}')">
          <i class="bi bi-trash me-2"></i>Delete Complaint
        </button>
        <a href="#/my-complaints" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-2"></i>Back to List
        </a>
      </div>
    </div>

    <style>
      .detail-section {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      }
      
      .detail-section h5 {
        color: #495057;
        margin-bottom: 1rem;
        font-weight: 600;
      }
      
      .detail-item {
        margin-bottom: 1rem;
      }
      
      .detail-label {
        font-weight: 600;
        color: #6c757d;
        display: block;
        margin-bottom: 0.5rem;
      }
      
      .detail-value {
        margin: 0;
        color: #212529;
        line-height: 1.5;
      }
      
      .evidence-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .evidence-item {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        background: white;
        border-radius: 6px;
        border: 1px solid #dee2e6;
      }
      
      .detail-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
    </style>
  `;
  
  console.log('🎨 Setting HTML to complaintDetailContent');
  const element = document.getElementById('complaintDetailContent');
  if (element) {
    element.innerHTML = detailHTML;
    console.log('✅ HTML set successfully');
  } else {
    console.error('❌ complaintDetailContent element not found!');
  }
}

// Download evidence file
async function downloadEvidence(complaintId, filename) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BASE_URL}/api/complaints/evidence/${complaintId}/${filename}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showNotification('success', 'Evidence file downloaded successfully!');
    } else {
      showNotification('error', 'Failed to download evidence file');
    }
  } catch (error) {
    console.error('Error downloading evidence:', error);
    showNotification('error', 'Error downloading evidence file');
  }
}

// Delete complaint function
async function deleteComplaint(complaintId, complaintTitle) {
  try {
    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to delete this complaint?\n\n` +
      `Title: ${complaintTitle}\n` +
      `ID: ${complaintId}\n\n` +
      `This action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }
    
    console.log('🗑️ Deleting complaint:', complaintId);
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BASE_URL}/api/complaints/${complaintId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('success', 'Complaint deleted successfully!');
      // Redirect back to complaints list
      window.location.hash = '#/my-complaints';
    } else {
      showNotification('error', result.message || 'Failed to delete complaint');
    }
    
  } catch (error) {
    console.error('Error deleting complaint:', error);
    showNotification('error', 'Error deleting complaint. Please try again.');
  }
}

// Placeholder functions for missing pages
function renderViewComplaint() {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const complaintId = urlParams.get('id');
  
  if (!complaintId) {
    return `<div class="container mt-5"><div class="alert alert-danger">Complaint ID not found</div></div>`;
  }

  // For demo mode, directly show complaint details without loading
  if (demoMode.enabled) {
    const complaint = demoMode.demoComplaints.find(c => c._id === complaintId || c.complaintId === complaintId);
    
    if (complaint) {
      console.log('🎭 Directly rendering demo complaint:', complaint);
      return renderComplaintDetailDirect(complaint);
    }
  }

  return `
    <div class="container mt-4">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="complaint-detail-card">
            <div class="card-header">
              <h3><i class="bi bi-file-text me-2"></i>Complaint Details</h3>
              <div class="back-btn">
                <a href="#/my-complaints" class="btn btn-outline-secondary">
                  <i class="bi bi-arrow-left"></i> Back to My Complaints
                </a>
              </div>
            </div>
            <div class="card-body" id="complaintDetailContent">
              <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading complaint details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .complaint-detail-card {
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border-radius: 10px;
        overflow: hidden;
      }
      
      .card-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .card-header h3 {
        margin: 0;
      }
      
      .back-btn a {
        color: white;
        border-color: white;
      }
      
      .back-btn a:hover {
        background: rgba(255,255,255,0.1);
      }
    </style>

    <script>
      // Load complaint details when page loads
      setTimeout(() => loadComplaintDetail('${complaintId}'), 100);
    </script>
  `;
}

// Direct render complaint details without loading
function renderComplaintDetailDirect(complaint) {
  const statusColor = getStatusColor(complaint.status);
  const priorityColor = getPriorityColor(complaint.priority);
  
  return `
    <div class="container mt-4">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="complaint-detail-card">
            <div class="card-header">
              <h3><i class="bi bi-file-text me-2"></i>Complaint Details</h3>
              <div class="back-btn">
                <a href="#/my-complaints" class="btn btn-outline-secondary">
                  <i class="bi bi-arrow-left"></i> Back to My Complaints
                </a>
              </div>
            </div>
            <div class="card-body">
              <div class="complaint-detail-content">
                <!-- Status and Priority -->
                <div class="row mb-4">
                  <div class="col-md-6">
                    <div class="detail-item">
                      <label class="detail-label">Status</label>
                      <span class="badge bg-${statusColor} fs-6">${complaint.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="detail-item">
                      <label class="detail-label">Priority</label>
                      <span class="badge bg-${priorityColor} fs-6">${complaint.priority}</span>
                    </div>
                  </div>
                </div>

                <!-- Basic Information -->
                <div class="detail-section">
                  <h5><i class="bi bi-info-circle me-2"></i>Basic Information</h5>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="detail-item">
                        <label class="detail-label">Complaint ID</label>
                        <p class="detail-value">${complaint.complaintId || complaint._id}</p>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="detail-item">
                        <label class="detail-label">Date Filed</label>
                        <p class="detail-value">${new Date(complaint.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-12">
                      <div class="detail-item">
                        <label class="detail-label">Title</label>
                        <p class="detail-value">${complaint.title}</p>
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-12">
                      <div class="detail-item">
                        <label class="detail-label">Description</label>
                        <p class="detail-value">${complaint.description}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Location Information -->
                <div class="detail-section">
                  <h5><i class="bi bi-geo-alt me-2"></i>Location Information</h5>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="detail-item">
                        <label class="detail-label">Incident Location</label>
                        <p class="detail-value">${complaint.incidentLocation || 'Not specified'}</p>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="detail-item">
                        <label class="detail-label">Category</label>
                        <p class="detail-value">${complaint.category}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="detail-actions mt-4">
                  <button class="btn btn-primary" onclick="downloadComplaint('${complaint._id}')">
                    <i class="bi bi-download me-2"></i>Download Full Report
                  </button>
                  ${complaint.status === 'pending' ? `
                    <button class="btn btn-warning" onclick="editComplaint('${complaint._id}')">
                      <i class="bi bi-pencil me-2"></i>Edit Complaint
                    </button>
                  ` : ''}
                  <a href="#/my-complaints" class="btn btn-outline-secondary">
                    <i class="bi bi-arrow-left me-2"></i>Back to List
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .complaint-detail-card {
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border-radius: 10px;
        overflow: hidden;
      }
      
      .card-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .card-header h3 {
        margin: 0;
      }
      
      .back-btn a {
        color: white;
        border-color: white;
      }
      
      .back-btn a:hover {
        background: rgba(255,255,255,0.1);
      }
      
      .detail-section {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      }
      
      .detail-section h5 {
        color: #495057;
        margin-bottom: 1rem;
        font-weight: 600;
      }
      
      .detail-item {
        margin-bottom: 1rem;
      }
      
      .detail-label {
        font-weight: 600;
        color: #6c757d;
        display: block;
        margin-bottom: 0.5rem;
      }
      
      .detail-value {
        margin: 0;
        color: #212529;
        line-height: 1.5;
      }
      
      .detail-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
    </style>
  `;
}

function renderViewComplaints() {
  return `<div class="container mt-5"><div class="alert alert-info">View all complaints - Feature coming soon</div></div>`;
}

function renderUpdateComplaint() {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const complaintId = urlParams.get('id');
  
  if (!complaintId) {
    return `<div class="container mt-5"><div class="alert alert-danger">Complaint ID not provided</div></div>`;
  }

  // This is a placeholder - in a real app, you'd fetch the complaint data
  return `<div class="container mt-5"><div class="alert alert-info">Update complaint ${complaintId} - Feature coming soon</div></div>`;
  const editData = localStorage.getItem('editComplaintData');
  const complaint = editData ? JSON.parse(editData) : null;

  if (!complaint || complaint._id !== complaintId) {
    return `<div class="container mt-5"><div class="alert alert-danger">Complaint data not found</div></div>`;
  }

  if (complaint.status !== 'pending') {
    return `<div class="container mt-5"><div class="alert alert-warning">Only pending complaints can be edited</div></div>`;
  }

  return `
    <div class="container mt-4">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="form-section">
            <h2><i class="bi bi-pencil-square me-2"></i>Edit Complaint</h2>
            <div class="alert alert-info">
              <strong>Editing Complaint ID:</strong> ${complaint.complaintId || complaint._id}
            </div>
            
            <form id="updateComplaintForm">
              <div class="mb-3">
                <label class="form-label">Title <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="updateTitle" value="${complaint.title}" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Category <span class="text-danger">*</span></label>
                <select class="form-select" id="updateCategory" required>
                  <option value="theft" ${complaint.category === 'theft' ? 'selected' : ''}>Theft</option>
                  <option value="harassment" ${complaint.category === 'harassment' ? 'selected' : ''}>Harassment</option>
                  <option value="violence" ${complaint.category === 'violence' ? 'selected' : ''}>Violence</option>
                  <option value="fraud" ${complaint.category === 'fraud' ? 'selected' : ''}>Fraud</option>
                  <option value="cyber-crime" ${complaint.category === 'cyber-crime' ? 'selected' : ''}>Cyber Crime</option>
                  <option value="other" ${complaint.category === 'other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Priority <span class="text-danger">*</span></label>
                <select class="form-select" id="updatePriority" required>
                  <option value="low" ${complaint.priority === 'low' ? 'selected' : ''}>Low</option>
                  <option value="medium" ${complaint.priority === 'medium' ? 'selected' : ''}>Medium</option>
                  <option value="high" ${complaint.priority === 'high' ? 'selected' : ''}>High</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Incident Date <span class="text-danger">*</span></label>
                <input type="datetime-local" class="form-control" id="updateIncidentDate" value="${complaint.incidentDate ? new Date(complaint.incidentDate).toISOString().slice(0, 16) : ''}" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Incident Location <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="updateIncidentLocation" value="${complaint.incidentLocation || ''}" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Description <span class="text-danger">*</span></label>
                <textarea class="form-control" id="updateDescription" rows="4" required>${complaint.description}</textarea>
              </div>
              
              <div id="updateComplaintAlert"></div>
              
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary">
                  <i class="bi bi-check-circle me-2"></i>Update Complaint
                </button>
                <a href="#/view-complaint?id=${complaintId}" class="btn btn-outline-secondary">
                  <i class="bi bi-x-circle me-2"></i>Cancel
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <script>
      // Attach form listener when page loads
      setTimeout(() => attachUpdateFormListener('${complaintId}'), 100);
    </script>
  `;
}

// Attach update form listener
function attachUpdateFormListener(complaintId) {
  const form = document.getElementById('updateComplaintForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        title: document.getElementById('updateTitle').value,
        category: document.getElementById('updateCategory').value,
        priority: document.getElementById('updatePriority').value,
        incidentDate: document.getElementById('updateIncidentDate').value,
        incidentLocation: document.getElementById('updateIncidentLocation').value,
        description: document.getElementById('updateDescription').value
      };

      try {
        setLoading(true);
        
        // For demo mode, simulate successful update
        if (demoMode.enabled) {
          console.log('🎭 Demo mode: Simulating complaint update');
          console.log('📝 Updated data:', formData);
          
          // Update the demo complaint in memory
          const complaintIndex = demoMode.demoComplaints.findIndex(c => c._id === complaintId || c.complaintId === complaintId);
          if (complaintIndex !== -1) {
            demoMode.demoComplaints[complaintIndex] = {
              ...demoMode.demoComplaints[complaintIndex],
              ...formData
            };
            console.log('✅ Demo complaint updated successfully');
          }
          
          showNotification('success', 'Complaint updated successfully!');
          localStorage.removeItem('editComplaintData'); // Clear stored data
          window.location.hash = `#/view-complaint?id=${complaintId}`;
          return;
        }
        
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${BASE_URL}/api/complaints/${complaintId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
          showNotification('success', 'Complaint updated successfully!');
          localStorage.removeItem('editComplaintData'); // Clear stored data
          window.location.hash = `#/view-complaint?id=${complaintId}`;
        } else {
          document.getElementById('updateComplaintAlert').innerHTML = `
            <div class="alert alert-danger">
              ${result.message || 'Failed to update complaint'}
            </div>
          `;
        }
      } catch (error) {
        console.error('Error updating complaint:', error);
        document.getElementById('updateComplaintAlert').innerHTML = `
          <div class="alert alert-danger">
            Error updating complaint. Please try again.
          </div>
        `;
      } finally {
        setLoading(false);
      }
    });
  }
}