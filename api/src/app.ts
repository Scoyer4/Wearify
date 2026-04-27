import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import './types';

import type { CorsOptions } from 'cors';

dotenv.config();

import config from './config';

import productRoutes from "./routes/productRoutes";
import userRoutes from "./routes/userRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";

const app = express();

const allowedOrigins = ['https://wearify-pink.vercel.app', 'http://localhost:5173'];

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || config.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}; 

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/favorites", favoriteRoutes);

// Error handler DESPUÉS de las rutas
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

app.listen(config.PORT, () => {
  console.log(`Server is running on port http://localhost:${config.PORT}`);
});