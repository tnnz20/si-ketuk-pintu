import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';

function ScrollToHashOrTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return null;
}

export default function MainLayout() {
  return (
    <div className="selection:bg-civic-neutralFill flex min-h-screen flex-col bg-background text-on-background selection:text-civic-dark">
      <ScrollToHashOrTop />
      <TopBar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
