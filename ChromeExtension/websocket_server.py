#!/usr/bin/env python3
import asyncio
import websockets
import json
import base64
from io import BytesIO
from PIL import Image
import logging

# Logging ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def handle_client(websocket, path):
    logger.info(f"Yeni bağlantı: {websocket.remote_address}")
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.info(f"Mesaj alındı: {data.get('type', 'unknown')}")
                
                if data.get('type') == 'image':
                    # Accepts: { type: 'image', url: 'https://...' }
                    image_url = data.get('url', '')
                    logger.info(f"Görsel URL: {image_url[:100]}...")

                    # Call your VTON pipeline
                    from gradio_client import Client
                    client = Client("Agents-MCP-Hackathon/viton-mcp-server")
                    result = client.predict(
                        model_image_path=None,
                        garment_image_path=None,
                        model_url=None,
                        garment_url=image_url,
                        n_steps=20,
                        image_scale=2,
                        seed=-1,
                        api_name="/run_viton"
                    )
                    # Assume result is a list of dicts with 'image' key (file path)
                    img_path = result[0].get("image")
                    with open(img_path, "rb") as f:
                        img_b64 = base64.b64encode(f.read()).decode()

                    response = {
                        'type': 'processed_image',
                        'image_base64': img_b64,
                        'message': 'Görsel başarıyla işlendi!'
                    }
                    await websocket.send(json.dumps(response))
                    logger.info("İşlenmiş görsel gönderildi")
                    
            except json.JSONDecodeError:
                logger.error("JSON decode hatası")
            except Exception as e:
                logger.error(f"Mesaj işleme hatası: {e}")
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Bağlantı kapandı: {websocket.remote_address}")
    except Exception as e:
        logger.error(f"Bağlantı hatası: {e}")

async def main():
    # WebSocket sunucusunu başlat
    server = await websockets.serve(handle_client, "localhost", 8765)
    logger.info("WebSocket sunucusu localhost:8765 adresinde başlatıldı")
    logger.info("Sunucuyu durdurmak için Ctrl+C tuşlayın")
    
    # Sunucuyu çalıştır
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Sunucu durduruldu")
