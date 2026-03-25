/**
 * Simple test endpoint to verify Vercel API routing works
 */
export default function handler(req, res) {
  res.status(200).json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasApiKey: !!process.env.VITE_AI_API_KEY,
      nodeEnv: process.env.NODE_ENV,
    }
  });
}
