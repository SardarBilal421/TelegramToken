const fs = require("fs");
const path = require("path");
const dexscreener = require("./dexscreener");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

class TokenStorage {
  constructor() {
    // Create data directory if it doesn't exist
    this.dataDir = path.join(__dirname, "data");
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.storageFile = path.join(this.dataDir, "savedTokens.json");
    this.tokens = new Map();
    this.updateInterval = null;
    this.initialized = false;
    this.telegramClient = null;
    this.init();
  }

  // Initialize Telegram client
  async initTelegramClient() {
    try {
      const apiId = 22610695;
      const apiHash = "a8d2da237cb629133af4a026a09355d7";
      const stringSession = new StringSession(
        "1BAAOMTQ5LjE1NC4xNjcuOTEAUASPpxZd2/drCHXtURBaogx2Qy/g4PAY9gq8aIs7rYrlFijMZQ8leF6SgYNVX+Qt7u0uUNpf8AVqKpHMzs16pXW2XtToeZir6xgP1PWPMyKeJP6rvTuJ4fnKkn5P1iaDoGg+JuDE0suyAXX6vmaiXcE+/x1ZICqPNrR9dAkCeL7/XhRVd+djb4DwEBrv0FU0zz3R7S006u6ujhxVyi3g+LwCNvYiozOf8cKuWA/rspAxluXr7zdzJycE/ZC67dm3wkgn3jpyaLW0LIjvU7cD7D67kmfGZak4i6AaXFc5xrhIucOUbTaVwHZ5k6Q+pQUGX79XwYytOvGXS/BwwDALhLc="
      );

      this.telegramClient = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
      });

