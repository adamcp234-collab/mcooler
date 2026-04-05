import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Package, AlertCircle, Clock, CheckCircle, MapPin, LogOut, Plus, Pencil, Trash2, User, Settings, X, Save
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

  // Service CRUD state
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceName, setServiceName] = useState("");
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

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ["vendor-services", mitraId],
    queryFn: () => (mitraId ? fetchMitraServices(mitraId) : Promise.resolve([])),
    enabled: !!mitraId,
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
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["status-logs"] });
      toast.success("Status order diperbarui");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Service mutations
  const saveServiceMutation = useMutation({
    mutationFn: async () => {
      if (!mitraId) throw new Error("No mitra");
      const payload = {
        mitra_id: mitraId,
        service_name: serviceName,
        price: parseInt(servicePrice) || 0,
        description: serviceDesc || null,
        is_active: true,
      };
      if (editingService) {
        const { error } = await supabase.from("ms_service_det").update(payload).eq("id", editingService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ms_service_det").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-services"] });
      toast.success(editingService ? "Layanan diperbarui" : "Layanan ditambahkan");
      closeServiceDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase.from("ms_services").delete().eq("id", serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-services"] });
      toast.success("Layanan dihapus");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleServiceActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("ms_services").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-services"] });
    },
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

  const openServiceDialog = (service?: any) => {
    if (service) {
      setEditingService(service);
      setServiceName(service.service_name);
      setServicePrice(String(service.price));
      setServiceDesc(service.description || "");
    } else {
      setEditingService(null);
      setServiceName("");
      setServicePrice("");
      setServiceDesc("");
    }
    setShowServiceDialog(true);
  };

  const closeServiceDialog = () => {
    setShowServiceDialog(false);
    setEditingService(null);
    setServiceName("");
    setServicePrice("");
    setServiceDesc("");
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
            <TabsTrigger value="services">Layanan ({services.length})</TabsTrigger>
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

            {selectedOrder ? (
              <div className="space-y-4 animate-fade-in">
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(null)}>← Kembali</Button>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{selectedOrder.order_id}</CardTitle>
                      <Badge className={cn("text-xs", STATUS_COLORS[selectedOrder.status as OrderStatus])}>
                        {STATUS_LABELS[selectedOrder.status as OrderStatus]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium text-foreground">{selectedOrder.cust_name}</p>
                        <a href={`https://wa.me/${selectedOrder.cust_whatsapp.replace(/^0/, "62")}`} target="_blank" rel="noopener" className="text-primary text-xs hover:underline">
                          {selectedOrder.cust_whatsapp} ↗
                        </a>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Jadwal</p>
                        <p className="font-medium text-foreground">{selectedOrder.booking_date}</p>
                        <p className="text-xs text-muted-foreground">{selectedOrder.booking_time}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Alamat</p>
                      <p className="font-medium text-foreground">{selectedOrder.cust_address_detail || "-"}</p>
                      {selectedOrder.cust_latitude && selectedOrder.cust_longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${selectedOrder.cust_latitude},${selectedOrder.cust_longitude}`}
                          target="_blank"
                          rel="noopener"
                          className="text-primary text-xs hover:underline flex items-center gap-1 mt-1"
                        >
                          <MapPin className="w-3 h-3" /> Buka di Google Maps ↗
                        </a>
                      )}
                    </div>
                    {selectedOrder.notes && (
                      <div>
                        <p className="text-muted-foreground">Catatan</p>
                        <p className="font-medium text-foreground">{selectedOrder.notes}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Layanan</p>
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

                    {/* Status Log */}
                    <div>
                      <p className="text-muted-foreground mb-2">Riwayat Status</p>
                      <div className="space-y-2">
                        {statusLogs.map((log) => (
                          <div key={log.id} className="flex gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <div>
                              <p className="text-foreground font-medium">{STATUS_LABELS[log.new_status as OrderStatus]}</p>
                              <p className="text-muted-foreground">{log.notes}</p>
                              <p className="text-muted-foreground">{new Date(log.created_at!).toLocaleString("id-ID")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {nextStatus(selectedOrder.status) && (
                        <Button
                          className="flex-1 mcooler-gradient"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ orderId: selectedOrder.order_id, status: nextStatus(selectedOrder.status)! })}
                        >
                          {STATUS_LABELS[nextStatus(selectedOrder.status)!]}
                        </Button>
                      )}
                      {!["cancelled", "done"].includes(selectedOrder.status) && (
                        <Button
                          variant="outline"
                          className="text-destructive border-destructive/30"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ orderId: selectedOrder.order_id, status: "cancelled" })}
                        >
                          Batalkan
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
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
                    <p className="text-sm text-foreground">{order.cust_name} • {order.cust_whatsapp}</p>
                    <p className="text-xs text-muted-foreground">{order.booking_date} • {order.booking_time} • {(order.selected_services as any[])?.length || 0} layanan</p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{services.length} layanan terdaftar</p>
              <Button size="sm" className="mcooler-gradient" onClick={() => openServiceDialog()}>
                <Plus className="w-4 h-4 mr-1" /> Tambah
              </Button>
            </div>
            {services.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Belum ada layanan. Tambahkan layanan pertama Anda.</p>
            )}
            {services.map((service) => (
              <div key={service.id} className={cn("bg-card border rounded-lg p-3", service.is_active ? "border-border" : "border-border/50 opacity-60")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground truncate">{service.service_name}</p>
                      {!service.is_active && <Badge variant="outline" className="text-[10px]">Nonaktif</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{service.description || "-"}</p>
                    <p className="text-sm font-semibold text-primary mt-1">Rp {service.price.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openServiceDialog(service)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleServiceActive.mutate({ id: service.id, active: !service.is_active })}
                    >
                      {service.is_active ? <X className="w-3.5 h-3.5 text-muted-foreground" /> : <CheckCircle className="w-3.5 h-3.5 text-success" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                      if (confirm("Hapus layanan ini?")) deleteServiceMutation.mutate(service.id);
                    }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={(open) => !open && closeServiceDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Layanan" : "Tambah Layanan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Layanan *</Label>
              <Input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Cuci AC 1 PK" />
            </div>
            <div className="space-y-2">
              <Label>Harga (Rp) *</Label>
              <Input type="number" value={servicePrice} onChange={e => setServicePrice(e.target.value)} placeholder="80000" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} placeholder="Deskripsi layanan..." rows={2} />
            </div>
            <Button
              className="w-full mcooler-gradient"
              onClick={() => saveServiceMutation.mutate()}
              disabled={!serviceName.trim() || !servicePrice || saveServiceMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1" />
              {saveServiceMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
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
