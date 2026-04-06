
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'ec_order_head'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.ec_order_head;
  END IF;
END $$;
