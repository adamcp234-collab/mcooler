import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Package, AlertCircle, Clock, CheckCircle, MapPin, LogOut, Pencil, Settings, Save,
  Calendar, Phone, Mail, MapPinIcon, MessageCircle, Navigation, X, Play, Ban, Eye
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  fetchOrdersByMitra,
  fetchStatusLogs,
  updateOrderStatus,
  fetchMitraServices,
} from "@/lib/api";
import { STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/data/services";
import { useAuth } from "@/hooks/useAuth";
import MapPicker from "@/components/MapPicker";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user, isVendor, loading, mitraId, registrationStatus, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Service edit state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");

  // Profile edit state
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLocation, setProfileLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/vendor/auth", { replace: true });
      } else if (!isVendor && !mitraId) {
        // Only redirect to onboarding if no vendor role AND no mitra record
        navigate("/vendor/onboarding", { replace: true });
      }
    }
  }, [user, isVendor, mitraId, loading, navigate]);

  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ["vendor-orders", mitraId],
    queryFn: () => (mitraId ? fetchOrdersByMitra(mitraId) : Promise.resolve([])),
    enabled: !!mitraId,
    refetchInterval: 30000,
  });

  // Realtime
  useEffect(() => {
    if (!mitraId) return;
    const channel = supabase
      .channel('vendor-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ec_order_head', filter: `mitra_id=eq.${mitraId}` },
        () => { queryClient.invalidateQueries({ queryKey: ["vendor-orders", mitraId] }); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [mitraId, queryClient]);

  // Fetch vendor's service details
  const { data: vendorServices = [] } = useQuery({
    queryKey: ["vendor-services", mitraId],
    queryFn: () => (mitraId ? fetchMitraServices(mitraId) : Promise.resolve([])),
    enabled: !!mitraId,
  });

  // Fetch ALL master services from platform
  const { data: masterServices = [] } = useQuery({
    queryKey: ["master-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("master_services").select("*").order("service_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch mitra profile
  const { data: mitraProfile } = useQuery({
    queryKey: ["vendor-profile", mitraId],
    queryFn: async () => {
      if (!mitraId) return null;
      const { data, error } = await supabase.from("ms_mitra_det").select("*").eq("mitra_id", mitraId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!mitraId,
  });

  const selectedOrder = orders.find((o) => o.order_id === selectedOrderId);

  const { data: statusLogs = [] } = useQuery({
    queryKey: ["status-logs", selectedOrderId],
    queryFn: () => fetchStatusLogs(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  // Order status mutation
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status, cancelReason }: { orderId: string; status: string; cancelReason?: string }) =>
      updateOrderStatus(orderId, status, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["status-logs"] });
      toast.success("Status order diperbarui");
      setShowCancelDialog(false);
      setCancelReason("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Toggle service on/off with upsert
  const toggleServiceMutation = useMutation({
    mutationFn: async ({ masterServiceId, activate }: { masterServiceId: string; activate: boolean }) => {
      if (!mitraId) throw new Error("No mitra");
      const existing = vendorServices.find((s) => s.master_service_id === masterServiceId);
      if (existing) {
        if (!activate) {
          const { error } = await supabase.from("ms_service_det").update({ is_active: false }).eq("id", existing.id);
          if (error) throw error;
        } else {
          // Will open edit form, not toggle directly
        }
      } else if (!activate) {
        // Nothing to do
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-services"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Save service price/description (upsert)
  const saveServiceMutation = useMutation({
    mutationFn: async ({ masterServiceId }: { masterServiceId: string }) => {
      if (!mitraId) throw new Error("No mitra");
      const price = parseInt(servicePrice) || 0;
      const desc = serviceDesc.trim();
      if (price <= 0) throw new Error("Harga wajib diisi dan harus lebih besar dari 0");
      if (!desc) throw new Error("Deskripsi wajib diisi");

      const existing = vendorServices.find((s) => s.master_service_id === masterServiceId);
      if (existing) {
        const { error } = await supabase.from("ms_service_det").update({
          price, description: desc, is_active: true,
        }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ms_service_det").insert({
          mitra_id: mitraId, master_service_id: masterServiceId,
          price, description: desc, is_active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-services"] });
      toast.success("Layanan disimpan");
      setEditingServiceId(null);
      setServicePrice("");
      setServiceDesc("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!mitraId || !profileData) throw new Error("No data");
      const { error } = await supabase.from("ms_mitra_det").update({
        company_name: profileData.company_name,
        whatsapp_number: profileData.whatsapp_number,
        address_full: profileData.address_full || null,
        email: profileData.email || null,
        latitude: profileLocation?.lat || null,
        longitude: profileLocation?.lng || null,
      }).eq("mitra_id", mitraId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
      toast.success("Profil diperbarui");
      setShowProfileDialog(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Helper: get vendor service detail for a master service
  const getVendorService = (masterServiceId: string) =>
    vendorServices.find((s) => s.master_service_id === masterServiceId);

  const startEditService = (masterServiceId: string) => {
    const existing = getVendorService(masterServiceId);
    setEditingServiceId(masterServiceId);
    setServicePrice(existing?.price ? String(existing.price) : "");
    setServiceDesc(existing?.description || "");
  };

  const openProfileDialog = () => {
    if (mitraProfile) {
      setProfileData({ ...mitraProfile });
      setProfileLocation(
        mitraProfile.latitude && mitraProfile.longitude
          ? { lat: mitraProfile.latitude, lng: mitraProfile.longitude }
          : null
      );
    }
    setShowProfileDialog(true);
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    active: orders.filter((o) => ["confirmed", "on_progress"].includes(o.status)).length,
    done: orders.filter((o) => o.status === "done").length,
  };

  const revenue = orders
    .filter((o) => o.status === "done")
    .reduce((sum, o) => sum + ((o.selected_services as any[])?.reduce((s: number, sv: any) => s + (sv.price || 0), 0) || 0), 0);

  const nextStatus = (status: string): OrderStatus | null => {
    const flow: Record<string, OrderStatus> = { pending: "confirmed", confirmed: "on_progress", on_progress: "done" };
    return flow[status] || null;
  };

  const filteredOrders = orderFilter === "all" ? orders : orders.filter(o => o.status === orderFilter);

  // Deduplicate status logs (same old_status, new_status, notes, created_at)
  const deduplicatedLogs = useMemo(() => {
    const seen = new Set<string>();
    return statusLogs.filter((log) => {
      const key = `${log.old_status}-${log.new_status}-${log.notes}-${log.created_at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [statusLogs]);

  // Compute distance & travel time between vendor and customer
  const orderDistance = useMemo(() => {
    if (!selectedOrder || !mitraProfile) return null;
    const vLat = mitraProfile.latitude;
    const vLng = mitraProfile.longitude;
    const cLat = selectedOrder.cust_latitude;
    const cLng = selectedOrder.cust_longitude;
    if (!vLat || !vLng || !cLat || !cLng) return null;
    const R = 6371;
    const dLat = ((cLat - vLat) * Math.PI) / 180;
    const dLng = ((cLng - vLng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((vLat * Math.PI) / 180) * Math.cos((cLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const minutes = Math.round(km * 2); // rough estimate ~30km/h
    return { km: km.toFixed(1), minutes };
  }, [selectedOrder, mitraProfile]);

  const nextStatusLabel: Record<string, string> = {
    pending: "Konfirmasi",
    confirmed: "Mulai Pengerjaan",
    on_progress: "Selesaikan",
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return null;

  if (registrationStatus === "pending_verification") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-lg px-4 py-20 text-center">
          <Clock className="w-16 h-16 mx-auto text-warning mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Menunggu Verifikasi</h1>
          <p className="text-muted-foreground mb-4">
            Akun Anda sedang dalam proses verifikasi oleh admin.
          </p>
          <Button variant="outline" onClick={() => navigate("/vendor/onboarding")}>Lengkapi Data</Button>
          <Button variant="ghost" className="ml-2" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
        </div>
      </div>
    );
  }

  if (registrationStatus === "rejected") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-lg px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Pendaftaran Ditolak</h1>
          <p className="text-muted-foreground mb-4">Hubungi admin untuk informasi lebih lanjut.</p>
          <Button variant="ghost" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header mitraName={mitraProfile?.company_name || "Dashboard Vendor"} />
      <div className="container max-w-2xl px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {mitraProfile?.slug && (
              <p className="text-xs text-muted-foreground">Link: /{mitraProfile.slug}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openProfileDialog}>
              <Settings className="w-4 h-4 mr-1" /> Profil
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Total Order", value: stats.total, icon: Package, color: "text-foreground" },
            { label: "Pending", value: stats.pending, icon: AlertCircle, color: "text-warning" },
            { label: "Aktif", value: stats.active, icon: Clock, color: "text-primary" },
            { label: "Pendapatan", value: `Rp ${(revenue / 1000).toFixed(0)}K`, icon: CheckCircle, color: "text-success" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="mcooler-card">
              <CardContent className="p-3 text-center">
                <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">
              Order
              {stats.pending > 0 && <span className="ml-1 bg-warning text-warning-foreground text-[10px] rounded-full px-1.5">{stats.pending}</span>}
            </TabsTrigger>
            <TabsTrigger value="services">Layanan ({vendorServices.filter(s => s.is_active).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-3">
            {/* Order filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { key: "all", label: "Semua" },
                { key: "pending", label: "Pending" },
                { key: "confirmed", label: "Dikonfirmasi" },
                { key: "on_progress", label: "Dikerjakan" },
                { key: "done", label: "Selesai" },
                { key: "cancelled", label: "Batal" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setOrderFilter(f.key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                    orderFilter === f.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/30"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredOrders.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {orderFilter === "all" ? "Belum ada order." : "Tidak ada order dengan status ini."}
                </p>
              )}
              {filteredOrders.map((order) => (
                <button
                  key={order.order_id}
                  onClick={() => setSelectedOrderId(order.order_id)}
                  className="w-full bg-card border border-border rounded-lg p-3 text-left hover:border-primary/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-foreground">{order.order_id}</span>
                    <Badge className={cn("text-xs", STATUS_COLORS[order.status as OrderStatus])}>
                      {STATUS_LABELS[order.status as OrderStatus]}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{order.cust_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.booking_date} • {order.booking_time} • {(order.selected_services as any[])?.length || 0} layanan
                  </p>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aktifkan layanan yang Anda tawarkan. Isi harga & deskripsi untuk setiap layanan aktif.
            </p>
            {masterServices.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Belum ada layanan dari platform.</p>
            )}
            {masterServices.map((ms) => {
              const vs = getVendorService(ms.id);
              const isActive = vs?.is_active === true;
              const isEditing = editingServiceId === ms.id;

              return (
                <div key={ms.id} className={cn("bg-card border rounded-lg p-3 space-y-2", isActive ? "border-primary/30" : "border-border")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{ms.service_name}</p>
                      {isActive && vs && (
                        <div className="mt-0.5">
                          <p className="text-sm font-semibold text-primary">Rp {vs.price?.toLocaleString("id-ID") || 0}</p>
                          <p className="text-xs text-muted-foreground">{vs.description || "-"}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isActive && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditService(ms.id)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            startEditService(ms.id);
                          } else {
                            toggleServiceMutation.mutate({ masterServiceId: ms.id, activate: false });
                          }
                        }}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="space-y-1">
                        <Label className="text-xs">Harga (Rp) *</Label>
                        <Input type="number" value={servicePrice} onChange={e => setServicePrice(e.target.value)} placeholder="80000" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Deskripsi *</Label>
                        <Textarea value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} placeholder="Deskripsi layanan..." rows={2} />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="mcooler-gradient"
                          onClick={() => saveServiceMutation.mutate({ masterServiceId: ms.id })}
                          disabled={saveServiceMutation.isPending}
                        >
                          <Save className="w-3.5 h-3.5 mr-1" />
                          {saveServiceMutation.isPending ? "Menyimpan..." : "Simpan"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingServiceId(null); setServicePrice(""); setServiceDesc(""); }}>
                          Batal
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrderId} onOpenChange={(open) => { if (!open) setSelectedOrderId(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
          {selectedOrder && (
            <>
              <DialogHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-lg">Detail Pesanan</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dibuat pada {new Date(selectedOrder.created_at!).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <Badge className={cn("text-xs", STATUS_COLORS[selectedOrder.status as OrderStatus])}>
                    {STATUS_LABELS[selectedOrder.status as OrderStatus]}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="px-4 pb-4 space-y-4 text-sm">
                {/* Order ID */}
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Nomor Pesanan</p>
                  <p className="text-foreground font-mono">{selectedOrder.order_id}</p>
                </div>

                <hr className="border-border" />

                {/* Data Pelanggan - hidden when pending */}
                {selectedOrder.status !== "pending" && (
                  <>
                    <div className="space-y-1.5">
                      <p className="font-semibold text-foreground">Data Pelanggan</p>
                      <div className="flex items-center gap-2 text-foreground"><span className="w-4 flex-shrink-0">👤</span> {selectedOrder.cust_name}</div>
                      <div className="flex items-center gap-2 text-foreground"><Phone className="w-4 h-4 flex-shrink-0 text-muted-foreground" /> {selectedOrder.cust_whatsapp}</div>
                      {selectedOrder.cust_email && (
                        <div className="flex items-center gap-2 text-foreground"><Mail className="w-4 h-4 flex-shrink-0 text-muted-foreground" /> {selectedOrder.cust_email}</div>
                      )}
                      <div className="flex items-center gap-2 text-foreground"><MapPin className="w-4 h-4 flex-shrink-0 text-muted-foreground" /> {selectedOrder.cust_address_detail || "-"}</div>
                    </div>
                    <hr className="border-border" />
                  </>
                )}

                {/* Jadwal */}
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">Jadwal</p>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-muted-foreground" /> {selectedOrder.booking_date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted-foreground" /> {selectedOrder.booking_time}</span>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Layanan */}
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">Layanan</p>
                  {(selectedOrder.selected_services as any[])?.map((s: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-foreground">{s.serviceName}</span>
                      <span className="font-medium text-foreground">Rp {s.price?.toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                  <div className="border-t border-border mt-1 pt-1 flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">
                      Rp {(selectedOrder.selected_services as any[])?.reduce((sum: number, s: any) => sum + (s.price || 0), 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Jarak & Estimasi */}
                {orderDistance && (
                  <>
                    <hr className="border-border" />
                    <div className="space-y-1.5">
                      <p className="font-semibold text-foreground flex items-center gap-1.5"><Navigation className="w-4 h-4" /> Jarak & Estimasi</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">Jarak</p>
                          <p className="font-bold text-primary">{orderDistance.km} km</p>
                        </div>
                        <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">Estimasi</p>
                          <p className="font-bold text-primary">~{orderDistance.minutes} menit</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Catatan */}
                {selectedOrder.notes && (
                  <>
                    <hr className="border-border" />
                    <div>
                      <p className="font-semibold text-foreground">Catatan</p>
                      <p className="text-foreground mt-1">{selectedOrder.notes}</p>
                    </div>
                  </>
                )}

                <hr className="border-border" />

                {/* Riwayat Status */}
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-1.5 mb-2"><Clock className="w-4 h-4" /> Riwayat Status</p>
                  <div className="space-y-3">
                    {deduplicatedLogs.map((log, idx) => {
                      const prevLog = idx > 0 ? deduplicatedLogs[idx - 1] : null;
                      const timeDiff = prevLog
                        ? Math.round((new Date(log.created_at!).getTime() - new Date(prevLog.created_at!).getTime()) / 60000)
                        : null;
                      return (
                        <div key={log.id} className="flex gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {log.old_status ? `${STATUS_LABELS[log.old_status as OrderStatus]} → ` : ""}
                                {STATUS_LABELS[log.new_status as OrderStatus]}
                              </span>
                              {timeDiff !== null && timeDiff > 0 && (
                                <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" /> {timeDiff} menit
                                </span>
                              )}
                            </div>
                            {log.notes && <p className="text-muted-foreground mt-0.5">{log.notes}</p>}
                            <p className="text-muted-foreground">
                              {new Date(log.created_at!).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })},{" "}
                              {new Date(log.created_at!).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {deduplicatedLogs.length > 1 && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1 border-t border-border">
                        <Clock className="w-3 h-3" />
                        Total durasi: {Math.round((new Date(deduplicatedLogs[deduplicatedLogs.length - 1].created_at!).getTime() - new Date(deduplicatedLogs[0].created_at!).getTime()) / 60000)} menit
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {nextStatus(selectedOrder.status) && (
                    <Button
                      className="w-full mcooler-gradient"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ orderId: selectedOrder.order_id, status: nextStatus(selectedOrder.status)! })}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      {nextStatusLabel[selectedOrder.status] || STATUS_LABELS[nextStatus(selectedOrder.status)!]}
                    </Button>
                  )}
                  {!["cancelled", "done"].includes(selectedOrder.status) && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={statusMutation.isPending}
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <Ban className="w-4 h-4 mr-1" /> Batalkan
                    </Button>
                  )}
                   {selectedOrder.status !== "pending" && (
                     <Button
                       variant="outline"
                       className="w-full"
                       onClick={() => {
                         const wa = selectedOrder.cust_whatsapp.replace(/^0/, "62");
                         window.open(`https://wa.me/${encodeURIComponent(wa)}`, "_blank");
                       }}
                     >
                       <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                     </Button>
                   )}
                   {selectedOrder.cust_latitude && selectedOrder.cust_longitude && (
                     <Button
                       variant="outline"
                       className="w-full"
                       onClick={() => window.open(`https://www.google.com/maps?q=${selectedOrder.cust_latitude},${selectedOrder.cust_longitude}`, "_blank")}
                     >
                       <MapPin className="w-4 h-4 mr-1" /> Buka Google Maps
                     </Button>
                   )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Reason Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={(open) => { if (!open) { setShowCancelDialog(false); setCancelReason(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Batalkan Pesanan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Alasan pembatalan wajib diisi:</p>
            <Textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Tuliskan alasan pembatalan..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!cancelReason.trim() || statusMutation.isPending}
                onClick={() => {
                  if (selectedOrder) {
                    statusMutation.mutate({
                      orderId: selectedOrder.order_id,
                      status: "cancelled",
                      cancelReason: cancelReason.trim(),
                    });
                  }
                }}
              >
                {statusMutation.isPending ? "Membatalkan..." : "Konfirmasi Batal"}
              </Button>
              <Button variant="outline" onClick={() => { setShowCancelDialog(false); setCancelReason(""); }}>
                Kembali
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={(open) => !open && setShowProfileDialog(false)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profil Usaha</DialogTitle>
          </DialogHeader>
          {profileData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Usaha</Label>
                <Input value={profileData.company_name} onChange={e => setProfileData({ ...profileData, company_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={profileData.whatsapp_number} onChange={e => setProfileData({ ...profileData, whatsapp_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profileData.email || ""} onChange={e => setProfileData({ ...profileData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Textarea value={profileData.address_full || ""} onChange={e => setProfileData({ ...profileData, address_full: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Lokasi Workshop</Label>
                <MapPicker value={profileLocation || undefined} onChange={setProfileLocation} height="200px" />
                {profileLocation && <p className="text-xs text-muted-foreground">📍 {profileLocation.lat.toFixed(5)}, {profileLocation.lng.toFixed(5)}</p>}
              </div>
              <Button
                className="w-full mcooler-gradient"
                onClick={() => saveProfileMutation.mutate()}
                disabled={saveProfileMutation.isPending}
              >
                <Save className="w-4 h-4 mr-1" />
                {saveProfileMutation.isPending ? "Menyimpan..." : "Simpan Profil"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
