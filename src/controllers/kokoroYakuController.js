
const {
  scrapeLatestUpdate
} = require("../scrapper/kokoroYakuScrapper");

async function getLatestUpdate(req, res) {
  try {
    const novels = await scrapeLatestUpdate();

    // Get page and perPage from query parameters with validation
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.max(1, parseInt(req.query.perPage) || 10);

    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;

    if (startIndex >= novels.length) {
      return res.status(200).send({
        success: true,
        message: "No more data available!",
        total: novels.length,
        page,
        perPage,
        data: []
      });
    }

    const reformNovels = novels.map(novel => ({
      id: novel.id || "",
      title: novel.title || "",
      cover: novel.cover || "",
      volume: novel.volume || "",
      provider: {
        malId: novel.provider?.malId || "",
        anilistId: novel.provider?.anilistId || ""
      },
      epubLink: novel.epubLink || ""
    }));

    const paginatedNovels = reformNovels.slice(startIndex, endIndex);

    return res.status(200).send({
      success: true,
      total: novels.length,
      page,
      perPage,
      data: paginatedNovels
    });
  } catch (error) {
    console.error("error in getLatestUpdate:", error.message);
    return res.status(500).send({
      success: false,
      message: "Failed to fetch data from Jellee!"
    });
  }
}

module.exports = {
  getLatestUpdate
};