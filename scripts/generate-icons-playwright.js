const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const ROOT_DIR = path.dirname(SCRIPT_DIR);
const SVG_PATH = path.join(ROOT_DIR, 'frontend', 'public', 'logo.svg');
const PWA_IMAGES_DIR = path.join(ROOT_DIR, 'frontend', 'public', 'images');
const MOBILE_ASSETS_DIR = path.join(ROOT_DIR, 'mobile', 'assets');

// Icon sizes for PWA
const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Background color from logo (yellow)
const BG_COLOR = '#fad02c';

async function generateIcon(page, svgContent, outputPath, size) {
  // Create an HTML page with the SVG centered on background
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: ${size}px;
          height: ${size}px;
          background-color: ${BG_COLOR};
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .logo-container {
          width: 90%;
          height: 90%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-container svg {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
        }
      </style>
    </head>
    <body>
      <div class="logo-container">
        ${svgContent}
      </div>
    </body>
    </html>
  `;

  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html);
  await page.screenshot({ path: outputPath, type: 'png' });
  console.log(`  Created: ${path.basename(outputPath)} (${size}x${size})`);
}

async function main() {
  console.log(`Reading SVG from: ${SVG_PATH}`);

  if (!fs.existsSync(SVG_PATH)) {
    console.error(`ERROR: SVG file not found at: ${SVG_PATH}`);
    process.exit(1);
  }

  // Read SVG content
  let svgContent = fs.readFileSync(SVG_PATH, 'utf8');

  // Ensure output directories exist
  if (!fs.existsSync(PWA_IMAGES_DIR)) {
    fs.mkdirSync(PWA_IMAGES_DIR, { recursive: true });
  }

  // Launch browser
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Generate PWA icons
    console.log('\nGenerating PWA icons...');
    for (const size of PWA_SIZES) {
      const outputPath = path.join(PWA_IMAGES_DIR, `icon-${size}x${size}.png`);
      await generateIcon(page, svgContent, outputPath, size);
    }

    // Generate Apple touch icon (180x180)
    const appleTouchPath = path.join(PWA_IMAGES_DIR, 'apple-touch-icon.png');
    await generateIcon(page, svgContent, appleTouchPath, 180);

    // Generate favicon (32x32)
    const faviconPath = path.join(ROOT_DIR, 'frontend', 'public', 'favicon.png');
    await generateIcon(page, svgContent, faviconPath, 32);

    // Generate Mobile icons
    console.log('\nGenerating Mobile icons...');

    // App icon (1024x1024)
    const iconPath = path.join(MOBILE_ASSETS_DIR, 'icon.png');
    await generateIcon(page, svgContent, iconPath, 1024);

    // Adaptive icon (1024x1024)
    const adaptivePath = path.join(MOBILE_ASSETS_DIR, 'adaptive-icon.png');
    await generateIcon(page, svgContent, adaptivePath, 1024);

    // Splash icon (512x512)
    const splashPath = path.join(MOBILE_ASSETS_DIR, 'splash-icon.png');
    await generateIcon(page, svgContent, splashPath, 512);

    // Notification icon (96x96)
    const notificationPath = path.join(MOBILE_ASSETS_DIR, 'notification-icon.png');
    await generateIcon(page, svgContent, notificationPath, 96);

    // Favicon for mobile web (96x96)
    const webFaviconPath = path.join(MOBILE_ASSETS_DIR, 'favicon.png');
    await generateIcon(page, svgContent, webFaviconPath, 96);

    console.log('\nAll icons generated successfully!');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
