import { Outlet } from 'react-router';
import Footer from './Footer';
import TopBar from './TopBar';

export default function LandingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <TopBar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
