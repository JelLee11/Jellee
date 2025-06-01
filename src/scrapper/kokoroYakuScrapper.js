const axios = require("axios");
const BASE_DATA = "https://jellee11.github.io/Kokoro-Yaku/data/novels-data.json";

async function scrapeLatestUpdate() {
  const response = await axios(BASE_DATA);
  const novels = response.data;
  return novels;
}

// Fetches manga info from the Jikan API by MAL ID
/*async function fetchMangaFromJikan(malId) {
  try {
    const response = await axios.get(`https://api.jikan.moe/v4/manga/${malId}`);
    return response.data?.data || null;
  } catch (error) {
    console.warn(`Jikan API fetch failed for malId ${malId}:`, error.message);
    return null;
  }
} */

async function fetchMangaFromJikan(malId) {
  try {
    const response = await axios.get(`https://api.jikan.moe/v4/manga/${malId}`);
    const data = response.data?.data;

    if (!data) return null;

    return {
      images: data.images || {},
      titles: data.titles || [],
      type: data.type || "",
      status: data.status || "",
      score: data.score || 0,
      popularity: data.popularity || 0,
      synopsis: data.synopsis || "",
      genres: data.genres || [],
      authors: data.authors || []
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
      Media(id: $id, type: MANGA, format: LIGHT NOVEL) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
          color
        }
        siteUrl
        genres
        averageScore
        chapters
        volumes
        status
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

    return response.data?.data?.Media || null;
  } catch (error) {
    console.warn(`AniList API fetch failed for anilistId ${anilistId}:`, error.message);
    return null;
  }
}

module.exports = {
  scrapeLatestUpdate,
  fetchMangaFromJikan,
  fetchMangaFromAnilist
};
