// Static API integration for Netlify
// This file intercepts API calls and uses static data for Netlify deployment

// Import static API
import { StaticAPI } from './static-api.js';

// Detect if running on Netlify
const isNetlify = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

console.log('Netlify Integration - Running on Netlify:', isNetlify);

// Override fetch for static API on Netlify
if (isNetlify) {
  const originalFetch = window.fetch;
  
  window.fetch = async function(url, options) {
    console.log('Intercepted API call:', url);
    
    // Handle login API
    if (url.includes('/login.php')) {
      const formData = new URLSearchParams(options.body);
      const email = formData.get('email');
      const password = formData.get('password');
      const result = await StaticAPI.login(email, password, false);
      return {
        ok: result.success,
        json: () => Promise.resolve(result),
        status: result.success ? 200 : 400
      };
    }
    
    // Handle police login API
    if (url.includes('/police-login.php')) {
      const formData = new URLSearchParams(options.body);
      const email = formData.get('email');
      const password = formData.get('password');
      const result = await StaticAPI.login(email, password, true);
      return {
        ok: result.success,
        json: () => Promise.resolve(result),
        status: result.success ? 200 : 400
      };
    }
    
    // Handle get complaints API
    if (url.includes('/get_complaints.php')) {
      const urlObj = new URL(url, window.location.origin);
      const user_id = urlObj.searchParams.get('user_id');
      const user_email = urlObj.searchParams.get('user_email');
      const result = await StaticAPI.getComplaints({ user_id, user_email });
      return {
        ok: true,
        json: () => Promise.resolve(result),
        status: 200
      };
    }
    
    // Handle get single complaint API
    if (url.includes('/get_complaint.php')) {
      const urlObj = new URL(url, window.location.origin);
      const id = urlObj.searchParams.get('id');
      const result = await StaticAPI.getComplaint(id);
      return {
        ok: result.success,
        json: () => Promise.resolve(result),
        status: result.success ? 200 : 404
      };
    }
    
    // Handle file complaint API
    if (url.includes('/file_complaint.php')) {
      // For static demo, just return success
      return {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Complaint filed successfully (Demo Mode)',
          complaint_id: 'DEMO' + Date.now()
        }),
        status: 200
      };
    }
    
    // Use original fetch for all other cases
    return originalFetch.apply(this, arguments);
  };
}
