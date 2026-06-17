import os
import yt_dlp
from typing import Dict, Any, Tuple

class YouTubeService:
    """
    A service class for interacting with YouTube using yt-dlp.
    Handles extraction of video/playlist metadata and downloading audio.
    """

    def __init__(self):
        """
        Initializes the YouTubeService and sets up the FFMPEG path if available.
        """
        self.ffmpeg_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ffmpeg_bin')
        self.base_extractor_args = {'youtube': {'player_client': ['android', 'tv', 'ios', 'web']}}

    def get_video_info(self, url: str) -> Dict[str, Any]:
        """
        Extracts metadata for a given YouTube URL.
        If the URL points to a playlist, it returns a list of its entries.

        Args:
            url (str): The YouTube video or playlist URL.

        Returns:
            Dict[str, Any]: A dictionary containing whether it's a playlist,
            the title, and the URL or list of entries.
        """
        ydl_opts = {
            'quiet': True,
            'extract_flat': True,
            'extractor_args': self.base_extractor_args
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if 'entries' in info:
                # Playlist
                entries = []
                for entry in info['entries']:
                    if entry and (entry.get('url') or entry.get('id')):
                        vid_url = entry.get('url')
                        if not vid_url:
                            vid_url = f"https://www.youtube.com/watch?v={entry.get('id')}"
                        entries.append({'title': entry.get('title', 'Unknown Title'), 'url': vid_url})
                return {'is_playlist': True, 'title': info.get('title', 'Playlist'), 'entries': entries}
            else:
                return {'is_playlist': False, 'title': info.get('title', 'Video'), 'url': url}

    def download_video_file(self, url: str, request_dir: str, format_type: str = 'mp3', quality: str = 'best') -> Tuple[str, str]:
        """
        Downloads a YouTube video as an MP3 or MP4 file into the specified directory.

        Args:
            url (str): The YouTube video URL to download.
            request_dir (str): The directory where the downloaded file should be saved.
            format_type (str): The requested format ('mp3' or 'mp4').
            quality (str): The requested quality ('best' or 'worst').

        Returns:
            Tuple[str, str]: A tuple containing the absolute path to the downloaded file
                             and the file's basename.
                             
        Raises:
            Exception: If no file was downloaded successfully.
        """
        output_path = os.path.join(request_dir, '%(title)s.%(ext)s')

        ydl_opts = {
            'outtmpl': output_path,
            'quiet': True,
            'noplaylist': True,
            'extractor_args': self.base_extractor_args
        }

        if format_type == 'mp3':
            # Audio (MP3) extraction
            ydl_opts['format'] = 'bestaudio/best' if quality == 'best' else 'worstaudio/worst'
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192' if quality == 'best' else '96',
            }]
        else:
            # Video (MP4) extraction
            if quality == 'best':
                ydl_opts['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
            else:
                ydl_opts['format'] = 'worstvideo[ext=mp4]+worstaudio[ext=m4a]/worst[ext=mp4]/worst'
            
            ydl_opts['merge_output_format'] = 'mp4'

        if os.path.exists(self.ffmpeg_path):
            ydl_opts['ffmpeg_location'] = self.ffmpeg_path

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.extract_info(url, download=True)
            
            files = os.listdir(request_dir)
            if not files:
                raise Exception("No file downloaded")
            
            final_file = os.path.join(request_dir, files[0])
            return final_file, files[0]
