# Use Ruby base image
FROM ruby:3.3-slim

WORKDIR /app

# Copy simple server
COPY simple_server.rb .

# Create non-root user
RUN groupadd -g 1000 rails && \
    useradd -u 1000 -g rails -m rails && \
    chown -R rails:rails /app

USER rails

EXPOSE 3000

# Start simple server
CMD ["ruby", "simple_server.rb"]
