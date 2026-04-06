import { useParams, Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle, Home, Clock, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABELS, STATUS_COLORS, type OrderStatus } from "@/data/services";
import { cn } from "@/lib/utils";
import { fetchOrderById, fetchStatusLogs } from "@/lib/api";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const orderToken = searchParams.get("token");
  const [order, setOrder] = useState<any>(null);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    
    const loadData = async () => {
      const [orderData, logs] = await Promise.all([
        fetchOrderById(orderId, orderToken || undefined),
        fetchStatusLogs(orderId),
      ]);
      setOrder(orderData);
      setStatusLogs(logs || []);
      setLoading(false);
    };
    loadData();

    // Realtime subscription for order updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ec_order_head',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new);
          // Reload status logs
          fetchStatusLogs(orderId).then(logs => setStatusLogs(logs || []));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "done": return <CheckCircle className="w-5 h-5 text-success" />;
      case "cancelled": return <XCircle className="w-5 h-5 text-destructive" />;
      case "on_progress": return <Truck className="w-5 h-5 text-primary" />;
      default: return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-lg px-4 py-10 space-y-6">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Order Berhasil!</h1>
          <p className="text-muted-foreground mt-2">
            Pesanan Anda telah dikirim. Mitra kami akan segera menghubungi Anda melalui WhatsApp.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">No. Order</p>
          <p className="text-xl font-bold text-primary tracking-wider">{orderId}</p>
          {order && (
            <Badge className={cn("mt-2 text-xs", STATUS_COLORS[order.status as OrderStatus])}>
              {STATUS_LABELS[order.status as OrderStatus]}
            </Badge>
          )}
        </div>

        {/* Order Details */}
        {order && !loading && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Detail Order</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal</span>
                <span className="text-foreground">{order.booking_date} • {order.booking_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama</span>
                <span className="text-foreground">{order.cust_name}</span>
              </div>
              {(order.selected_services as any[])?.map((s: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{s.serviceName}</span>
                  <span className="text-foreground">Rp {s.price?.toLocaleString("id-ID")}</span>
                </div>
              ))}
              <div className="border-t border-border pt-1 flex justify-between font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">
                  Rp {(order.selected_services as any[])?.reduce((sum: number, s: any) => sum + (s.price || 0), 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        {statusLogs.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Riwayat Status</h3>
            <div className="space-y-3">
              {statusLogs.map((log, i) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {statusIcon(log.new_status)}
                    {i < statusLogs.length - 1 && <div className="w-0.5 h-full bg-border mt-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium text-foreground">
                      {STATUS_LABELS[log.new_status as OrderStatus]}
                    </p>
                    <p className="text-xs text-muted-foreground">{log.notes}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to="/">
          <Button variant="outline" className="w-full">
            <Home className="w-4 h-4 mr-2" /> Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}
