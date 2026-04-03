
-- Re-create triggers for order status logging (they were missing)
CREATE TRIGGER trg_order_created
AFTER INSERT ON public.ec_order_head
FOR EACH ROW
EXECUTE FUNCTION public.log_order_created();

CREATE TRIGGER trg_order_status_change
AFTER UPDATE ON public.ec_order_head
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();

-- Fix: Calendar should allow today. Also fix the date comparison logic is in frontend only.
-- Add vendor SELECT policy for their own data even when not yet active
CREATE POLICY "Vendors can view own mitra regardless of active status"
ON public.ms_mitra_det
FOR SELECT
TO authenticated
USING (auth.uid() = mitra_id);
