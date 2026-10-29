-- The first admin signs in as "director" instead of "admin@yumyum.local". Password unchanged.
UPDATE "users" SET "email" = 'director'
WHERE "email" = 'admin@yumyum.local' AND NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = 'director');
