import { useState } from "react";
import { Package, Users, AlertCircle, TrendingUp, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/data/services";

export default function AdminDashboard() {
  const [searchOrders, setSearchOrders] = useState("");
  const [searchMitra, setSearchMitra] = useState("");

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
  });

  const { data: mitras = [] } = useQuery({
    queryKey: ["admin-mitras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ms_mitra_det")
        .select("*")
        .order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const filteredOrders = orders.filter(
    (o) => o.order_id.toLowerCase().includes(searchOrders.toLowerCase()) || o.cust_name.toLowerCase().includes(searchOrders.toLowerCase())
  );
  const filteredMitras = mitras.filter(
    (m) => m.company_name.toLowerCase().includes(searchMitra.toLowerCase()) || m.slug.toLowerCase().includes(searchMitra.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-4xl px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Kelola mitra, order, dan layanan MCOOLER</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Order", value: orders.length, icon: Package, color: "text-primary" },
            { label: "Mitra Aktif", value: mitras.filter((m) => m.is_active).length, icon: Users, color: "text-success" },
            { label: "Pending", value: orders.filter((o) => o.status === "pending").length, icon: AlertCircle, color: "text-warning" },
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

        <Tabs defaultValue="orders">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Semua Order</TabsTrigger>
            <TabsTrigger value="mitras">Mitra</TabsTrigger>
          </TabsList>

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
            {filteredMitras.map((mitra) => (
              <Card key={mitra.mitra_id} className="mcooler-card">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-foreground">{mitra.company_name}</span>
                    <Badge variant="outline" className={cn("text-xs", mitra.is_active ? "text-success" : "text-destructive")}>
                      {mitra.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">/{mitra.slug} • {mitra.address_full}</p>
                </CardContent>
              </Card>
            ))}
            {filteredMitras.length === 0 && <p className="text-center text-muted-foreground py-8">Tidak ada mitra.</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
