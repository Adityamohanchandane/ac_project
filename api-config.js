// API Configuration for LAN Deployment
const API_BASE_URL = "http://10.244.57.108:3000";

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_BASE_URL;
} else {
  window.API_BASE_URL = API_BASE_URL;
}
