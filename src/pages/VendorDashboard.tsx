import { useState } from "react";
import { 
  Package, Settings, Clock, MapPin, Wrench, 
  ChevronRight, CheckCircle, XCircle, AlertCircle,
  BarChart3, Users, TrendingUp
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MOCK_ORDERS, MOCK_MITRAS, type Order } from "@/data/mockData";
import { STATUS_LABELS, STATUS_COLORS, ORDER_STATUSES, type OrderStatus } from "@/data/services";

const MITRA = MOCK_MITRAS[0]; // demo vendor

export default function VendorDashboard() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [services, setServices] = useState(MITRA.services);
  const [activeTab, setActiveTab] = useState("orders");

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    active: orders.filter((o) => ["confirmed", "on_progress"].includes(o.status)).length,
    done: orders.filter((o) => o.status === "done").length,
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.orderId !== orderId) return o;
        const log = {
          id: `log-${Date.now()}`,
          oldStatus: o.status,
          newStatus,
          changedBy: MITRA.id,
          notes: `Status diubah ke ${STATUS_LABELS[newStatus]}`,
          createdAt: new Date().toISOString(),
        };
        return { ...o, status: newStatus, statusLog: [...o.statusLog, log] };
      })
    );
    if (selectedOrder?.orderId === orderId) {
      setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const toggleService = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const updateServicePrice = (serviceId: string, price: number) => {
    setServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, price } : s))
    );
  };

  const nextStatus = (status: OrderStatus): OrderStatus | null => {
    const flow: Record<string, OrderStatus> = {
      pending: "confirmed",
      confirmed: "on_progress",
      on_progress: "done",
    };
    return flow[status] || null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header mitraName={MITRA.companyName} />

      <div className="container max-w-2xl px-4 py-6 space-y-6">
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Order</TabsTrigger>
            <TabsTrigger value="services">Layanan</TabsTrigger>
            <TabsTrigger value="settings">Profil</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-3">
            {selectedOrder ? (
              <div className="space-y-4 animate-fade-in">
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                  ← Kembali
                </Button>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{selectedOrder.orderId}</CardTitle>
                      <Badge className={cn("text-xs", STATUS_COLORS[selectedOrder.status])}>
                        {STATUS_LABELS[selectedOrder.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium text-foreground">{selectedOrder.custName}</p>
                      <p className="text-muted-foreground">{selectedOrder.custWhatsapp}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Alamat</p>
                      <p className="font-medium text-foreground">{selectedOrder.custAddressDetail}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Jadwal</p>
                      <p className="font-medium text-foreground">{selectedOrder.bookingDate} - {selectedOrder.bookingTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Layanan</p>
                      {selectedOrder.selectedServices.map((s) => (
                        <div key={s.serviceId} className="flex justify-between">
                          <span className="text-foreground">{s.serviceName}</span>
                          <span className="font-medium text-foreground">Rp {s.price.toLocaleString("id-ID")}</span>
                        </div>
                      ))}
                      <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">
                          Rp {selectedOrder.selectedServices.reduce((s, i) => s + i.price, 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                    {selectedOrder.notes && (
                      <div>
                        <p className="text-muted-foreground">Catatan</p>
                        <p className="text-foreground">{selectedOrder.notes}</p>
                      </div>
                    )}

                    {/* Status Log */}
                    <div>
                      <p className="text-muted-foreground mb-2">Riwayat Status</p>
                      <div className="space-y-2">
                        {selectedOrder.statusLog.map((log) => (
                          <div key={log.id} className="flex gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <div>
                              <p className="text-foreground font-medium">{STATUS_LABELS[log.newStatus]}</p>
                              <p className="text-muted-foreground">{log.notes}</p>
                              <p className="text-muted-foreground">{new Date(log.createdAt).toLocaleString("id-ID")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {nextStatus(selectedOrder.status) && (
                        <Button
                          className="flex-1 mcooler-gradient"
                          onClick={() => updateOrderStatus(selectedOrder.orderId, nextStatus(selectedOrder.status)!)}
                        >
                          {STATUS_LABELS[nextStatus(selectedOrder.status)!]}
                        </Button>
                      )}
                      {selectedOrder.status !== "cancelled" && selectedOrder.status !== "done" && (
                        <Button
                          variant="outline"
                          className="text-destructive border-destructive/30"
                          onClick={() => updateOrderStatus(selectedOrder.orderId, "cancelled")}
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
                {orders.map((order) => (
                  <button
                    key={order.orderId}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full bg-card border border-border rounded-lg p-3 text-left hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-foreground">{order.orderId}</span>
                      <Badge className={cn("text-xs", STATUS_COLORS[order.status])}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">{order.custName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.bookingDate} • {order.selectedServices.length} layanan • Rp{" "}
                      {order.selectedServices.reduce((s, i) => s + i.price, 0).toLocaleString("id-ID")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-2">
            {services.map((service) => (
              <div key={service.serviceId} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{service.serviceName}</p>
                  </div>
                  <Switch
                    checked={service.isActive}
                    onCheckedChange={() => toggleService(service.serviceId)}
                  />
                </div>
                {service.isActive && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      value={service.price}
                      onChange={(e) => updateServicePrice(service.serviceId, Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profil Mitra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Nama Usaha</label>
                  <Input defaultValue={MITRA.companyName} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">WhatsApp</label>
                  <Input defaultValue={MITRA.whatsappNumber} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Alamat</label>
                  <Input defaultValue={MITRA.addressFull} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Lokasi</label>
                  <div className="mt-1">
                    <MapPickerLazy />
                  </div>
                </div>
                <Button className="w-full mcooler-gradient">Simpan</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Jam Operasional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(MITRA.operationalHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <span className="capitalize font-medium text-foreground w-20">{day}</span>
                    <div className="flex items-center gap-2">
                      {hours.isOpen ? (
                        <>
                          <span className="text-muted-foreground">{hours.open} - {hours.close}</span>
                          <Badge variant="outline" className="text-success text-[10px]">Buka</Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-destructive text-[10px]">Tutup</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Lazy map for settings
function MapPickerLazy() {
  const [show, setShow] = useState(false);
  const [MapComp, setMapComp] = useState<React.ComponentType<any> | null>(null);

  const handleShow = async () => {
    const mod = await import("@/components/MapPicker");
    setMapComp(() => mod.default);
    setShow(true);
  };

  if (!show || !MapComp) {
    return (
      <Button variant="outline" size="sm" onClick={handleShow} className="w-full">
        <MapPin className="w-4 h-4 mr-1" /> Atur Lokasi di Map
      </Button>
    );
  }
  return <MapComp onChange={() => {}} height="200px" />;
}
