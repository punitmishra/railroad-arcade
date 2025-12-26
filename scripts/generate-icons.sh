#!/bin/bash

# ============================================
# App Icon Generator for iOS and Android
# ============================================
# Requires: ImageMagick (brew install imagemagick)
#
# Usage: ./scripts/generate-icons.sh [source-icon.png]
# Default source: public/icons/icon-512.png

set -e

SOURCE="${1:-public/icons/icon-512.png}"

if [ ! -f "$SOURCE" ]; then
    echo "Error: Source file not found: $SOURCE"
    echo "Usage: ./scripts/generate-icons.sh [source-icon.png]"
    exit 1
fi

echo "Generating icons from: $SOURCE"

# ============================================
# PWA Icons (public/icons/)
# ============================================
echo "Generating PWA icons..."

# Standard icons
convert "$SOURCE" -resize 72x72 public/icons/icon-72.png
convert "$SOURCE" -resize 96x96 public/icons/icon-96.png
convert "$SOURCE" -resize 128x128 public/icons/icon-128.png
convert "$SOURCE" -resize 144x144 public/icons/icon-144.png
convert "$SOURCE" -resize 152x152 public/icons/icon-152.png
convert "$SOURCE" -resize 192x192 public/icons/icon-192.png
convert "$SOURCE" -resize 384x384 public/icons/icon-384.png
convert "$SOURCE" -resize 512x512 public/icons/icon-512.png

# Maskable icons (with padding for safe zone)
# Maskable icons need 10% padding on each side (20% total)
convert "$SOURCE" -resize 410x410 -gravity center -background "#050508" -extent 512x512 public/icons/icon-maskable-512.png
convert "$SOURCE" -resize 154x154 -gravity center -background "#050508" -extent 192x192 public/icons/icon-maskable-192.png

# PWA shortcut icons
convert "$SOURCE" -resize 96x96 public/icons/shortcut-play.png
convert "$SOURCE" -resize 96x96 -modulate 100,100,50 public/icons/shortcut-trophy.png
convert "$SOURCE" -resize 96x96 -modulate 100,100,25 public/icons/shortcut-tokens.png

echo "PWA icons generated!"

# ============================================
# iOS Icons (ios/App/App/Assets.xcassets/AppIcon.appiconset/)
# ============================================
echo "Generating iOS icons..."

IOS_ICONS="ios/App/App/Assets.xcassets/AppIcon.appiconset"
mkdir -p "$IOS_ICONS"

# iPhone icons
convert "$SOURCE" -resize 40x40 "$IOS_ICONS/Icon-App-20x20@2x.png"
convert "$SOURCE" -resize 60x60 "$IOS_ICONS/Icon-App-20x20@3x.png"
convert "$SOURCE" -resize 58x58 "$IOS_ICONS/Icon-App-29x29@2x.png"
convert "$SOURCE" -resize 87x87 "$IOS_ICONS/Icon-App-29x29@3x.png"
convert "$SOURCE" -resize 80x80 "$IOS_ICONS/Icon-App-40x40@2x.png"
convert "$SOURCE" -resize 120x120 "$IOS_ICONS/Icon-App-40x40@3x.png"
convert "$SOURCE" -resize 120x120 "$IOS_ICONS/Icon-App-60x60@2x.png"
convert "$SOURCE" -resize 180x180 "$IOS_ICONS/Icon-App-60x60@3x.png"

# iPad icons
convert "$SOURCE" -resize 20x20 "$IOS_ICONS/Icon-App-20x20@1x.png"
convert "$SOURCE" -resize 29x29 "$IOS_ICONS/Icon-App-29x29@1x.png"
convert "$SOURCE" -resize 40x40 "$IOS_ICONS/Icon-App-40x40@1x.png"
convert "$SOURCE" -resize 76x76 "$IOS_ICONS/Icon-App-76x76@1x.png"
convert "$SOURCE" -resize 152x152 "$IOS_ICONS/Icon-App-76x76@2x.png"
convert "$SOURCE" -resize 167x167 "$IOS_ICONS/Icon-App-83.5x83.5@2x.png"

# App Store icon (1024x1024)
convert "$SOURCE" -resize 1024x1024 "$IOS_ICONS/Icon-App-1024x1024@1x.png"

