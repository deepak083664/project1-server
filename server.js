require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

const cookieParser = require('cookie-parser');
const { apiLimiter } = require('./config/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorMiddleware'); // Import error handlers

const mongoSanitize = require('express-mongo-sanitize');

// Middleware
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Important for fetching images

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173', // Local dev
  process.env.CLIENT_URL   // Production frontend URL from Render
].filter(Boolean); // Remove undefined if CLIENT_URL is not set

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json()); // Allow parsing of JSON bodies
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Apply rate limiter to all api routes
app.use('/api/', apiLimiter);

// Basic test route
app.get('/', (req, res) => {
  res.send('Server Running');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/product'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/analytics', require('./routes/analytics'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/coupons', require('./routes/coupon'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/wishlist', require('./routes/wishlist'));

const root = path.resolve();
app.use('/uploads', express.static(path.join(root, 'server/uploads')));

// Error Handling Middlewares (MUST BE AT THE END OF ALL ROUTES)
app.use(notFound);
app.use(errorHandler);

const http = require('http');
const server = http.createServer(app);

// Initialize Socket.io
const socketIo = require('./config/socket');
socketIo.init(server);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
