import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Footer from './Footer';
import TopBar from './TopBar';

type LayoutProps = {
  children: ReactNode;
  showTopBar?: boolean;
  showFooter?: boolean;
};

export default function Layout({ children, showTopBar, showFooter }: LayoutProps) {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  const displayTopBar = showTopBar ?? !isAdminRoute;
  const displayFooter = showFooter ?? !isAdminRoute;

  return (
    <div className="min-h-screen bg-background text-on-background">
      {displayTopBar && <TopBar />}
      <main className={displayTopBar ? 'pt-20' : undefined}>{children}</main>
      {displayFooter && <Footer />}
    </div>
  );
}
