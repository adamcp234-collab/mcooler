import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Users, AlertCircle, TrendingUp, Search, CheckCircle, XCircle, Eye, LogOut, UserCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/data/services";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [searchOrders, setSearchOrders] = useState("");
  const [searchMitra, setSearchMitra] = useState("");
  const [selectedMitraId, setSelectedMitraId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ec_order_head")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: mitras = [] } = useQuery({
    queryKey: ["admin-mitras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ms_mitra_det")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: vendorPhotos = [] } = useQuery({
    queryKey: ["vendor-photos", selectedMitraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_photos")
        .select("*")
        .eq("mitra_id", selectedMitraId!);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMitraId,
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ mitraId, status }: { mitraId: string; status: "verified" | "rejected" }) => {
      const { error } = await supabase
        .from("ms_mitra_det")
        .update({
          registration_status: status as any,
          is_active: status === "verified",
        })
        .eq("mitra_id", mitraId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-mitras"] });
      toast.success(vars.status === "verified" ? "Vendor diverifikasi dan diaktifkan" : "Vendor ditolak");
      setSelectedMitraId(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredOrders = orders.filter(
    (o) => o.order_id.toLowerCase().includes(searchOrders.toLowerCase()) || o.cust_name.toLowerCase().includes(searchOrders.toLowerCase())
  );
  const filteredMitras = mitras.filter(
    (m) => m.company_name.toLowerCase().includes(searchMitra.toLowerCase()) || m.slug.toLowerCase().includes(searchMitra.toLowerCase())
  );

  const pendingVendors = mitras.filter(m => (m as any).registration_status === "pending_verification");
  const selectedMitra = mitras.find(m => m.mitra_id === selectedMitraId);

  const PHOTO_TYPE_LABELS: Record<string, string> = {
    identity: "Foto Identitas",
    equipment: "Foto Diri + Peralatan",
    certificate: "Sertifikat",
    other: "Lainnya",
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-lg px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda tidak memiliki akses admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-4xl px-4 py-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Kelola mitra, order, dan layanan MCOOLER</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Order", value: orders.length, icon: Package, color: "text-primary" },
            { label: "Mitra Aktif", value: mitras.filter((m) => m.is_active).length, icon: Users, color: "text-success" },
            { label: "Pending Verif", value: pendingVendors.length, icon: UserCheck, color: "text-warning" },
            { label: "Selesai", value: orders.filter((o) => o.status === "done").length, icon: TrendingUp, color: "text-primary" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="mcooler-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
                    <Icon className={cn("w-5 h-5", color)} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue={pendingVendors.length > 0 ? "verification" : "orders"}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="verification" className="relative">
              Verifikasi
              {pendingVendors.length > 0 && (
                <span className="ml-1 bg-warning text-warning-foreground text-[10px] rounded-full px-1.5 py-0.5">{pendingVendors.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders">Order</TabsTrigger>
            <TabsTrigger value="mitras">Mitra</TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="space-y-3">
            {pendingVendors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Tidak ada vendor menunggu verifikasi.</p>
            ) : (
              pendingVendors.map((mitra) => (
                <Card key={mitra.mitra_id} className="mcooler-card">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-medium text-sm text-foreground">{mitra.company_name}</span>
                        <p className="text-xs text-muted-foreground">{mitra.email} • {mitra.whatsapp_number || "-"}</p>
                      </div>
                      <Badge className="bg-warning/10 text-warning text-xs">Menunggu</Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedMitraId(mitra.mitra_id)}>
                        <Eye className="w-3 h-3 mr-1" /> Detail
                      </Button>
                      <Button size="sm" className="bg-accent text-accent-foreground" onClick={() => verifyMutation.mutate({ mitraId: mitra.mitra_id, status: "verified" })}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Verifikasi
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => verifyMutation.mutate({ mitraId: mitra.mitra_id, status: "rejected" })}>
                        <XCircle className="w-3 h-3 mr-1" /> Tolak
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari order..." value={searchOrders} onChange={(e) => setSearchOrders(e.target.value)} className="pl-9" />
            </div>
            {filteredOrders.map((order) => (
              <Card key={order.order_id} className="mcooler-card">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-foreground">{order.order_id}</span>
                    <Badge className={cn("text-xs", STATUS_COLORS[order.status as OrderStatus])}>
                      {STATUS_LABELS[order.status as OrderStatus]}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{order.cust_name} • {order.cust_whatsapp}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {order.booking_date} {order.booking_time} •{" "}
                    Mitra: {mitras.find((m) => m.mitra_id === order.mitra_id)?.company_name || "-"}
                  </p>
                </CardContent>
              </Card>
            ))}
            {filteredOrders.length === 0 && <p className="text-center text-muted-foreground py-8">Tidak ada order.</p>}
          </TabsContent>

          <TabsContent value="mitras" className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari mitra..." value={searchMitra} onChange={(e) => setSearchMitra(e.target.value)} className="pl-9" />
            </div>
            {filteredMitras.map((mitra) => {
              const regStatus = (mitra as any).registration_status;
              return (
                <Card key={mitra.mitra_id} className="mcooler-card">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-foreground">{mitra.company_name}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className={cn("text-xs", mitra.is_active ? "text-success" : "text-destructive")}>
                          {mitra.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">/{mitra.slug} • {mitra.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedMitraId(mitra.mitra_id)}>
                        <Eye className="w-3 h-3 mr-1" /> Detail
                      </Button>
                      {!mitra.is_active && regStatus === "verified" && (
                        <Button size="sm" className="bg-accent text-accent-foreground" onClick={() => verifyMutation.mutate({ mitraId: mitra.mitra_id, status: "verified" })}>
                          Aktifkan
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredMitras.length === 0 && <p className="text-center text-muted-foreground py-8">Tidak ada mitra.</p>}
          </TabsContent>
        </Tabs>
      </div>

      {/* Vendor Detail Dialog */}
      <Dialog open={!!selectedMitraId} onOpenChange={(open) => !open && setSelectedMitraId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Vendor</DialogTitle>
          </DialogHeader>
          {selectedMitra && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Nama Usaha</p>
                  <p className="font-medium text-foreground">{selectedMitra.company_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Slug</p>
                  <p className="font-medium text-foreground">/{selectedMitra.slug}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{selectedMitra.email || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">WhatsApp</p>
                  <p className="font-medium text-foreground">{selectedMitra.whatsapp_number || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Alamat</p>
                  <p className="font-medium text-foreground">{selectedMitra.address_full || "-"}</p>
                </div>
              </div>

              {/* Vendor Photos */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Foto Vendor</p>
                {vendorPhotos.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Belum ada foto diupload</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {vendorPhotos.map((photo) => (
                      <div key={photo.id} className="space-y-1">
                        <img
                          src={photo.file_path}
                          alt={photo.file_name}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          {PHOTO_TYPE_LABELS[photo.photo_type] || photo.photo_type}
                          {photo.is_required && " (wajib)"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(selectedMitra as any).registration_status === "pending_verification" && (
                <div className="flex gap-2">
                  <Button className="flex-1 bg-accent text-accent-foreground" onClick={() => verifyMutation.mutate({ mitraId: selectedMitra.mitra_id, status: "verified" })}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Verifikasi & Aktifkan
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => verifyMutation.mutate({ mitraId: selectedMitra.mitra_id, status: "rejected" })}>
                    <XCircle className="w-4 h-4 mr-1" /> Tolak
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
