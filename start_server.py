#!/usr/bin/env python3
"""
Simple script to start the WebSocket server for the Chrome extension
"""
import os
import sys

def main():
    print("=== BTK Hackathon VTON WebSocket Server ===")
    print("Starting server on ws://localhost:8765")
    print("Press Ctrl+C to stop the server")
    print("=" * 45)
    
    # Check if model image exists
    if not os.path.exists("model_7.png"):
        print("WARNING: model_7.png not found! Make sure it exists in the current directory.")
        return
    
    # Import and run the server
    try:
        from run import main as run_main
        import asyncio
        asyncio.run(run_main())
    except KeyboardInterrupt:
        print("\nServer stopped by user.")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
