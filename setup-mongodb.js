// MongoDB Database Setup Script
// Run this once to setup your database

import { MongoClient } from 'mongodb';

// Replace with your MongoDB connection string
const uri = 'mongodb+srv://adityachandane71_db_user:adityamch2007@observex.fcerr8w.mongodb.net/?appName=observeX';
const client = new MongoClient(uri);

async function setupDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('observx');

    // Create users collection
    const users = database.collection('users');
    
    // Insert police user
    const policeUser = {
      email: 'adii123@gmail.com',
      password: 'hashed_password_here', // In production, use bcrypt
      role: 'police',
      full_name: 'Police Officer',
      mobile: '1234567890',
      address: 'Police Station',
      created_at: new Date()
    };

    // Insert regular user
    const regularUser = {
      email: 'test@example.com',
      password: 'hashed_password_here', // In production, use bcrypt
      role: 'user',
      full_name: 'Test User',
      mobile: '1234567890',
      address: 'Test Address',
      created_at: new Date()
    };

    await users.insertMany([policeUser, regularUser]);
    console.log('Users inserted');

    // Create complaints collection
    const complaints = database.collection('complaints');
    
    // Insert sample complaints
    const sampleComplaints = [
      {
        id: 'comp_001',
        complaint_id: 'CMP1772011370555',
        user_id: 'user_001',
        user_email: 'test@example.com',
        title: 'Street Light Not Working',
        category: 'Infrastructure',
        description: 'Street light has been not working for past 3 days near main road',
        incident_date: '2026-02-25',
        status: 'pending',
        priority_level: 'normal',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'comp_002',
        complaint_id: 'CMP1772024405328',
        user_id: 'user_001',
        user_email: 'test@example.com',
        title: 'Noise Pollution',
        category: 'Environmental',
        description: 'Loud noise from construction site during late hours',
        incident_date: '2026-02-25',
        status: 'investigating',
        priority_level: 'high',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await complaints.insertMany(sampleComplaints);
    console.log('Sample complaints inserted');

    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Database setup error:', error);
  } finally {
    await client.close();
  }
}

setupDatabase();
