# BTK Hackathon Chrome Extension Setup

## How to Install and Use

### 1. Install the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `ChromeExtension` folder from this project
5. The extension should appear in your extensions list

### 2. Start the Python WebSocket Server

```bash
# Make sure you're in the project directory
cd /home/aziz/life/Work/VCamp/btk/viton-mcp-server

# Activate the virtual environment
source env/bin/activate

# Start the WebSocket server
python start_server.py
# OR directly:
python run.py
```

The server will start on `ws://localhost:8765`

### 3. Using the Extension

1. Navigate to any e-commerce website (Amazon, Hepsiburada, Trendyol, etc.)
2. Find a clothing item page with product images
3. Click on the extension icon in Chrome toolbar
4. Click the "Üstümde Göster" button
5. The extension will:
   - Extract the product image from the page
   - Send it to your Python server via WebSocket
   - Process it using the VTON AI model
   - Display the result showing how the garment looks on the model

### Supported Websites

The extension automatically detects clothing images from:
- Amazon (ID: `landingImage`)
- Hepsiburada (various class names)
- Trendyol (various class names)

### Troubleshooting

1. **"WebSocket bağlantı hatası!"**: Make sure the Python server is running
2. **"Hiç görsel bulunamadı!"**: The webpage might not have supported image elements
3. **Processing errors**: Check the Python server console for detailed error messages

### Requirements

- Python environment with all dependencies installed (see requirements.txt)
- Chrome browser with Developer mode enabled
- The `model_7.png` file must exist in the project root directory
