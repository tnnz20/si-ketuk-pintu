import { useSearchParams } from 'react-router';
import RequestNotFoundState from '@components/requests/RequestNotFoundState';
import Seo from '@components/shared/Seo';

export default function RequestNotFound() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  return (
    <>
      <Seo title="Halaman Tidak Ditemukan — Si Ketuk Pintu" noindex />
      <RequestNotFoundState
        token={token}
        tokenFallback="provided"
        backToHomeIcon="arrow-left"
      />
    </>
  );
}