# Generate Contents.json
cat > "$IOS_ICONS/Contents.json" << 'EOF'
{
  "images" : [
    { "filename" : "Icon-App-20x20@1x.png", "idiom" : "ipad", "scale" : "1x", "size" : "20x20" },
    { "filename" : "Icon-App-20x20@2x.png", "idiom" : "iphone", "scale" : "2x", "size" : "20x20" },
    { "filename" : "Icon-App-20x20@2x.png", "idiom" : "ipad", "scale" : "2x", "size" : "20x20" },
    { "filename" : "Icon-App-20x20@3x.png", "idiom" : "iphone", "scale" : "3x", "size" : "20x20" },
    { "filename" : "Icon-App-29x29@1x.png", "idiom" : "ipad", "scale" : "1x", "size" : "29x29" },
    { "filename" : "Icon-App-29x29@2x.png", "idiom" : "iphone", "scale" : "2x", "size" : "29x29" },
    { "filename" : "Icon-App-29x29@2x.png", "idiom" : "ipad", "scale" : "2x", "size" : "29x29" },
    { "filename" : "Icon-App-29x29@3x.png", "idiom" : "iphone", "scale" : "3x", "size" : "29x29" },
    { "filename" : "Icon-App-40x40@1x.png", "idiom" : "ipad", "scale" : "1x", "size" : "40x40" },
    { "filename" : "Icon-App-40x40@2x.png", "idiom" : "iphone", "scale" : "2x", "size" : "40x40" },
    { "filename" : "Icon-App-40x40@2x.png", "idiom" : "ipad", "scale" : "2x", "size" : "40x40" },
    { "filename" : "Icon-App-40x40@3x.png", "idiom" : "iphone", "scale" : "3x", "size" : "40x40" },
    { "filename" : "Icon-App-60x60@2x.png", "idiom" : "iphone", "scale" : "2x", "size" : "60x60" },
    { "filename" : "Icon-App-60x60@3x.png", "idiom" : "iphone", "scale" : "3x", "size" : "60x60" },
    { "filename" : "Icon-App-76x76@1x.png", "idiom" : "ipad", "scale" : "1x", "size" : "76x76" },
    { "filename" : "Icon-App-76x76@2x.png", "idiom" : "ipad", "scale" : "2x", "size" : "76x76" },
    { "filename" : "Icon-App-83.5x83.5@2x.png", "idiom" : "ipad", "scale" : "2x", "size" : "83.5x83.5" },
    { "filename" : "Icon-App-1024x1024@1x.png", "idiom" : "ios-marketing", "scale" : "1x", "size" : "1024x1024" }
  ],
  "info" : { "author" : "xcode", "version" : 1 }
}
EOF

echo "iOS icons generated!"

# ============================================
# Android Icons (android/app/src/main/res/)
# ============================================
echo "Generating Android icons..."

ANDROID_RES="android/app/src/main/res"

# Standard icons (mipmap-*)
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    case $density in
        mdpi)    size=48 ;;
        hdpi)    size=72 ;;
        xhdpi)   size=96 ;;
        xxhdpi)  size=144 ;;
        xxxhdpi) size=192 ;;
    esac

    mkdir -p "$ANDROID_RES/mipmap-$density"
    convert "$SOURCE" -resize ${size}x${size} "$ANDROID_RES/mipmap-$density/ic_launcher.png"

    # Round icon
    convert "$SOURCE" -resize ${size}x${size} \
        \( +clone -alpha extract -draw "fill black polygon 0,0 0,${size} ${size},0 fill white circle $((size/2)),$((size/2)) $((size/2)),0" \) \
        -alpha off -compose CopyOpacity -composite \
        "$ANDROID_RES/mipmap-$density/ic_launcher_round.png"
done

# Adaptive icon (foreground layer with padding)
mkdir -p "$ANDROID_RES/mipmap-anydpi-v26"
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    case $density in
        mdpi)    size=108; inner=48 ;;
        hdpi)    size=162; inner=72 ;;
        xhdpi)   size=216; inner=96 ;;
        xxhdpi)  size=324; inner=144 ;;
        xxxhdpi) size=432; inner=192 ;;
    esac

    mkdir -p "$ANDROID_RES/drawable-$density"
    convert "$SOURCE" -resize ${inner}x${inner} -gravity center -background none -extent ${size}x${size} \
        "$ANDROID_RES/drawable-$density/ic_launcher_foreground.png"
done

# Adaptive icon XML
cat > "$ANDROID_RES/mipmap-anydpi-v26/ic_launcher.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
EOF

cat > "$ANDROID_RES/mipmap-anydpi-v26/ic_launcher_round.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
EOF

# Background color
mkdir -p "$ANDROID_RES/values"
cat > "$ANDROID_RES/values/ic_launcher_background.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#050508</color>
</resources>
EOF

echo "Android icons generated!"

# ============================================
# Splash Screen Assets
# ============================================
echo "Generating splash screen assets..."

# iOS splash (LaunchScreen)
convert "$SOURCE" -resize 200x200 "$IOS_ICONS/../SplashLogo.png"

# Android splash
mkdir -p "$ANDROID_RES/drawable"
convert "$SOURCE" -resize 200x200 "$ANDROID_RES/drawable/splash_logo.png"

echo "Splash screen assets generated!"

# ============================================
# Summary
# ============================================
echo ""
echo "=========================================="
echo "Icon generation complete!"
echo "=========================================="
echo ""
echo "Generated:"
echo "  - PWA icons: public/icons/"
echo "  - iOS icons: ios/App/App/Assets.xcassets/AppIcon.appiconset/"
echo "  - Android icons: android/app/src/main/res/mipmap-*/"
echo "  - Splash logos: iOS and Android"
echo ""
echo "Next steps:"
echo "  1. Run 'npx cap sync' to sync assets"
echo "  2. Rebuild the native apps"
echo ""
