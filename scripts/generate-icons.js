const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SVG_PATH = path.join(__dirname, '..', 'frontend', 'public', 'logo.svg');

// Icon sizes needed for PWA
const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Mobile icon sizes
const MOBILE_ICON_SIZE = 1024;
const SPLASH_WIDTH = 1284;
const SPLASH_HEIGHT = 2778;

async function generateIcons() {
  console.log('Reading SVG from:', SVG_PATH);

  if (!fs.existsSync(SVG_PATH)) {
    console.error('SVG file not found at:', SVG_PATH);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);

  // Ensure output directories exist
  const pwaImagesDir = path.join(__dirname, '..', 'frontend', 'public', 'images');
  const mobileAssetsDir = path.join(__dirname, '..', 'mobile', 'assets');

  if (!fs.existsSync(pwaImagesDir)) {
    fs.mkdirSync(pwaImagesDir, { recursive: true });
  }

  // Generate PWA icons
  console.log('\nGenerating PWA icons...');
  for (const size of PWA_SIZES) {
    const outputPath = path.join(pwaImagesDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 250, g: 208, b: 44, alpha: 1 } })
      .png()
      .toFile(outputPath);
    console.log(`  Created: icon-${size}x${size}.png`);
  }

  // Generate Apple touch icon
  const appleTouchPath = path.join(pwaImagesDir, 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 250, g: 208, b: 44, alpha: 1 } })
    .png()
    .toFile(appleTouchPath);
  console.log('  Created: apple-touch-icon.png');

  // Generate favicon
  const faviconPath = path.join(__dirname, '..', 'frontend', 'public', 'favicon.ico');
  await sharp(svgBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 250, g: 208, b: 44, alpha: 1 } })
    .png()
    .toFile(faviconPath.replace('.ico', '.png'));
  console.log('  Created: favicon.png');

  // Generate Mobile App Icon (1024x1024)
  console.log('\nGenerating Mobile icons...');
  const mobileIconPath = path.join(mobileAssetsDir, 'icon.png');
  await sharp(svgBuffer)
    .resize(MOBILE_ICON_SIZE, MOBILE_ICON_SIZE, { fit: 'contain', background: { r: 250, g: 208, b: 44, alpha: 1 } })
    .png()
    .toFile(mobileIconPath);
  console.log('  Created: icon.png (1024x1024)');

  // Generate Adaptive Icon (1024x1024)
  const adaptiveIconPath = path.join(mobileAssetsDir, 'adaptive-icon.png');
  await sharp(svgBuffer)
    .resize(MOBILE_ICON_SIZE, MOBILE_ICON_SIZE, { fit: 'contain', background: { r: 250, g: 208, b: 44, alpha: 1 } })
    .png()
    .toFile(adaptiveIconPath);
  console.log('  Created: adaptive-icon.png (1024x1024)');

  // Generate Splash Icon (centered, smaller for splash screen)
  const splashIconPath = path.join(mobileAssetsDir, 'splash-icon.png');
  await sharp(svgBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 250, g: 208, b: 44, alpha: 1 } })
    .png()
    .toFile(splashIconPath);
  console.log('  Created: splash-icon.png (512x512)');

  // Generate Notification Icon (96x96, white on transparent for Android)
  const notificationIconPath = path.join(mobileAssetsDir, 'notification-icon.png');
  await sharp(svgBuffer)
    .resize(96, 96, { fit: 'contain', background: { r: 250, g: 208, b: 44, alpha: 1 } })
    .png()
    .toFile(notificationIconPath);
  console.log('  Created: notification-icon.png (96x96)');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
