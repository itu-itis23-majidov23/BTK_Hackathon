#!/usr/bin/env python3
"""
Test WebSocket server to verify extension functionality
"""
import asyncio
import websockets
import json
import base64
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def handle_test_client(websocket):
    logger.info(f"Test connection: {websocket.remote_address}")
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get('type', 'unknown')
                logger.info(f"Received: {msg_type}")
                
                if msg_type == 'process_viton':
                    model_b64 = data.get('model_image_base64', '')
                    garment_url = data.get('garment_url', '')
                    
                    logger.info(f"Model image size: {len(model_b64)} chars")
                    logger.info(f"Garment URL: {garment_url[:100]}...")
                    
                    # Send status updates
                    await websocket.send(json.dumps({
                        'type': 'status',
                        'message': 'Processing images...'
                    }))
                    
                    await asyncio.sleep(2)
                    
                    # Send mock result
                    await websocket.send(json.dumps({
                        'type': 'processed_image',
                        'image_base64': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                        'message': 'Test processing completed!'
                    }))
                    
                elif msg_type == 'image':
                    garment_url = data.get('url', '')
                    logger.info(f"Legacy mode - Garment URL: {garment_url[:100]}...")
                    
                    await websocket.send(json.dumps({
                        'type': 'status',
                        'message': 'Processing with default model...'
                    }))
                    
                    await asyncio.sleep(1)
                    
                    await websocket.send(json.dumps({
                        'type': 'processed_image',
                        'image_base64': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                        'message': 'Test processing completed!'
                    }))
                    
            except Exception as e:
                logger.error(f"Message error: {e}")
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': f'Test error: {str(e)}'
                }))
                
    except websockets.exceptions.ConnectionClosed:
        logger.info("Test connection closed")
    except Exception as e:
        logger.error(f"Connection error: {e}")

async def main():
    async with websockets.serve(handle_test_client, "localhost", 8765):
        logger.info("Test WebSocket server started at ws://localhost:8765")
        logger.info("Ready to test Chrome extension!")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
