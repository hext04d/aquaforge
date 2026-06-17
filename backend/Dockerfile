FROM python:3.11-slim

# Install ffmpeg, curl and unzip (for deno)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl unzip && \
    rm -rf /var/lib/apt/lists/*

# Install Deno as the default JS runtime for yt-dlp
RUN curl -fsSL https://deno.land/install.sh | sh && \
    ln -s /root/.deno/bin/deno /usr/local/bin/deno

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Expose port
EXPOSE 5000

# Start gunicorn server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app", "--timeout", "600"]
