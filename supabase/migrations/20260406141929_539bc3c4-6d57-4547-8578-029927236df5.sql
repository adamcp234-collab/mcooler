
-- Table for reschedule proposals
CREATE TABLE public.order_reschedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.ec_order_head(order_id) ON DELETE CASCADE,
  old_date date NOT NULL,
  old_time time NOT NULL,
  new_date date NOT NULL,
  new_time time NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_by text NOT NULL DEFAULT 'vendor',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_reschedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage own reschedules"
  ON public.order_reschedules FOR ALL
  USING (public.is_vendor_owner(public.get_mitra_id_for_order(order_id)))
  WITH CHECK (public.is_vendor_owner(public.get_mitra_id_for_order(order_id)));

CREATE POLICY "Admins full access reschedules"
  ON public.order_reschedules FOR ALL
  USING (public.is_admin());

CREATE POLICY "Public can read reschedules"
  ON public.order_reschedules FOR SELECT
  USING (true);

-- Table for service reminders
CREATE TABLE public.service_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.ec_order_head(order_id) ON DELETE CASCADE,
  mitra_id uuid NOT NULL,
  cust_name text NOT NULL,
  cust_whatsapp text NOT NULL,
  service_summary text NOT NULL,
  reminder_days integer NOT NULL DEFAULT 90,
  reminder_date date NOT NULL,
  is_sent boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.service_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage own reminders"
  ON public.service_reminders FOR ALL
  USING (public.is_vendor_owner(mitra_id))
  WITH CHECK (public.is_vendor_owner(mitra_id));

CREATE POLICY "Admins full access reminders"
  ON public.service_reminders FOR ALL
  USING (public.is_admin());

-- Trigger to update order schedule when reschedule accepted
CREATE OR REPLACE FUNCTION public.apply_accepted_reschedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE public.ec_order_head
    SET booking_date = NEW.new_date::text,
        booking_time = NEW.new_time::text
    WHERE order_id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_reschedule
  AFTER UPDATE ON public.order_reschedules
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_accepted_reschedule();
