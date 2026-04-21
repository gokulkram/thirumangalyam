import { cn } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";
import type { PremiumPlan } from "@/types";

interface PlanCardProps {
  plan: PremiumPlan;
  selected?: boolean;
  onSelect: (planId: string) => void;
}

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-[var(--radius-xl)] border-2 p-6 transition-all",
        plan.isPopular
          ? "border-primary-600 shadow-lg scale-105"
          : selected
          ? "border-primary-400 shadow-md"
          : "border-neutral-200 hover:border-neutral-300"
      )}
    >
      {plan.isPopular && (
        <Badge variant="primary" size="sm" className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}

      <h3 className="text-lg font-semibold text-neutral-900">{plan.label}</h3>

      <div className="mt-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-neutral-900">
            &#8377;{plan.totalPrice.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="text-sm text-neutral-500 mt-0.5">
          &#8377;{plan.monthlyPrice}/month
        </p>
        {plan.savings && (
          <Badge variant="success" size="sm" className="mt-2">
            {plan.savings}
          </Badge>
        )}
      </div>

      <Button
        variant={plan.isPopular ? "primary" : "secondary"}
        fullWidth
        className="mt-6"
        onClick={() => onSelect(plan.id)}
      >
        {plan.isPopular ? "Choose Plan" : "Select"}
      </Button>
    </div>
  );
}
