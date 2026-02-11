-- =============================================
-- EXPAND USER PROFILES WITH ADDITIONAL PERSONAL INFORMATION
-- Migration: 0052
-- =============================================

-- Add new columns to user_profiles table for richer user data
DO $$
BEGIN
  -- Add gender column
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'gender') THEN
    ALTER TABLE user_profiles ADD COLUMN gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-say', 'other'));
  END IF;

  -- Add phone number
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
    ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(20);
  END IF;

  -- Add position/job title
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'position') THEN
    ALTER TABLE user_profiles ADD COLUMN position VARCHAR(100);
  END IF;

  -- Add department
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'department') THEN
    ALTER TABLE user_profiles ADD COLUMN department VARCHAR(100);
  END IF;

  -- Add bio/description
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bio') THEN
    ALTER TABLE user_profiles ADD COLUMN bio TEXT;
  END IF;

  -- Add birthday (just month and day for greetings, not year for privacy)
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'birthday') THEN
    ALTER TABLE user_profiles ADD COLUMN birthday DATE;
  END IF;
END $$;

-- Create index on birthday for birthday lookups
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_profiles_birthday') THEN
    CREATE INDEX idx_user_profiles_birthday ON user_profiles(birthday) WHERE birthday IS NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN user_profiles.gender IS 'User gender identity for personalization';
COMMENT ON COLUMN user_profiles.phone IS 'Contact phone number';
COMMENT ON COLUMN user_profiles.position IS 'Job title or position in the company';
COMMENT ON COLUMN user_profiles.department IS 'Department or area within the company';
COMMENT ON COLUMN user_profiles.bio IS 'Short biography or description';
COMMENT ON COLUMN user_profiles.birthday IS 'Birthday (used for greetings and celebrations)';
