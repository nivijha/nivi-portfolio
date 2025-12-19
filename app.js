const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
// const { inject } = require("@vercel/analytics");
// const { injectSpeedInsights } = require("@vercel/speed-insights");
const projects = require("./data/projects");
const ejsMate = require("ejs-mate");
require("dotenv").config();

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Inject Vercel Web Analytics script
// inject();

// Inject Vercel Speed Insights script
// injectSpeedInsights();

// DynamoDB client (configure via env)
const ddbRegion = process.env.AWS_REGION || "us-east-1";
const ddbTable = process.env.DDB_TABLE_CONTACTS || "contact-submissions";
const ddbClient = new DynamoDBClient({
  region: ddbRegion,
  // credentials picked from env/instance role by default
});

//home
app.get("/", (req, res) => {
  res.render("home", { projects });
});

// contact submission (placeholder handler)
app.post("/contact", (req, res) => {
  const { name, email, message, company } = req.body || {};
  if (company) {
    // bot detected
    return res.status(200).json({ success: true });
  }

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, error: "All fields are required." });
  }

  const submissionId = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
  const timestamp = new Date().toISOString();

  const item = {
    id: submissionId,
    name,
    email,
    message,
    createdAt: timestamp,
    source: "portfolio-contact",
  };

  const command = new PutItemCommand({
    TableName: ddbTable,
    Item: marshall(item),
  });

  ddbClient
    .send(command)
    .then(() => {
      res.json({
        success: true,
        message: "Thanks for reaching out! I'll get back to you soon.",
      });
    })
    .catch((err) => {
      console.error("DynamoDB contact save failed:", err);
      res.status(500).json({
        success: false,
        error: "Failed to save message. Please try again later.",
      });
    });

  console.log("Region:", process.env.AWS_REGION);
  console.log("Table:", process.env.DDB_TABLE_CONTACTS);
});

const PORT = 3000;
app.listen(PORT);
