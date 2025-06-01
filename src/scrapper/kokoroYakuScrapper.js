const axios = require("axios");
const BASE_DATA = "https://jellee11.github.io/Kokoro-Yaku/data/novels-data.json";

async function scrapeLatestUpdate() {
  const response = await axios(BASE_DATA);
  const novels = response.data;
  return novels;
}

module.exports = {
  scrapeLatestUpdate
};