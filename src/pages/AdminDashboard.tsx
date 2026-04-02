import { useState } from "react";
import {
  BarChart3, Users, Package, Settings, TrendingUp,
  CheckCircle, AlertCircle, Clock, XCircle, Eye,
  Search
} from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MOCK_MITRAS, MOCK_ORDERS } from "@/data/mockData";
import { STATUS_LABELS, STATUS_COLORS } from "@/data/services";

export default function AdminDashboard() {
  const [searchOrders, setSearchOrders] = useState("");
  const [searchMitra, setSearchMitra] = useState("");

  const filteredOrders = MOCK_ORDERS.filter(
    (o) =>
      o.orderId.toLowerCase().includes(searchOrders.toLowerCase()) ||
      o.custName.toLowerCase().includes(searchOrders.toLowerCase())
  );

  const filteredMitras = MOCK_MITRAS.filter(
    (m) =>
      m.companyName.toLowerCase().includes(searchMitra.toLowerCase()) ||
      m.slug.toLowerCase().includes(searchMitra.toLowerCase())
  );

  const totalRevenue = MOCK_ORDERS
    .filter((o) => o.status === "done")
    .reduce((sum, o) => sum + o.selectedServices.reduce((s, i) => s + i.price, 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-4xl px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Kelola mitra, order, dan layanan MCOOLER</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Order", value: MOCK_ORDERS.length, icon: Package, color: "text-primary" },
            { label: "Mitra Aktif", value: MOCK_MITRAS.filter((m) => m.isActive).length, icon: Users, color: "text-success" },
            { label: "Order Pending", value: MOCK_ORDERS.filter((o) => o.status === "pending").length, icon: AlertCircle, color: "text-warning" },
            { label: "Pendapatan", value: `Rp ${(totalRevenue / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-primary" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="mcooler-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-muted")}>
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

        <Tabs defaultValue="orders">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Semua Order</TabsTrigger>
            <TabsTrigger value="mitras">Mitra</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari order..."
                value={searchOrders}
                onChange={(e) => setSearchOrders(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="space-y-2">
              {filteredOrders.map((order) => (
                <Card key={order.orderId} className="mcooler-card">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-foreground">{order.orderId}</span>
                      <Badge className={cn("text-xs", STATUS_COLORS[order.status])}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">{order.custName} • {order.custWhatsapp}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mitra: {MOCK_MITRAS.find((m) => m.id === order.mitraId)?.companyName || "-"} •{" "}
                      {order.bookingDate} {order.bookingTime} •{" "}
                      Rp {order.selectedServices.reduce((s, i) => s + i.price, 0).toLocaleString("id-ID")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mitras" className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari mitra..."
                value={searchMitra}
                onChange={(e) => setSearchMitra(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="space-y-2">
              {filteredMitras.map((mitra) => (
                <Card key={mitra.id} className="mcooler-card">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-foreground">{mitra.companyName}</span>
                      <Badge variant="outline" className={cn("text-xs", mitra.isActive ? "text-success" : "text-destructive")}>
                        {mitra.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">/{mitra.slug} • {mitra.addressFull}</p>
                    <p className="text-xs text-muted-foreground">
                      {mitra.services.filter((s) => s.isActive).length} layanan aktif • {mitra.whatsappNumber}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
