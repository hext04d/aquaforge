# Aquaforge - YouTube to MP3 Downloader

A beautiful, simple web application to download and convert YouTube videos to high-quality MP3 files instantly.

## Features
- **Download videos and playlists in different formats**

   [! MP3 and MP4 only for now, more formats coming soon !]

## Requirements
- Python 3
- Dependencies: `Flask`, `yt-dlp`, `flask-cors`
- A static `ffmpeg` binary

## How to Run

### Option 1: Using Docker (Recommended)
You can run the entire application using Docker Compose. It will automatically set up the backend, frontend, and all dependencies like `ffmpeg`.

1. **Start the application**:
   ```bash
   docker-compose up -d --build
   ```
   or
   ```bash
   ./test.sh run
   ```

2. **Open the App**:
   Navigate to [http://localhost:8080](http://localhost:8080) in your web browser.

### Option 2: Running Locally

1. **Start the Backend**:
   Open a terminal, navigate to the `backend` directory, and run the Flask server:
   ```bash
   cd backend
   python3 app.py
   ```
   The server will start on `http://localhost:5000`.

2. **Open the Frontend**:
   Simply open `frontend/index.html` in your web browser. You don't need a local server for the frontend.
   ```bash
   xdg-open frontend/index.html
   ```

