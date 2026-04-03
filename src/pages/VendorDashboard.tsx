import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, AlertCircle, Clock, CheckCircle, MapPin, LogOut
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  fetchOrdersByMitra,
  fetchStatusLogs,
  updateOrderStatus,
  fetchMitraServices,
} from "@/lib/api";
import { STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/data/services";
import { useAuth } from "@/hooks/useAuth";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user, isVendor, loading, mitraId, registrationStatus, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/vendor/auth", { replace: true });
      } else if (!isVendor && !mitraId) {
        navigate("/vendor/onboarding", { replace: true });
      }
    }
  }, [user, isVendor, mitraId, loading, navigate]);

  const { data: orders = [] } = useQuery({
    queryKey: ["vendor-orders", mitraId],
    queryFn: () => (mitraId ? fetchOrdersByMitra(mitraId) : Promise.resolve([])),
    enabled: !!mitraId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["vendor-services", mitraId],
    queryFn: () => (mitraId ? fetchMitraServices(mitraId) : Promise.resolve([])),
    enabled: !!mitraId,
  });

  const selectedOrder = orders.find((o) => o.order_id === selectedOrderId);

  const { data: statusLogs = [] } = useQuery({
    queryKey: ["status-logs", selectedOrderId],
    queryFn: () => fetchStatusLogs(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

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

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    active: orders.filter((o) => ["confirmed", "on_progress"].includes(o.status)).length,
    done: orders.filter((o) => o.status === "done").length,
  };

  const nextStatus = (status: string): OrderStatus | null => {
    const flow: Record<string, OrderStatus> = { pending: "confirmed", confirmed: "on_progress", on_progress: "done" };
    return flow[status] || null;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  if (!user) return null;

  // Pending verification state
  if (registrationStatus === "pending_verification") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-lg px-4 py-20 text-center">
          <Clock className="w-16 h-16 mx-auto text-warning mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Menunggu Verifikasi</h1>
          <p className="text-muted-foreground mb-4">
            Akun Anda sedang dalam proses verifikasi oleh admin. Anda akan mendapat akses penuh setelah akun diverifikasi.
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
          <p className="text-muted-foreground mb-4">Mohon maaf, pendaftaran Anda ditolak. Hubungi admin untuk informasi lebih lanjut.</p>
          <Button variant="ghost" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header mitraName="Dashboard Vendor" />
      <div className="container max-w-2xl px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: stats.total, icon: Package, color: "text-foreground" },
            { label: "Pending", value: stats.pending, icon: AlertCircle, color: "text-warning" },
            { label: "Aktif", value: stats.active, icon: Clock, color: "text-primary" },
            { label: "Selesai", value: stats.done, icon: CheckCircle, color: "text-success" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="mcooler-card">
              <CardContent className="p-3 text-center">
                <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Order</TabsTrigger>
            <TabsTrigger value="services">Layanan</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-3">
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
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium text-foreground">{selectedOrder.cust_name}</p>
                      <p className="text-muted-foreground">{selectedOrder.cust_whatsapp}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Alamat</p>
                      <p className="font-medium text-foreground">{selectedOrder.cust_address_detail || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Jadwal</p>
                      <p className="font-medium text-foreground">{selectedOrder.booking_date} - {selectedOrder.booking_time}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Layanan</p>
                      {(selectedOrder.selected_services as any[])?.map((s: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-foreground">{s.serviceName}</span>
                          <span className="font-medium text-foreground">Rp {s.price?.toLocaleString("id-ID")}</span>
                        </div>
                      ))}
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
                {orders.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Belum ada order.</p>
                )}
                {orders.map((order) => (
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
                    <p className="text-xs text-muted-foreground">{order.booking_date} • {(order.selected_services as any[])?.length || 0} layanan</p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-2">
            {services.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Belum ada layanan terdaftar.</p>
            )}
            {services.map((service) => (
              <div key={service.id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-foreground truncate flex-1">{service.service_name}</p>
                  <span className="text-sm font-semibold text-foreground ml-2">
                    Rp {service.price.toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
