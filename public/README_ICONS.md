# PWA Icon Setup

## Current Status
The icon files are currently placeholders (0 bytes). You need to create actual PNG images for the PWA to work properly.

## Quick Setup - Create Icons

You have two options:

### Option 1: Use an Online Tool (Recommended)
1. Create a single 512x512 PNG icon with your app logo
2. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
3. Upload your 512x512 image
4. Download all generated sizes
5. Replace the placeholder files in the `/public` folder

### Option 2: Use ImageMagick (Command Line)
If you have ImageMagick installed:

```bash
# Install ImageMagick first if needed
# Then create icons from a source image (replace 'source.png' with your image):

magick convert source.png -resize 72x72 public/icon-72.png
magick convert source.png -resize 96x96 public/icon-96.png
magick convert source.png -resize 128x128 public/icon-128.png
magick convert source.png -resize 144x144 public/icon-144.png
magick convert source.png -resize 152x152 public/icon-152.png
magick convert source.png -resize 192x192 public/icon-192.png
magick convert source.png -resize 384x384 public/icon-384.png
magick convert source.png -resize 512x512 public/icon-512.png
```

## Required Icon Sizes
- 72x72 - Android notification icon
- 96x96 - Windows tile
- 128x128 - Chrome Web Store
- 144x144 - Windows tile
- 152x152 - iOS
- 192x192 - Android home screen (minimum)
- 384x384 - Android splash screen
- 512x512 - Android home screen (recommended)

## Icon Design Tips
- Use a simple, recognizable logo
- Ensure good contrast for visibility
- Test on both light and dark backgrounds
- Avoid text that's too small
- Use solid colors or simple gradients
- Leave some padding around the edges

## Testing Your PWA
After adding real icons:
1. Rebuild your app: `npm run build`
2. Test in Chrome: Open DevTools > Application > Manifest
3. Check that all icons load correctly
4. Test installation on mobile device
