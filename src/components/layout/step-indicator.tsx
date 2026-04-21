"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { WIZARD_STEPS } from "@/lib/constants";

interface StepIndicatorProps {
  currentStep: number;
  completedSteps?: number[];
}

export function StepIndicator({ currentStep, completedSteps = [] }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop: full step labels */}
      <div className="hidden sm:flex items-center justify-between">
        {WIZARD_STEPS.map((step, i) => {
          const isCompleted = completedSteps.includes(step.step);
          const isCurrent = step.step === currentStep;
          const isPast = step.step < currentStep;

          return (
            <div key={step.step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5 relative">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    isCompleted || isPast
                      ? "bg-primary-600 text-white"
                      : isCurrent
                      ? "bg-primary-600 text-white ring-4 ring-primary-100"
                      : "bg-neutral-200 text-neutral-500"
                  )}
                >
                  {isCompleted || isPast ? <Check className="h-4 w-4" /> : step.step}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium whitespace-nowrap",
                    isCurrent ? "text-primary-600" : "text-neutral-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-[-18px]",
                    isPast || isCompleted ? "bg-primary-600" : "bg-neutral-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: progress bar with step count */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-neutral-800">
            {WIZARD_STEPS.find((s) => s.step === currentStep)?.label}
          </span>
          <span className="text-sm text-neutral-500">
            Step {currentStep} of {WIZARD_STEPS.length}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
