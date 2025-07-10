const axios = require("axios");

// Configuration
const CHECK_INTERVAL = 10000; // Check every 10 seconds
const DEXSCREENER_API = "https://api.dexscreener.com/token-profiles/latest/v1";

// Keep track of seen tokens
let seenTokens = new Set();
let lastCheckTime = Date.now();

// Function to check for new tokens
async function checkNewTokens() {
  try {
    console.log("\n=== FETCHING NEWEST TOKEN PROFILES FROM DEXSCREENER ===");

    // Get current time
    const currentTime = Date.now();
    const timeSinceLastCheck = currentTime - lastCheckTime;

    // Get latest token profiles
    const response = await axios.get(DEXSCREENER_API, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json",
        Origin: "https://dexscreener.com",
        Referer: "https://dexscreener.com/",
      },
    });

    const tokens = response.data || [];
    console.log(`\nFound ${tokens.length} total tokens`);
    console.log(
      `Time since last check: ${Math.floor(timeSinceLastCheck / 1000)} seconds`
    );

    let newTokensFound = 0;

    for (const token of tokens) {
      const tokenAddress = token.tokenAddress;
      if (!tokenAddress || seenTokens.has(tokenAddress)) continue;

      // Add to seen tokens
      seenTokens.add(tokenAddress);
      newTokensFound++;

      console.log("\n🚨 NEW TOKEN DETECTED! 🚨");
      console.log("Token Name:", token.description?.split("\n")[0] || "N/A");
      console.log("Token Address:", tokenAddress);
      console.log("Chain:", token.chainId || "N/A");
      console.log("Description:", token.description || "N/A");

      // Display links if available
      if (token.links && token.links.length > 0) {
        console.log("\nLinks:");
        token.links.forEach((link) => {
          if (link.type === "twitter") {
            console.log("Twitter:", link.url);
          } else if (link.type === "telegram") {
            console.log("Telegram:", link.url);
          } else if (link.label) {
            console.log(`${link.label}:`, link.url);
          }
        });
      }

      // Display URLs
      console.log("\nURLs:");
      console.log("DexScreener:", token.url);
      if (token.icon) console.log("Icon:", token.icon);
      if (token.header) console.log("Header:", token.header);

      console.log("----------------------------------------");
    }

    // Update last check time
    lastCheckTime = currentTime;

    if (newTokensFound === 0) {
      console.log("\nNo new tokens found in the last check.");
    } else {
      console.log(`\nFound ${newTokensFound} new tokens in the last check!`);
    }

    // Clean up old tokens (keep only last 1000 to prevent memory issues)
    if (seenTokens.size > 1000) {
      const tokensArray = Array.from(seenTokens);
      seenTokens = new Set(tokensArray.slice(-1000));
    }
  } catch (error) {
    console.error("\n❌ ERROR FETCHING TOKENS:");
    console.error("Error message:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Main function
async function main() {
  console.log("Starting token monitor...");
  console.log("Monitoring for new tokens every 10 seconds...");
  console.log("Using DexScreener Token Profiles API");

  // Initial check
  await checkNewTokens();

  // Set up periodic checking
  setInterval(checkNewTokens, CHECK_INTERVAL);
}

// Start the monitor
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
