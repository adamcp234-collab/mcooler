
-- Allow vendors to delete their own services
CREATE POLICY "Vendors can delete own services"
ON public.ms_services
FOR DELETE
TO authenticated
USING (public.is_vendor_owner(mitra_id));

-- Allow vendors to delete own photos
CREATE POLICY "Vendors can delete own photos"
ON public.vendor_photos
FOR DELETE
TO authenticated
USING (auth.uid() = mitra_id);

-- Recreate triggers if missing
DROP TRIGGER IF EXISTS trg_order_created ON public.ec_order_head;
CREATE TRIGGER trg_order_created
AFTER INSERT ON public.ec_order_head
FOR EACH ROW
EXECUTE FUNCTION public.log_order_created();

DROP TRIGGER IF EXISTS trg_order_status_change ON public.ec_order_head;
CREATE TRIGGER trg_order_status_change
AFTER UPDATE ON public.ec_order_head
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();
