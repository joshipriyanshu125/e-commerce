import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { app } from './app.js';
import { logger } from './utils/logger.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`⚙️  Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("MONGO db connection failed !!! ", err);
  });
