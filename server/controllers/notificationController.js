const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { mockNotifications } = require('../config/mockStore');

// Helper to push a notification (works in both MongoDB and mock store)
const createNotification = async ({ recipient, role = 'customer', type = 'system', title, message, link = '', metadata = {} }) => {
  try {
    if (mongoose.connection.readyState === 1) {
      return await Notification.create({
        recipient,
        role,
        type,
        title,
        message,
        link,
        metadata,
        isRead: false,
      });
    } else {
      const mockNotif = {
        _id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        recipient: recipient ? (recipient._id || recipient) : null,
        role,
        type,
        title,
        message,
        link,
        metadata,
        isRead: false,
        createdAt: new Date(),
      };
      mockNotifications.unshift(mockNotif);
      return mockNotif;
    }
  } catch (err) {
    console.warn('[Notification Create Warning]:', err.message);
    return null;
  }
};

// @desc    Get user/vendor/admin notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { unreadOnly } = req.query;

    if (mongoose.connection.readyState !== 1) {
      let filtered = mockNotifications.filter((n) => {
        // Admin gets all admin notifications or broadcasts
        if (user.role === 'admin') {
          return n.role === 'admin' || n.role === 'all' || n.recipient === user._id;
        }
        // Vendor gets vendor notifications
        if (user.role === 'vendor') {
          return (
            (n.role === 'vendor' && (!n.recipient || n.recipient === user._id || n.recipient === user.id)) ||
            n.role === 'all'
          );
        }
        // Customer gets customer notifications
        return (
          (n.role === 'customer' && (!n.recipient || n.recipient === user._id || n.recipient === user.id)) ||
          n.role === 'all'
        );
      });

      if (unreadOnly === 'true') {
        filtered = filtered.filter((n) => !n.isRead);
      }

      const unreadCount = filtered.filter((n) => !n.isRead).length;

      return res.status(200).json({
        success: true,
        count: filtered.length,
        unreadCount,
        notifications: filtered,
      });
    }

    // Live MongoDB Query
    const query = {
      $or: [
        { recipient: user._id },
        { role: user.role, recipient: null },
        { role: 'all' },
      ],
    };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const notif = mockNotifications.find((n) => n._id === id);
      if (notif) {
        notif.isRead = true;
      }
      return res.status(200).json({ success: true, message: 'Notification marked as read' });
    }

    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    const user = req.user;

    if (mongoose.connection.readyState !== 1) {
      mockNotifications.forEach((n) => {
        if (user.role === 'admin' && n.role === 'admin') n.isRead = true;
        else if (user.role === 'vendor' && n.role === 'vendor') n.isRead = true;
        else if (user.role === 'customer' && n.role === 'customer') n.isRead = true;
      });
      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    }

    await Notification.updateMany(
      {
        $or: [
          { recipient: user._id },
          { role: user.role, recipient: null },
          { role: 'all' },
        ],
      },
      { isRead: true }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
};
