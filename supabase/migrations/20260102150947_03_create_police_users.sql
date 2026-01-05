/*
  # Create Police User Records

  1. Insert sample police officers for demonstration
    - Pre-created police accounts for testing
    - Email: police@secureindiapolice.gov.in
    - Password: will be set via Supabase Auth
*/

-- Note: Police users are created through Supabase Auth signup
-- and marked with role='police' in the users table
-- The actual user records will be linked to auth.users via trigger