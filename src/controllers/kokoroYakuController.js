
const {
  scrapeLatestUpdate,
  fetchMangaFromJikan,
  fetchMangaFromAnilist
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
      providers: {
        malId: novel.providers?.malId || "",
        anilistId: novel.providers?.anilistId || ""
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

async function getNovelInfo(req, res) {
  try {
    const novelId = req.params.novelId;
    const providerType = req.query.providers; // "mal" or "anilist"

    const novels = await scrapeLatestUpdate();

    const matchingNovel = novels.find(novel =>
      novel.id?.toString().padStart(6, "0") === novelId
    );

    if (!matchingNovel) {
      return res.status(404).json({
        success: false,
        message: "Novel not found"
      });
    }

    const novel = {
      id: matchingNovel.id?.toString().padStart(6, "0"),
      title: matchingNovel.title || "",
      cover: matchingNovel.cover || "",
      volume: matchingNovel.volume || "",
      providers: {
        malId: matchingNovel.providers?.malId?.toString() || "",
        anilistId: matchingNovel.providers?.anilistId?.toString() || ""
      },
      epubLink: matchingNovel.epubLink || ""
    };

    let externalInfo = null;
    if (providerType === "mal" && novel.providers.malId) {
      externalInfo = await fetchMangaFromJikan(novel.providers.malId);
    } else if (providerType === "anilist" && novel.providers.anilistId) {
      externalInfo = await fetchMangaFromAnilist(novel.providers.anilistId);
    }

    return res.status(200).json({
      success: true,
      data: novel,
      extra: externalInfo
    });

  } catch (error) {
    console.error("error in getNovelInfo:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch novel info"
    });
  }
}

module.exports = {
  getLatestUpdate,
  getNovelInfo
};