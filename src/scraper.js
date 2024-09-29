const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeMenu(restaurantName, url) {
  try {
    const encodedUrl = encodeURI(url);
    const response = await axios.get(encodedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
      },
    });
    const $ = cheerio.load(response.data);

    const menuSection = $(".item-container");
    if (!menuSection.length) {
      return `No menu found for ${restaurantName} today.`;
    }

    const menuItems = [];
    menuSection.find("li.menu-item").each((index, element) => {
      const dish = $(element).text().trim();
      menuItems.push(dish);
    });

    if (menuItems.length > 0) {
      return `Today's ${restaurantName} Menu:\n` + menuItems.join("\n");
    } else {
      return `No menu found for ${restaurantName} today.`;
    }
  } catch (error) {
    console.error(`Error scraping menu for ${restaurantName}:`, error);
    return `Error fetching menu for ${restaurantName}.`;
  }
}

module.exports = { scrapeMenu };
