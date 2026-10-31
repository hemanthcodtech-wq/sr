import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';
import LoadingScreen from './components/LoadingScreen';
import AppRoutes from './routes/AppRoutes';

const AppLayout = () => {
  const location = useLocation();
  const { loading } = useAuth();

  // If the app is initializing or refreshing, show the animated loading screen
  if (loading) {
    return <LoadingScreen fullScreen={true} />;
  }

  // Standalone dashboard routes shouldn't render public customer marketplace headers/footers
  const isDashboardRoute =
    (location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') ||
    (location.pathname.startsWith('/vendor') && location.pathname !== '/vendor/register');

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {!isDashboardRoute && <Navbar />}
      <main className="flex-1 w-full pb-28 md:pb-0">
        <AppRoutes />
      </main>
      {!isDashboardRoute && <Footer />}
      {!isDashboardRoute && <BottomNav />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AppLayout />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
