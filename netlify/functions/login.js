// Netlify Function for User Login
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
    const { email, password } = JSON.parse(event.body);

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

    const user = await users.findOne({ email });

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'No account found with that email' })
      };
    }

    // For demo, simple password check (in production, use bcrypt)
    if (password === 'adii123' && email === 'adii123@gmail.com') {
      // Police login
      if (user.role !== 'police') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ success: false, message: 'No police account found with that email' })
        };
      }
    } else if (password === 'password' && email === 'test@example.com') {
      // User login
      if (user.role !== 'user') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ success: false, message: 'Access denied' })
        };
      }
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Incorrect password' })
      };
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        user_id: user._id.toString(),
        user: userWithoutPassword
      })
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  } finally {
    await client.close();
  }
};
