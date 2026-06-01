# PhotoFoss

PhotoFoss is a professional, web-based photo editor with Photoshop-class tools running entirely in your browser. It supports non-destructive editing, custom adjustment layers, pixel-perfect layer masks, advanced selection tools, and robust painting/retouching capabilities.

## Features

- **Layer Stack & Blending Modes**: Control visibility, opacity, clipping masks, and standard blend modes (Normal, Multiply, Screen, Overlay, Color Dodge, etc.).
- **Adjustment Layers**: Non-destructive adjustment layers for Brightness & Contrast, Hue & Saturation, Color Balance, and Black & White.
- **Layer Masks**: Link/unlink and paint on layer masks to non-destructively hide or reveal parts of layers.
- **Selection Tools**: Rectangle Marquee, Ellipse Marquee, Lasso, Magnetic Lasso, and Magic Wand.
- **Painting & Retouching**:
  - Adjustable Brush Tool
  - Clone Stamp (with sample point Selection)
  - Spot Healing Tool (content-aware local blending)
  - Smudge, Blur, Sharpen, Dodge, and Burn tools
- **Vector Graphics & Typography**: Pen tool for paths, vector shapes (Rectangle, Circle, Line, etc.), and rich text layers.
- **Gradients**: Linear and radial gradients with primary and secondary color blending.
- **Flexible Canvas & Templates**: Pan, zoom, and select from preset social/print/screen templates.

## Run Locally

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed.

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/PHOTOFOSS.git
   cd PHOTOFOSS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## Production Build

To build the application for deployment:

```bash
npm run build
npm start
```

## License

This project is licensed under the Apache-2.0 License.
