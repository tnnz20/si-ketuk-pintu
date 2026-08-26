import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

type Step = { id: number; title: string; icon: React.ComponentType<{ className?: string }> };
export function StepIndicators({
  steps,
  currentStep,
  reduce,
  onSelect,
}: {
  steps: Step[];
  currentStep: number;
  reduce: boolean;
  onSelect: (step: number) => void;
}) {
  return (
    <motion.div
      variants={reduce ? undefined : undefined}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-2 overflow-x-auto pb-2 md:gap-4"
    >
      {steps.map((step, index) => {
        const completed = currentStep > step.id;
        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => completed && onSelect(step.id)}
              disabled={currentStep <= step.id}
              className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 transition-all disabled:cursor-not-allowed ${currentStep === step.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25' : completed ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20' : 'bg-surface-container text-on-surface-variant'}`}
            >
              {completed ? <CheckCircle2 className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
              <span className="font-label text-label-sm font-medium whitespace-nowrap">
                {step.title}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`mx-2 h-px w-8 md:w-12 ${completed ? 'bg-emerald-500' : 'bg-surface-alt'}`}
              />
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
