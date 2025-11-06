
// Root index.js - Entry point for Render
const app = require('./api/index');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API ready at http://localhost:${PORT}`);
});