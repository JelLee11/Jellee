const express = require("express");
const {
  getLatestUpdate,
} = require("../controllers/kokoroYakuController");

const router = express.Router();

// Define the route for the newest novels
router.get("/kokoro/latest", getLatestUpdate);

module.exports = router;