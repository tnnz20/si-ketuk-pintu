import { useSearchParams } from 'react-router-dom';
import RequestNotFoundState from '../../components/requests/RequestNotFoundState';

export default function RequestNotFound() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  return (
    <RequestNotFoundState
      token={token}
      tokenFallback="provided"
      tryAnotherTokenLink
      backToHomeIcon="arrow-left"
    />
  );
}
