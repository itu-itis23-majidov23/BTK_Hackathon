---
title: Viton Mcp Server
emoji: 💻
colorFrom: red
colorTo: pink
sdk: gradio
sdk_version: 5.33.0
app_file: app.py
pinned: false
license: cc-by-nc-sa-4.0
short_description: MCP Server of Virtual Try On
tags:
    - mcp-server-track
    - viton
    - OOTDiffusion
    - FLUX
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

# Virtual Try-On

Virtual try-on application powered by [OOTDiffusion](https://github.com/levihsu/OOTDiffusion) that allows user to virtually try on user provided garment image or ai generated garment image. [FLUX.1-dev](https://huggingface.co/black-forest-labs/FLUX.1-dev) from [Nebius](https://nebius.com) AI Studio is used to generate the garment. The Gradio app connect to FastAPI backend server which is deployed on [Modal](https://modal.com) for running the inference pipeline on Nvidia A100 for faster inference. This application includes both a Gradio web interface and Model Context Protocol (MCP) server capabilities for seamless integration with AI assistants. Sample images for inference are obtained from [VITON-HD](https://github.com/shadow2496/VITON-HD)
