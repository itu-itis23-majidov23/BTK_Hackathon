// Global variables
let websocket = null;
let uploadedModelImageBase64 = null;

// DOM elements
let quickMode, customMode, quickModeButtons, customModeButtons;
let modelImageInput, modelImagePreview, processButton;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup loaded, initializing...');
  
  // Get DOM elements
  quickMode = document.getElementById('quickMode');
  customMode = document.getElementById('customMode');
  quickModeButtons = document.getElementById('quickModeButtons');
  customModeButtons = document.getElementById('customModeButtons');
  modelImageInput = document.getElementById('modelImageInput');
  modelImagePreview = document.getElementById('modelImagePreview');
  processButton = document.getElementById('processCustomViton');

  // Check if elements exist
  if (!quickMode || !customMode || !quickModeButtons || !customModeButtons) {
    console.error('Required DOM elements not found');
    return;
  }

  // Load stored state when popup opens
  loadStoredState();

  // Mode switching functionality
  quickMode.addEventListener('change', function() {
    console.log('Quick mode selected');
    if (this.checked) {
      quickModeButtons.style.display = 'block';
      customModeButtons.style.display = 'none';
      clearStoredImage();
    }
  });

  customMode.addEventListener('change', function() {
    console.log('Custom mode selected');
    if (this.checked) {
      quickModeButtons.style.display = 'none';
      customModeButtons.style.display = 'block';
      // Don't clear image when switching to custom mode, restore it
      loadStoredState();
    }
  });

  // Handle model image upload
  if (modelImageInput) {
    modelImageInput.addEventListener('change', function(e) {
      console.log('File input changed');
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        console.log('Valid image file selected:', file.name);
        
        // Show processing status immediately
        updateStatus("Processing image upload...");
        
        // Prevent popup from closing by keeping it active
        e.preventDefault();
        e.stopPropagation();
        
        const reader = new FileReader();
        reader.onload = function(readerEvent) {
          uploadedModelImageBase64 = readerEvent.target.result;
          
          // Store in Chrome storage immediately
          chrome.storage.local.set({
            'uploadedModelImage': uploadedModelImageBase64,
            'hasUploadedImage': true,
            'imageTimestamp': Date.now()
          }, function() {
            if (chrome.runtime.lastError) {
              console.error('Storage error:', chrome.runtime.lastError);
              updateStatus("Error saving image. Please try again.");
              return;
            }
            
            console.log('Image stored in Chrome storage successfully');
            updateUI();
            updateStatus("Model image uploaded and saved! Ready to process.");
            
            // Force UI update after short delay
            setTimeout(() => {
              updateUI();
            }, 100);
          });
        };
        
        reader.onerror = function() {
          console.error('FileReader error');
          updateStatus("Error reading image file. Please try again.");
        };
        
        reader.readAsDataURL(file);
      } else {
        console.log('Invalid file selected');
        clearStoredImage();
        updateStatus("Please select a valid image file.");
      }
    });
    
    // Also handle click event to prevent default behavior
    modelImageInput.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }

  // Clear model button
  const clearModelBtn = document.getElementById("clearModelBtn");
  if (clearModelBtn) {
    clearModelBtn.addEventListener("click", () => {
      clearStoredImage();
      updateStatus("Model image cleared.");
    });
  }

  // Quick mode button
  const showUponMeBtn = document.getElementById("showUponMe");
  if (showUponMeBtn) {
    showUponMeBtn.addEventListener("click", async () => {
      console.log('Quick mode button clicked');
      updateStatus("Starting quick mode processing...");
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractImagesById,
      }, async (results) => {
        if (results && results[0] && results[0].result && results[0].result.length > 0) {
          const firstImageUrl = results[0].result[0].src;
          updateStatus("Garment image found, processing with default model...");
          await startWebSocketAndSendLegacyImage(firstImageUrl);
        } else {
          updateStatus("No supported garment images found!");
          displayResultMessage("No supported garment images found on this page.");
        }
      });
    });
  }

  // Custom mode process button
  if (processButton) {
    processButton.addEventListener("click", async () => {
      console.log('Custom mode process button clicked');
      
      // Load image from storage if not in memory
      if (!uploadedModelImageBase64) {
        await loadStoredState();
      }
      
      if (!uploadedModelImageBase64) {
        updateStatus("Please upload a model image first.");
        return;
      }

      updateStatus("Finding garment image on current page...");
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractImagesById,
      }, async (results) => {
        if (results && results[0] && results[0].result && results[0].result.length > 0) {
          const garmentImageUrl = results[0].result[0].src;
          updateStatus("Garment image found, processing with uploaded model...");
          await startWebSocketAndProcessViton(uploadedModelImageBase64, garmentImageUrl);
        } else {
          updateStatus("No supported garment images found!");
          displayResultMessage("No supported garment images found on this page. Make sure you're on an e-commerce site with clothing items.");
        }
      });
    });
  }

  updateStatus("Extension loaded and ready!");
});

