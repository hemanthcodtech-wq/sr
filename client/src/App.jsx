import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import LoadingScreen from './components/LoadingScreen';
import AppRoutes from './routes/AppRoutes';

const AppLayout = () => {
  const location = useLocation();
  const { loading } = useAuth();

  // If the app is initializing or refreshing, show the luxury animated loading screen
  if (loading) {
    return <LoadingScreen fullScreen={true} />;
  }

  // Standalone dashboard routes shouldn't render public customer marketplace headers/footers
  const isDashboardRoute =
    (location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') ||
    (location.pathname.startsWith('/vendor') && location.pathname !== '/vendor/register');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {!isDashboardRoute && <Navbar />}
      <main className="flex-1 w-full">
        <AppRoutes />
      </main>
      {!isDashboardRoute && <Footer />}
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
