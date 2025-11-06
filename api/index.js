const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const serverless = require("serverless-http");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let problems = [];
let nextId = 1;

app.get('/api/problems', (req, res) => {
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

app.get('/api/problems/:id', (req, res) => {
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

app.post('/api/problems', (req, res) => {
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

app.put('/api/problems/:id', (req, res) => {
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

app.post('/api/problems/:id/upvote', (req, res) => {
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

app.patch('/api/problems/:id/status', (req, res) => {
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

app.delete('/api/problems/:id', (req, res) => {
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

app.get('/api/stats', (req, res) => {
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

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// IMPORTANT FOR VERCEL
module.exports = serverless(app);
