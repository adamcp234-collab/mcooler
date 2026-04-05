import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarIcon, User, Phone, FileText, ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import OrderStepper from "@/components/OrderStepper";
import ServiceSelector from "@/components/ServiceSelector";
import MapPicker from "@/components/MapPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  fetchActiveMitras,
  fetchMitraBySlug,
  fetchMitraServices,
  createOrder,
  findNearestMitraFromList,
} from "@/lib/api";

// For slug-based booking: Layanan first (mitra already known)
const STEPS_SLUG = ["Layanan", "Lokasi", "Jadwal", "Data Diri"];
// For home-based booking: Lokasi first to determine nearest mitra
const STEPS_HOME = ["Lokasi", "Jadwal", "Layanan", "Data Diri"];

const TIME_SLOTS = Array.from({ length: 19 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

export default function BookingPage() {
  const { mitraSlug } = useParams();
  const navigate = useNavigate();
  const isSlugMode = !!mitraSlug;
  const STEPS = isSlugMode ? STEPS_SLUG : STEPS_HOME;

  const { data: slugMitra, isLoading: loadingSlug } = useQuery({
    queryKey: ["mitra-slug", mitraSlug],
    queryFn: () => fetchMitraBySlug(mitraSlug!),
    enabled: !!mitraSlug,
  });

  const { data: allMitras } = useQuery({
    queryKey: ["active-mitras"],
    queryFn: fetchActiveMitras,
    enabled: !mitraSlug,
  });

  const [step, setStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Determine effective mitra — NO fallback to first mitra for home mode
  const effectiveMitraId = useMemo(() => {
    if (slugMitra) return slugMitra.mitra_id;
    if (location && allMitras && allMitras.length > 0) {
      const nearest = findNearestMitraFromList(allMitras, location.lat, location.lng);
      return nearest?.mitra_id || null;
    }
    return null; // Don't fall back to first mitra
  }, [slugMitra, allMitras, location]);

  const effectiveMitraName = useMemo(() => {
    if (slugMitra) return slugMitra.company_name;
    if (effectiveMitraId && allMitras) {
      return allMitras.find((m) => m.mitra_id === effectiveMitraId)?.company_name || null;
    }
    return null;
  }, [slugMitra, effectiveMitraId, allMitras]);

  // Reset selected services when mitra changes (location changed → different nearest vendor)
  const prevMitraIdRef = useMemo(() => effectiveMitraId, [effectiveMitraId]);
  useEffect(() => {
    // When not in slug mode and mitra changes, clear service selection
    if (!isSlugMode) {
      setSelectedServices([]);
    }
  }, [effectiveMitraId, isSlugMode]);

  const { data: services = [] } = useQuery({
    queryKey: ["mitra-services", effectiveMitraId],
    queryFn: () => fetchMitraServices(effectiveMitraId!),
    enabled: !!effectiveMitraId,
  });

  const selectorServices = useMemo(
    () =>
      services.map((s) => ({
        serviceId: s.id,
        serviceName: s.service_name,
        price: s.price,
        isActive: s.is_active ?? true,
        description: s.description || "",
      })),
    [services]
  );

  const selectedServiceDetails = useMemo(
    () => selectorServices.filter((s) => selectedServices.includes(s.serviceId)),
    [selectorServices, selectedServices]
  );
  const totalPrice = selectedServiceDetails.reduce((sum, s) => sum + s.price, 0);

  const toggleService = (id: string) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  // Map step label to validation
  const canNextForStep = (stepLabel: string) => {
    switch (stepLabel) {
      case "Lokasi": return location !== null;
      case "Jadwal": return date !== undefined && time !== "";
      case "Layanan": return selectedServices.length > 0;
      case "Data Diri": return name.trim() !== "" && whatsapp.trim().length >= 10;
      default: return false;
    }
  };

  const canNext = () => canNextForStep(STEPS[step]);

  const handleSubmit = async () => {
    if (!canNext() || !effectiveMitraId || !date) return;
    setSubmitting(true);
    try {
      const order = await createOrder({
        mitraId: effectiveMitraId,
        custName: name,
        custWhatsapp: whatsapp,
        custLatitude: location?.lat,
        custLongitude: location?.lng,
        custAddressDetail: address,
        bookingDate: date,
        bookingTime: time,
        notes,
        selectedServices: selectedServiceDetails.map((s) => ({
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          price: s.price,
        })),
      });
      toast.success("Order berhasil dibuat!", { description: `No. Order: ${order.order_id}` });
      navigate(`/order-success/${order.order_id}`);
    } catch (err: any) {
      toast.error("Gagal membuat order", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (mitraSlug && !loadingSlug && !slugMitra) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Mitra tidak ditemukan</h1>
          <p className="text-muted-foreground mb-6">Link mitra "{mitraSlug}" tidak valid.</p>
          <Button onClick={() => navigate("/")}>Kembali ke Beranda</Button>
        </div>
      </div>
    );
  }

  const currentStepLabel = STEPS[step];

  return (
    <div className="min-h-screen bg-background">
      <Header mitraName={effectiveMitraName || undefined} />
      <div className="container max-w-lg px-4 py-6 space-y-6">
        <OrderStepper steps={STEPS} currentStep={step} />

        <div className="animate-fade-in">
          {currentStepLabel === "Lokasi" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Tentukan Lokasi</h2>
                <p className="text-sm text-muted-foreground">Geser peta atau gunakan GPS untuk menentukan lokasi servis</p>
              </div>
              <MapPicker value={location || undefined} onChange={setLocation} height="280px" />
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Detail Alamat</label>
                <Textarea placeholder="Contoh: Jl. Sudirman No. 10, RT 03/RW 02" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
              </div>
              {location && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                  {effectiveMitraName && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Mitra terdekat: <span className="font-medium text-foreground">{effectiveMitraName}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStepLabel === "Jadwal" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Pilih Jadwal</h2>
                <p className="text-sm text-muted-foreground">Tentukan tanggal dan waktu servis</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Tanggal</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "EEEE, d MMMM yyyy", { locale: localeId }) : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => { const today = new Date(); today.setHours(0,0,0,0); return d < today; }} className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Waktu</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={cn(
                        "py-2 rounded-lg text-sm font-medium border transition-colors",
                        time === slot ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/30"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStepLabel === "Layanan" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Pilih Layanan</h2>
                <p className="text-sm text-muted-foreground">
                  Pilih satu atau lebih layanan yang Anda butuhkan
                  {effectiveMitraName && <span className="block text-xs mt-1">🧑‍🔧 Mitra: {effectiveMitraName}</span>}
                </p>
              </div>
              {selectorServices.length > 0 ? (
                <ServiceSelector services={selectorServices} selected={selectedServices} onToggle={toggleService} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {effectiveMitraId ? "Memuat layanan..." : "Belum ada mitra tersedia di lokasi Anda."}
                </p>
              )}
              {selectedServices.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{selectedServices.length} layanan dipilih</span>
                  <span className="font-bold text-primary">Rp {totalPrice.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>
          )}

          {currentStepLabel === "Data Diri" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Data Diri</h2>
                <p className="text-sm text-muted-foreground">Isi data Anda untuk konfirmasi order</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block"><User className="w-3.5 h-3.5 inline mr-1" /> Nama Lengkap</label>
                <Input placeholder="Nama Anda" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block"><Phone className="w-3.5 h-3.5 inline mr-1" /> No. WhatsApp</label>
                <Input placeholder="08xxxxxxxxxx" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block"><FileText className="w-3.5 h-3.5 inline mr-1" /> Catatan (opsional)</label>
                <Textarea placeholder="Catatan tambahan..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-foreground text-sm">Ringkasan Order</h3>
                <div className="space-y-1">
                  {selectedServiceDetails.map((s) => (
                    <div key={s.serviceId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{s.serviceName}</span>
                      <span className="text-foreground">Rp {s.price.toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-primary text-lg">Rp {totalPrice.toLocaleString("id-ID")}</span>
                </div>
                {date && time && <p className="text-xs text-muted-foreground">📅 {format(date, "EEEE, d MMMM yyyy", { locale: localeId })} pukul {time}</p>}
                {effectiveMitraName && <p className="text-xs text-muted-foreground">🧑‍🔧 Mitra: {effectiveMitraName}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="flex-1 mcooler-gradient">
              Lanjut <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canNext() || submitting} className="flex-1 mcooler-gradient">
              {submitting ? "Memproses..." : "Kirim Order"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
