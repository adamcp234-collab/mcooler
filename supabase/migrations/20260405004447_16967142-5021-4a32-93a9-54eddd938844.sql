CREATE TABLE IF NOT EXISTS public.ms_service_det (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mitra_id uuid NOT NULL,
  master_service_id text NOT NULL REFERENCES public.master_services(id) ON DELETE CASCADE,
  price integer,
  description text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ms_service_det_unique_vendor_service UNIQUE (mitra_id, master_service_id)
);

CREATE INDEX IF NOT EXISTS idx_ms_service_det_mitra_id ON public.ms_service_det (mitra_id);
CREATE INDEX IF NOT EXISTS idx_ms_service_det_master_service_id ON public.ms_service_det (master_service_id);
CREATE INDEX IF NOT EXISTS idx_ms_service_det_active ON public.ms_service_det (is_active);

ALTER TABLE public.ms_service_det ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access vendor service details" ON public.ms_service_det;
CREATE POLICY "Admins full access vendor service details"
ON public.ms_service_det
FOR ALL
TO public
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Vendors can view own service details" ON public.ms_service_det;
CREATE POLICY "Vendors can view own service details"
ON public.ms_service_det
FOR SELECT
TO public
USING (public.is_vendor_owner(mitra_id));

DROP POLICY IF EXISTS "Vendors can create own service details" ON public.ms_service_det;
CREATE POLICY "Vendors can create own service details"
ON public.ms_service_det
FOR INSERT
TO authenticated
WITH CHECK (public.is_vendor_owner(mitra_id));

DROP POLICY IF EXISTS "Vendors can update own service details" ON public.ms_service_det;
CREATE POLICY "Vendors can update own service details"
ON public.ms_service_det
FOR UPDATE
TO public
USING (public.is_vendor_owner(mitra_id))
WITH CHECK (public.is_vendor_owner(mitra_id));

DROP POLICY IF EXISTS "Vendors can delete own service details" ON public.ms_service_det;
CREATE POLICY "Vendors can delete own service details"
ON public.ms_service_det
FOR DELETE
TO public
USING (public.is_vendor_owner(mitra_id));

DROP POLICY IF EXISTS "Public can view active vendor services" ON public.ms_service_det;
CREATE POLICY "Public can view active vendor services"
ON public.ms_service_det
FOR SELECT
TO public
USING (
  is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.ms_mitra_det m
    WHERE m.mitra_id = ms_service_det.mitra_id
      AND m.is_active = true
  )
);

ALTER TABLE public.master_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view master services" ON public.master_services;
CREATE POLICY "Anyone can view master services"
ON public.master_services
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Admins can manage master services" ON public.master_services;
CREATE POLICY "Admins can manage master services"
ON public.master_services
FOR ALL
TO public
USING (public.is_admin())
WITH CHECK (public.is_admin());

ALTER TABLE public.ec_order_head
ADD COLUMN IF NOT EXISTS cancel_reason text;

CREATE OR REPLACE FUNCTION public.validate_ms_service_det()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active THEN
    IF NEW.price IS NULL OR NEW.price <= 0 THEN
      RAISE EXCEPTION 'Harga wajib diisi dan harus lebih besar dari 0 saat layanan diaktifkan';
    END IF;

    IF NEW.description IS NULL OR btrim(NEW.description) = '' THEN
      RAISE EXCEPTION 'Deskripsi wajib diisi saat layanan diaktifkan';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_ms_service_det ON public.ms_service_det;
CREATE TRIGGER trg_validate_ms_service_det
BEFORE INSERT OR UPDATE ON public.ms_service_det
FOR EACH ROW
EXECUTE FUNCTION public.validate_ms_service_det();

CREATE OR REPLACE FUNCTION public.validate_order_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM NEW.status OR COALESCE(OLD.cancel_reason, '') IS DISTINCT FROM COALESCE(NEW.cancel_reason, '')) THEN
    IF NEW.cancel_reason IS NULL OR btrim(NEW.cancel_reason) = '' THEN
      RAISE EXCEPTION 'Alasan pembatalan wajib diisi';
    END IF;
  END IF;

  IF NEW.status <> 'cancelled' THEN
    NEW.cancel_reason := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_order_cancellation ON public.ec_order_head;
CREATE TRIGGER trg_validate_order_cancellation
BEFORE UPDATE ON public.ec_order_head
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_cancellation();

DROP TRIGGER IF EXISTS trigger_log_order_created ON public.ec_order_head;
DROP TRIGGER IF EXISTS trigger_log_order_status ON public.ec_order_head;
DROP TRIGGER IF EXISTS trg_order_created ON public.ec_order_head;
DROP TRIGGER IF EXISTS trg_order_status_change ON public.ec_order_head;

CREATE TRIGGER trg_order_created
AFTER INSERT ON public.ec_order_head
FOR EACH ROW
EXECUTE FUNCTION public.log_order_created();

CREATE TRIGGER trg_order_status_change
AFTER UPDATE ON public.ec_order_head
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();

DROP TRIGGER IF EXISTS update_ms_service_det_updated_at ON public.ms_service_det;
CREATE TRIGGER update_ms_service_det_updated_at
BEFORE UPDATE ON public.ms_service_det
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();