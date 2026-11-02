-- The admin greets the director by role instead of "Admin". A name changed since is kept.
UPDATE "users" SET "name" = 'Ղեկավար' WHERE "email" = 'director' AND "name" = 'Admin';
