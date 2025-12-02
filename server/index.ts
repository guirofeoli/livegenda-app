import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());

const server = createServer(app);

registerRoutes(server, app).then(() => {
  const PORT = process.env.API_PORT || 3001;
  server.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
});
