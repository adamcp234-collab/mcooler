import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/data/services";

export interface ServiceItem {
  serviceId: string;
  serviceName: string;
  price: number;
  isActive: boolean;
  description: string;
}

interface ServiceSelectorProps {
  services: ServiceItem[];
  selected: string[];
  onToggle: (serviceId: string) => void;
}

export default function ServiceSelector({ services, selected, onToggle }: ServiceSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>(SERVICE_CATEGORIES[0]);
  const activeServices = services.filter((s) => s.isActive);

  const grouped = SERVICE_CATEGORIES.reduce<Record<string, ServiceItem[]>>((acc, cat) => {
    const items = activeServices.filter((s) => {
      const name = s.serviceName.toLowerCase();
      switch (cat) {
        case "Cuci AC": return name.includes("cuci");
        case "Tambah Freon": return name.includes("tambah freon");
        case "Isi Freon": return name.includes("isi freon");
        case "Bongkar & Pasang": return name.includes("bongkar") || name.includes("pasang") || name.includes("bobok");
        case "Perbaikan & Perawatan": return name.includes("las ") || name.includes("pengecekan") || name.includes("kapasitor");
        case "Lainnya": return name.includes("vacuum") || name.includes("flushing") || name.includes("apartemen");
        default: return false;
      }
    });
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const availableCategories = Object.keys(grouped);

  // Auto-select first available category
  const effectiveCategory = availableCategories.includes(activeCategory)
    ? activeCategory
    : availableCategories[0] || "";

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {availableCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              effectiveCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {(grouped[effectiveCategory] || []).map((service) => {
          const isSelected = selected.includes(service.serviceId);
          return (
            <button
              key={service.serviceId}
              type="button"
              onClick={() => onToggle(service.serviceId)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{service.serviceName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                  Rp {service.price.toLocaleString("id-ID")}
                </span>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors",
                    isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
