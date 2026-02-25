// Netlify Function for Filing Complaint
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/observx?retryWrites=true&w=majority';
const client = new MongoClient(uri);

export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const { title, category, description, incident_date, user_location, crime_location, priority_level } = JSON.parse(event.body);

    // Validation
    if (!title || !category || !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Title, category, and description are required' })
      };
    }

    await client.connect();
    const database = client.db('observx');
    const complaints = database.collection('complaints');

    // Generate complaint ID
    const complaint_id = 'CMP' + Date.now();

    const newComplaint = {
      id: new Date().getTime().toString(),
      complaint_id,
      user_id: 'user123', // Default user for demo
      user_email: 'test@example.com',
      title,
      category,
      description,
      incident_date: incident_date || new Date().toISOString().split('T')[0],
      user_location: user_location || null,
      crime_location: crime_location || null,
      status: 'pending',
      priority_level: priority_level || 'normal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await complaints.insertOne(newComplaint);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Complaint filed successfully',
        complaint_id: newComplaint.complaint_id,
        id: result.insertedId.toString()
      })
    };

  } catch (error) {
    console.error('File complaint error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  } finally {
    await client.close();
  }
};
