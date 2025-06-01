const axios = require("axios");
const BASE_DATA = "https://jellee11.github.io/Kokoro-Yaku/data/novels-data.json";

async function scrapeLatestUpdate() {
  const response = await axios(BASE_DATA);
  const novels = response.data;
  return novels;
}

// Fetches manga info from the Jikan API by MAL ID
async function fetchMangaFromJikan(malId) {
  try {
    const response = await axios.get(`https://api.jikan.moe/v4/manga/${malId}`);
    const data = response.data?.data;

    if (!data) return null;

    return {
      images: {
        extraLarge: data.images.webp.large_image_url || "",
        large: data.images.webp.image_url || "",
        medium: data.images.jpg.image_url || "",
        color: null
      },
      titles: {
        romaji: data.title || "",
        english: data.title_english || "",
        native: data.title_japanese || "",
        userPreferred: data.title || ""
      },
      type: data.type || "MANGA",
      status: data.status || "",
      score: data.score || 0,
      popularity: data.popularity || 0,
      synopsis: data.synopsis || "",
      genres: (data.genres || []).map(g => g.name),
      authors: (data.authors || []).map(a => a.name)
    };
  } catch (error) {
    console.warn(`Jikan API fetch failed for malId ${malId}:`, error.message);
    return null;
  }
}

// Fetch from AniList GraphQL API
async function fetchMangaFromAnilist(anilistId) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: MANGA, format: NOVEL) {
        title {
          romaji
          english
          native
          userPreferred
        }
        type
        status
        description
        coverImage {
          extraLarge
          large
          medium
          color
        }
        genres
        averageScore
        popularity
        staff {
          nodes {
            name {
              full
            }
          }
        }
      }
    }
  `;

  const variables = { id: parseInt(anilistId) };

  try {
    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });

    const data = response.data?.data?.Media;

    if (!data) return null;

    return {
      images: {
        extraLarge: data.coverImage.extraLarge || "",
        large: data.coverImage.large || "",
        medium: data.coverImage.medium || "",
        color: data.coverImage.color || null
      },
      titles: data.title || {},
      type: data.type || "MANGA",
      status: data.status || "",
      score: data.averageScore || 0,
      popularity: data.popularity || 0,
      synopsis: data.description || "",
      genres: data.genres || [],
      authors: (data.staff?.nodes || []).map(s => s.name.full)
    };
  } catch (error) {
    console.warn(`AniList API fetch failed for anilistId ${anilistId}:`, error.message);
    return null;
  }
}

// Fetch popularity

async function getSortedNovelsByPopularity(provider = "anilist") {
  const response = await axios(BASE_DATA);
  const novels = response.data;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const enrichedNovels = [];

  for (const novel of novels) {
    let info = null;

    try {
      if (provider === "anilist" && novel.providers?.anilistId) {
        info = await fetchMangaFromAnilist(novel.providers.anilistId);
      } else {
        continue; // Skip if no AniList ID
      }

      enrichedNovels.push({
        ...novel,
        popularity: info?.popularity || 0
      });

    } catch (err) {
      console.error(`AniList fetch failed for "${novel.title}":`, err.message);
    }
  }

  // Remove duplicates, keep only volume 1
  const uniqueByTitle = {};
  for (const novel of enrichedNovels) {
    if (!novel.title) continue;

    const key = novel.title.trim().toLowerCase();
    const volume = novel.volume?.trim().toLowerCase() || "";
    const isVol1 = /^((vol(ume)?)\.?\s*)?1$/.test(volume) || volume === "1";

    if (!uniqueByTitle[key] || (isVol1 && !/^((vol(ume)?)\.?\s*)?1$/.test(uniqueByTitle[key].volume?.trim().toLowerCase() || ""))) {
      uniqueByTitle[key] = novel;
    }
  }

  return Object.values(uniqueByTitle)
    .filter(n => n.popularity > 0)
    .sort((a, b) => b.popularity - a.popularity);
}


module.exports = {
  scrapeLatestUpdate,
  fetchMangaFromJikan,
  fetchMangaFromAnilist,
  getSortedNovelsByPopularity
};
