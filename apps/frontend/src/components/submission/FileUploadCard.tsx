import { CheckCircle2, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export function FileUploadCard({
  title,
  description,
  file,
  error,
  onFileChange,
  reduce,
}: {
  title: string;
  description: string;
  file?: File;
  error?: string;
  onFileChange: (file: File | undefined) => void;
  reduce: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') onFileChange(droppedFile);
  };
  return (
    <motion.div
      animate={reduce ? undefined : { scale: isDragging ? 1.02 : 1 }}
      className={`group relative overflow-hidden rounded-xl border-2 border-dashed transition-all ${isDragging ? 'border-emerald-500 bg-emerald-500/10' : file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-outline-variant bg-surface hover:border-emerald-500/30 hover:bg-surface-container-low'}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center p-6 text-center">
        {file ? (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <button
              type="button"
              onClick={() =>
                window.open(URL.createObjectURL(file), '_blank', 'noopener,noreferrer')
              }
              title="Klik untuk pratinjau di tab baru"
              className="mb-1 max-w-full truncate font-label text-label-md font-medium text-emerald-700 underline decoration-emerald-500/30 underline-offset-2 transition-colors hover:decoration-emerald-700 cursor-pointer"
            >
              {file.name}
            </button>
            <p className="mb-4 font-label text-label-sm text-on-surface-variant">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={() => onFileChange(undefined)}
              className="font-label text-label-sm text-error underline decoration-error/30 underline-offset-2 transition-colors hover:decoration-error cursor-pointer"
            >
              Hapus file
            </button>
          </>
        ) : (
          <>
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${isDragging ? 'bg-emerald-500/20' : 'bg-surface-container group-hover:bg-emerald-500/10'}`}
            >
              <Upload
                className={`h-8 w-8 transition-colors ${isDragging ? 'text-emerald-600' : 'text-on-surface-variant group-hover:text-emerald-600'}`}
              />
            </div>
            <p className="mb-1 font-label text-label-md font-medium text-on-surface">{title}</p>
            <p className="mb-2 font-label text-label-sm text-on-surface-variant">{description}</p>
            <p className="mb-4 font-label text-label-sm text-on-surface-variant/70">
              PDF, maksimal 5MB
            </p>
            <label className="cursor-pointer rounded-lg border border-outline bg-surface px-4 py-2 font-label text-label-sm font-medium text-on-surface transition-all hover:border-emerald-500 hover:text-emerald-600">
              Pilih File
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => onFileChange(event.target.files?.[0])}
                className="hidden"
              />
            </label>
            {error && <p className="mt-3 font-label text-label-sm text-error">{error}</p>}
          </>
        )}
        {error && file && <p className="mt-3 font-label text-label-sm text-error">{error}</p>}
      </div>
    </motion.div>
  );
}
