FROM node:20.17.0-alpine

# Install bash and deno for script execution
RUN apk add --no-cache bash curl unzip \
    && curl -fsSL https://deno.land/x/install/install.sh | sh \
    && ln -s /root/.deno/bin/deno /usr/local/bin/deno

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Create data directory for persistence
RUN mkdir -p /app/data

# Create scripts directory
RUN mkdir -p /scripts

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV SCRIPTS_DIR=/scripts

# Start the application
CMD ["node", "backend/server.js"]
