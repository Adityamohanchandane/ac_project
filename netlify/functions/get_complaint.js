// Netlify Function for Getting Single Complaint
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/observx?retryWrites=true&w=majority';
const client = new MongoClient(uri);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const { id } = event.queryStringParameters;

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Complaint ID is required' })
      };
    }

    await client.connect();
    const database = client.db('observx');
    const complaints = database.collection('complaints');
    const users = database.collection('users');

    const complaint = await complaints.findOne({
      $or: [
        { _id: id },
        { id: id },
        { complaint_id: id }
      ]
    });

    if (!complaint) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'Complaint not found' })
      };
    }

    // Get user details
    const user = await users.findOne({ _id: complaint.user_id });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        complaint,
        user
      })
    };

  } catch (error) {
    console.error('Get complaint error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  } finally {
    await client.close();
  }
};
