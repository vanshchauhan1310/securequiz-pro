ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_email TEXT;

UPDATE activities 
SET user_email = user_name 
WHERE user_email IS NULL AND user_name LIKE '%@%';
