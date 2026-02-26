#!/usr/bin/env node

// Simple startup script for the server
console.log('🚀 Starting ObservX Backend Server...\n');

const { spawn } = require('child_process');
const os = require('os');

// Get local IP addresses
const networkInterfaces = os.networkInterfaces();
const localIPs = [];

Object.keys(networkInterfaces).forEach(interfaceName => {
  const interfaces = networkInterfaces[interfaceName];
  interfaces.forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal) {
      localIPs.push({
        interface: interfaceName,
        ip: iface.address
      });
    }
  });
});

console.log('📡 Network Interfaces:');
localIPs.forEach(({ interface, ip }) => {
  console.log(`   ${interface}: http://${ip}:3000`);
});

console.log('\n🔐 Demo Credentials:');
console.log('   Email: demo@gmail.com');
console.log('   Password: 1234');

console.log('\n🌐 Starting server...\n');

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

server.on('close', (code) => {
  console.log(`\n🔄 Server exited with code ${code}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});
