const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const serverless = require("serverless-http");

const app = express();

// CORS configuration for Render deployment
app.use(cors({
  origin: '*', // Allow all origins, or specify your frontend URL
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let problems = [];
let nextId = 1;

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Community Problem Solver API',
    endpoints: {
      problems: '/problems',
      health: '/health',
      stats: '/stats'
    }
  });
});

// Get all problems (with optional filters)
app.get('/problems', (req, res) => {
  const { status, category } = req.query;
  let filteredProblems = [...problems];
  
  if (status) {
    filteredProblems = filteredProblems.filter(p => p.status === status);
  }
  if (category) {
    filteredProblems = filteredProblems.filter(p => p.category === category);
  }
  
  res.json({
    success: true,
    count: filteredProblems.length,
    data: filteredProblems
  });
});

// Get single problem
app.get('/problems/:id', (req, res) => {
  const problem = problems.find(p => p.id === parseInt(req.params.id));
  
  if (!problem) {
    return res.status(404).json({
      success: false,
      message: 'Problem not found'
    });
  }
  
  res.json({
    success: true,
    data: problem
  });
});

// Create new problem
app.post('/problems', (req, res) => {
  const { title, description, category, location } = req.body;
  
  if (!title || !description || !category || !location) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }
  
  const newProblem = {
    id: nextId++,
    title,
    description,
    category,
    location,
    upvotes: 0,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  problems.push(newProblem);
  
  res.status(201).json({
    success: true,
    message: 'Problem reported successfully',
    data: newProblem
  });
});

// Update problem
app.put('/problems/:id', (req, res) => {
  const problemIndex = problems.findIndex(p => p.id === parseInt(req.params.id));
  
  if (problemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Problem not found'
    });
  }
  
  const { title, description, category, location, status } = req.body;
  
  problems[problemIndex] = {
    ...problems[problemIndex],
    ...(title && { title }),
    ...(description && { description }),
    ...(category && { category }),
    ...(location && { location }),
    ...(status && { status }),
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Problem updated successfully',
    data: problems[problemIndex]
  });
});

// Upvote problem
app.post('/problems/:id/upvote', (req, res) => {
  const problemIndex = problems.findIndex(p => p.id === parseInt(req.params.id));
  
  if (problemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Problem not found'
    });
  }
  
  problems[problemIndex].upvotes += 1;
  problems[problemIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Upvote recorded',
    data: problems[problemIndex]
  });
});

// Update problem status
app.patch('/problems/:id/status', (req, res) => {
  const problemIndex = problems.findIndex(p => p.id === parseInt(req.params.id));
  
  if (problemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Problem not found'
    });
  }
  
  const { status } = req.body;
  
  if (!['open', 'in-progress', 'resolved'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be: open, in-progress, or resolved'
    });
  }
  
  problems[problemIndex].status = status;
  problems[problemIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Status updated successfully',
    data: problems[problemIndex]
  });
});

// Delete problem
app.delete('/problems/:id', (req, res) => {
  const problemIndex = problems.findIndex(p => p.id === parseInt(req.params.id));
  
  if (problemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Problem not found'
    });
  }
  
  const deletedProblem = problems.splice(problemIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'Problem deleted successfully',
    data: deletedProblem
  });
});

// Get statistics
app.get('/stats', (req, res) => {
  const stats = {
    total: problems.length,
    open: problems.filter(p => p.status === 'open').length,
    inProgress: problems.filter(p => p.status === 'in-progress').length,
    resolved: problems.filter(p => p.status === 'resolved').length,
    categories: {
      infrastructure: problems.filter(p => p.category === 'infrastructure').length,
      safety: problems.filter(p => p.category === 'safety').length,
      environment: problems.filter(p => p.category === 'environment').length,
      education: problems.filter(p => p.category === 'education').length,
      health: problems.filter(p => p.category === 'health').length
    },
    topUpvoted: problems.sort((a, b) => b.upvotes - a.upvotes).slice(0, 5)
  };
  
  res.json({
    success: true,
    data: stats
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    problemsCount: problems.length
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server for Render (always listen, not just in development)
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Ready to accept connections`);
});

// Export for serverless environments (Vercel, Netlify, etc.)
module.exports = app;
module.exports.handler = serverless(app);