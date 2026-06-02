# Use Node.js LTS (18-alpine is lightweight and secure)
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port your backend runs on
EXPOSE 5000

# Start the Node.js server
CMD ["npm", "start"]
