const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');
const enrollmentRoutes = require('./routes/enrollment');
const featuresRoutes = require('./routes/features');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', featuresRoutes);

// Root info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'DSA Judge API is running',
    health: '/health',
    apiBase: '/api',
    routes: {
      auth: '/api/auth',
      problems: '/api/problems',
      submissions: '/api/submissions',
      enrollment: '/api/enrollment',
    },
  });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app;
