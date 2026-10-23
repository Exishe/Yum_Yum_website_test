-- Row Level Security for every table. Applied after each migration by db/migrate.ts.
-- Safe to run many times.
--
-- Model:
--   * The Next.js server connects with the database owner role (DATABASE_URL).
--     The owner bypasses RLS, and all writes go through validated server code.
--   * Supabase also exposes the database through its REST API with the public
--     "anon" key. Every table has RLS on with NO policy by default, which means
--     deny everything. The only exceptions are the read-only policies below for
--     published catalogue data.
--   * Orders, customers, users, sessions, audit and settings have no policies at
--     all: the public can never read or write them directly.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'categories','products','product_options','shops','delivery_zones',
    'orders','order_items','order_status_history','reviews','site_texts',
    'settings','newsletter_subscribers','contact_messages','users','sessions',
    'audit_log','rate_limits','notification_log'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Supabase roles exist only on Supabase. On a plain local Postgres, skip this part.
DO $$
DECLARE t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    -- Start from zero: no table privileges for the API roles.
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated';

    -- Read-only access to the published catalogue.
    FOREACH t IN ARRAY ARRAY['categories','products','product_options','shops','delivery_zones','reviews'] LOOP
      EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    END LOOP;

    DROP POLICY IF EXISTS public_read_categories ON public.categories;
    CREATE POLICY public_read_categories ON public.categories
      FOR SELECT TO anon, authenticated USING (is_published);

    DROP POLICY IF EXISTS public_read_products ON public.products;
    CREATE POLICY public_read_products ON public.products
      FOR SELECT TO anon, authenticated USING (is_published);

    DROP POLICY IF EXISTS public_read_product_options ON public.product_options;
    CREATE POLICY public_read_product_options ON public.product_options
      FOR SELECT TO anon, authenticated
      USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_published));

    DROP POLICY IF EXISTS public_read_shops ON public.shops;
    CREATE POLICY public_read_shops ON public.shops
      FOR SELECT TO anon, authenticated USING (is_active);

    DROP POLICY IF EXISTS public_read_zones ON public.delivery_zones;
    CREATE POLICY public_read_zones ON public.delivery_zones
      FOR SELECT TO anon, authenticated USING (is_active);

    DROP POLICY IF EXISTS public_read_reviews ON public.reviews;
    CREATE POLICY public_read_reviews ON public.reviews
      FOR SELECT TO anon, authenticated USING (is_approved);
  END IF;
END $$;
