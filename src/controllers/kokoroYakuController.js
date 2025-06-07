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
    const perPage = Math.min(
      15,
      Math.max(1, parseInt(req.query.perPage) || 10)
    );

    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;
    if (startIndex >= novels.length) {
      return res.status(200).send({
        success: true,
        message: "No more data available!",
        total: novels.length,
        page,
        perPage,
        totalPages: Math.ceil(novels.length / perPage),
        hasNextPage: false,
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
      epubId: novel.epubId || ""
    }));

    const paginatedNovels = reformNovels.slice(startIndex, endIndex);

    const total = novels.length;
    const totalPages = Math.ceil(total / perPage);
    const hasNextPage = page < totalPages;

    return res.status(200).send({
      success: true,
      total,
      page,
      perPage,
      totalPages,
      hasNextPage,
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

    const matchingNovel = novels.find(
      novel => novel.id?.toString().padStart(6, "0") === novelId
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
      epubId: matchingNovel.epubId || ""
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
    const provider = req.query.provider || "anilist";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(
      15,
      Math.max(1, parseInt(req.query.perPage) || 10)
    );

    const allNovels = await scrapeLatestUpdate();

    // Filter only volume 1 novels first
    const volume1Novels = allNovels.filter(novel => novel.volume === "1");

    // Deduplicate by title (case-insensitive)
    const uniqueNovelsMap = new Map();
    for (const novel of volume1Novels) {
      const key = novel.title.trim().toLowerCase();
      if (!uniqueNovelsMap.has(key)) {
        uniqueNovelsMap.set(key, novel);
      }
    }
    const uniqueNovels = Array.from(uniqueNovelsMap.values());

    // Fetch popularity info only for filtered & deduped novels
    const novelInfos = await Promise.all(
      uniqueNovels.map(async novel => {
        const info =
          provider === "mal"
            ? await fetchMangaFromJikan(novel.providers?.malId)
            : await fetchMangaFromAnilist(novel.providers?.anilistId);

        return {
          ...novel,
          popularity: info?.popularity || 0,
          externalInfo: info || {}
        };
      })
    );
    await delay(2000);
    // Sort by popularity descending
    novelInfos.sort((a, b) => b.popularity - a.popularity);

    // Paginate
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;
    if (startIndex >= novelInfos.length) {
      return res.status(200).send({
        success: true,
        message: "No more data available!",
        total: novelInfos.length,
        page,
        perPage,
        totalPages: Math.ceil(novelInfos.length / perPage),
        hasNextPage: false,
        data: []
      });
    }

    const pageNovels = novelInfos.slice(startIndex, startIndex + perPage);

    const total = novelInfos.length;
    const totalPages = Math.ceil(total / perPage);
    const hasNextPage = page < totalPages;

    return res.status(200).json({
      success: true,
      total,
      page,
      perPage,
      totalPages,
      hasNextPage,
      data: pageNovels
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch popular novels"
    });
  }
}

// Get top
async function getTopNovels(req, res) {
  try {
    const provider = req.query.provider || "anilist";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(
      15,
      Math.max(1, parseInt(req.query.perPage) || 10)
    );

    const allNovels = await scrapeLatestUpdate();

    // Filter only volume 1 novels first
    const volume1Novels = allNovels.filter(novel => novel.volume === "1");

    // Deduplicate by title (case-insensitive)
    const uniqueNovelsMap = new Map();
    for (const novel of volume1Novels) {
      const key = novel.title.trim().toLowerCase();
      if (!uniqueNovelsMap.has(key)) {
        uniqueNovelsMap.set(key, novel);
      }
    }
    const uniqueNovels = Array.from(uniqueNovelsMap.values());

    // Fetch popularity info only for filtered & deduped novels
    const novelInfos = await Promise.all(
      uniqueNovels.map(async novel => {
        const info =
          provider === "mal"
            ? await fetchMangaFromJikan(novel.providers?.malId)
            : await fetchMangaFromAnilist(novel.providers?.anilistId);

        return {
          ...novel,
          score: info?.score || 0,
          externalInfo: info || {}
        };
      })
    );

    await delay(2000);

    // Sort by popularity descending
    novelInfos.sort((a, b) => b.score - a.score);
    // Paginate
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;
    if (startIndex >= novelInfos.length) {
      return res.status(200).send({
        success: true,
        message: "No more data available!",
        total: novelInfos.length,
        page,
        perPage,
        totalPages: Math.ceil(novelInfos.length / perPage),
        hasNextPage: false,
        data: []
      });
    }

    const pageNovels = novelInfos.slice(startIndex, startIndex + perPage);
    const total = novelInfos.length;
    const totalPages = Math.ceil(total / perPage);
    const hasNextPage = page < totalPages;

    return res.status(200).json({
      success: true,
      total,
      page,
      perPage,
      totalPages,
      hasNextPage,
      data: pageNovels
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch popular novels"
    });
  }
}

async function searchNovelsByTitle(req, res) {
  try {
    const rawQuery = req.query.title || "";
    const query = normalizeText(rawQuery);

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Missing `title` query parameter"
      });
    }

    const provider = (req.query.provider || "anilist").toLowerCase();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(
      15,
      Math.max(1, parseInt(req.query.perPage) || 10)
    );
    const startIndex = (page - 1) * perPage;

    const novels = await scrapeLatestUpdate();

    const filtered = novels.filter(novel => {
      const title = normalizeText(novel.title || "");
      return title.includes(query);
    });

    // Only enrich novels on the current page (pagination first)
    const pageNovels = filtered.slice(startIndex, startIndex + perPage);

    const enrichedNovels = await Promise.all(
      pageNovels.map(async novel => {
        const info =
          provider === "mal"
            ? await fetchMangaFromJikan(novel.providers?.malId)
            : await fetchMangaFromAnilist(novel.providers?.anilistId);

        return {
          ...novel,
          externalInfo: info || {}
        };
      })
    );

    // Optional delay to simulate loading time
    await delay(2000);

    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage);
    const hasNextPage = page < totalPages;

    return res.status(200).json({
      success: true,
      query: rawQuery.trim(),
      provider,
      total,
      page,
      perPage,
      totalPages,
      hasNextPage,
      data: enrichedNovels
    });
  } catch (error) {
    console.error("Error in searchNovelsByTitle:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search novels"
    });
  }
}

