// Sayfadaki ilk img etiketini bul
const firstImg = document.querySelector("img");

if (firstImg) {
  // Resmin kaynağını al
  const imageUrl = firstImg.src;

  // Popup'a göndermek için message yolla
  chrome.runtime.sendMessage({ type: "image", src: imageUrl });
} else {
  chrome.runtime.sendMessage({ type: "image", src: "Resim bulunamadı." });
}
