FROM node:22-alpine

WORKDIR /app

# Install ffmpeg and build tools for native modules
RUN apk add --no-cache ffmpeg python3 make g++

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start"]
