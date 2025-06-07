const express = require("express");
const {
  getLatestUpdate,
  getNovelInfo,
  getPopularNovels,
  getTopNovels,
  searchNovelsByTitle,
  filterNovelsByGenres
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
// Search by title
router.get("/kokoro/search", searchNovelsByTitle);
// Filtr4 genres
router.get("/kokoro/filter", filterNovelsByGenres);

module.exports = router;