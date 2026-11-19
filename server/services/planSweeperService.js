const mongoose = require('mongoose');
const Store = require('../models/Store');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');
const { sendEmail } = require('../utils/sendEmail');

/**
 * Sweeper function to:
 * 1. Mark stores whose plan has expired as 'expired' & alert vendors
 * 2. Send warning notifications/emails to vendors whose plan expires in <= 7 days
 */
const runPlanExpirySweeper = async () => {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);

  const results = {
    checkedAt: now,
    expiredUpdated: 0,
    remindersSent: 0,
    errors: [],
  };

  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Plan Sweeper] MongoDB not connected, skipping run.');
      return results;
    }

    // ----------------------------------------------------
    // STEP 1: Process Expired Stores
    // ----------------------------------------------------
    const expiredStores = await Store.find({
      status: { $in: ['active', 'approved'] },
      planExpiresAt: { $ne: null, $lt: now },
    }).populate('vendor', 'name email phone');

    for (const store of expiredStores) {
      try {
        store.status = 'expired';

        if (!store.planExpiredNotificationSentAt) {
          const vendorUser = store.vendor;
          const formattedDate = store.planExpiresAt.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          // In-App Notification
          if (vendorUser?._id) {
            await createNotification({
              recipient: vendorUser._id,
              role: 'vendor',
              type: 'plan_expired',
              title: '⚠️ Store Plan Expired',
              message: `Your subscription for "${store.storeName}" expired on ${formattedDate}. Renew your plan to reactivate your storefront.`,
              link: '/vendor/plans',
            }).catch(() => null);
          }

          // Email Notification
          if (vendorUser?.email) {
            const html = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
                <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
                  <div style="background: #071d42; padding: 24px; text-align: center; color: #ffffff;">
                    <h2 style="margin: 0; font-size: 22px;">SR <span style="color: #f59e0b;">Marketplace</span></h2>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Merchant Plan Update</p>
                  </div>
                  <div style="padding: 28px;">
                    <h3 style="color: #b91c1c; margin-top: 0;">Your Store Plan Has Expired</h3>
                    <p>Hello ${vendorUser.name || 'Merchant'},</p>
                    <p>Your subscription plan for <strong>"${store.storeName}"</strong> expired on <strong>${formattedDate}</strong>.</p>
                    <p>While expired, your store items are temporarily hidden from the public marketplace.</p>
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="http://localhost:5173/vendor/plans" style="background: #0c2a5e; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block;">
                        Renew Store Plan Now
                      </a>
                    </div>
                  </div>
                  <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b;">
                    © 2026 SR Marketplace.
                  </div>
                </div>
              </div>
            `;

            await sendEmail({
              email: vendorUser.email,
              subject: `Urgent: Store Subscription Expired for "${store.storeName}" - SR Marketplace`,
              message: `Your store subscription for "${store.storeName}" expired on ${formattedDate}. Please renew to keep your store active.`,
              html,
            }).catch((e) => console.warn('[Sweeper Email Error]', e.message));
          }

          store.planExpiredNotificationSentAt = new Date();
        }

        await store.save();
        results.expiredUpdated++;
      } catch (storeErr) {
        results.errors.push(`Expired store ${store._id}: ${storeErr.message}`);
      }
    }

    // ----------------------------------------------------
    // STEP 2: Send 7-Day Expiry Warnings
    // ----------------------------------------------------
    const sixDaysAgo = new Date(now.getTime() - 6 * 86400000);
    const expiringSoonStores = await Store.find({
      status: { $in: ['active', 'approved'] },
      planExpiresAt: { $gte: now, $lte: sevenDaysFromNow },
      $or: [
        { expiryReminderSentAt: { $exists: false } },
        { expiryReminderSentAt: null },
        { expiryReminderSentAt: { $lt: sixDaysAgo } },
      ],
    }).populate('vendor', 'name email phone').populate('activePlan', 'title');

    for (const store of expiringSoonStores) {
      try {
        const vendorUser = store.vendor;
        const daysLeft = Math.max(
          1,
          Math.ceil((new Date(store.planExpiresAt).getTime() - now.getTime()) / 86400000)
        );
        const formattedDate = store.planExpiresAt.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        // In-App Notification
        if (vendorUser?._id) {
          await createNotification({
            recipient: vendorUser._id,
            role: 'vendor',
            type: 'plan_expiring_soon',
            title: `⏳ Store Plan Expiring in ${daysLeft} Day${daysLeft > 1 ? 's' : ''}`,
            message: `Your subscription for "${store.storeName}" will expire on ${formattedDate}. Renew now to avoid service interruption.`,
            link: '/vendor/plans',
          }).catch(() => null);
        }

        // Email Notification
        if (vendorUser?.email) {
          const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
              <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
                <div style="background: #071d42; padding: 24px; text-align: center; color: #ffffff;">
                  <h2 style="margin: 0; font-size: 22px;">SR <span style="color: #f59e0b;">Marketplace</span></h2>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Subscription Expiry Notice</p>
                </div>
                <div style="padding: 28px;">
                  <h3 style="color: #d97706; margin-top: 0;">Plan Expiring in ${daysLeft} Days</h3>
                  <p>Hello ${vendorUser.name || 'Merchant'},</p>
                  <p>This is a friendly reminder that your <strong>"${store.activePlan?.title || 'Merchant'}"</strong> plan for <strong>"${store.storeName}"</strong> will expire on <strong>${formattedDate}</strong> (${daysLeft} days remaining).</p>
                  <p>Renew today to ensure uninterrupted sales, zero storefront downtime, and seamless order fulfillment.</p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="http://localhost:5173/vendor/plans" style="background: #0c2a5e; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block;">
                      Renew Plan Subscription
                    </a>
                  </div>
                </div>
                <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b;">
                  © 2026 SR Marketplace.
                </div>
              </div>
            </div>
          `;

          await sendEmail({
            email: vendorUser.email,
            subject: `Action Required: Store plan expiring in ${daysLeft} days for "${store.storeName}" - SR Marketplace`,
            message: `Your store subscription for "${store.storeName}" will expire in ${daysLeft} days on ${formattedDate}. Please renew to prevent downtime.`,
            html,
          }).catch((e) => console.warn('[Reminder Email Error]', e.message));
        }

        store.expiryReminderSentAt = new Date();
        await store.save();
        results.remindersSent++;
      } catch (remErr) {
        results.errors.push(`Reminder store ${store._id}: ${remErr.message}`);
      }
    }

    console.log(`[Plan Sweeper] Completed: ${results.expiredUpdated} expired updated, ${results.remindersSent} reminders sent.`);
    return results;
  } catch (err) {
    console.error('[Plan Sweeper Error]', err);
    results.errors.push(err.message);
    return results;
  }
};

/**
 * Initialize daily in-process background timer
 */
const initDailySweeper = () => {
  // Run once shortly after startup (after 30 seconds)
  setTimeout(() => {
    runPlanExpirySweeper().catch(console.error);
  }, 30000);

  // Run every 24 hours
  setInterval(() => {
    runPlanExpirySweeper().catch(console.error);
  }, 24 * 60 * 60 * 1000);
};

module.exports = {
  runPlanExpirySweeper,
  initDailySweeper,
};
