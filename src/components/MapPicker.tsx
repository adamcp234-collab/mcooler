import { useState, useRef, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { MapPin, Crosshair, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  value?: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: string;
}

function MapEvents({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onMove(center.lat, center.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function MapPicker({ value, onChange, height = "300px" }: MapPickerProps) {
  const [center, setCenter] = useState(value || { lat: -6.2088, lng: 106.8456 });
  const [locating, setLocating] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);

  const handleMove = useCallback((lat: number, lng: number) => {
    setCenter({ lat, lng });
  }, []);

  const handleSetLocation = () => {
    onChange(center);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(coords);
        setFlyTo(coords);
        onChange(coords);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-border" style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onMove={handleMove} />
        {flyTo && <RecenterMap lat={flyTo.lat} lng={flyTo.lng} />}
      </MapContainer>

      {/* Fixed center marker */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
        <MapPin className="w-8 h-8 text-primary -mt-8 drop-shadow-lg" fill="hsl(var(--primary))" />
        <div className="absolute w-2 h-2 rounded-full bg-primary" />
      </div>

      {/* Controls */}
      <div className="absolute bottom-3 left-3 right-3 flex gap-2 z-[1000]">
        <Button
          type="button"
          size="sm"
          onClick={handleSetLocation}
          className="flex-1 mcooler-gradient"
        >
          <Check className="w-4 h-4 mr-1" /> Set Lokasi
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleGPS}
          disabled={locating}
          className="bg-card"
        >
          <Crosshair className="w-4 h-4 mr-1" />
          {locating ? "..." : "GPS"}
        </Button>
      </div>

      {/* Coordinates display */}
      <div className="absolute top-3 left-3 z-[1000] bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground">
        {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
      </div>
    </div>
  );
}
