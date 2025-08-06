# Virtual Try-On with Chrome Extension Integration

## About This Project

This is a complete virtual try-on solution developed for the BTK Hackathon that combines AI-powered garment visualization with a Chrome extension for seamless e-commerce integration. The project allows users to virtually try on clothing items directly from e-commerce websites like Amazon, Hepsiburada, and Trendyol.

### What This Project Does

- **Virtual Try-On AI**: Uses [OOTDiffusion](https://github.com/levihsu/OOTDiffusion) to realistically place garments on a model
- **AI-Generated Garments**: Leverages [FLUX.1-dev](https://huggingface.co/black-forest-labs/FLUX.1-dev) from [Nebius](https://nebius.com) AI Studio for garment generation
- **Chrome Extension**: Automatically extracts product images from e-commerce sites and processes them through the AI pipeline
- **WebSocket Server**: Real-time communication between the browser extension and AI backend

The system works by extracting clothing images from e-commerce websites, sending them through a WebSocket connection to a Python server, processing them with AI models, and displaying the virtual try-on results directly in the browser.

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://huggingface.co/spaces/Agents-MCP-Hackathon/viton-mcp-server
cd viton-mcp-server
```

### 2. Create and Activate Python Environment

```bash
# Create virtual environment
python -m venv env

# Activate virtual environment (Linux/Mac)
source env/bin/activate

# On Windows use:
# env\Scripts\activate
```

### 3. Install Dependencies and Run

```bash
# Install required packages
pip install -r requirements.txt

# Start the WebSocket server
python run.py

# OR use the convenience script:
python start_server.py
```

The server will start on `ws://localhost:8765` and be ready to accept connections from the Chrome extension.

## Chrome Extension Setup

### Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right corner)
3. Click "Load unpacked extension"
4. Select the `ChromeExtension` folder from this project directory
5. The extension icon should appear in your Chrome toolbar

### Usage

1. **Start the Python server** (see setup instructions above)
2. **Navigate to an e-commerce website** (Amazon, Hepsiburada, Trendyol, etc.)
3. **Find a clothing item page** with product images
4. **Click the extension icon** in the Chrome toolbar
5. **Click "Üstümde Göster" (Show on Me)** button
6. The extension will automatically:
   - Extract the product image from the page
   - Send it to the Python server via WebSocket
   - Process it using the VTON AI model
   - Display the result showing how the garment looks on the model

### Supported E-commerce Sites

The extension automatically detects clothing images from:

- **Amazon**: Looks for images with ID `landingImage`
- **Hepsiburada**: Detects images with classes:
  - `i9jTSpEeoI29_M1mOKct hb-HbImage-view__image` (main page)
  - `hbImageView-module_hbImage__Ca3xO` (product page)
- **Trendyol**: Detects images with classes:
  - `p-card-img` (main page)
  - `_carouselThumbsImage_ddecc3e` (product page)

## Project Architecture

```
viton-mcp-server/
├── run.py              # Main WebSocket server
├── start_server.py     # Convenience startup script
├── requirements.txt    # Python dependencies
├── model_7.png        # Model image for try-on
├── ChromeExtension/   # Chrome extension files
│   ├── manifest.json  # Extension configuration
│   ├── popup.html     # Extension popup UI
│   ├── popup.js       # Extension logic
│   ├── content.js     # Page content extraction
│   └── background.js  # Background processes
└── results/           # Output directory for processed images
```

## Features

- **One-Click Virtual Try-On**: Complete automation with a single button click
- **Smart Image Detection**: Automatically finds product images on supported sites
- **Real-Time Processing**: WebSocket communication for instant results
- **Responsive Design**: Results displayed proportionally in the browser
- **Multi-Site Support**: Works across major e-commerce platforms
- **AI-Powered Generation**: Can generate new garments using FLUX.1-dev

## Troubleshooting

- **Server not starting**: Make sure all dependencies are installed and the virtual environment is activated
- **Extension not working**: Verify the extension is loaded and developer mode is enabled
- **No images detected**: Check if you're on a supported e-commerce site with product images
- **Connection errors**: Ensure the Python server is running on `ws://localhost:8765`

## Sample Images

Sample images for testing are obtained from [VITON-HD](https://github.com/shadow2496/VITON-HD) dataset.

## License

This project is licensed under CC-BY-NC-SA-4.0.
