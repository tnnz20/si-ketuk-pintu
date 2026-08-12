import { ArrowRight, Eye, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../lib/api/auth';

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(identifier, password);
      navigate('/admin');
    } catch {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <main className="w-full max-w-md">
        <div className="rounded-lg border border-surface-alt bg-surface-container-lowest p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center mb-8">
            <img src="/assets/logo.webp" alt="Si Ketuk Pintu Logo" className="h-24 w-24 object-contain" />
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface">Admin Login</h1>
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">Sign in to manage visitor requests.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && <div className="rounded bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-label-md text-label-md text-on-surface">Email Address or Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
                <input
                  id="email"
                  className="w-full rounded border border-surface-alt bg-surface-container-lowest py-2 pl-10 pr-3 font-body-md text-body-md transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="admin@domain.gov"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  type="text"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="font-label-md text-label-md text-on-surface">Password</label>
                <a className="font-label-sm text-label-sm text-primary hover:underline" href="#">Forgot Password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
                <input
                  id="password"
                  className="w-full rounded border border-surface-alt bg-surface-container-lowest py-2 pl-10 pr-10 font-body-md text-body-md transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                />
                <button type="button" className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline hover:text-on-surface">
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full rounded bg-primary py-3 font-label-md text-label-md text-on-primary transition-opacity hover:opacity-90 active:opacity-80 flex justify-center items-center gap-2">
              {isLoading ? 'Loading...' : 'Login'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
