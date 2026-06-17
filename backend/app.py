import os
import uuid
import shutil
from io import BytesIO
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from youtube_service import YouTubeService

app = Flask(__name__)
CORS(app, expose_headers=["Content-Disposition"], origins="*")

DOWNLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'downloads')
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

youtube_service = YouTubeService()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

@app.route('/api/info', methods=['POST'])
def get_info():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400

    try:
        info = youtube_service.get_video_info(url)
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/download', methods=['POST'])
def download_video():
    data = request.json
    url = data.get('url')
    format_type = data.get('format', 'mp3')
    quality = data.get('quality', 'best')
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400

    request_id = str(uuid.uuid4())
    request_dir = os.path.join(DOWNLOAD_FOLDER, request_id)
    os.makedirs(request_dir, exist_ok=True)

    try:
        final_file, filename = youtube_service.download_video_file(url, request_dir, format_type, quality)
        
        # Read the file into memory so we can delete the folder immediately
        with open(final_file, 'rb') as f:
            file_data = BytesIO(f.read())
            
        # Clean up the temporary folder
        shutil.rmtree(request_dir, ignore_errors=True)
        
        mimetype = 'audio/mpeg' if format_type == 'mp3' else 'video/mp4'
        
        return send_file(
            file_data,
            as_attachment=True,
            download_name=filename,
            mimetype=mimetype
        )
    except Exception as e:
        # Clean up on error as well
        if os.path.exists(request_dir):
            shutil.rmtree(request_dir, ignore_errors=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
