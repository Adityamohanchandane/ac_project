// Netlify Function for User Registration
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://adityachandane71_db_user:adityamch2007@observex.fcerr8w.mongodb.net/observx?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true';
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

    const { email, password, full_name, mobile, address, role = 'user' } = requestBody;

    if (!email || !password || !full_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Email, password, and full name are required' })
      };
    }

    await client.connect();
    const database = client.db('observx');
    const users = database.collection('users');

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ success: false, message: 'User with this email already exists' })
      };
    }

    // Create new user
    const newUser = {
      email,
      password, // In production, you should hash this password
      full_name,
      mobile: mobile || '',
      address: address || '',
      role,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await users.insertOne(newUser);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Registration successful',
        user_id: result.insertedId.toString(),
        user: {
          id: result.insertedId.toString(),
          email,
          full_name,
          mobile,
          address,
          role
        }
      })
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  } finally {
    await client.close();
  }
};