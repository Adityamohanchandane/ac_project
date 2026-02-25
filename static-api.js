// Static API handler for Netlify deployment
import { mockUsers, mockComplaints } from './static-data.js';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class StaticAPI {
  // User authentication
  static async login(email, password, isPolice = false) {
    await delay(500);
    
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: 'No account found with that email.' };
    }
    
    if (isPolice && user.role !== 'police') {
      return { success: false, message: 'No police account found with that email.' };
    }
    
    // Simple password check for demo
    if (email === 'adii123@gmail.com' && password === 'adii123') {
      return {
        success: true,
        message: 'Login successful',
        user_id: user.id,
        user: { ...user, password: undefined }
      };
    }
    
    if (email === 'test@example.com' && password === 'password') {
      return {
        success: true,
        message: 'Login successful',
        user_id: user.id,
        user: { ...user, password: undefined }
      };
    }
    
    return { success: false, message: 'Incorrect password.' };
  }
  
  // Get complaints
  static async getComplaints(filters = {}) {
    await delay(300);
    
    let filteredComplaints = [...mockComplaints];
    
    if (filters.user_id) {
      filteredComplaints = filteredComplaints.filter(c => c.user_id === filters.user_id);
    }
    
    if (filters.user_email) {
      filteredComplaints = filteredComplaints.filter(c => c.user_email === filters.user_email);
    }
    
    return {
      success: true,
      complaints: filteredComplaints
    };
  }
  
  // Get single complaint
  static async getComplaint(id) {
    await delay(200);
    
    const complaint = mockComplaints.find(c => c.id === id || c.complaint_id === id);
    
    if (!complaint) {
      return { success: false, message: 'Complaint not found' };
    }
    
    const user = mockUsers.find(u => u.id === complaint.user_id);
    
    return {
      success: true,
      complaint,
      user
    };
  }
  
  // File complaint
  static async fileComplaint(complaintData) {
    await delay(800);
    
    const newComplaint = {
      id: 'comp_' + Date.now(),
      complaint_id: 'CMP' + Date.now(),
      user_id: 'f1fd51b8-754f-40fc-a247-ec468176df97',
      user_email: 'test@example.com',
      ...complaintData,
      status: 'pending',
      priority_level: complaintData.priority_level || 'normal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockComplaints.push(newComplaint);
    
    return {
      success: true,
      message: 'Complaint filed successfully',
      complaint_id: newComplaint.complaint_id
    };
  }
  
  // Update complaint
  static async updateComplaint(id, updates) {
    await delay(400);
    
    const complaintIndex = mockComplaints.findIndex(c => c.id === id || c.complaint_id === id);
    
    if (complaintIndex === -1) {
      return { success: false, message: 'Complaint not found' };
    }
    
    mockComplaints[complaintIndex] = {
      ...mockComplaints[complaintIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    return {
      success: true,
      message: 'Complaint updated successfully',
      complaint: mockComplaints[complaintIndex]
    };
  }
}
