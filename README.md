# LocalLM

A privacy-first AI chat application that runs large language models entirely on your device. Choose between browser-based inference with Google's Gemma models via MediaPipe or self-hosted inference with Ollama.

A hosted version is available at [https://locallm.chiragvijay.com](https://locallm.chiragvijay.com).

![LocalLM Screenshot](/assets/welcome.png)

## Core Features

- **Multiple Inference Backends** — Run models via Google MediaPipe (browser-based with Gemma) or connect to a local Ollama instance
- **Privacy First** — All conversations stay on your device; full offline support with IndexedDB storage
- **WebGPU Acceleration** — Leverage GPU acceleration in the browser for faster inference with MediaPipe
- **Real-time Streaming** — See responses generate token-by-token with live generation stats
- **Multi-Chat Support** — Organize conversations into projects with persistent storage
- **Modern UI** — Clean, responsive interface with dark/light theme switching and smooth animations

## Inference Methods

### Google MediaPipe + Gemma (Browser-Based)

Run Google's efficient Gemma models directly in your browser with hardware acceleration:

- **Gemma 2B** — Lightweight, perfect for quick responses
- **Gemma 4B** — Balanced performance and quality
- **No Server Required** — 100% client-side, completely offline after downloading the model
- **WebGPU Powered** — Automatic GPU acceleration when available, falls back to WASM

### Ollama (Self-Hosted)

Connect to a local Ollama instance for flexible model selection and faster inference:

- **Any Ollama Model** — Access the full Ollama model library (Llama, Mistral, neural-chat, etc.)
- **Local Server** — Run `ollama serve` on your machine
- **Flexible** — Swap models without reloading the app
