import { useParams, Link } from "react-router-dom";
import { CheckCircle, Home, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

export default function OrderSuccess() {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-lg px-4 py-16 text-center space-y-6">
        <div className="animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Order Berhasil!</h1>
          <p className="text-muted-foreground mt-2">
            Pesanan Anda telah dikirim. Mitra kami akan segera menghubungi Anda melalui WhatsApp.
          </p>
          <div className="bg-card border border-border rounded-lg p-4 mt-6">
            <p className="text-sm text-muted-foreground">No. Order</p>
            <p className="text-xl font-bold text-primary tracking-wider">{orderId}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Link to="/">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" /> Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
