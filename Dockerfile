# Use standard Node 18 (Debian-based) to avoid native build errors
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (using npm install is more forgiving than npm ci)
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the port your backend runs on
EXPOSE 5000

# Start the Node.js server
CMD ["npm", "start"]
