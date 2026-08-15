import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import TopBar from './TopBar';

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <TopBar />
      <main className="pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
