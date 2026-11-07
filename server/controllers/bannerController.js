const Banner = require('../models/Banner');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Get all active banners (Public - for Homepage Hero Carousel)
// @route   GET /api/banners
// @access  Public
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error('[Banner Controller Error - getActiveBanners]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active banners: ' + error.message,
    });
  }
};

// @desc    Get all banners for admin management (includes inactive)
// @route   GET /api/banners/admin
// @access  Private (Admin)
exports.getAllBannersAdmin = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error('[Banner Controller Error - getAllBannersAdmin]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners: ' + error.message,
    });
  }
};

// @desc    Upload image to Cloudinary and create new Hero Banner
// @route   POST /api/banners
// @access  Private (Admin)
exports.createBanner = async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl || '';
    let cloudinaryId = '';

    // If an image file was uploaded via multer, send it to Cloudinary
    if (req.file) {
      console.log(`[Banner Upload] Uploading banner image to Cloudinary: ${req.file.originalname} (${req.file.size} bytes)`);
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'hero_banners',
        req.file.originalname
      );
      imageUrl = uploadResult.secure_url;
      cloudinaryId = uploadResult.public_id || '';
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a banner image file or an image URL',
      });
    }

    const {
      title = '',
      subtitle = '',
      badge = '',
      link = '/products',
      ctaText = 'Shop Now',
      order = 0,
      isActive = true,
      theme = 'gold',
    } = req.body;

    const banner = await Banner.create({
      title,
      subtitle,
      badge,
      imageUrl,
      cloudinaryId,
      link: link || '/products',
      ctaText: ctaText || 'Shop Now',
      order: Number(order) || 0,
      isActive: isActive === 'true' || isActive === true,
      theme: theme || 'gold',
    });

    res.status(201).json({
      success: true,
      message: 'Hero carousel banner created and saved to Cloudinary successfully',
      banner,
    });
  } catch (error) {
    console.error('[Banner Controller Error - createBanner]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hero banner: ' + error.message,
    });
  }
};

// @desc    Update existing banner (optionally replace image on Cloudinary)
// @route   PUT /api/banners/:id
// @access  Private (Admin)
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner slide not found',
      });
    }

    // Check if new image file was uploaded
    if (req.file) {
      console.log(`[Banner Upload] Replacing banner image in Cloudinary: ${req.file.originalname}`);
      // Remove old image from Cloudinary if existed
      if (banner.cloudinaryId) {
        await deleteFromCloudinary(banner.cloudinaryId);
      }
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'hero_banners',
        req.file.originalname
      );
      banner.imageUrl = uploadResult.secure_url;
      banner.cloudinaryId = uploadResult.public_id || '';
    } else if (req.body.imageUrl && req.body.imageUrl !== banner.imageUrl) {
      banner.imageUrl = req.body.imageUrl;
    }

    if (req.body.title !== undefined) banner.title = req.body.title;
    if (req.body.subtitle !== undefined) banner.subtitle = req.body.subtitle;
    if (req.body.badge !== undefined) banner.badge = req.body.badge;
    if (req.body.link !== undefined) banner.link = req.body.link;
    if (req.body.ctaText !== undefined) banner.ctaText = req.body.ctaText;
    if (req.body.order !== undefined) banner.order = Number(req.body.order);
    if (req.body.isActive !== undefined) banner.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.theme !== undefined) banner.theme = req.body.theme;

    await banner.save();

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      banner,
    });
  } catch (error) {
    console.error('[Banner Controller Error - updateBanner]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner: ' + error.message,
    });
  }
};

// @desc    Toggle active state of a banner
// @route   PATCH /api/banners/:id/toggle
// @access  Private (Admin)
exports.toggleBannerActive = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner slide not found',
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner is now ${banner.isActive ? 'Active (Visible on Homepage)' : 'Inactive'}`,
      banner,
    });
  } catch (error) {
    console.error('[Banner Controller Error - toggleBannerActive]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle banner status: ' + error.message,
    });
  }
};

// @desc    Delete a banner and remove its file from Cloudinary
// @route   DELETE /api/banners/:id
// @access  Private (Admin)
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner slide not found',
      });
    }

    // Clean up asset from Cloudinary
    if (banner.cloudinaryId) {
      await deleteFromCloudinary(banner.cloudinaryId);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Banner deleted and removed from Cloudinary successfully',
    });
  } catch (error) {
    console.error('[Banner Controller Error - deleteBanner]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner: ' + error.message,
    });
  }
};