// Load stored state from Chrome storage
async function loadStoredState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['uploadedModelImage', 'hasUploadedImage', 'imageTimestamp'], function(result) {
      if (chrome.runtime.lastError) {
        console.error('Storage retrieval error:', chrome.runtime.lastError);
        resolve();
        return;
      }
      
      if (result.hasUploadedImage && result.uploadedModelImage) {
        // Check if image is not too old (24 hours)
        const imageAge = Date.now() - (result.imageTimestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (imageAge < maxAge) {
          uploadedModelImageBase64 = result.uploadedModelImage;
          console.log('Loaded stored model image (age:', Math.round(imageAge / 1000 / 60), 'minutes)');
          updateUI();
          updateStatus("Stored model image loaded. Ready to process!");
        } else {
          console.log('Stored image is too old, clearing it');
          clearStoredImage();
        }
      } else {
        console.log('No stored image found');
      }
      resolve();
    });
  });
}

// Update UI based on current state
function updateUI() {
  const clearModelBtn = document.getElementById("clearModelBtn");
  
  if (uploadedModelImageBase64) {
    if (modelImagePreview) {
      modelImagePreview.src = uploadedModelImageBase64;
      modelImagePreview.style.display = 'block';
    }
    if (processButton) {
      processButton.disabled = false;
    }
    if (clearModelBtn) {
      clearModelBtn.style.display = 'block';
    }
  } else {
    if (modelImagePreview) {
      modelImagePreview.style.display = 'none';
    }
    if (processButton) {
      processButton.disabled = true;
    }
    if (clearModelBtn) {
      clearModelBtn.style.display = 'none';
    }
  }
}

// Clear stored image
function clearStoredImage() {
  uploadedModelImageBase64 = null;
  chrome.storage.local.remove(['uploadedModelImage', 'hasUploadedImage', 'imageTimestamp'], function() {
    if (chrome.runtime.lastError) {
      console.error('Storage clear error:', chrome.runtime.lastError);
    } else {
      console.log('Cleared stored image');
    }
  });
  if (modelImageInput) {
    modelImageInput.value = '';
  }
  updateUI();
}

// WebSocket function for legacy mode (default model)
async function startWebSocketAndSendLegacyImage(garmentImageUrl) {
  try {
    console.log('Starting WebSocket for legacy mode');
    websocket = new WebSocket('ws://localhost:8765');
    
    const connectionTimeout = setTimeout(() => {
      if (websocket.readyState === WebSocket.CONNECTING) {
        websocket.close();
        updateStatus("Connection timeout!");
        displayResultMessage("Could not connect to server. Make sure Python server is running.");
      }
    }, 10000);
    
    websocket.onopen = () => {
      console.log('WebSocket connection opened');
      clearTimeout(connectionTimeout);
      updateStatus("Connected, processing with default model...");
      
      // Send garment image with legacy message type
      websocket.send(JSON.stringify({
        type: 'image',
        url: garmentImageUrl
      }));
    };
    
    websocket.onmessage = handleWebSocketMessage;
    websocket.onerror = handleWebSocketError;
    websocket.onclose = handleWebSocketClose;
    
  } catch (error) {
    console.error('WebSocket startup error:', error);
    updateStatus("WebSocket startup error!");
    displayResultMessage("Could not start WebSocket.");
  }
}

