import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import Home from '../pages/Home';
import Products from '../pages/Products';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Wishlist from '../pages/Wishlist';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyOtp from '../pages/VerifyOtp';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Stores from '../pages/Stores';
import StoreDetail from '../pages/StoreDetail';
import NotFound from '../pages/NotFound';

// Legal Pages
import Terms from '../pages/legal/Terms';
import Privacy from '../pages/legal/Privacy';
import ReturnRefund from '../pages/legal/ReturnRefund';
import Shipping from '../pages/legal/Shipping';

// Protected Customer Pages
import Checkout from '../pages/Checkout';
import MyOrders from '../pages/MyOrders';
import Profile from '../pages/Profile';
import OrderTracking from '../pages/OrderTracking';

// Vendor Pages
import VendorRegister from '../pages/VendorRegister';
import VendorDashboard from '../pages/vendor/VendorDashboard';
import VendorProducts from '../pages/vendor/VendorProducts';
import VendorOrders from '../pages/vendor/VendorOrders';
import VendorWallet from '../pages/vendor/VendorWallet';

// Admin Pages
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminPlans from '../pages/admin/AdminPlans';
import AdminVendors from '../pages/admin/AdminVendors';
import AdminSettlements from '../pages/admin/AdminSettlements';
import AdminSettings from '../pages/admin/AdminSettings';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/stores" element={<Stores />} />
      <Route path="/store/:id" element={<StoreDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Legal & Compliance Pages */}
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy-policy" element={<Privacy />} />
      <Route path="/return-refund" element={<ReturnRefund />} />
      <Route path="/shipping-policy" element={<Shipping />} />

      {/* Protected Customer Routes (Requires Login) */}
      <Route
        path="/cart"
        element={
          <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wishlist"
        element={
          <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
            <Wishlist />
          </ProtectedRoute>
        }
      />

      {/* Protected Customer Routes */}
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
            <Checkout />
          </ProtectedRoute>
        }
      />
      {/* Customer Portal & Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Customer Orders */}
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Live Order Tracking */}
      <Route path="/track-order" element={<OrderTracking />} />
      <Route path="/order/:id" element={<OrderTracking />} />

      {/* Vendor Store Onboarding (Any signed in user can apply) */}
      <Route
        path="/vendor/register"
        element={
          <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
            <VendorRegister />
          </ProtectedRoute>
        }
      />

      {/* Protected Vendor Routes */}
      <Route
        path="/vendor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['vendor', 'admin']}>
            <VendorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/products"
        element={
          <ProtectedRoute allowedRoles={['vendor', 'admin']}>
            <VendorProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/orders"
        element={
          <ProtectedRoute allowedRoles={['vendor', 'admin']}>
            <VendorOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/wallet"
        element={
          <ProtectedRoute allowedRoles={['vendor', 'admin']}>
            <VendorWallet />
          </ProtectedRoute>
        }
      />

      {/* Admin Authentication */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vendors"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminVendors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/plans"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPlans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settlements"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettlements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      {/* 404 Catch-All Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
