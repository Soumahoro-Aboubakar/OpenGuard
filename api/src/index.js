import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRouter from './routes/analyze.js';
import repoRouter from './routes/repo.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api', analyzeRouter);
app.use('/api', repoRouter);
 
app.get('/api/health', (_, res) => {
  res.json({ success: true, message: 'OpenGuard API OK' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`OpenGuard API running on http://localhost:${PORT}`);
  });
}

export default app;
