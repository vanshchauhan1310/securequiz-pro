-- Add user_email column to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Update existing records to use user_name as email if it looks like an email
UPDATE activities 
SET user_email = user_name 
WHERE user_email IS NULL AND user_name LIKE '%@%';
