import shutil
import asyncio
import websockets
import json
import base64
from io import BytesIO
from PIL import Image
import logging
from gradio_client import Client, handle_file
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def handle_client(websocket):
    logger.info(f"New connection: {websocket.remote_address}")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.info(f"Received message: {data.get('type', 'unknown')}")
                if data.get('type') == 'image':
                    # Accepts: { type: 'image', url: 'https://...' }
                    image_url = data.get('url', '')
                    logger.info(f"Processing garment image URL: {image_url[:100]}...")

                    # Send acknowledgment
                    await websocket.send(json.dumps({
                        'type': 'status',
                        'message': 'Image received, processing...'
                    }))

                    # Call your VTON pipeline
                    client = Client("Agents-MCP-Hackathon/viton-mcp-server")
                    
                    # Use the model_7.png as the model image
                    model_img_path = "model_7.png"
                    if not os.path.exists(model_img_path):
                        logger.error(f"Model image not found: {model_img_path}")
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'message': 'Model image not found on server'
                        }))
                        continue
                    
                    result = client.predict(
                        model_image_path=handle_file(model_img_path),
                        garment_image_path=None,
                        model_url=None,
                        garment_url=image_url,
                        n_steps=20,
                        image_scale=2,
                        seed=-1,
                        api_name="/run_viton"
                    )
                    
                    # Process the result
                    if result and len(result) > 0:
                        img_path = result[0].get("image")
                        if img_path and os.path.exists(img_path):
                            with open(img_path, "rb") as f:
                                img_b64 = base64.b64encode(f.read()).decode()

                            response = {
                                'type': 'processed_image',
                                'image_base64': img_b64,
                                'message': 'Image processed successfully!'
                            }
                            await websocket.send(json.dumps(response))
                            logger.info("Processed image sent successfully")
                        else:
                            logger.error("No valid image path in result")
                            await websocket.send(json.dumps({
                                'type': 'error',
                                'message': 'Processing failed - no output image generated'
                            }))
                    else:
                        logger.error("No result from VTON processing")
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'message': 'Processing failed - no result from AI model'
                        }))
                        
            except Exception as e:
                logger.error(f"Message processing error: {e}")
                try:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': f'Processing error: {str(e)}'
                    }))
                except:
                    pass
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Connection closed: {websocket.remote_address}")
    except Exception as e:
        logger.error(f"Connection error: {e}")

async def main():
    async with websockets.serve(handle_client, "localhost", 8765):
        logger.info("WebSocket server started at ws://localhost:8765")
        await asyncio.Future()  # run forever

def run_viton_and_save():
    client = Client("Agents-MCP-Hackathon/viton-mcp-server")

    model_img = handle_file("model_7.png")
    garment_img = handle_file("a.png") # image url

    result = client.predict(
        model_image_path=model_img,
        garment_image_path=garment_img,
        model_url=None,
        garment_url=None,
        n_steps=20,
        image_scale=2,
        seed=-1,
        api_name="/run_viton"
    )
    
    for i, output_dict in enumerate(result):
        img_path = output_dict.get("image")
        if img_path and os.path.exists(img_path):
            dest_path = f"results/output_{i}.webp"  # you can rename to png if you want (just change extension)
            shutil.copy(img_path, dest_path)
            print(f"Saved result image to {dest_path}")
        else:
            print(f"No valid image path found in result {i}")

if __name__ == "__main__":
    # run_viton_and_save()
    asyncio.run(main())
