// Test direct URL navigation
import fetch from 'node-fetch';

console.log('Testing if the main page loads...');

fetch('https://observx.netlify.app/adii/')
  .then(res => {
    console.log('Main page status:', res.status);
    return res.text();
  })
  .then(html => {
    if (html.includes('ObservX') || html.includes('Secure India')) {
      console.log('✅ Main page loads correctly');
    } else {
      console.log('❌ Main page content issue');
    }
  })
  .catch(err => console.error('❌ Main page failed:', err.message));
