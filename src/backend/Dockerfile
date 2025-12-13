# Builder stage
FROM ruby:3.3-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    tzdata

WORKDIR /app

# Install gems
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local deployment 'true' && \
    bundle config set --local without 'development test' && \
    bundle config set --local path /usr/local/bundle && \
    bundle install --jobs 4 --retry 3

# Copy application
COPY . .

# Clean up
RUN rm -rf tmp/cache vendor/bundle/ruby/*/cache

# Runtime stage
FROM ruby:3.3-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    postgresql-client \
    tzdata

WORKDIR /app

# Copy gems and app
COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY --from=builder /app /app

# Create non-root user
RUN addgroup -g 1000 rails && \
    adduser -D -u 1000 -G rails rails && \
    chown -R rails:rails /app

USER rails

EXPOSE 3000

# Start application with database setup
CMD ["sh", "-c", "bundle exec bin/rails db:create db:migrate 2>/dev/null || true && bundle exec bin/rails server -b 0.0.0.0"]
