const express = require("express");
const cors = require("cors");
const jelleeNovelRoutes = require("./src/routes/jelleeRouter");
const fetch = require("node-fetch").default;

const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to Jellee Api - your destination for scrapping data from various novel & manga sites! Seamlessly access  id, title, image and more.");
});

app.get("/proxy-image", async (req, res) => {
  try {
    const imageUrl = req.query.url;

    // fetch the image
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(404).send("Image not found");
    }

    // convert to buffer
    const buffer = await response.arrayBuffer();
    res.set("Content-Type", response.headers.get("content-type") || "image/jpeg");
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch image");
  }
});

app.use("/novel", jelleeNovelRoutes);
// app.use("/novel", kokoroYakuNovelRoutes);

// Start server
app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});