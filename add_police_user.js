// Add police user to database
import bcrypt from 'bcrypt';
import fs from 'fs';
import crypto from 'crypto';

const USERS_FILE = './users.json';

async function addPoliceUser() {
  try {
    // Load existing users
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === 'adii123@gmail.com');
    if (existingUser) {
      console.log('User with email adii123@gmail.com already exists.');
      console.log('Current role:', existingUser.role);
      
      // Update to police role if not already police
      if (existingUser.role !== 'police') {
        existingUser.role = 'police';
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        console.log('✅ Updated user role to police');
      }
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('adii123', 10);

    // Create new police user
    const newPoliceUser = {
      id: crypto.randomUUID(),
      email: 'adii123@gmail.com',
      password: hashedPassword,
      role: 'police',
      full_name: 'Police Officer',
      mobile: '1234567890',
      address: 'Police Station',
      user_location: null,
      created_at: new Date().toISOString()
    };

    // Add to users array
    users.push(newPoliceUser);

    // Save to file
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    console.log('✅ Police user added successfully!');
    console.log('Email: adii123@gmail.com');
    console.log('Password: adii123');
    console.log('Role: police');
    console.log('User ID:', newPoliceUser.id);

  } catch (error) {
    console.error('❌ Error adding police user:', error);
  }
}

addPoliceUser();