// WebSocket function for custom mode (uploaded model + garment URL)
async function startWebSocketAndProcessViton(modelImageBase64, garmentImageUrl) {
  try {
    console.log('Starting WebSocket for custom mode');
    websocket = new WebSocket('ws://localhost:8765');
    
    const connectionTimeout = setTimeout(() => {
      if (websocket.readyState === WebSocket.CONNECTING) {
        websocket.close();
        updateStatus("Connection timeout!");
        displayResultMessage("Could not connect to server. Make sure Python server is running.");
      }
    }, 10000);
    
    websocket.onopen = () => {
      console.log('WebSocket connection opened');
      clearTimeout(connectionTimeout);
      updateStatus("Connected, sending images for processing...");
      
      // Send both model image (base64) and garment image (URL)
      websocket.send(JSON.stringify({
        type: 'process_viton',
        model_image_base64: modelImageBase64,
        garment_url: garmentImageUrl
      }));
    };
    
    websocket.onmessage = handleWebSocketMessage;
    websocket.onerror = handleWebSocketError;
    websocket.onclose = handleWebSocketClose;
    
  } catch (error) {
    console.error('WebSocket startup error:', error);
    updateStatus("WebSocket startup error!");
    displayResultMessage("Could not start WebSocket.");
  }
}

function handleWebSocketMessage(event) {
  try {
    const data = JSON.parse(event.data);
    console.log('Received WebSocket message:', data);
    
    if (data.type === 'processed_image') {
      displayResultImage(data.image_base64 || data.image_url);
      updateStatus("Virtual try-on completed successfully!");
    } else if (data.type === 'status') {
      updateStatus(data.message);
    } else if (data.type === 'error') {
      updateStatus("Processing error: " + data.message);
      displayResultMessage("Error during processing: " + data.message);
    }
  } catch (error) {
    console.error('Message processing error:', error);
    updateStatus("Result processing error!");
    displayResultMessage("Could not process server response.");
  }
}

function handleWebSocketError(error) {
  console.error('WebSocket error:', error);
  updateStatus("WebSocket connection error! Is the server running?");
  displayResultMessage("Could not connect to WebSocket server. Make sure Python server is running on port 8765.");
}

function handleWebSocketClose(event) {
  console.log('WebSocket connection closed', event);
  if (event.code !== 1000) { // 1000 is normal closure
    updateStatus("Connection closed unexpectedly!");
  }
}

// Extract garment images from e-commerce sites (injected into page)
function extractImagesById() {
  const targetIds = [
    'landingImage' // Amazon product page image ID
  ];
  
  const extractedImages = [];
  
  // Extract by ID
  for (const id of targetIds) {
    const img = document.getElementById(id);
    if (img && img.src) {
      extractedImages.push({
        src: img.src,
        alt: img.alt || '',
        id: id,
        method: 'id'
      });
    }
  }
  
  // Extract by class if no ID matches found  
  if (extractedImages.length === 0) {
    const targetClasses = [
      'i9jTSpEeoI29_M1mOKct hb-HbImage-view__image', // Hepsiburada main page
      'hbImageView-module_hbImage__Ca3xO', // Hepsiburada product page
      'p-card-img', // Trendyol main page
      '_carouselThumbsImage_ddecc3e' // Trendyol product page
    ];
    
    for (const className of targetClasses) {
      const images = document.querySelectorAll(`img.${className.replace(/ /g, '.')}`);
      images.forEach(img => {
        if (img.src && !extractedImages.some(existing => existing.src === img.src)) {
          extractedImages.push({
            src: img.src,
            alt: img.alt || '',
            className: className,
            method: 'class'
          });
        }
      });
      if (extractedImages.length > 0) break;
    }
  }
  
  return extractedImages;
}

// UI helper functions
function updateStatus(message) {
  console.log('Status:', message);
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

function displayResultImage(imageBase64) {
  const container = document.getElementById('imageContainer');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center;">
        <h4 style="color: #28a745; margin-bottom: 10px;">Virtual Try-On Result:</h4>
        <img src="data:image/png;base64,${imageBase64}" 
             style="max-width: 100%; height: auto; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" 
             alt="Virtual try-on result">
        <div style="margin-top: 10px;">
          <button onclick="clearStoredImage()" style="background-color: #dc3545; padding: 5px 10px; font-size: 12px;">
            Clear Uploaded Model
          </button>
        </div>
      </div>
    `;
  }
}

function displayResultMessage(message) {
  const container = document.getElementById('imageContainer');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; color: #dc3545; padding: 20px;">
        <strong>Message:</strong><br>${message}
      </div>
    `;
  }
}
