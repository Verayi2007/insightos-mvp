#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function safeResolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const target = path.resolve(root, clean === "/" ? "index.html" : clean.slice(1));
  if (!target.startsWith(root)) return null;
  return target;
}

const server = http.createServer((req, res) => {
  const filePath = safeResolve(req.url || "/");
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, buffer) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(buffer);
  });
});

server.listen(port, () => {
  console.log(`InsightOS MVP running at http://localhost:${port}`);
});
