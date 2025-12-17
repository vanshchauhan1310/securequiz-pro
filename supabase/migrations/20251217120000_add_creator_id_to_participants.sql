-- Drop the incorrect foreign key constraint if it exists
ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS participants_creator_id_fkey;

-- Add the creator_id column if it doesn't exist
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS creator_id UUID;

-- Add the correct foreign key constraint referencing the public.users table
ALTER TABLE public.participants ADD CONSTRAINT participants_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);
