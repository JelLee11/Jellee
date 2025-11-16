const axios = require("axios");
const path = require("path");
const fs = require("fs");
// const BASE_DATA = "../data/data.json";
const inputFile = path.resolve("./data/data.json");
const BASE_DATA = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

async function scrapeLatestUpdate() {
  const response = await axios(BASE_DATA);
  const novels = response.data;
  return novels;
}

async function scrapeMostRated() {
  try {
    const response = await axios.get(BASE_DATA);
    const novels = response.data;

    // Sort the unique novels by rating from highest to lowest
    novels.sort((a, b) => b.anilist.rating - a.anilist.rating);

    return novels;
  } catch (error) {
    console.error("Error fetching or filtering data:", error.message);
    throw error;
  }
}

async function scrapeMostPopular() {
  try {
    const response = await axios.get(BASE_DATA);
    const novels = response.data;
    // Sort the unique novels by rating from highest to lowest
    novels.sort((a, b) => b.anilist.popularity - a.anilist.popularity);

    return novels;
  } catch (error) {
    console.error("Error fetching or filtering data:", error.message);
    throw error;
  }
}

async function scrapeInfo(id) {
  try {
    const response = await axios.get(BASE_DATA);
    const novels = response.data;

    // Find the main novel by ID
    const novel = novels.find(novel => novel.id === id);

    if (!novel) {
      throw new Error(`No novel found with ID: ${id}`);
    }

    return novel;
  } catch (error) {
    console.error("Error in scrapeInfo:", error.message);
    throw error;
  }
}

async function scrapeSearch(query) {
  try {
    const response = await axios.get(BASE_DATA);
    const novels = response.data;

    if (!novels || !Array.isArray(novels)) {
      throw new Error("Invalid data format or empty data from BASE_DATA.");
    }

    // Normalize and sanitize both the query and titles
    const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim();

    const sanitizedQuery = sanitizeString(query);

    // Filter novels based on sanitized query
    const novel = novels.filter(novel =>
      sanitizeString(novel.title).includes(sanitizedQuery)
    );

   /* if (!novel || novel.length === 0) {
      throw new Error(`No novel found with a similar title to: ${query}`);
    } */

    return novel;
  } catch (error) {
    console.error("Error in query:", error.message);
    throw error;
  }
}

async function scrapeByPublisher(query, sortBy) {
  try {
    const response = await axios.get(BASE_DATA);
    const novels = response.data;

    if (!novels || !Array.isArray(novels)) {
      throw new Error("Invalid data format or empty data from BASE_DATA.");
    }

    // Normalize and sanitize both the query and translation
    const sanitizeString = (str) => str.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim();

    const sanitizedQuery = sanitizeString(query);

    // Filter novels based on sanitized query
    const novel = novels.filter(novel =>
      sanitizeString(novel.translation).includes(sanitizedQuery)
    );

    if (!novel || novel.length === 0) {
      throw new Error(`No novel found listed by : ${query}`);
    }

    return novel;
  } catch (error) {
    console.error("Error in query:", error.message);
    throw error;
  }
}

/*async function filterScrap({ genres = [], status, publisher }) {
  try {
    // Fetch data
    const response = await axios.get(BASE_DATA);
    const data = response.data;

    // Filter data based on conditions
    
    return data.filter(item => {
      const matchesStatus = !status || item.status.toLowerCase() === status.toLowerCase();
      const matchesGenres = genres.map((genre) => genre.toLowerCase());
      item.genres.some((novelGenre) =>
            matchesGenres.includes(novelGenre.toLowerCase())
          );
      const matchesPublisher = !publisher || item.translation.toLowerCase() === publisher.toLowerCase();
      
      return matchesStatus && matchesGenres && matchesPublisher;
    });
  } catch (error) {
    throw error;
  }
} */

async function filterScrap({ genres = [], status, publisher }) {
  try {
    // Fetch data
    const response = await axios.get(BASE_DATA);
    const data = response.data;

    // Filter data based on conditions
    return data.filter(item => {
      const matchesStatus = !status || item.status.toLowerCase() === status.toLowerCase();

      // Check if item genres match any of the provided genres
      const matchesGenres = 
        genres.length === 0 || // If no genres are provided, always match
        item.genres.some(novelGenre => 
          genres.map(genre => genre.toLowerCase()).includes(novelGenre.toLowerCase())
        );

      const matchesPublisher = !publisher || item.translation.toLowerCase() === publisher.toLowerCase();

      return matchesStatus && matchesGenres && matchesPublisher;
    });
  } catch (error) {
    // Handle error if fetching or filtering fails
    console.error("Error fetching or filtering data:", error);
    throw error; // Rethrow the error if necessary for further handling
  }
}

async function volumesScrape(id) {
  try {
    const response = await axios.get(BASE_DATA); // Fetch JSON data
    const novels = response.data;

    // Find the novel by ID
    const novel = novels.find(novel => novel.id === id);

    if (!novel) {
      throw new Error(`No novel found with ID: ${id}`);
    }

    // Return only the volumes array
    return novel.volumes;
  } catch (error) {
    console.error("Error in volumesScrape:", error.message);
    throw error;
  }
}

async function recommendationsScrape(id) {
  try {
    const response = await axios.get(BASE_DATA);
    const novels = response.data;

    // Find the main novel by ID
    const mainNovel = novels.find(novel => novel.id === id);

    if (!mainNovel) {
      throw new Error(`No novel found with ID: ${id}`);
    }

    // Ensure genres are handled as arrays
    //const mainGenres = Array.isArray(mainNovel.genre) ? mainNovel.genre : [mainNovel.genre];

    // Fetch related novels with at least one matching genre
    /*const recommendations = novels.filter(novel => {
      const novelGenres = Array.isArray(novel.genre) ? novel.genre : [novel.genre];
      return novel.id !== id && novelGenres.some(genre => mainGenres.includes(genre));
    });*/
    const recommendations = novels.filter(
      novel => novel.translation === mainNovel.translation && novel.id !== id
    );
    
    return recommendations;
  } catch (error) {
    console.error("Error in recommendationsScrape:", error.message);
    throw error;
  }
}

module.exports = {
  scrapeLatestUpdate,
  scrapeMostRated,
  scrapeMostPopular,
  scrapeInfo,
  scrapeSearch,
  scrapeByPublisher,
  filterScrap,
  volumesScrape,
  recommendationsScrape
};