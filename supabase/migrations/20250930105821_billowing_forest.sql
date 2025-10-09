/*
  # Drop NOT NULL constraint from email column

  1. Changes
    - Remove NOT NULL constraint from users.email column to allow phone-only registration
*/

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;