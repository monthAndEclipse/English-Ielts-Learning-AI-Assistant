# Backend Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy only backend files (exclude frontend)
COPY app/ ./app/

# Expose FastAPI port
EXPOSE 8003

# Temporary CMD: list /app and then keep container alive
#CMD ls -lR /app && sleep infinity

# Run FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]