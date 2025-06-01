
const {
  scrapeLatestUpdate,
  fetchMangaFromJikan,
  fetchMangaFromAnilist,
  getSortedNovelsByPopularity
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
    const providerType = req.query.provider; // "mal" or "anilist"

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

// Get popularity
async function getPopularNovels(req, res) {
  try {
    const providerType = req.query.provider; // "mal" or "anilist"
    if (!["mal", "anilist"].includes(providerType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider type. Must be 'mal' or 'anilist'."
      });
    }

    const novels = await scrapeLatestUpdate();

    // Filter by provider
    const filteredNovels = novels.filter(novel =>
      providerType === "mal"
        ? novel.providers?.malId
        : novel.providers?.anilistId
    );

    // ✅ Apply pagination BEFORE fetching popularity
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.max(1, parseInt(req.query.perPage) || 10);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    const pageItems = filteredNovels.slice(startIndex, endIndex);

    // ✅ Fetch popularity for current page only
    const enriched = await Promise.all(
      pageItems.map(async novel => {
        const id =
          providerType === "mal"
            ? novel.providers.malId
            : novel.providers.anilistId;

        const info =
          providerType === "mal"
            ? await fetchMangaFromJikan(id)
            : await fetchMangaFromAnilist(id);

        return {
          ...novel,
          popularity: info?.popularity || 0,
          score: info?.score || 0,
          titles: info?.titles || {},
          images: info?.images || {},
          synopsis: info?.synopsis || "",
          genres: info?.genres || [],
          authors: info?.authors || [],
        };
      })
    );

    // ✅ Sort only the page items by popularity
    const sorted = enriched.sort((a, b) => b.popularity - a.popularity);

    return res.status(200).json({
      success: true,
      provider: providerType,
      total: filteredNovels.length,
      page,
      perPage,
      data: sorted
    });
  } catch (error) {
    console.error("error in getPopularNovels:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch popular novels"
    });
  }
}

module.exports = {
  getLatestUpdate,
  getNovelInfo,
  getPopularNovels
};