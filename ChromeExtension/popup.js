// Ana buton - Tüm işlemleri yapar
document.getElementById("showUponMe").addEventListener("click", async () => {
  updateStatus("İşlem başlatılıyor...");
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractImagesById,
  }, async (results) => {
    if (results && results[0] && results[0].result && results[0].result.length > 0) {
      const firstImageUrl = results[0].result[0].src;
      updateStatus("Görsel bulundu, WebSocket'e gönderiliyor...");
      await startWebSocketAndSendImage(firstImageUrl);
    } else {
      updateStatus("Hiç görsel bulunamadı!");
      displayResultMessage("Bu sayfada desteklenen görsel bulunamadı.");
    }
  });
});

// WebSocket bağlantısı
let websocket = null;

// WebSocket başlat ve görsel gönder
async function startWebSocketAndSendImage(imageUrl) {
  try {
    // WebSocket bağlantısını kur
    websocket = new WebSocket('ws://localhost:8765');
    
    // Connection timeout
    const connectionTimeout = setTimeout(() => {
      if (websocket.readyState === WebSocket.CONNECTING) {
        websocket.close();
        updateStatus("Bağlantı zaman aşımına uğradı!");
        displayResultMessage("Sunucuya bağlanılamadı. Python sunucusunun çalıştığından emin olun.");
      }
    }, 10000); // 10 second timeout
    
    websocket.onopen = () => {
      console.log('WebSocket bağlantısı açıldı');
      clearTimeout(connectionTimeout);
      updateStatus("Bağlantı kuruldu, görsel işleniyor...");
      
      // Görseli gönder
      websocket.send(JSON.stringify({
        type: 'image',
        url: imageUrl
      }));
    };
    
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        
        if (data.type === 'processed_image') {
          displayResultImage(data.image_base64 || data.image_url);
          updateStatus("İşlem tamamlandı!");
        } else if (data.type === 'status') {
          updateStatus(data.message);
        } else if (data.type === 'error') {
          updateStatus("İşlem hatası: " + data.message);
          displayResultMessage("İşlem sırasında hata oluştu: " + data.message);
        }
      } catch (error) {
        console.error('Mesaj işleme hatası:', error);
        updateStatus("Sonuç işleme hatası!");
        displayResultMessage("Sunucudan gelen yanıt işlenemedi.");
      }
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket hatası:', error);
      clearTimeout(connectionTimeout);
      updateStatus("WebSocket bağlantı hatası! Sunucu çalışıyor mu?");
      displayResultMessage("WebSocket sunucusuna bağlanılamadı. Python sunucusunun çalıştığından emin olun.");
    };
    
    websocket.onclose = (event) => {
      console.log('WebSocket bağlantısı kapandı', event);
      clearTimeout(connectionTimeout);
      if (event.code !== 1000) { // 1000 is normal closure
        updateStatus("Bağlantı beklenmedik şekilde kapandı!");
      }
    };
    
  } catch (error) {
    console.error('WebSocket başlatma hatası:', error);
    updateStatus("WebSocket başlatma hatası!");
    displayResultMessage("WebSocket başlatılamadı.");
  }
}

// Belirli ID'lere sahip görselleri çeken fonksiyon
function extractImagesById() {
  // Çekmek istediğiniz ID'ler (bunları ihtiyacınıza göre değiştirebilirsiniz)
  const targetIds = [
    'landingImage' // Amazon ürün sayfası fotograf ID'si
  ];
  
  const extractedImages = [];
  
  // ID'lere göre görsel ara
  targetIds.forEach(id => {
    const img = document.getElementById(id);
    if (img && img.src) {
      extractedImages.push({
        id: id,
        src: img.src,
        alt: img.alt || '',
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      });
    }
  });
  
  // Eğer ID'lerle bulunamadıysa, class isimlerine göre de ara.
  const targetClasses = [
    'i9jTSpEeoI29_M1mOKct hb-HbImage-view__image', // Hepsiburada ana sayfası fotograf class ismi !!DEGISKEN!!
    'hbImageView-module_hbImage__Ca3xO', // Hepsiburada ürün sayfası fotograf class ismi
    'p-card-img', // Trendyol ana sayfası fotograf class ismi
    '_carouselThumbsImage_ddecc3e' // Trendyol ürün sayfası fotograf class ismi
  ];
  
  targetClasses.forEach(className => {
    const images = document.getElementsByClassName(className);
    for (let img of images) {
      if (img.tagName === 'IMG' && img.src) {
        extractedImages.push({
          className: className,
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        });
      }
    }
  });
  
  return extractedImages;
}

// Durum güncelleyici
function updateStatus(message) {
  const statusDiv = document.getElementById('status');
  if (statusDiv) {
    statusDiv.textContent = message;
    
    // Don't auto-clear error messages or completion messages
    if (!message.includes('hatası') && !message.includes('tamamlandı')) {
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 3000);
    }
  }
}

// Sonuç görselini göster
function displayResultImage(imageUrlOrBase64) {
  const resultImageDiv = document.getElementById('resultImage');
  if (resultImageDiv && imageUrlOrBase64) {
    resultImageDiv.innerHTML = '';
    const imgElement = document.createElement('img');
    if (imageUrlOrBase64.startsWith('data:image')) {
      imgElement.src = imageUrlOrBase64;
    } else if (imageUrlOrBase64.length > 1000) {
      imgElement.src = 'data:image/png;base64,' + imageUrlOrBase64;
    } else {
      imgElement.src = imageUrlOrBase64;
    }
    imgElement.style.maxWidth = '100%';
    imgElement.style.maxHeight = '300px';
    imgElement.style.width = 'auto';
    imgElement.style.height = 'auto';
    imgElement.style.objectFit = 'contain';
    imgElement.style.borderRadius = '5px';
    
    imgElement.onload = () => {
      updateStatus("Sonuç görseli yüklendi!");
    };
    
    imgElement.onerror = () => {
      displayResultMessage("Görsel yüklenemedi");
      updateStatus("Görsel yükleme hatası!");
    };
    
    resultImageDiv.appendChild(imgElement);
  }
}

// Sonuç mesajını göster
function displayResultMessage(message) {
  const resultImageDiv = document.getElementById('resultImage');
  if (resultImageDiv) {
    resultImageDiv.innerHTML = `<span style="color: #dc3545;">${message}</span>`;
  }
}
