const express = require("express");
const {
  getLatestUpdate,
  getNovelInfo,
  getPopularNovels
} = require("../controllers/kokoroYakuController");

const router = express.Router();

// Define the route for the newest novels
router.get("/kokoro/latest", getLatestUpdate);
// Route: /kokoro/info/:novelId
router.get("/kokoro/info/:novelId", getNovelInfo);
// Route: /kokoro/popularity
router.get("/kokoro/popularity", getNovelInfo);

module.exports = router;