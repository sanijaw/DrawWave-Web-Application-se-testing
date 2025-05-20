# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set working directory in the container
WORKDIR /app

# Install system dependencies required for OpenCV and SQLite
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code to the container
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
# The API_URL can be overridden at runtime with: docker run -e API_URL=http://your-api-url:5000/api ...
# If not set, code will try multiple connection options automatically

# Expose the WebSocket server port (modify this if your server uses a different port)
EXPOSE 8765

# Command to run the web server version of the application
CMD ["python", "web_main.py"]
