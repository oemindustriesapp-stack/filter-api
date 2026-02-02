import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

/* =====================================================
   CORS CONFIG (ONLY ALLOW YOUR STORE)
===================================================== */
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://oem-industries.zohoecommerce.com"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Store-Key"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

/* =====================================================
   HEALTH CHECK
===================================================== */
app.get("/", (req, res) => {
  res.json({ status: "Proxy is running" });
});

/* =====================================================
   CREATOR VALIDATION PROXY
===================================================== */
app.get("/validate-products", async (req, res) => {
  const { year, make, model, engine } = req.query;

  // Basic validation
  if (!year || !make) {
    return res.status(400).json({
      error: "Missing required parameters"
    });
  }

  // Optional shared secret check
  if (req.headers["x-store-key"] !== process.env.STORE_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const creatorUrl =
    "https://www.zohoapis.in/creator/custom/demo20ashprotech/Test_API" +
    `?publickey=${process.env.CREATOR_KEY}` +
    `&in_year=${encodeURIComponent(year)}` +
    `&in_make=${encodeURIComponent(make)}` +
    `&in_model=${encodeURIComponent(model || "")}` +
    `&in_engine=${encodeURIComponent(engine || "")}`;

  try {
    const response = await fetch(creatorUrl);
    const data = await response.json();

    // Return ONLY what frontend needs
    res.json({
      result: Array.isArray(data.result) ? data.result : []
    });

  } catch (err) {
    console.error("Creator API error:", err);
    res.status(500).json({
      error: "Failed to fetch from Zoho Creator"
    });
  }
});

/* =====================================================
   SERVER START
===================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Zoho Creator Proxy running on port ${PORT}`);
});
