# Node.js + Express + MongoDB Starter Template

A clean and working starter template for building backend applications with Node.js, Express, and MongoDB.

## Features
- Express server setup
- MongoDB connection using Mongoose
- Environment variables configured with `dotenv`
- CORS enabled
- Basic `GET "/"` test route

## Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally (or a MongoDB Atlas URI)

## Setup Instructions

1. **Install Dependencies**
   Open a terminal in the `server` directory and run:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   The `.env` file is already created with default configurations:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/starter_db
   ```
   *Note: Change the `MONGO_URI` if you are using a cloud database like MongoDB Atlas.*

3. **Run the Server**
   To start the server in development mode with auto-reload (using nodemon):
   ```bash
   npm run dev
   ```
   
   To start the server in production mode:
   ```bash
   npm start
   ```

4. **Verify it Works**
   Open your browser and navigate to `http://localhost:5000` or use an API client like Postman. You should see the response:
   ```text
   Server Running
   ```
