const express = require("express");
const jelleeNovelRoutes = require("./src/routes/jelleeRouter");
const kokoroYakuNovelRoutes = require("./src/routes/kokoroYakuRouter");

const app = express();
const port = 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Jellee Api - your destination for scrapping data from various novel & manga sites! Seamlessly access  id, title, image and more.");
});

app.use("/novel", jelleeNovelRoutes);
app.use("/novel", kokoroYakuNovelRoutes);

// Start server
app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});