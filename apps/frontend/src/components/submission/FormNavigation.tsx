import { ArrowLeft, ArrowRight, LoaderCircle, Send } from 'lucide-react';
export function FormNavigation({
  currentStep,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
}: {
  currentStep: number;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-4 pt-4 sm:flex-row sm:justify-between">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="flex items-center justify-center gap-2 rounded-xl border border-outline px-6 py-3.5 font-label text-label-md font-medium text-on-surface transition-all hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="h-4 w-4" />
        Sebelumnya
      </button>
      {currentStep < 4 ? (
        <button
          type="button"
          onClick={onNext}
          className="group flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 font-label text-label-md font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-600/25 active:scale-[0.98]"
        >
          Selanjutnya
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-600 px-8 py-3.5 font-label text-label-md font-semibold text-white transition-all hover:shadow-xl hover:shadow-emerald-600/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              <span>Mengirim...</span>
            </>
          ) : (
            <>
              <span>Ajukan Permohonan</span>
              <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
          <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
        </button>
      )}
    </div>
  );
}
