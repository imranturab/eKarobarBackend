const express = require("express");
const http = require("http");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const server = http.createServer(app);

const pool = new Pool({
  connectionString: "postgresql://postgres:punLjyDwNhfxOPIRdnNdstsBlegAVihR@yamanote.proxy.rlwy.net:24991/railway",
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection error:", err.stack);
    return;
  }
  console.log("✅ Connected to database: eKarobar");
  client.query("SELECT current_database(), current_schema()", (err, result) => {
    release();
    if (err) {
      console.error("❌ Error querying database:", err.stack);
      return;
    }
    console.log(
      `✅ Database: ${result.rows[0].current_database}, Schema: ${result.rows[0].current_schema}`
    );
  });
});

app.use(cors());
app.use(express.json());

// ✅ Get all products
app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM product ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ✅ Search product
app.get("/searchProduct/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const result = await pool.query(
      "SELECT * FROM product WHERE name ILIKE $1 ORDER BY id DESC",
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Search Error:", err.message);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// ✅ Get single product
app.get("/getProduct/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM product WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Get Error:", err.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ✅ Add product
app.post("/product", async (req, res) => {
  try {
    const { name, cost, price, quantityavailable } = req.body;

    // Validate input
    if (!name || !cost || !price || !quantityavailable) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      "INSERT INTO product (name, cost, price, quantityavailable) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, cost, price, quantityavailable]
    );
    console.log("✅ Inserted product:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Insert Error:", err.message);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// ✅ Update product
app.put("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cost, price, quantityavailable } = req.body;

    // Validate input
    if (!name || !cost || !price || !quantityavailable) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      "UPDATE product SET name=$1, cost=$2, price=$3, quantityavailable=$4 WHERE id=$5 RETURNING *",
      [name, cost, price, quantityavailable, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    console.log("✅ Updated product:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Update Error:", err.message);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ✅ Delete product
app.delete("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM product WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    console.log("✅ Deleted product:", result.rows[0]);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Error:", err.message);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ✅ Test database connection
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as current_time");
    res.json({ message: "Database connected", time: result.rows[0].current_time });
  } catch (err) {
    console.error("❌ Test DB Error:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ✅ Server Start
server.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});