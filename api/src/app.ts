import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import type { CorsOptions } from 'cors';

dotenv.config();

import config from './config';

import listingRoutes from "./routes/listingRoutes";
import userRoutes from "./routes/userRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";

const app = express();

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (config.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(
        new Error(`CORS error: ${origin} is not allowed by CORS`),
        false,
      );
      console.warn(`CORS error: ${origin} is not allowed by CORS`);
    }
  }
}; 

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/listings", listingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/favorites", favoriteRoutes);

app.listen(config.PORT, () => {
  console.log(`Server is running on port http://localhost:${config.PORT}`);
})