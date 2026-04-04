import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import MapPicker from "@/components/MapPicker";
import { Upload, Camera, Award, Plus, X, CheckCircle, MapPin } from "lucide-react";

type PhotoUpload = {
  file: File;
  preview: string;
  type: "identity" | "equipment" | "certificate" | "other";
  label: string;
};

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const { user, isVendor, loading, mitraId, refreshRoles } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Profile data
  const [companyName, setCompanyName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Step 2: Photos
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/vendor/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  // Load existing mitra data
  useEffect(() => {
    if (mitraId) {
      supabase
        .from("ms_mitra_det")
        .select("*")
        .eq("mitra_id", mitraId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setCompanyName(data.company_name || "");
            setWhatsapp(data.whatsapp_number || "");
            setAddress(data.address_full || "");
            if (data.latitude && data.longitude) {
              setLocation({ lat: data.latitude, lng: data.longitude });
            }
          }
        });
    }
  }, [mitraId]);

  const handleFileSelect = (type: PhotoUpload["type"], label: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      const preview = URL.createObjectURL(file);
      if (type === "identity" || type === "equipment") {
        setPhotos(prev => [...prev.filter(p => p.type !== type), { file, preview, type, label }]);
      } else {
        setPhotos(prev => [...prev, { file, preview, type, label }]);
      }
    };
    input.click();
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSaveProfile = async () => {
    if (!companyName.trim() || !whatsapp.trim()) {
      toast.error("Nama usaha dan WhatsApp wajib diisi");
      return;
    }
    if (!location) {
      toast.error("Lokasi workshop wajib ditentukan");
      return;
    }
    if (!user) return;
    setSubmitting(true);

    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    if (mitraId) {
      const { error } = await supabase
        .from("ms_mitra_det")
        .update({
          company_name: companyName,
          whatsapp_number: whatsapp,
          address_full: address || null,
          latitude: location.lat,
          longitude: location.lng,
          slug: slug + "-" + user.id.substring(0, 4),
        })
        .eq("mitra_id", mitraId);
      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }
    } else {
      // Create vendor role first
      await supabase.from("user_roles").insert({ user_id: user.id, role: "vendor" as any });
      const { error } = await supabase.from("ms_mitra_det").insert({
        mitra_id: user.id,
        company_name: companyName,
        slug: slug + "-" + user.id.substring(0, 4),
        whatsapp_number: whatsapp,
        email: user.email || "",
        address_full: address || null,
        latitude: location.lat,
        longitude: location.lng,
        is_active: false,
        registration_status: "pending_verification" as any,
      });
      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }
      // Refresh auth context so mitraId is set
      await refreshRoles();
    }

    setSubmitting(false);
    toast.success("Data profil disimpan");
    setStep(2);
  };

  const handleSubmitPhotos = async () => {
    const hasIdentity = photos.some(p => p.type === "identity");
    const hasEquipment = photos.some(p => p.type === "equipment");
    if (!hasIdentity || !hasEquipment) {
      toast.error("Foto identitas dan foto diri bersama peralatan wajib diupload");
      return;
    }
    if (!user) return;
    setSubmitting(true);

    for (const photo of photos) {
      const ext = photo.file.name.split(".").pop();
      const path = `${user.id}/${photo.type}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("vendor-photos")
        .upload(path, photo.file);
      if (uploadErr) {
        toast.error(`Gagal upload ${photo.label}: ${uploadErr.message}`);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("vendor-photos").getPublicUrl(path);
      await supabase.from("vendor_photos").insert({
        mitra_id: user.id,
        photo_type: photo.type,
        file_name: photo.file.name,
        file_path: urlData.publicUrl,
        is_required: photo.type === "identity" || photo.type === "equipment",
      });
    }

    setSubmitting(false);
    toast.success("Pendaftaran selesai! Menunggu verifikasi admin.");
    setStep(3);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-lg px-4 py-8">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="mcooler-elevated">
            <CardHeader>
              <CardTitle>Data Usaha</CardTitle>
              <CardDescription>Lengkapi informasi usaha Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Usaha *</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Contoh: AC Jaya Teknik" />
              </div>
              <div className="space-y-2">
                <Label>Nomor WhatsApp *</Label>
                <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="08123456789" />
              </div>
              <div className="space-y-2">
                <Label>Alamat Lengkap</Label>
                <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat lengkap usaha Anda" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Lokasi Workshop *
                </Label>
                <p className="text-xs text-muted-foreground">Geser peta atau gunakan GPS untuk menentukan lokasi workshop Anda</p>
                <MapPicker
                  value={location || undefined}
                  onChange={setLocation}
                  height="250px"
                />
                {location && (
                  <p className="text-xs text-muted-foreground">📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                )}
              </div>
              <Button className="w-full mcooler-gradient" onClick={handleSaveProfile} disabled={submitting}>
                {submitting ? "Menyimpan..." : "Selanjutnya"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="mcooler-elevated">
            <CardHeader>
              <CardTitle>Upload Foto</CardTitle>
              <CardDescription>Upload foto wajib dan dokumen pendukung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Foto Wajib</p>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleFileSelect("identity", "Foto Identitas (KTP/SIM)")}
                >
                  {photos.find(p => p.type === "identity") ? (
                    <div className="relative">
                      <img src={photos.find(p => p.type === "identity")!.preview} alt="Identitas" className="w-full h-40 object-cover rounded" />
                      <button onClick={(e) => { e.stopPropagation(); removePhoto(photos.findIndex(p => p.type === "identity")); }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Foto Identitas (KTP/SIM) *</p>
                    </div>
                  )}
                </div>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleFileSelect("equipment", "Foto Diri + Peralatan")}
                >
                  {photos.find(p => p.type === "equipment") ? (
                    <div className="relative">
                      <img src={photos.find(p => p.type === "equipment")!.preview} alt="Peralatan" className="w-full h-40 object-cover rounded" />
                      <button onClick={(e) => { e.stopPropagation(); removePhoto(photos.findIndex(p => p.type === "equipment")); }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Foto Diri Bersama Peralatan Lengkap *</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Foto Tambahan (Opsional)</p>
                <div className="grid grid-cols-3 gap-2">
                  {photos.filter(p => p.type === "certificate" || p.type === "other").map((photo, i) => (
                    <div key={i} className="relative">
                      <img src={photo.preview} alt={photo.label} className="w-full h-24 object-cover rounded" />
                      <button
                        onClick={() => removePhoto(photos.indexOf(photo))}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{photo.label}</p>
                    </div>
                  ))}
                  <div className="space-y-1">
                    <button
                      className="w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors"
                      onClick={() => handleFileSelect("certificate", "Sertifikat")}
                    >
                      <Award className="w-5 h-5 mb-1" />
                      <span className="text-[10px]">Sertifikat</span>
                    </button>
                    <button
                      className="w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors"
                      onClick={() => handleFileSelect("other", "Foto Lainnya")}
                    >
                      <Plus className="w-5 h-5 mb-1" />
                      <span className="text-[10px]">Lainnya</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Kembali</Button>
                <Button className="flex-1 mcooler-gradient" onClick={handleSubmitPhotos} disabled={submitting}>
                  {submitting ? "Mengupload..." : "Kirim Pendaftaran"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="mcooler-elevated text-center">
            <CardContent className="py-12 space-y-4">
              <CheckCircle className="w-16 h-16 mx-auto text-accent" />
              <h2 className="text-xl font-bold text-foreground">Pendaftaran Berhasil!</h2>
              <p className="text-muted-foreground">
                Data Anda sedang dalam proses verifikasi oleh admin. Anda akan mendapat notifikasi setelah akun diverifikasi dan diaktifkan.
              </p>
              <Button variant="outline" onClick={() => navigate("/vendor")}>Ke Dashboard</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
