import os
from flask import Blueprint, request, jsonify

visits_bp = Blueprint('visits', __name__)

DOWNLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'downloads')
VISITS_FILE = os.path.join(DOWNLOAD_FOLDER, 'visits.txt')

@visits_bp.route('/api/visits', methods=['GET', 'POST'])
def visits():
    count = 0
    if os.path.exists(VISITS_FILE):
        try:
            with open(VISITS_FILE, 'r') as f:
                content = f.read().strip()
                if content:
                    count = int(content)
        except Exception:
            pass
            
    if request.method == 'POST':
        count += 1
        try:
            os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
            with open(VISITS_FILE, 'w') as f:
                f.write(str(count))
        except Exception:
            pass
            
    return jsonify({'visits': count})
