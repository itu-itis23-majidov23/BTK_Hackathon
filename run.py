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
import tempfile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def handle_client(websocket):
    logger.info(f"New connection: {websocket.remote_address}")
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.info(f"Received message: {data.get('type', 'unknown')}")
                
                if data.get('type') == 'process_viton':
                    # Expects: { type: 'process_viton', model_image_base64: '...', garment_url: 'https://...' }
                    model_image_b64 = data.get('model_image_base64', '')
                    garment_url = data.get('garment_url', '')
                    
                    if not model_image_b64 or not garment_url:
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'message': 'Both model image and garment URL are required'
                        }))
                        continue
                    
                    logger.info(f"Processing model image (base64) and garment URL: {garment_url[:100]}...")

                    # Send acknowledgment
                    await websocket.send(json.dumps({
                        'type': 'status',
                        'message': 'Images received, processing virtual try-on...'
                    }))

                    await process_viton_with_uploaded_model(websocket, model_image_b64, garment_url)
                
                elif data.get('type') == 'image':
                    # Legacy support for single garment image with default model
                    garment_url = data.get('url', '')
                    logger.info(f"Processing garment image URL (legacy mode): {garment_url[:100]}...")

                    # Send acknowledgment
                    await websocket.send(json.dumps({
                        'type': 'status',
                        'message': 'Image received, processing with default model...'
                    }))

                    # Use the default model_7.png as the model image
                    model_img_path = "model_7.png"
                    if not os.path.exists(model_img_path):
                        logger.error(f"Model image not found: {model_img_path}")
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'message': 'Default model image not found on server'
                        }))
                        continue
                    
                    await process_viton_with_default_model(websocket, garment_url, model_img_path)
                        
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

async def process_viton_with_uploaded_model(websocket, model_image_b64, garment_url):
    """Process virtual try-on with uploaded model image and garment URL"""
    model_temp_path = None
    
    try:
        # Save uploaded model image to temporary file
        await websocket.send(json.dumps({
            'type': 'status',
            'message': 'Saving uploaded model image...'
        }))
        
        model_temp_path = save_base64_image_to_temp(model_image_b64)
        if not model_temp_path:
            await websocket.send(json.dumps({
                'type': 'error',
                'message': 'Failed to save uploaded model image'
            }))
            return
        
        await websocket.send(json.dumps({
            'type': 'status',
            'message': 'Model image saved, processing with AI...'
        }))
        
        # Call VTON pipeline with both images
        client = Client("Agents-MCP-Hackathon/viton-mcp-server")
        
        result = client.predict(
            model_image_path=handle_file(model_temp_path),
            garment_image_path=None,
            model_url=None,
            garment_url=garment_url,
            n_steps=20,
            image_scale=2,
            seed=-1,
            api_name="/run_viton"
        )
        
        # Send result back to client
        await send_result(websocket, result)
        
    except Exception as e:
        logger.error(f"Virtual try-on processing error: {e}")
        await websocket.send(json.dumps({
            'type': 'error',
            'message': f'Processing failed: {str(e)}'
        }))
    finally:
        # Clean up temporary model image file
        if model_temp_path and os.path.exists(model_temp_path):
            try:
                os.unlink(model_temp_path)
                logger.info(f"Cleaned up temporary model image: {model_temp_path}")
            except Exception as e:
                logger.error(f"Failed to clean up temp file {model_temp_path}: {e}")

async def process_viton_with_default_model(websocket, garment_url, model_img_path):
    """Process with default model (legacy support)"""
    try:
        client = Client("Agents-MCP-Hackathon/viton-mcp-server")
        
        result = client.predict(
            model_image_path=handle_file(model_img_path),
            garment_image_path=None,
            model_url=None,
            garment_url=garment_url,
            n_steps=20,
            image_scale=2,
            seed=-1,
            api_name="/run_viton"
        )
        
        await send_result(websocket, result)
        
    except Exception as e:
        logger.error(f"Default model processing error: {e}")
        await websocket.send(json.dumps({
            'type': 'error',
            'message': f'Processing failed: {str(e)}'
        }))

def save_base64_image_to_temp(base64_data):
    """Save base64 encoded image to temporary file"""
    try:
        # Remove data URL prefix if present (e.g., "data:image/png;base64,")
        if ',' in base64_data:
            base64_data = base64_data.split(',', 1)[1]
        
        # Decode base64 data
        image_data = base64.b64decode(base64_data)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(image_data)
            temp_file_path = temp_file.name
        
        # Verify the image can be opened
        with Image.open(temp_file_path) as img:
            # Convert to RGB if necessary and save as JPEG
            if img.mode in ('RGBA', 'LA'):
                img = img.convert('RGB')
            img.save(temp_file_path, 'JPEG', quality=95)
        
        logger.info(f"Saved base64 image to temporary file: {temp_file_path}")
        return temp_file_path
        
    except Exception as e:
        logger.error(f"Failed to save base64 image: {e}")
        return None

async def send_result(websocket, result):
    """Send processing result to client"""
    if result and len(result) > 0:
        img_path = result[0].get("image")
        if img_path and os.path.exists(img_path):
            with open(img_path, "rb") as f:
                img_b64 = base64.b64encode(f.read()).decode()

            response = {
                'type': 'processed_image',
                'image_base64': img_b64,
                'message': 'Virtual try-on completed successfully!'
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

async def main():
    async with websockets.serve(handle_client, "localhost", 8765):
        logger.info("WebSocket server started at ws://localhost:8765")
        logger.info("Supported message types:")
        logger.info("  - process_viton: {model_image_base64: '...', garment_url: 'https://...'}")
        logger.info("  - image: {url: 'https://...'} (legacy mode with default model)")
        await asyncio.Future()  # run forever

def run_viton_and_save():
    """Test function for local processing"""
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
