# Extension Icons

This directory should contain the extension icons required for Chrome Web Store submission.

## Required Icons

You need to create three icon sizes:

- **icon16.png** - 16x16 pixels (used in browser toolbar)
- **icon48.png** - 48x48 pixels (used in extension management page)
- **icon128.png** - 128x128 pixels (used in Chrome Web Store)

## Creating Icons

### Option 1: Design Tools
Use design tools like:
- Figma
- Adobe Photoshop/Illustrator
- Sketch
- Canva

Create a single high-resolution design (at least 512x512), then export at the three required sizes.

### Option 2: Online Generators
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/
- https://favicon.io/

Upload a high-resolution image and download the generated icons.

### Option 3: Command Line (ImageMagick)
If you have ImageMagick installed:

```bash
# Create icons from a source image (source.png)
convert source.png -resize 16x16 icons/icon16.png
convert source.png -resize 48x48 icons/icon48.png
convert source.png -resize 128x128 icons/icon128.png
```

## Design Guidelines

- **Simple and recognizable**: Icons should be clear even at 16x16
- **High contrast**: Ensure visibility on different backgrounds
- **Consistent style**: All sizes should look cohesive
- **No text**: Avoid text in icons (especially at small sizes)
- **Square format**: Icons should work well in square format

## Testing

After creating icons:
1. Load the extension in Chrome (unpacked)
2. Verify icons appear correctly in:
   - Browser toolbar
   - Extension management page (chrome://extensions)
   - Extension popup (if applicable)

## Example Icon Ideas

- Experiment/test tube icon
- Code brackets `<>`
- Lightning bolt (for hot reloading)
- Lab flask
- Puzzle piece

