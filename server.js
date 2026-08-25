const path = require("path");
const express = require("express");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.local" });
}

const app = express();
const PORT = process.env.PORT || 8888;
const ROOT_DIR = __dirname;
const FUNCTIONS_DIR = path.join(ROOT_DIR, "netlify", "functions");

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

function buildEvent(req) {
  return {
    httpMethod: req.method,
    headers: req.headers,
    path: req.originalUrl.split("?")[0],
    queryStringParameters: req.query || {},
    body:
      req.body && Object.keys(req.body).length > 0
        ? JSON.stringify(req.body)
        : req.rawBody || "",
    isBase64Encoded: false,
  };
}

async function runFunction(req, res, functionName) {
  try {
    const functionPath = path.join(FUNCTIONS_DIR, `${functionName}.js`);
    const fn = require(functionPath);

    if (!fn.handler) {
      res.status(500).json({ error: `Function '${functionName}' has no handler` });
      return;
    }

    const result = await fn.handler(buildEvent(req), {});
    const headers = result.headers || {};

    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(result.statusCode || 200).send(result.body || "");
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      res.status(404).json({ error: `Function '${functionName}' not found` });
      return;
    }

    console.error(`[render] Function '${functionName}' failed:`, error);
    res.status(500).json({ error: "Function execution failed" });
  }
}

app.all("/.netlify/functions/:functionName/*rest", (req, res) => {
  runFunction(req, res, req.params.functionName);
});

app.all("/.netlify/functions/:functionName", (req, res) => {
  runFunction(req, res, req.params.functionName);
});

app.all("/api/:functionName/*rest", (req, res) => {
  runFunction(req, res, req.params.functionName);
});

app.all("/api/:functionName", (req, res) => {
  runFunction(req, res, req.params.functionName);
});

app.get("/brand", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "brand-login.html"));
});

app.use(express.static(ROOT_DIR));

app.listen(PORT, () => {
  console.log(`Vively server running on port ${PORT}`);
});