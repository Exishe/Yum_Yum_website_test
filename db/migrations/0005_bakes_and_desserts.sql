-- Cakes have no confirmed price yet and are hidden, so the category is named for what it shows.
-- Only the old seed text changes; a name edited in the admin is kept.
UPDATE "categories" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Թխվածքներ և դեսերտներ'::text)) WHERE "name"->>'hy' = 'Թխվածքներ և տորթեր';
--> statement-breakpoint
UPDATE "categories" SET "name" = jsonb_set("name", '{en}', to_jsonb('Bakes & desserts'::text)) WHERE "name"->>'en' = 'Cakes & bakes';
