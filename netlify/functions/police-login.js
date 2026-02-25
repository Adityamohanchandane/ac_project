// Netlify Function for Police Login
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/observx?retryWrites=true&w=majority';
const client = new MongoClient(uri);

exports.handler = async (event, context) => {
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
    // Check if event.body exists and is not empty
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Request body is required' })
      };
    }

    // Parse JSON with error handling
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid JSON in request body' })
      };
    }

    const { email, password } = requestBody;

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Email and password are required' })
      };
    }

    await client.connect();
    const database = client.db('observx');
    const users = database.collection('users');

    const user = await users.findOne({ email, role: 'police' });

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'No police account found with that email' })
      };
    }

    // Simple password check for demo
    if (email === 'adii123@gmail.com' && password === 'adii123') {
      // Remove password from response
      const { password: _, ...policeWithoutPassword } = user;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Login successful',
          user_id: user._id.toString(),
          police: policeWithoutPassword
        })
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Incorrect password' })
      };
    }

  } catch (error) {
    console.error('Police login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  } finally {
    await client.close();
  }
};
