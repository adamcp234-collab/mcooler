import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OrderStepperProps {
  steps: string[];
  currentStep: number;
}

export default function OrderStepper({ steps, currentStep }: OrderStepperProps) {
  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                i < currentStep
                  ? "bg-primary text-primary-foreground"
                  : i === currentStep
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn(
              "text-[10px] mt-1 text-center whitespace-nowrap",
              i <= currentStep ? "text-primary font-medium" : "text-muted-foreground"
            )}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              "h-0.5 flex-1 mx-1 mt-[-16px]",
              i < currentStep ? "bg-primary" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
