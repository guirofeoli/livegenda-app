import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";

async function startDevServer() {
  const app = express();
  
  app.use(express.json());
  
  const apiPort = 3001;
  const devPort = 5000;
  
  const proxyMiddleware = async (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/objects')) {
      try {
        const targetUrl = `http://localhost:${apiPort}${req.originalUrl}`;
        const fetchOptions = {
          method: req.method,
          headers: {
            ...req.headers,
            host: `localhost:${apiPort}`,
          },
        };
        
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          fetchOptions.body = JSON.stringify(req.body);
        }
        
        delete fetchOptions.headers['content-length'];
        
        const response = await fetch(targetUrl, fetchOptions);
        
        res.status(response.status);
        
        for (const [key, value] of response.headers.entries()) {
          if (key.toLowerCase() !== 'transfer-encoding') {
            res.setHeader(key, value);
          }
        }
        
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      } catch (error) {
        console.error(`Proxy error for ${req.path}:`, error.message);
        next();
      }
    } else {
      next();
    }
  };
  
  app.use(proxyMiddleware);
  
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: {
        port: 24678,
      },
    },
    appType: "spa",
  });
  
  app.use(vite.middlewares);
  
  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      let template = await vite.transformIndexHtml(url, 
        `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Livegenda</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
      );
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  
  const server = createServer(app);
  
  server.listen(devPort, "0.0.0.0", () => {
    console.log(`Dev server running on http://localhost:${devPort}`);
    console.log(`Proxying /api/* and /objects/* to http://localhost:${apiPort}`);
  });
}

startDevServer().catch(console.error);
