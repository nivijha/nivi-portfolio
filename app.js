const express = require("express");
const path = require("path");
const projects = require("./data/projects");
const ejsMate = require("ejs-mate");

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

//home
app.get("/", (req, res)=>{
    res.render("home", { projects });
})

app.listen(3000, ()=> {
    console.log("server running on 3000")
});
