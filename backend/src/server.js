import dotenv from 'dotenv';
import app from './app.js';
import pool from './config/db.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  }
};

startServer();
