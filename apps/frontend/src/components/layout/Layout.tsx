import { type ReactNode } from 'react';
import Footer from './Footer';
import TopBar from './TopBar';

type LayoutProps = {
  children: ReactNode;
  showTopBar?: boolean;
  showFooter?: boolean;
};

export default function Layout({ children, showTopBar = true, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {showTopBar && <TopBar />}
      <main className={showTopBar ? 'pt-20' : undefined}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
