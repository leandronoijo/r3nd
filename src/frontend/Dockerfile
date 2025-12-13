# Use Python for simple static file serving
FROM python:3.11-alpine

WORKDIR /app

# Copy static frontend
COPY dist-static ./public

# Create a simple server script
RUN echo '#!/usr/bin/env python3' > server.py && \
    echo 'import http.server' >> server.py && \
    echo 'import socketserver' >> server.py && \
    echo 'import os' >> server.py && \
    echo '' >> server.py && \
    echo 'PORT = int(os.environ.get("PORT", 4173))' >> server.py && \
    echo '' >> server.py && \
    echo 'class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):' >> server.py && \
    echo '    def end_headers(self):' >> server.py && \
    echo '        self.send_header("Access-Control-Allow-Origin", "*")' >> server.py && \
    echo '        super().end_headers()' >> server.py && \
    echo '' >> server.py && \
    echo 'os.chdir("public")' >> server.py && \
    echo 'with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:' >> server.py && \
    echo '    print(f"Frontend server running at http://0.0.0.0:{PORT}")' >> server.py && \
    echo '    httpd.serve_forever()' >> server.py && \
    chmod +x server.py

# Expose port
EXPOSE 4173

# Set environment variables
ENV PORT=4173

# Start server
CMD ["python3", "server.py"]