async function filterNovelsByGenres(req, res) {
  try {
    const provider = (req.query.provider || "anilist").toLowerCase();
    const rawGenres = req.query.genres;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(15, Math.max(1, parseInt(req.query.perPage) || 10));
    const startIndex = (page - 1) * perPage;

    if (!rawGenres) {
      return res.status(400).json({
        success: false,
        message: "Missing required `genres` parameter"
      });
    }

    // Clean and parse genres
    let genres = [];
    try {
      genres = rawGenres
        .replace(/[\s"]/g, "") // remove brackets, spaces, quotes
        .split(",")
        .map(g => g.toLowerCase().trim())
        .filter(g => g.length > 0);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "`genres` must be a list like [romance,comedy]"
      });
    }

    // Step 1: Fetch all novels
    const allNovels = await scrapeLatestUpdate();
    const volume1Novels = allNovels.filter(novel => novel.volume === "1");

    // Step 2: Deduplicate by title
    const uniqueNovelsMap = new Map();
    for (const novel of volume1Novels) {
      const key = novel.title.trim().toLowerCase();
      if (!uniqueNovelsMap.has(key)) {
        uniqueNovelsMap.set(key, novel);
      }
    }
    const uniqueNovels = Array.from(uniqueNovelsMap.values());

    // Step 3: Enrich novels with provider data (for genre info)
    const enriched = await Promise.all(
      uniqueNovels.map(async novel => {
        let providerData = null;
        if (provider === "mal" && novel.providers?.malId) {
          providerData = await fetchMangaFromJikan(novel.providers.malId);
        } else if (provider === "anilist" && novel.providers?.anilistId) {
          providerData = await fetchMangaFromAnilist(novel.providers.anilistId);
        }

        const providerGenres = (providerData?.genres || []).map(g => g.toLowerCase());

        return {
          ...novel,
          externalInfo: {
            ...providerData,
            genres: providerGenres
          }
        };
      })
    );

    await delay(2000); // optional artificial delay

    // Step 4: Filter novels by genres (AND logic: must match all)
    const filtered = enriched.filter(novel =>
      genres.every(g => (novel.externalInfo.genres || []).includes(g))
    );

    // Step 5: Pagination
    const total = filtered.length;
    const paginated = filtered.slice(startIndex, startIndex + perPage);
    const totalPages = Math.ceil(total / perPage);
    const hasNextPage = page < totalPages;

    return res.status(200).json({
      success: true,
      provider,
      genres,
      page,
      perPage,
      total,
      totalPages,
      hasNextPage,
      data: paginated
    });

  } catch (error) {
    console.error("Error in filterNovelsByGenres:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while filtering novels"
    });
  }
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics
    .replace(/[^a-z0-9\s]/gi, "") // Remove non-alphanumeric chars
    .trim()
    .replace(/\s+/g, " "); // Collapse extra whitespace
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  getLatestUpdate,
  getNovelInfo,
  getPopularNovels,
  getTopNovels,
  searchNovelsByTitle,
  filterNovelsByGenres
};
