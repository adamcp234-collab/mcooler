
-- Fix order_status_log: remove permissive INSERT, only trigger inserts via SECURITY DEFINER
DROP POLICY "Anyone can insert status logs" ON public.order_status_log;

CREATE POLICY "Authenticated can insert status logs" ON public.order_status_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fix order_ratings: only allow for completed orders  
DROP POLICY "Anyone can insert rating" ON public.order_ratings;

CREATE POLICY "Anyone can rate completed orders" ON public.order_ratings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ec_order_head 
      WHERE ec_order_head.order_id = order_ratings.order_id 
      AND ec_order_head.status = 'done'
    )
  );
