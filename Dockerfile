# Use Node.js 20 as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies, including nodemon for auto-restart
RUN npm install && npm install -g nodemon

# Copy project files
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the server with nodemon
CMD ["nodemon", "--watch", ".", "--ext", "js,ts,json", "--exec", "npm", "run", "dev"]

