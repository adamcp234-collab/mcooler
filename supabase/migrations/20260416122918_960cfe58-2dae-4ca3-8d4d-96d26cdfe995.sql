
-- Enable pg_net for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create trigger function to notify vendor on new order
CREATE OR REPLACE FUNCTION public.notify_vendor_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _supabase_url text;
  _anon_key text;
BEGIN
  -- Get config from vault or hardcode the function URL
  SELECT decrypted_secret INTO _supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  SELECT decrypted_secret INTO _anon_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_PUBLISHABLE_KEY' LIMIT 1;

  PERFORM net.http_post(
    url := _supabase_url || '/functions/v1/notify-vendor-new-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    ),
    body := jsonb_build_object('order_id', NEW.order_id)
  );

  RETURN NEW;
END;
$$;

-- Create trigger on ec_order_head for new orders
CREATE TRIGGER on_new_order_notify_vendor
AFTER INSERT ON public.ec_order_head
FOR EACH ROW
EXECUTE FUNCTION public.notify_vendor_new_order();
