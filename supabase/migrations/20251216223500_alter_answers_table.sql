-- Rename selected_answer to selected_answers and change type to integer array if needed
-- Or just add the column if it doesn't exist

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'answers' AND column_name = 'selected_answer') THEN
        ALTER TABLE answers ADD COLUMN IF NOT EXISTS selected_answers INTEGER[];
        -- Migrate data if needed (optional, simplistic here)
        UPDATE answers SET selected_answers = ARRAY[selected_answer] WHERE selected_answer IS NOT NULL;
        -- We might keep selected_answer for backward compatibility or drop it. Let's keep it for now.
    ELSE
        ALTER TABLE answers ADD COLUMN IF NOT EXISTS selected_answers INTEGER[];
    END IF;
END $$;