      await this.telegramClient.connect();
      console.log("✅ Token Storage Telegram client connected");
    } catch (error) {
      console.error("❌ Error initializing Telegram client:", error);
    }
  }

  // Initialize the token storage
  async init() {
    try {
      // Load saved tokens
      await this.loadTokens();

      // Initialize Telegram client
      await this.initTelegramClient();

      // Start auto-update
      this.startAutoUpdate();

      // Mark as initialized
      this.initialized = true;

      // Initial update of all tokens
      await this.updateAllPrices();

      console.log("✅ Token storage initialized successfully");
      console.log(`📊 Tracking ${this.tokens.size} tokens`);
    } catch (error) {
      console.error("❌ Error initializing token storage:", error);
    }
  }

  // Load saved tokens from file
  async loadTokens() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = JSON.parse(fs.readFileSync(this.storageFile, "utf8"));
        this.tokens = new Map(Object.entries(data));

        // Validate and clean loaded tokens
        for (const [key, token] of this.tokens.entries()) {
          // Ensure all required fields exist
          token.errors = token.errors || [];
          token.retryCount = token.retryCount || 0;
          token.priceHistory = token.priceHistory || [];

          // Clean up any invalid data
          if (!token.chain || !token.address) {
            console.log(`⚠️ Removing invalid token entry: ${key}`);
            this.tokens.delete(key);
            continue;
          }

          // Normalize addresses
          token.address =
            token.chain === "solana"
              ? token.address.trim()
              : token.address.trim().toLowerCase();

          // Update the key if needed
          const correctKey = `${token.chain}-${token.address}`;
          if (key !== correctKey) {
            this.tokens.delete(key);
            this.tokens.set(correctKey, token);
          }
        }

        // Save cleaned up tokens
        await this.saveTokens();
      }
    } catch (error) {
      console.error("Error loading tokens:", error.message);
      // Create empty file if it doesn't exist
      await this.saveTokens();
    }
  }

  // Save tokens to file with retries
  async saveTokens(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const data = Object.fromEntries(this.tokens);
        await fs.promises.writeFile(
          this.storageFile,
          JSON.stringify(data, null, 2)
        );
        return true;
      } catch (error) {
        console.error(
          `Error saving tokens (attempt ${attempt}/${retries}):`,
          error.message
        );
        if (attempt === retries) {
          throw error;
        }
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Start auto-update of token prices
  startAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update prices every 30 seconds
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateAllPrices();
      } catch (error) {
        console.error("Error in auto-update:", error.message);
      }
    }, 30000);

    // Ensure the interval is cleaned up if the process exits
    process.on("exit", () => this.stopAutoUpdate());
    process.on("SIGINT", () => {
      this.stopAutoUpdate();
      process.exit();
    });
  }

  // Stop auto-update
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Get a specific token
  getToken(key) {
    return this.tokens.get(key);
  }

  // Add a new token with validation
  async addToken(
    chain,
    address,
    sourceGroup = "Unknown",
    symbol = null,
    name = null,
    foundAt = null
  ) {
    // Wait for initialization if needed
    if (!this.initialized) {
      console.log("⏳ Waiting for token storage to initialize...");
      await new Promise((resolve) => {
        const checkInit = () => {
          if (this.initialized) {
            resolve();
          } else {
            setTimeout(checkInit, 100);
          }
        };
        checkInit();
      });
    }

    // Validate chain
    if (!dexscreener.SUPPORTED_CHAINS[chain]) {
      console.error(`❌ Unsupported chain: ${chain}`);
      return null;
    }

    // Clean and validate address
    const cleanAddress =
      chain === "solana" ? address.trim() : address.trim().toLowerCase();
    if (!cleanAddress.match(dexscreener.SUPPORTED_CHAINS[chain].addressRegex)) {
      console.error(`❌ Invalid address format for chain ${chain}: ${address}`);
      return null;
    }

    const key = `${chain}-${cleanAddress}`;
    if (!this.tokens.has(key)) {
      const token = {
        chain,
        address: cleanAddress,
        symbol,
        name,
        sourceGroup,
        foundAt: foundAt
          ? new Date(foundAt * 1000).toISOString()
          : new Date().toISOString(),
        lastPrice: null,
        lastUpdate: null,
        priceHistory: [],
        errors: [],
        retryCount: 0,
      };

      this.tokens.set(key, token);
      await this.saveTokens();

      // Immediately try to fetch initial data
      try {
        await this.updateTokenPrice(chain, cleanAddress);
      } catch (error) {
        console.error(`Error fetching initial data for ${key}:`, error.message);
      }
    }

    return this.tokens.get(key);
  }

  // Remove a token
  removeToken(chain, address) {
    const cleanAddress =
      chain === "solana" ? address.trim() : address.trim().toLowerCase();
    const key = `${chain}-${cleanAddress}`;
    const result = this.tokens.delete(key);
    if (result) {
      this.saveTokens();
    }
    return result;
  }

  // Get all saved tokens
  getAllTokens() {
    return Array.from(this.tokens.values());
  }

  // Update prices for all tokens
  async updateAllPrices() {
    const tokens = this.getAllTokens();
    const removedTokens = [];
    const updatedTokens = [];

    for (const token of tokens) {
      const result = await this.updateTokenPrice(token.chain, token.address);

      if (result?.status === "removed") {
        removedTokens.push({
          chain: token.chain,
          address: token.address,
          reason: result.message,
        });
      } else if (result?.status === "success") {
        updatedTokens.push(token);
      }
    }

    // Log summary of removed tokens
    if (removedTokens.length > 0) {
      console.log("\n🧹 Cleanup Summary:");
      console.log(`Removed ${removedTokens.length} invalid tokens:`);
      removedTokens.forEach((token) => {
        console.log(`- ${token.chain}:${token.address} (${token.reason})`);
      });
    }

    return updatedTokens;
  }

  // Update token price with improved error handling
  async updateTokenPrice(chain, address) {
    const cleanAddress =
      chain === "solana" ? address.trim() : address.trim().toLowerCase();
    const key = `${chain}-${cleanAddress}`;
    const token = this.tokens.get(key);
    if (!token) return null;

    try {
      const metrics = await dexscreener.getTokenMetrics(chain, cleanAddress);

      // If no metrics returned, remove the token
      if (!metrics) {
        console.log(`🗑️ Removing token ${cleanAddress} - No data found`);
        this.tokens.delete(key);
        await this.saveTokens();
        return {
          status: "removed",
          message: "Token removed - No data found",
          chainName: chain,
          timestamp: new Date().toISOString(),
        };
      }

      // Reset error tracking on successful response
      token.errors = [];
      token.retryCount = 0;

      if (metrics.status === "error" || metrics.status === "not_found") {
        console.log(`⚠️ ${metrics.message}`);
        // Track error
        token.errors.push({
          timestamp: new Date().toISOString(),
          message: metrics.message,
        });
        token.retryCount++;

        // Remove token if no pairs found or other critical errors
        if (
          metrics.message.includes("No pairs found") ||
          metrics.message.includes("Invalid token address") ||
          token.retryCount >= 2
        ) {
          console.log(`🗑️ Removing token ${cleanAddress} - ${metrics.message}`);
          this.tokens.delete(key);
          await this.saveTokens();
          return {
            status: "removed",
            message: `Token removed - ${metrics.message}`,
            chainName: chain,
            timestamp: new Date().toISOString(),
          };
        }

        // Keep only last 5 errors
        if (token.errors.length > 5) {
          token.errors.shift();
        }

        // Save error state
        this.tokens.set(key, token);
        await this.saveTokens();

        return metrics;
      }

      if (metrics.status === "success") {
        // Update token information
        token.symbol = metrics.baseToken.symbol;
        token.name = metrics.baseToken.name;
        token.lastPrice = metrics.priceUsd;
        token.lastUpdate = new Date().toISOString();
        token.dex = metrics.dex;
        token.liquidity = metrics.liquidity;
        token.volume24h = metrics.volume24h;
        token.priceChange = metrics.priceChange;

        // Store price history (keep last 24 hours of data)
        token.priceHistory.push({
          price: metrics.priceUsd,
          timestamp: token.lastUpdate,
          liquidity: metrics.liquidity?.usd,
          volume: metrics.volume24h,
        });

        // Keep only last 24 hours of price history
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        token.priceHistory = token.priceHistory.filter(
          (entry) => new Date(entry.timestamp) > twentyFourHoursAgo
        );

        this.tokens.set(key, token);
        await this.saveTokens();

        return {
          ...metrics,
          priceHistory: token.priceHistory,
        };
      }

      return metrics;
    } catch (error) {
      console.error(`Error updating token price for ${key}:`, error.message);

      // Track error
      token.errors.push({
        timestamp: new Date().toISOString(),
        message: error.message,
      });
      token.retryCount++;

      // Remove token if too many errors
      if (token.retryCount >= 2) {
        console.log(`🗑️ Removing token ${cleanAddress} - Too many errors`);
        this.tokens.delete(key);
        await this.saveTokens();
        return {
          status: "removed",
          message: "Token removed - Too many errors",
          chainName: chain,
          timestamp: new Date().toISOString(),
        };
      }

      // Keep only last 5 errors
      if (token.errors.length > 5) {
        token.errors.shift();
      }

      // Save error state
      this.tokens.set(key, token);
      await this.saveTokens();

      return {
        status: "error",
        message: error.message,
        chainName: chain,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Send price updates to Telegram
  async sendPriceUpdateToTelegram(tokens) {
    try {
      if (!this.telegramClient) {
        console.error("❌ Telegram client not initialized");
        return;
      }

      // First send a header message
      const headerMessage =
        `📊 Token Price Update\n` +
        `⏰ Time: ${new Date().toLocaleTimeString()}\n` +
        `===================`;

      try {
        await this.telegramClient.sendMessage("hamza_ilyas212", {
          message: headerMessage,
        });
        console.log("✅ Sent header message");

        // Wait a bit between messages to avoid flood limits
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Send each token update as a separate message
        for (const token of tokens) {
          if (token.symbol && token.lastPrice) {
            let tokenMessage = "";
            const priceChange = token.priceChange?.h24 || "0.00";
            const volume = token.volume24h
              ? `$${Number(token.volume24h).toLocaleString()}`
              : "N/A";
            const liquidity = token.liquidity?.usd
              ? `$${Number(token.liquidity.usd).toLocaleString()}`
              : "N/A";

            tokenMessage += `🪙 ${
              token.symbol
            } (${token.chain.toUpperCase()})\n`;
            tokenMessage += `📱 From: ${token.sourceGroup}\n`;
            tokenMessage += `⏰ Found: ${new Date(
              token.foundAt
            ).toLocaleString()}\n`;
            tokenMessage += `💰 Price: $${token.lastPrice}\n`;
            tokenMessage += `📈 24h Change: ${priceChange}%\n`;
            tokenMessage += `💧 Liquidity: ${liquidity}\n`;
            tokenMessage += `📊 Volume 24h: ${volume}\n`;
            if (token.dex) {
              tokenMessage += `🏦 DEX: ${token.dex}\n`;
            }

            try {
              await this.telegramClient.sendMessage("hamza_ilyas212", {
                message: tokenMessage,
              });
              console.log(`✅ Sent update for ${token.symbol}`);

              // Wait between messages to avoid flood limits
              await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (tokenError) {
              console.error(
                `❌ Failed to send update for ${token.symbol}:`,
                tokenError.message
              );
            }
          }
        }

        // Send footer message
        const footerMessage = "===================\n⏰ Update complete";
        await this.telegramClient.sendMessage("hamza_ilyas212", {
          message: footerMessage,
        });
        console.log("✅ Sent footer message");
      } catch (error) {
        console.error("Failed to send messages:", error.message);

        // If simple method failed, try raw API method
        try {
          const result = await this.telegramClient.invoke({
            _: "contacts.resolveUsername",
            username: "hamza_ilyas212",
          });

          if (result && result.peer) {
            const peer = {
              _: "inputPeerUser",
              user_id: result.peer.user_id,
              access_hash: result.users[0].access_hash,
            };

            // Send header
            await this.telegramClient.invoke({
              _: "messages.sendMessage",
              peer: peer,
              message: headerMessage,
              random_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
            });

            // Wait between messages
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Send each token update
            for (const token of tokens) {
              if (token.symbol && token.lastPrice) {
                let tokenMessage = "";
                const priceChange = token.priceChange?.h24 || "0.00";
                const volume = token.volume24h
                  ? `$${Number(token.volume24h).toLocaleString()}`
                  : "N/A";
                const liquidity = token.liquidity?.usd
                  ? `$${Number(token.liquidity.usd).toLocaleString()}`
                  : "N/A";

                tokenMessage += `🪙 ${
                  token.symbol
                } (${token.chain.toUpperCase()})\n`;
                tokenMessage += `📱 From: ${token.sourceGroup || "Unknown"}\n`;
                tokenMessage += `💰 Price: $${token.lastPrice}\n`;
                tokenMessage += `📈 24h Change: ${priceChange}%\n`;
                tokenMessage += `💧 Liquidity: ${liquidity}\n`;
                tokenMessage += `📊 Volume 24h: ${volume}\n`;
                if (token.dex) {
                  tokenMessage += `🏦 DEX: ${token.dex}\n`;
                }

                try {
                  await this.telegramClient.invoke({
                    _: "messages.sendMessage",
                    peer: peer,
                    message: tokenMessage,
                    random_id: Math.floor(
                      Math.random() * Number.MAX_SAFE_INTEGER
                    ),
                  });
                  console.log(
                    `✅ Sent update for ${token.symbol} using raw API`
                  );

                  // Wait between messages
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                } catch (tokenError) {
                  console.error(
                    `❌ Failed to send update for ${token.symbol}:`,
                    tokenError.message
                  );
                }
              }
            }

            // Send footer
            await this.telegramClient.invoke({
              _: "messages.sendMessage",
              peer: peer,
              message: footerMessage,
              random_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
            });
          }
        } catch (apiError) {
          throw new Error(
            `Failed to send messages using raw API: ${apiError.message}`
          );
        }
      }
    } catch (error) {
      console.error("❌ Error sending price updates to Telegram:", error);
      if (error.message) {
        console.error("Error details:", error.message);
      }
    }
  }

  // Display current prices for all tokens with improved formatting
  async displayAllPrices() {
    console.log("\n📊 Current Token Prices:");
    console.log("=".repeat(50));

    const tokens = this.getAllTokens();
    if (tokens.length === 0) {
      console.log(
        "No tokens saved yet. Add tokens from messages to track them."
      );
      return;
    }

    const updatedTokens = [];

    for (const token of tokens) {
      const metrics = await this.updateTokenPrice(token.chain, token.address);
      if (!metrics) continue;

      if (metrics.status === "success") {
        const priceChange =
          token.priceHistory.length > 1
            ? (
                ((metrics.priceUsd - token.priceHistory[0].price) /
                  token.priceHistory[0].price) *
                100
              ).toFixed(2)
            : "0.00";

        console.log(
          `\n🪙 ${metrics.baseToken.symbol} (${token.chain.toUpperCase()})`
        );
        console.log(`📍 Address: ${token.address}`);
        console.log(`💰 Price: $${metrics.priceUsd}`);
        console.log(`📈 24h Change: ${metrics.priceChange?.h24 || 0}%`);
        console.log(
          `💧 Liquidity: $${metrics.liquidity?.usd.toLocaleString() || 0}`
        );
        console.log(
          `📊 Volume 24h: $${metrics.volume24h?.toLocaleString() || 0}`
        );
        console.log(`⚡ Recent Change: ${priceChange}%`);
        console.log(`🏦 DEX: ${metrics.dex || "Unknown"}`);
        console.log(`🔄 Last Update: ${new Date().toLocaleTimeString()}`);

        // Add to updated tokens for Telegram message
        updatedTokens.push({
          ...token,
          symbol: metrics.baseToken.symbol,
          lastPrice: metrics.priceUsd,
          priceChange: metrics.priceChange,
          volume24h: metrics.volume24h,
          liquidity: metrics.liquidity,
          dex: metrics.dex,
        });
      } else {
        console.log(`\n⚠️ Token ${token.chain}-${token.address}:`);
        console.log(`Status: ${metrics.status}`);
        console.log(`Message: ${metrics.message}`);
        if (token.errors.length > 0) {
          console.log(`Recent Errors: ${token.errors.length}`);
          console.log(`Retry Count: ${token.retryCount}`);
        }
      }
      console.log("-".repeat(50));
    }

    // Send price updates to Telegram if we have any successful updates
    if (updatedTokens.length > 0) {
      await this.sendPriceUpdateToTelegram(updatedTokens);
    }
  }
}

module.exports = new TokenStorage();
