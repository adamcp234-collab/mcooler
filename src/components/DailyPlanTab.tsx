import { useState, useEffect, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CalendarIcon, MapPin, Navigation, Clock, Route, ExternalLink,
  Crosshair, ChevronDown, ChevronUp, ArrowUpDown
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS } from "@/data/services";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const vendorIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const orderIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const statusMarkerColor: Record<string, string> = {
  pending: "orange",
  confirmed: "yellow",
  on_progress: "green",
  done: "grey",
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type SortMode = "time" | "nearest" | "farthest";

interface Order {
  order_id: string;
  cust_name: string;
  cust_address_detail: string | null;
  cust_latitude: number | null;
  cust_longitude: number | null;
  booking_date: string;
  booking_time: string;
  status: string;
  selected_services: any;
}

interface DailyPlanTabProps {
  orders: Order[];
  mitraId: string;
  mitraLat?: number | null;
  mitraLng?: number | null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [points, map]);
  return null;
}

export default function DailyPlanTab({ orders, mitraId, mitraLat, mitraLng }: DailyPlanTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sortMode, setSortMode] = useState<SortMode>("time");
  const [vendorPos, setVendorPos] = useState<{ lat: number; lng: number } | null>(
    mitraLat && mitraLng ? { lat: mitraLat, lng: mitraLng } : null
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [optimizedRoute, setOptimizedRoute] = useState<Order[] | null>(null);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);

  // Update vendorPos when mitraLat/mitraLng changes
  useEffect(() => {
    if (mitraLat && mitraLng && !vendorPos) {
      setVendorPos({ lat: mitraLat, lng: mitraLng });
    }
  }, [mitraLat, mitraLng]);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Filter orders for selected date, exclude cancelled
  const dayOrders = useMemo(
    () => orders.filter((o) => o.booking_date === dateStr && o.status !== "cancelled"),
    [orders, dateStr]
  );

  // Calculate distances
  const ordersWithDist = useMemo(() => {
    return dayOrders.map((o) => {
      let dist: number | null = null;
      if (vendorPos && o.cust_latitude && o.cust_longitude) {
        dist = haversine(vendorPos.lat, vendorPos.lng, o.cust_latitude, o.cust_longitude);
      }
      return { ...o, distance: dist };
    });
  }, [dayOrders, vendorPos]);

  // Sort
  const sortedOrders = useMemo(() => {
    const list = optimizedRoute
      ? optimizedRoute.map((o) => ordersWithDist.find((od) => od.order_id === o.order_id)!)
      : [...ordersWithDist];

    if (optimizedRoute) return list;

    switch (sortMode) {
      case "time":
        return list.sort((a, b) => a.booking_time.localeCompare(b.booking_time));
      case "nearest":
        return list.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
      case "farthest":
        return list.sort((a, b) => (b.distance ?? 0) - (a.distance ?? 0));
      default:
        return list;
    }
  }, [ordersWithDist, sortMode, optimizedRoute]);

  // Nearest Neighbor route optimization
  const optimizeRoute = useCallback(() => {
    if (!vendorPos || ordersWithDist.length === 0) return;

    const validOrders = ordersWithDist.filter((o) => o.cust_latitude && o.cust_longitude);
    if (validOrders.length === 0) return;

    const visited: Order[] = [];
    const remaining = [...validOrders];
    let currentLat = vendorPos.lat;
    let currentLng = vendorPos.lng;
    let totalDist = 0;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = haversine(currentLat, currentLng, remaining[i].cust_latitude!, remaining[i].cust_longitude!);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }
      const next = remaining.splice(nearestIdx, 1)[0];
      visited.push(next);
      totalDist += nearestDist;
      currentLat = next.cust_latitude!;
      currentLng = next.cust_longitude!;
    }

    // Add orders without coords at the end
    const noCoords = ordersWithDist.filter((o) => !o.cust_latitude || !o.cust_longitude);
    setOptimizedRoute([...visited, ...noCoords]);
    setTotalDistance(totalDist);
  }, [vendorPos, ordersWithDist]);

  const clearRoute = () => {
    setOptimizedRoute(null);
    setTotalDistance(null);
  };

  // GPS
  const requestGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setVendorPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true }
    );
  };

  // Google Maps navigation URL
  const getNavigationUrl = () => {
    if (!vendorPos) return "";
    const list = optimizedRoute || sortedOrders;
    const validPts = list.filter((o) => o.cust_latitude && o.cust_longitude);
    if (validPts.length === 0) return "";

    const origin = `${vendorPos.lat},${vendorPos.lng}`;
    const destination = `${validPts[validPts.length - 1].cust_latitude},${validPts[validPts.length - 1].cust_longitude}`;
    const waypoints = validPts
      .slice(0, -1)
      .slice(0, 9) // max 9 waypoints + destination
      .map((o) => `${o.cust_latitude},${o.cust_longitude}`)
      .join("/");

    return waypoints
      ? `https://www.google.com/maps/dir/${origin}/${waypoints}/${destination}`
      : `https://www.google.com/maps/dir/${origin}/${destination}`;
  };

  // Map points
  const mapPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (vendorPos) pts.push([vendorPos.lat, vendorPos.lng]);
    sortedOrders.forEach((o) => {
      if (o.cust_latitude && o.cust_longitude) pts.push([o.cust_latitude, o.cust_longitude]);
    });
    return pts;
  }, [vendorPos, sortedOrders]);

  // Polyline positions
  const polylinePositions = useMemo(() => {
    const pts: [number, number][] = [];
    if (vendorPos) pts.push([vendorPos.lat, vendorPos.lng]);
    const list = optimizedRoute || sortedOrders;
    list.forEach((o) => {
      if (o.cust_latitude && o.cust_longitude) pts.push([o.cust_latitude, o.cust_longitude]);
    });
    return pts;
  }, [vendorPos, sortedOrders, optimizedRoute]);

  const defaultCenter: [number, number] = vendorPos
    ? [vendorPos.lat, vendorPos.lng]
    : [-6.2088, 106.8456];

  return (
    <div className="space-y-4">
      {/* Header: Date picker + GPS + Sort */}
      <div className="flex flex-wrap gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarIcon className="w-4 h-4" />
              {format(selectedDate, "dd MMM yyyy", { locale: idLocale })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { if (d) { setSelectedDate(d); clearRoute(); } }}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" onClick={requestGPS} disabled={gpsLoading} className="gap-1">
          <Crosshair className="w-4 h-4" />
          {gpsLoading ? "..." : "GPS"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMap(!showMap)}
          className="gap-1 ml-auto"
        >
          <MapPin className="w-4 h-4" />
          {showMap ? "Sembunyikan Peta" : "Tampilkan Peta"}
        </Button>
      </div>

      {/* Map */}
      {showMap && dayOrders.length > 0 && (
        <div className="rounded-lg overflow-hidden border border-border" style={{ height: "280px" }}>
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapPoints.length > 0 && <FitBounds points={mapPoints} />}

            {vendorPos && (
              <Marker position={[vendorPos.lat, vendorPos.lng]} icon={vendorIcon} />
            )}

            {sortedOrders.map((o) =>
              o.cust_latitude && o.cust_longitude ? (
                <Marker
                  key={o.order_id}
                  position={[o.cust_latitude, o.cust_longitude]}
                  icon={orderIcon(statusMarkerColor[o.status] || "red")}
                />
              ) : null
            )}

            {polylinePositions.length > 1 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{ color: "hsl(var(--primary))", weight: 3, dashArray: optimizedRoute ? undefined : "8 4" }}
              />
            )}
          </MapContainer>
        </div>
      )}

      {/* Sort & Route actions */}
      {dayOrders.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 bg-muted rounded-md p-0.5">
            {([
              { key: "time", label: "Waktu" },
              { key: "nearest", label: "Terdekat" },
              { key: "farthest", label: "Terjauh" },
            ] as { key: SortMode; label: string }[]).map((s) => (
              <button
                key={s.key}
                onClick={() => { setSortMode(s.key); clearRoute(); }}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-sm transition-colors",
                  sortMode === s.key && !optimizedRoute
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant={optimizedRoute ? "default" : "outline"}
            onClick={optimizedRoute ? clearRoute : optimizeRoute}
            disabled={!vendorPos}
            className="gap-1 text-xs"
          >
            <Route className="w-3.5 h-3.5" />
            {optimizedRoute ? "Reset Rute" : "Rute Otomatis"}
          </Button>

          {vendorPos && sortedOrders.some((o) => o.cust_latitude) && (
            <Button
              size="sm"
              className="gap-1 text-xs mcooler-gradient ml-auto"
              onClick={() => window.open(getNavigationUrl(), "_blank")}
            >
              <Navigation className="w-3.5 h-3.5" />
              Start Navigation
            </Button>
          )}
        </div>
      )}

      {/* Route summary */}
      {optimizedRoute && totalDistance !== null && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
          <p className="font-medium text-foreground">
            🛣️ Rute Optimal — {sortedOrders.length} lokasi
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Estimasi jarak total: <span className="font-semibold text-foreground">{totalDistance.toFixed(1)} km</span>
            {" · "}
            Estimasi waktu: <span className="font-semibold text-foreground">~{Math.round(totalDistance * 2)} menit</span>
          </p>
        </div>
      )}

      {/* Empty state */}
      {dayOrders.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">Tidak ada order untuk tanggal ini</p>
          <p className="text-xs text-muted-foreground mt-1">Pilih tanggal lain atau tunggu order baru masuk</p>
        </div>
      )}

      {/* Order list */}
      <div className="space-y-2">
        {sortedOrders.map((order, idx) => {
          const services = (order.selected_services as any[]) || [];
          const isActive = order.status === "on_progress";
          return (
            <Card
              key={order.order_id}
              className={cn(
                "transition-all",
                isActive && "ring-2 ring-primary/50 bg-primary/5"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {optimizedRoute && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold mr-1.5">
                        {idx + 1}
                      </span>
                    )}
                    <span className="font-semibold text-sm text-foreground">{order.cust_name}</span>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {order.booking_time?.slice(0, 5)}
                    </div>
                    {order.cust_address_detail && (
                      <div className="flex items-start gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{order.cust_address_detail}</span>
                      </div>
                    )}
                    {order.distance != null && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        📏 {order.distance.toFixed(1)} km dari posisi Anda
                      </p>
                    )}
                    {services.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        🔧 {services.map((s: any) => s.serviceName).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge
                      className={cn("text-[10px]", STATUS_COLORS[order.status as keyof typeof STATUS_COLORS])}
                    >
                      {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
                    </Badge>
                    {order.cust_latitude && order.cust_longitude && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] gap-1 px-2"
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${order.cust_latitude},${order.cust_longitude}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="w-3 h-3" />
                        Maps
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
