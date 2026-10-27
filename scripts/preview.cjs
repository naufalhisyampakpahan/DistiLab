const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../web-preview");
const port = Number(process.env.DISTILAB_PREVIEW_PORT || 8082);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".svg": "image/svg+xml",
};
if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error("Jalankan npm run export:web terlebih dahulu.");
  process.exit(1);
}
http
  .createServer((req, res) => {
    try {
      const requestPath = decodeURIComponent(
        new URL(req.url, "http://127.0.0.1").pathname,
      );
      let file = path.resolve(root, "." + requestPath);
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        if (path.extname(requestPath)) {
          res.writeHead(404);
          res.end();
          return;
        }
        file = path.join(root, "index.html");
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(400);
      res.end();
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Pratinjau DistiLab: http://127.0.0.1:${port}`),
  );
