# Virtual Try-On with Chrome Extension Integration

## About This Project

This is a complete virtual try-on solution developed for the BTK Hackathon that combines AI-powered garment visualization with a Chrome extension for seamless e-commerce integration. The project allows users to virtually try on clothing items directly from e-commerce websites like Amazon, Hepsiburada, and Trendyol.

**🆕 NEW FEATURE**: This branch now supports **dynamic model selection**, where both the model image and garment image can be selected directly from web pages through the Chrome extension.

### What This Project Does

- **Virtual Try-On AI**: Uses [OOTDiffusion](https://github.com/levihsu/OOTDiffusion) to realistically place garments on a model
- **AI-Generated Garments**: Leverages [FLUX.1-dev](https://huggingface.co/black-forest-labs/FLUX.1-dev) from [Nebius](https://nebius.com) AI Studio for garment generation
- **Chrome Extension**: Automatically extracts product images from e-commerce sites and processes them through the AI pipeline
- **🔥 Dynamic Model Selection**: Select both model and garment images directly from any webpage
- **WebSocket Server**: Real-time communication between the browser extension and AI backend

The system works by extracting clothing images from e-commerce websites, sending them through a WebSocket connection to a Python server, processing them with AI models, and displaying the virtual try-on results directly in the browser.

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://huggingface.co/spaces/Agents-MCP-Hackathon/viton-mcp-server
cd viton-mcp-server

# Switch to the dynamic model selection branch
git checkout dynamic-model-selection
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

### Usage Modes

The extension now supports two modes:

#### 🚀 Quick Mode (Default Model)
1. **Start the Python server** (see setup instructions above)
2. **Navigate to an e-commerce website** (Amazon, Hepsiburada, Trendyol, etc.)
3. **Find a clothing item page** with product images
4. **Click the extension icon** and select "Quick Mode"
5. **Click "Try On Garment (Quick)"** button
6. The extension will use a default model and process the garment

#### 🎯 Custom Model Mode (NEW!)
1. **Start the Python server** (see setup instructions above)
2. **Navigate to any webpage** with both model and garment images
3. **Click the extension icon** and select "Custom Model Mode"
4. **Click "1. Select Model Image"** - then click on any person image on the webpage
5. **Click "2. Select Garment Image"** - then click on any clothing item image
6. **Click "3. Process Virtual Try-On"** to start processing with both selected images

### Supported E-commerce Sites (Quick Mode)

The extension automatically detects clothing images from:

- **Amazon**: Looks for images with ID `landingImage`
- **Hepsiburada**: Detects images with classes:
  - `i9jTSpEeoI29_M1mOKct hb-HbImage-view__image` (main page)
  - `hbImageView-module_hbImage__Ca3xO` (product page)
- **Trendyol**: Detects images with classes:
  - `p-card-img` (main page)
  - `_carouselThumbsImage_ddecc3e` (product page)

### Custom Mode Works On Any Website!

The new custom mode allows you to select any images from any website - fashion blogs, social media, online catalogs, etc.

## Project Architecture

```
viton-mcp-server/
├── run.py              # Enhanced WebSocket server with dual image support
├── start_server.py     # Convenience startup script
├── requirements.txt    # Python dependencies (includes websockets & requests)
├── model_7.png        # Default model image for quick mode
├── ChromeExtension/   # Enhanced Chrome extension files
│   ├── manifest.json  # Extension configuration
│   ├── popup.html     # Enhanced popup UI with mode selection
│   ├── popup.js       # Enhanced logic with dual image support
│   ├── content.js     # Page content extraction
│   └── background.js  # Background processes
└── results/           # Output directory for processed images
```

## Enhanced Features

- **🔄 Dual Processing Modes**: Quick mode for e-commerce and custom mode for any images
- **🖱️ Interactive Image Selection**: Click-to-select interface for choosing model and garment images
- **📱 Smart UI**: Mode switching with appropriate controls and visual feedback
- **🔄 Real-Time Status Updates**: Live progress tracking during processing
- **💾 Image Download & Processing**: Automatic image downloading and temporary file management
- **🔙 Backward Compatibility**: Legacy support for existing quick mode functionality
- **🎨 Visual Feedback**: Image previews and selection confirmations
- **⚡ WebSocket Communication**: Enhanced message types for model and garment images

## Message Protocol

The WebSocket server now supports these message types:

- `model_image`: Send model image URL
- `garment_image`: Send garment image URL  
- `image`: Legacy mode (garment only, uses default model)
- `processed_image`: Returns the virtual try-on result
- `status`: Progress updates
- `error`: Error messages

## Troubleshooting

- **Server not starting**: Make sure all dependencies are installed and the virtual environment is activated
- **Extension not working**: Verify the extension is loaded and developer mode is enabled
- **No images detected**: Check if you're on a supported e-commerce site with product images (Quick Mode)
- **Custom mode not working**: Ensure images are clickable and have valid URLs
- **Connection errors**: Ensure the Python server is running on `ws://localhost:8765`
- **Image download fails**: Check internet connection and image URL accessibility

## Sample Images

Sample images for testing are obtained from [VITON-HD](https://github.com/shadow2496/VITON-HD) dataset.

## License

This project is licensed under CC-BY-NC-SA-4.0.
