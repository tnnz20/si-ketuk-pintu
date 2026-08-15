import { ArrowLeft, FileQuestion, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function RequestNotFound() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-margin-mobile py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-error-container text-error">
        <FileQuestion className="h-10 w-10" aria-hidden="true" />
      </div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Request Not Found</h1>
      <p className="font-body-md mt-4 text-body-md text-on-surface-variant">
        No visitor request matches token{' '}
        <strong className="text-on-surface">{token || 'provided'}</strong>.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/#status"
          className="font-label-md flex items-center justify-center gap-2 rounded bg-primary px-6 py-3 text-label-md text-on-primary"
        >
          <Search className="h-4 w-4" aria-hidden="true" /> Try another token
        </Link>
        <Link
          to="/"
          className="font-label-md flex items-center justify-center gap-2 rounded border border-outline px-6 py-3 text-label-md text-on-surface"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Home
        </Link>
      </div>
    </div>
  );
}
