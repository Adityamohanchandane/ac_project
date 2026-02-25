// Netlify Function for Getting Complaints
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/observx?retryWrites=true&w=majority';
const client = new MongoClient(uri);

export const handler = async (event, context) => {
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
    const { user_id, user_email } = event.queryStringParameters;

    await client.connect();
    const database = client.db('observx');
    const complaints = database.collection('complaints');

    let filter = {};
    
    if (user_id) {
      filter.user_id = user_id;
    } else if (user_email) {
      filter.user_email = user_email;
    }

    const allComplaints = await complaints.find(filter).sort({ created_at: -1 }).toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        complaints: allComplaints
      })
    };

  } catch (error) {
    console.error('Get complaints error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  } finally {
    await client.close();
  }
};
