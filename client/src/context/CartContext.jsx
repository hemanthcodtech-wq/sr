import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { success, info, error } = useToast();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userId = user?._id || user?.id || null;
  const cartStorageKey = userId ? `amezon_cart_${userId}` : null;
  const wishlistStorageKey = userId ? `amezon_wishlist_${userId}` : null;

  // Initialize cart state
  const [cartItems, setCartItems] = useState(() => {
    try {
      if (userId) {
        const saved = localStorage.getItem(`amezon_cart_${userId}`) || localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Initialize wishlist state
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      if (userId) {
        const saved = localStorage.getItem(`amezon_wishlist_${userId}`);
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Sync cart and wishlist when authenticated user changes
  useEffect(() => {
    if (isAuthenticated && userId) {
      try {
        const savedCart = localStorage.getItem(`amezon_cart_${userId}`) || localStorage.getItem('cart');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
        const savedWishlist = localStorage.getItem(`amezon_wishlist_${userId}`);
        if (savedWishlist) {
          setWishlistItems(JSON.parse(savedWishlist));
        }
      } catch (e) {
        console.error('Failed to load user cart/wishlist', e);
      }
    } else {
      // Clear in-memory cart and wishlist for guests / logged-out users
      setCartItems([]);
      setWishlistItems([]);
    }
  }, [isAuthenticated, userId]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated && cartStorageKey) {
      try {
        localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
        // Keep fallback synchronized for backwards compatibility
        localStorage.setItem('cart', JSON.stringify(cartItems));
      } catch (e) {
        console.error('Failed to save cart', e);
      }
    }
  }, [cartItems, isAuthenticated, cartStorageKey]);

  // Persist wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated && wishlistStorageKey) {
      try {
        localStorage.setItem(wishlistStorageKey, JSON.stringify(wishlistItems));
      } catch (e) {
        console.error('Failed to save wishlist', e);
      }
    }
  }, [wishlistItems, isAuthenticated, wishlistStorageKey]);

  // Add to cart - Strictly requires authentication
  const addToCart = useCallback(
    (product, quantity = 1) => {
      if (!isAuthenticated) {
        error('Please sign in to add products to your shopping bag.');
        navigate('/login', { state: { from: location } });
        return false;
      }

      let toastMsg = null;
      let toastType = 'success';

      setCartItems((prevItems) => {
        const existing = prevItems.find((item) => item.product._id === product._id);
        if (existing) {
          const updatedQty = existing.quantity + quantity;
          if (product.stock && updatedQty > product.stock) {
            toastMsg = `Only ${product.stock} items currently in stock.`;
            toastType = 'info';
            return prevItems;
          }
          toastMsg = `Updated ${product.title} quantity to ${updatedQty}`;
          toastType = 'success';
          return prevItems.map((item) =>
            item.product._id === product._id ? { ...item, quantity: updatedQty } : item
          );
        } else {
          if (product.stock && quantity > product.stock) {
            toastMsg = `Only ${product.stock} items available in stock.`;
            toastType = 'info';
            return prevItems;
          }
          toastMsg = `Added "${product.title}" to your cart!`;
          toastType = 'success';
          return [...prevItems, { product, quantity, store: product.store || product.vendor?.store }];
        }
      });

      if (toastMsg) {
        if (toastType === 'info') info(toastMsg);
        else success(toastMsg);
      }
      return true;
    },
    [isAuthenticated, error, navigate, location, info, success]
  );

  const removeFromCart = useCallback(
    (productId) => {
      let removedTitle = null;
      setCartItems((prevItems) => {
        const removed = prevItems.find((item) => item.product._id === productId);
        if (removed) {
          removedTitle = removed.product.title;
        }
        return prevItems.filter((item) => item.product._id !== productId);
      });
      if (removedTitle) {
        info(`Removed "${removedTitle}" from your cart`);
      }
    },
    [info]
  );

  const updateQuantity = useCallback(
    (productId, newQuantity) => {
      if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
      }
      setCartItems((prevItems) =>
        prevItems.map((item) => {
          if (item.product._id === productId) {
            if (item.product.stock && newQuantity > item.product.stock) {
              info(`Cannot exceed available stock (${item.product.stock})`);
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
      );
    },
    [removeFromCart, info]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    if (cartStorageKey) localStorage.removeItem(cartStorageKey);
    localStorage.removeItem('cart');
  }, [cartStorageKey]);

  // Wishlist Actions - Strictly requires authentication
  const toggleWishlist = useCallback(
    (product) => {
      if (!isAuthenticated) {
        error('Please sign in to save products to your wishlist.');
        navigate('/login', { state: { from: location } });
        return false;
      }

      let toastMsg = null;
      let toastType = 'success';
      let added = false;

      setWishlistItems((prev) => {
        const exists = prev.some((item) => item._id === product._id);
        if (exists) {
          toastMsg = `Removed "${product.title}" from your wishlist`;
          toastType = 'info';
          added = false;
          return prev.filter((item) => item._id !== product._id);
        } else {
          toastMsg = `Saved "${product.title}" to your wishlist!`;
          toastType = 'success';
          added = true;
          return [...prev, product];
        }
      });

      if (toastMsg) {
        if (toastType === 'info') info(toastMsg);
        else success(toastMsg);
      }
      return added;
    },
    [isAuthenticated, error, navigate, location, info, success]
  );

  const isInWishlist = useCallback(
    (productId) => {
      return wishlistItems.some((item) => item._id === productId);
    },
    [wishlistItems]
  );

  const removeFromWishlist = useCallback(
    (productId) => {
      let removedTitle = null;
      setWishlistItems((prev) => {
        const removed = prev.find((item) => item._id === productId);
        if (removed) {
          removedTitle = removed.title;
        }
        return prev.filter((item) => item._id !== productId);
      });
      if (removedTitle) {
        info(`Removed "${removedTitle}" from your wishlist`);
      }
    },
    [info]
  );

  const moveToCart = useCallback(
    (product) => {
      if (!isAuthenticated) {
        error('Please sign in to manage your shopping cart.');
        navigate('/login', { state: { from: location } });
        return;
      }
      const added = addToCart(product, 1);
      if (added) {
        setWishlistItems((prev) => prev.filter((item) => item._id !== product._id));
      }
    },
    [isAuthenticated, error, navigate, location, addToCart]
  );

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
    if (wishlistStorageKey) localStorage.removeItem(wishlistStorageKey);
  }, [wishlistStorageKey]);

  const cartTotal = cartItems.reduce((total, item) => {
    const itemPrice =
      item.product.discountPrice && item.product.discountPrice < item.product.price
        ? item.product.discountPrice
        : item.product.price || 0;
    return total + itemPrice * item.quantity;
  }, 0);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
    // Wishlist
    wishlistItems,
    wishlistCount,
    toggleWishlist,
    isInWishlist,
    removeFromWishlist,
    moveToCart,
    clearWishlist,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

