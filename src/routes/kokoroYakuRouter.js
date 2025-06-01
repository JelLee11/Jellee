const express = require("express");
const {
  getLatestUpdate,
  getNovelInfo,
  getPopularNovels,
  getTopNovels
} = require("../controllers/kokoroYakuController");

const router = express.Router();

// Define the route for the newest novels
router.get("/kokoro/latest", getLatestUpdate);
// Route: /kokoro/info/:novelId
router.get("/kokoro/info/:novelId", getNovelInfo);
// Route: /kokoro/popularity
router.get("/kokoro/popular", getPopularNovels);
// Route: /kokoro/top
router.get("/kokoro/top", getTopNovels);

module.exports = router;