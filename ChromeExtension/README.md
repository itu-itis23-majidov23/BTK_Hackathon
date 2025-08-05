# Chrome Extension - WebSocket Entegrasyonu

## Kurulum ve Çalıştırma

### 1. Python WebSocket Server
```bash
# Gerekli paketleri yükle
pip install -r requirements.txt

# WebSocket sunucusunu başlat
python websocket_server.py
```

### 2. Chrome Extension
1. Chrome'u aç ve `chrome://extensions/` adresine git
2. "Geliştirici modu"nu etkinleştir
3. "Paketlenmemiş uzantı yükle" butonuna tıkla
4. Bu klasörü seç

## Kullanım

1. **Python sunucusunu başlat**: `python websocket_server.py`
2. **Desteklenen bir siteye git**: Amazon, Trendyol, Hepsiburada
3. **Extension'ı aç**: Sağ üst köşedeki extension ikonuna tıkla
4. **"Üstümde Göster" butonuna tıkla**: Tüm işlemler otomatik yapılır
   - Sayfadaki görselleri bulur
   - İlk görseli WebSocket'e gönderir
   - İşlenmiş görseli sonuç konteynerinde gösterir

## Özellikler

- **Tek buton ile tam otomatis**: Tüm işlemler tek tıkla yapılır
- **Akıllı görsel bulma**: Belirli ID'lere ve class'lara sahip görselleri otomatik bulur
- **WebSocket entegrasyonu**: Python sunucusu ile sorunsuz iletişim
- **Responsive tasarım**: Sonuç görseli orantılı ve büyük gösterilir
- **Türkçe karakter desteği**: Tam Türkçe desteği

## Desteklenen Siteler

Extension şu ID'lere sahip görselleri arar:
- `landingImage` (Amazon)

Ve şu class'lara sahip görselleri arar:
- `i9jTSpEeoI29_M1mOKct hb-HbImage-view__image` (Hepsiburada ana sayfa)
- `hbImageView-module_hbImage__Ca3xO` (Hepsiburada ürün sayfası)
- `p-card-img` (Trendyol ana sayfa)
- `_carouselThumbsImage_ddecc3e` (Trendyol ürün sayfası)

Yeni ID veya class eklemek için `popup.js` dosyasındaki `targetIds` ve `targetClasses` dizilerini düzenleyin.

## İşlem Akışı

1. **Görsel Bulma**: Sayfadaki desteklenen ID/class'lara sahip görselleri tarar
2. **WebSocket Bağlantısı**: Python sunucusuna bağlanır
3. **Görsel Gönderme**: İlk bulunan görseli JSON formatında gönderir
4. **Sonuç Alma**: İşlenmiş görseli alır ve büyük konteynerda gösterir
5. **Otomatik Temizlik**: WebSocket bağlantısını otomatik kapatır
