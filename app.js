const express = require("express");
const path = require("path");
// const { inject } = require("@vercel/analytics");
// const { injectSpeedInsights } = require("@vercel/speed-insights");
const ejsMate = require("ejs-mate");
require("dotenv").config();

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Initialize Vercel Web Analytics
// This injects the analytics tracking script for monitoring user interactions
// inject();

// Initialize Vercel Speed Insights
// This enables performance monitoring and Web Vitals tracking
// Documentation: https://vercel.com/docs/speed-insights
// injectSpeedInsights();


//home
app.get("/", (req, res) => {
  res.render("home", { page: "home" });
});

app.get("/about", (req, res) => {
  res.render("about", { page: "about" });
});

app.get("/skills", (req, res) => {
  res.render("skills", { page: "skills" });
});

app.get("/projects", (req, res) => {
  res.render("projects", {page: "projects"});
});

app.get("/contact", (req, res) => {
  res.render("contact", { page: "contact" });
});

app.get("/resume", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Resume.pdf"));
});

const PORT = 3000;
app.listen(PORT);
