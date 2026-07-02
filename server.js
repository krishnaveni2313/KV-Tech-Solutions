const http = require("http");
const fs = require("fs");
const path = require("path");

// ✅ For Node < 18 (uncomment if needed)
// const fetch = require("node-fetch");

require("dotenv").config();

const PUBLIC_DIR = __dirname;
const MAX_BODY_SIZE = 32 * 1024;

console.log("Current directory:", __dirname);
console.log(
  "Env loaded:",
  !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY
);

const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(data));
};

const sanitizeText = (value, maxLength) =>
  String(value || "").trim().slice(0, maxLength);

const validateLead = (lead) => {
  const cleaned = {
    name: sanitizeText(lead.name, 120),
    email: sanitizeText(lead.email, 180).toLowerCase(),
    phone: sanitizeText(lead.phone, 40),
    service: sanitizeText(lead.service, 160),
    message: sanitizeText(lead.message, 2000)
  };

  const errors = [];

  if (cleaned.name.length < 2) errors.push("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email))
    errors.push("A valid email is required.");
  if (!/^[+()\d\s-]{8,}$/.test(cleaned.phone))
    errors.push("A valid phone number is required.");
  if (!cleaned.service) errors.push("Service is required.");
  if (cleaned.message.length < 10)
    errors.push("Message must be at least 10 characters.");

  return { cleaned, errors };
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > MAX_BODY_SIZE) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON payload."));
      }
    });

    req.on("error", reject);
  });

const handleLeadSubmission = async (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    sendJson(res, 500, {
      error: "Supabase environment variables are not configured."
    });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const { cleaned, errors } = validateLead(body);

    if (errors.length) {
      sendJson(res, 400, { error: errors[0] });
      return;
    }

    const supabaseEndpoint = `${SUPABASE_URL.replace(
      /\/$/,
      ""
    )}/rest/v1/contact_leads`;

    const supabaseResponse = await fetch(supabaseEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
       Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal"
      },
      body: JSON.stringify(cleaned)
    });

    if (!supabaseResponse.ok) {
      const detail = await supabaseResponse.text();
      console.error("Supabase insert failed:", detail);

      sendJson(res, 502, {
        error: "Could not save your enquiry right now. Please try again."
      });
      return;
    }

    sendJson(res, 201, { message: "Lead saved successfully." });
  } catch (error) {
    sendJson(res, 400, {
      error: error.message || "Could not process the request."
    });
  }
};

const serveStaticFile = (req, res) => {
  const requestedPath =
    req.url.split("?")[0] === "/"
      ? "/index.html"
      : req.url.split("?")[0];

  const normalizedPath = path
    .normalize(decodeURIComponent(requestedPath))
    .replace(/^(\.\.[/\\])+/, "");

  const filePath = path.join(PUBLIC_DIR, normalizedPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8"
      });

      res.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();

    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });

    res.end(content);
  });
};

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/contact-leads") {
    handleLeadSubmission(req, res);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStaticFile(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
});

server.listen(PORT, () => {
  console.log(
    `KV Tech Solutions website running at http://localhost:${PORT}` // ✅ FIXED
  );
});