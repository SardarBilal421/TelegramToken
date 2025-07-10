const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input"); // install with: npm install input
const config = require("./config");
const dexscreener = require("./dexscreener");
const tokenStorage = require("./tokenStorage");
const fs = require("fs");

// Error monitoring and notification system
let errorNotificationCooldown = 0;
const ERROR_COOLDOWN_TIME = 5 * 60 * 1000; // 5 minutes between error notifications
let lastErrorNotification = 0;
let consecutiveErrors = 0;
let botStartTime = Date.now();

// Function to send error notification to @Saqlain666
const sendErrorNotification = async (client, error, context = "") => {
  try {
    const now = Date.now();

    // Check if we should send notification (avoid spam)
    if (now - lastErrorNotification < ERROR_COOLDOWN_TIME) {
      consecutiveErrors++;
      return;
    }

    consecutiveErrors++;
    lastErrorNotification = now;

    const uptime = Math.floor((now - botStartTime) / 1000 / 60); // minutes
    const errorMessage =
      `🚨 BOT ERROR ALERT!\n\n` +
      `⏰ Time: ${new Date().toLocaleString()}\n` +
      `🔄 Uptime: ${uptime} minutes\n` +
      `❌ Error Count: ${consecutiveErrors}\n` +
      `📍 Context: ${context || "General"}\n\n` +
      `🔍 Error Details:\n` +
      `Type: ${error.name || "Unknown"}\n` +
      `Message: ${error.message || "No message"}\n` +
      `Stack: ${error.stack ? error.stack.split("\n").slice(0, 3).join("\n") : "No stack trace"}\n\n` +
      `💻 Server: DigitalOcean VPS\n` +
      `📊 Status: ${consecutiveErrors > 5 ? "CRITICAL" : "WARNING"}\n` +
      `--------------------------------------------------`;

    await sendMessage(client, "Saqlain666", errorMessage);
    console.log("✅ Error notification sent to @Saqlain666");
  } catch (notifyError) {
    console.error("❌ Failed to send error notification:", notifyError);
  }
};

// Function to send status notification
const sendStatusNotification = async (client, status, details = "") => {
  try {
    const uptime = Math.floor((Date.now() - botStartTime) / 1000 / 60); // minutes
    const statusMessage =
      `📊 BOT STATUS UPDATE!\n\n` +
      `⏰ Time: ${new Date().toLocaleString()}\n` +
      `🔄 Uptime: ${uptime} minutes\n` +
      `📈 Status: ${status}\n` +
      `📝 Details: ${details}\n` +
      `💻 Server: DigitalOcean VPS\n` +
      `--------------------------------------------------`;

    await sendMessage(client, "Saqlain666", statusMessage);
    console.log("✅ Status notification sent to @Saqlain666");
  } catch (notifyError) {
    console.error("❌ Failed to send status notification:", notifyError);
  }
};

// Enhanced global error handler
process.on("uncaughtException", async (error) => {
  console.error("❌ Uncaught Exception:", error);

  // Try to send notification if client exists
  if (global.telegramClient) {
    await sendErrorNotification(
      global.telegramClient,
      error,
      "Uncaught Exception"
    );
  }

  // Don't exit the process, let it try to recover
});

process.on("unhandledRejection", async (error) => {
  console.error("❌ Unhandled Rejection:", error);

  // Try to send notification if client exists
  if (global.telegramClient) {
    await sendErrorNotification(
      global.telegramClient,
      error,
      "Unhandled Rejection"
    );
  }

  // Don't exit the process, let it try to recover
});

const apiId = 22610695;
const apiHash = "a8d2da237cb629133af4a026a09355d7";

// Store the session string in a variable so we can modify it if needed
let currentSession =
  "1BAAOMTQ5LjE1NC4xNjcuOTEAUAOw5VvcqVsjGfL+cUa1SjquRFOKrbNLuO8g03qeGoIsDJdnXRE0oPdmKi4YWuwW0AedkwzZNKaJmDxUc/IM+FA2Lc+cGFd3nKIppABWzCtk/KBagtMLtIqBXdBIUx/75bnax9Iphrne47PYBz/fdle1BqgnkDqjsiCs6cLfNUVExEr9mrYoUomLlPxTLuUB0jsotFAeKcKhkSdKntG/E65PeBpscl90hNfdNsn7Gol+7eUrsRMIuQ//RXC9sFbM/ZX6aPLEFk+M/0jmN7tLjWEXbr+iC44IXizX/LOP9nFIQ3YUmr9tD9oNcgfXSpZfkWnk6jw2Mejcga/Hw4SLKjo=";

// Function to save session string to a file
const saveSession = (session) => {
  try {
    fs.writeFileSync("session.txt", session);
    console.log("✅ Session saved to session.txt");
  } catch (error) {
    console.error("❌ Error saving session:", error);
  }
};

// Function to create a new client with the current session
const createClient = () => {
  return new TelegramClient(new StringSession(currentSession), apiId, apiHash, {
    connectionRetries: 5,
    maxReconnects: 10,
    retryDelay: 1000,
    autoReconnect: true,
    floodSleepThreshold: 60,
  });
};

// Function to create a new session
const createNewSession = async () => {
  try {
    console.log("🔑 Creating new session...");
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
      connectionRetries: 5,
      maxReconnects: 10,
      retryDelay: 1000,
      autoReconnect: true,
      floodSleepThreshold: 60,
    });

    // Function to handle flood wait
    const handleFloodWait = async (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      console.log(
        `⚠️ Telegram rate limit hit. Need to wait ${hours} hours and ${minutes} minutes.`
      );
      console.log(
        "💡 Tip: Try using your existing session or wait for the rate limit to reset."
      );
      process.exit(1);
    };

    try {
      await client.start({
        phoneNumber: "+447438139239",
        password: async () => await input.text("Please enter your password: "),
        phoneCode: async () =>
          await input.text("Please enter the code you received: "),
        onError: (err) => {
          if (err.errorMessage === "FLOOD") {
            handleFloodWait(err.seconds);
          }
          console.log(err);
        },
      });

      // Save the new session string
      currentSession = client.session.save();
      console.log("\n🔐 New session generated successfully!");
      console.log("📝 New Session String (save this for future use):");
      console.log(currentSession);

      // Save to file
      saveSession(currentSession);

      return client;
    } catch (error) {
      if (error.errorMessage === "FLOOD") {
        await handleFloodWait(error.seconds);
      }
      throw error;
    }
  } catch (error) {
    console.error("❌ Error creating new session:", error);
    throw error;
  }
};

// Array of group names to monitor
const groupNames = [
  "KOLscope",
  "Saqlain666",
  "spydefi",
  "willygoldkille",
  "GM_Degencalls",
  "DegensJournals",
  "GemsmineEth",
  "cryptoo_coffee",
  "nakamoto_gamble",
  "mad_apes_gambles",
  "hercules_degen_calls",
  "KurokoxGems1",
  "jahmangems",
  "alphadaocallsgems",
  "nakamoto_gamble",
  "POSEIDON_DEGEN_CALLS",
  "GM_Degencalls",
  "PrintingShitcoin",
  "brave_calls",
  "andyshoutout",
  "black_deg",
  "cryptoboyzprivate",
  "big_apes_call",
  "Archerrgambles",
  "degenalertstg",
  "Milagrosdegencalls",
  "DoxxedGamble",
  "KurokoxGems1",
  "Marshmellow100xCalls",
  "BrodyCalls",
  "AnimeGems",
  "TopCallersChannel",
  "Cryptic_Maestro",
  "Maestrosdegen",
  "Dwen_Exchange",
  "hulkgemscalls_real",
  "SultanPlays",
  "ghastlygems",
  "CrikeyCallz",
  "DONALD_CALL",
  "nexuscallofficial",
  "CNTokenChannel",
  "PEYOSDEGENHUB",
  "mooneagle_call",
  "Dwen_Exchange",
  "A3CallChan",
  "Tanjiroplays",
  "veigargambles",
  "RobinhoodReviewer",
  "PawGems",
  "ROYAL_DEGEN_CALLS",
  "GoonsCalls",
  "BasedchadsGamble",
  "Brookriskyplays",
  "DegenSeals",
  "WJALE",
  "LizardCall",
  "BlockChainBrothersGambles",
  "simoncallssafu",
  "mrcryptgamble",
  "batman_gem",
  "CentralHub_News",
  "michacalls",
  "SHYROSHIGAMBLES",
  "chiggajogambles",
  "itachigems",
  "degensgems",
  "RichKidcalls",
  "iloverugging",
  "DoxxedChannel",
  "CryptoBossGamble",
]; // Add your group names here

// Function to check if message contains price levels
const containsPriceLevels = (text) => {
  try {
    return (
      (text.includes("@") || text.includes("sl") || text.includes("tp")) &&
      text.match(/\d{4}/) // Contains at least one 4-digit number
    );
  } catch (error) {
    console.error("❌ Error in containsPriceLevels:", error);
    return false;
  }
};

// Function to check if message contains management instructions
const containsManagementInstructions = (text) => {
  try {
    return (
      text.includes("enter slowly") ||
      text.includes("proper money management") ||
      text.includes("do not rush")
    );
  } catch (error) {
    console.error("❌ Error in containsManagementInstructions:", error);
    return false;
  }
};

// Function to send message to a specific group or user
const sendMessage = async (client, target, message) => {
  try {
    // Try to get the entity (could be a user or group)
    const entity = await client.getEntity(target);
    await client.sendMessage(entity, { message });
    console.log(`✅ Message sent successfully to ${target}!`);
    // Add a small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    console.error(`❌ Error sending message to ${target}:`, error.message);
  }
};

// Function to generate multiplier targets
const generateMultiplierTargets = () => {
  const targets = {};
  // Add multipliers from 2x to 100x
  for (let i = 2; i <= 100; i++) {
    targets[`x${i}`] = false;
  }
  // Add multipliers from 105x to 500x with 5x increments
  for (let i = 105; i <= 500; i += 5) {
    targets[`x${i}`] = false;
  }
  return targets;
};

// Function to format multiplier number
const formatMultiplier = (multiplier) => {
  if (multiplier < 1) return "0x";

  // For multipliers less than 10, show 1 decimal place
  if (multiplier < 10) {
    return multiplier.toFixed(1) + "x";
  }

  // For multipliers 10 and above, round to nearest integer
  return Math.round(multiplier) + "x";
};

// Function to calculate price multipliers
const calculatePriceMultipliers = (currentPrice, initialPrice) => {
  if (!initialPrice || initialPrice <= 0) return null;

  const multiplier = currentPrice / initialPrice;
  const multipliers = generateMultiplierTargets();

  // Update achieved multipliers
  for (const [key, _] of Object.entries(multipliers)) {
    const targetValue = parseInt(key.replace("x", ""));
    multipliers[key] = multiplier >= targetValue;
  }

  // Get the highest achieved multiplier
  let highestMultiplier = 2; // Start from 2x
  let nextTarget = null;

  // Find highest achieved and next target
  for (let i = 2; i <= 500; i++) {
    // Start from 2
    const key = `x${i}`;
    if (i <= 100 || i % 5 === 0) {
      // Only check valid targets (2-100 and multiples of 5)
      if (multipliers[key]) {
        highestMultiplier = i;
      } else if (!nextTarget && i > highestMultiplier) {
        nextTarget = i;
      }
    }
  }

  return {
    currentMultiplier: formatMultiplier(multiplier),
    highestMultiplier: highestMultiplier + "x",
    nextTarget: nextTarget ? nextTarget + "x" : ">500x",
    multipliers,
    rawMultiplier: multiplier, // Store raw value for calculations
  };
};

// Function to format multiplier message
const formatMultiplierMessage = (multipliers) => {
  if (!multipliers) return "";

  // Get all achieved multipliers
  const achieved = Object.entries(multipliers.multipliers)
    .filter(([_, achieved]) => achieved)
    .map(([key]) => key);

  // Group achieved multipliers for better readability
  const formatAchieved = (achieved) => {
    if (achieved.length === 0) return "None yet";

    // Sort numerically
    achieved.sort(
      (a, b) => parseInt(a.replace("x", "")) - parseInt(b.replace("x", ""))
    );

    // Group consecutive numbers
    const groups = [];
    let currentGroup = [];

    achieved.forEach((mult, index) => {
      const value = parseInt(mult.replace("x", ""));
      if (index === 0) {
        currentGroup.push(value);
      } else {
        const prevValue = parseInt(achieved[index - 1].replace("x", ""));
        if (
          value === prevValue + 1 ||
          (value > 100 && value === prevValue + 5)
        ) {
          currentGroup.push(value);
        } else {
          if (currentGroup.length > 0) {
            groups.push(currentGroup);
          }
          currentGroup = [value];
        }
      }
    });
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // Format groups
    return groups
      .map((group) => {
        if (group.length === 1) return `x${group[0]}`;
        return `x${group[0]}-x${group[group.length - 1]}`;
      })
      .join(", ");
  };

  // Format initial and current prices for better readability
  const formatPrice = (price) => {
    if (!price) return "N/A";
    if (price < 0.000001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  return (
    `\n🚀 Price Multipliers:\n` +
    `📈 Current: ${multipliers.currentMultiplier}\n` +
    `🏆 Highest: ${multipliers.highestMultiplier}\n` +
    `🎯 Next Target: ${multipliers.nextTarget}\n` +
    `✨ Achieved: ${formatAchieved(achieved)}\n` +
    `💰 Initial: $${formatPrice(multipliers.rawMultiplier / multipliers.currentMultiplier)}\n` +
    `💵 Current: $${formatPrice(multipliers.rawMultiplier * (multipliers.rawMultiplier / multipliers.currentMultiplier))}`
  );
};

// Modify the token storage add function to include initial price
const addTokenWithInitialPrice = async (
  chain,
  address,
  sourceGroup,
  symbol,
  name,
  timestamp,
  initialPrice
) => {
  const savedToken = await tokenStorage.addToken(
    chain,
    address,
    sourceGroup,
    symbol,
    name,
    timestamp
  );
  if (savedToken) {
    savedToken.initialPrice = initialPrice;
  }
  return savedToken;
};

// Function to safely format price
const formatPrice = (price) => {
  try {
    // Handle null, undefined, or empty values
    if (price === null || price === undefined || price === "") {
      return "N/A";
    }

    // Convert to number if it's a string
    const numPrice = typeof price === "string" ? parseFloat(price) : price;

    // Check if it's a valid number
    if (isNaN(numPrice)) {
      return "N/A";
    }

    // Handle zero
    if (numPrice === 0) {
      return "$0.00";
    }

    // Handle very small numbers
    if (numPrice < 0.000001) {
      return `$${numPrice.toExponential(2)}`;
    }

    // Handle small numbers
    if (numPrice < 0.01) {
      return `$${numPrice.toFixed(6)}`;
    }

    // Handle numbers less than 1
    if (numPrice < 1) {
      return `$${numPrice.toFixed(4)}`;
    }

    // Handle regular numbers
    return `$${numPrice.toFixed(2)}`;
  } catch (error) {
    console.error("Error formatting price:", error);
    return "N/A";
  }
};

// Function to send achievement notification
const sendAchievementNotification = async (
  client,
  token,
  metrics,
  groupName,
  multipliers
) => {
  try {
    const totalTokens = Object.keys(tokenStorage.getAllTokens()).length;

    // Get the latest achieved multiplier
    const achieved = Object.entries(multipliers.multipliers)
      .filter(([_, achieved]) => achieved)
      .map(([key]) => parseInt(key.replace("x", "")))
      .sort((a, b) => b - a)[0]; // Get the highest achieved

    if (achieved) {
      const achievementMessage =
        `🎯 TOKEN ACHIEVEMENT ALERT!\n\n` +
        `🪙 Token: ${metrics.baseToken.symbol || "Unknown"}\n` +
        `📍 Address: ${token.address}\n` +
        `⛓️ Chain: ${token.chain.toUpperCase()}\n` +
        `📈 Achieved: x${achieved}\n` +
        `💰 Initial Price: ${formatPrice(token.initialPrice)}\n` +
        `💵 Current Price: ${formatPrice(metrics.priceUsd)}\n` +
        `📊 24h Change: ${metrics.priceChange24h || 0}%\n` +
        `💧 Liquidity: ${formatPrice(metrics.liquidityUsd)}\n` +
        `📈 Volume 24h: ${formatPrice(metrics.volume24h)}\n` +
        `🏦 DEX: ${metrics.dex || "Unknown"}\n` +
        `📢 Source Group: ${groupName}\n` +
        `⏰ Time: ${new Date().toLocaleString()}\n` +
        `--------------------------------------------------`;

      await sendMessage(client, "hamza_ilyas212", achievementMessage);
    }
  } catch (error) {
    console.error("❌ Error sending achievement notification:", error);
  }
};

// Function to send new token notification
const sendNewTokenNotification = async (client, token, metrics, groupName) => {
  try {
    const totalTokens = Object.keys(tokenStorage.getAllTokens()).length;

    const newTokenMessage =
      `💎 NEW TOKEN ADDED TO TRACKING!\n\n` +
      `🪙 Token: ${metrics.baseToken.symbol || "Unknown"}\n` +
      `📍 Address: ${token.address}\n` +
      `⛓️ Chain: ${token.chain.toUpperCase()}\n` +
      `💰 Initial Price: ${formatPrice(token.initialPrice)}\n` +
      `📊 24h Change: ${metrics.priceChange24h || 0}%\n` +
      `💧 Liquidity: ${formatPrice(metrics.liquidityUsd)}\n` +
      `📈 Volume 24h: ${formatPrice(metrics.volume24h)}\n` +
      `🏦 DEX: ${metrics.dex || "Unknown"}\n` +
      `📢 Source Group: ${groupName}\n` +
      `⏰ Found At: ${new Date().toLocaleString()}\n\n` +
      `📊 Total Tokens in Tracking: ${totalTokens}\n` +
      `--------------------------------------------------`;

    await sendMessage(client, "hamza_ilyas212", newTokenMessage);
  } catch (error) {
    console.error("❌ Error sending new token notification:", error);
  }
};

// Modify the sendTokenPriceUpdates function to only check for achievements
const sendTokenPriceUpdates = async (client) => {
  try {
    const tokens = tokenStorage.getAllTokens();
    if (!tokens || Object.keys(tokens).length === 0) {
      return;
    }

    // Only check for new achievements, don't send regular updates
    for (const [key, token] of Object.entries(tokens)) {
      try {
        const metrics = await tokenStorage.updateTokenPrice(
          token.chain,
          token.address
        );

        if (metrics && metrics.status === "success") {
          const multipliers = calculatePriceMultipliers(
            metrics.priceUsd,
            token.initialPrice
          );

          // Only send notification if there's a new achievement
          if (multipliers) {
            const achieved = Object.entries(multipliers.multipliers)
              .filter(([_, achieved]) => achieved)
              .map(([key]) => parseInt(key.replace("x", "")))
              .sort((a, b) => b - a)[0];

            // Only send if there's a new achievement
            if (
              achieved &&
              (!token.lastAchievement || achieved > token.lastAchievement)
            ) {
              await sendAchievementNotification(
                client,
                token,
                metrics,
                token.sourceGroup,
                multipliers
              );
              // Update the last achievement for this token
              token.lastAchievement = achieved;
            }
          }
        }
      } catch (error) {
        console.error(
          `❌ Error checking token ${token.address}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error("❌ Error in price update check:", error);
  }
};

// Main function with error handling and automatic reconnection
const startBot = async (retryCount = 0) => {
  try {
    console.log("\n📊 Configuration:");
    console.log("API ID:", apiId);
    console.log("API Hash:", apiHash);

    let client;
    try {
      console.log("🔄 Attempting to connect with saved session...");
      client = createClient();
      await client.connect();
      console.log("✅ Connected successfully using saved session!");

      // Make client globally accessible for error notifications
      global.telegramClient = client;

      // Send startup notification
      await sendStatusNotification(
        client,
        "STARTED",
        "Bot successfully connected and started"
      );
    } catch (error) {
      if (
        error.message.includes("AUTH_KEY_DUPLICATED") ||
        error.message.includes("SESSION_REVOKED") ||
        error.message.includes("The key is not registered in the system")
      ) {
        if (error.errorMessage === "FLOOD") {
          const seconds = error.seconds;
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          console.log(
            `⚠️ Rate limit hit. Need to wait ${hours} hours and ${minutes} minutes.`
          );
          console.log("💡 Please try again after the waiting period.");

          // Send rate limit notification
          if (client) {
            await sendErrorNotification(client, error, "Rate Limit Hit");
          }

          process.exit(1);
        } else {
          console.log("❌ Session is no longer valid. Creating new session...");
          client = await createNewSession();
          global.telegramClient = client;

          // Send session renewal notification
          await sendStatusNotification(
            client,
            "SESSION RENEWED",
            "New session created successfully"
          );
        }
      } else {
        throw error;
      }
    }

    // Object to store group entities and their states
    const groups = {};
    let connectedGroups = 0;

    // Initialize all groups with retry logic
    for (const groupName of groupNames) {
      let retries = 3;
      while (retries > 0) {
        try {
          const entity = await client.getEntity(groupName);
          const groupTitle = entity.title || groupName;
          groups[groupName] = {
            entity,
            title: groupTitle,
            isWaitingForSignal: false,
            currentSignal: "",
          };
          console.log(`✅ Successfully connected to ${groupTitle}`);
          connectedGroups++;
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error(
              `❌ Failed to connect to ${groupName} after 3 attempts:`,
              error.message
            );

            // Send group connection failure notification
            await sendErrorNotification(
              client,
              error,
              `Failed to connect to group: ${groupName}`
            );
          } else {
            console.log(
              `⚠️ Retrying connection to ${groupName}... (${retries} attempts left)`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    }

    // Send group connection summary
    await sendStatusNotification(
      client,
      "GROUPS CONNECTED",
      `Connected to ${connectedGroups}/${groupNames.length} groups successfully`
    );

    // Wait for token storage to initialize with timeout
    console.log("\n⏳ Waiting for token storage to initialize...");
    let initTimeout = setTimeout(async () => {
      console.error(
        "⚠️ Token storage initialization timed out, continuing anyway..."
      );
      await sendErrorNotification(
        client,
        new Error("Token storage initialization timeout"),
        "Token Storage Timeout"
      );
    }, 30000);

    try {
      while (!tokenStorage.initialized) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      clearTimeout(initTimeout);
      console.log("✅ Token storage initialized");

      // Start periodic achievement checks (but don't send regular updates)
      console.log("🔄 Starting periodic achievement checks...");
      setInterval(
        async () => {
          try {
            await sendTokenPriceUpdates(client);
          } catch (error) {
            console.error("❌ Error in achievement check:", error);
            await sendErrorNotification(
              client,
              error,
              "Achievement Check Error"
            );
          }
        },
        3 * 60 * 1000
      ); // Still check every 3 minutes, but only for achievements

      // Start periodic health check
      setInterval(
        async () => {
          try {
            const uptime = Math.floor((Date.now() - botStartTime) / 1000 / 60);
            const totalTokens = Object.keys(tokenStorage.getAllTokens()).length;

            await sendStatusNotification(
              client,
              "HEALTH CHECK",
              `Uptime: ${uptime}min | Tokens: ${totalTokens} | Groups: ${connectedGroups}/${groupNames.length}`
            );
          } catch (error) {
            console.error("❌ Error in health check:", error);
            await sendErrorNotification(client, error, "Health Check Error");
          }
        },
        60 * 60 * 1000
      ); // Every hour

      // Listen to new messages from all groups
      Object.keys(groups).forEach((groupName) => {
        const group = groups[groupName];

        client.addEventHandler(
          async (event) => {
            try {
              const message = event.message;
              const messageText = message.message;

              // Get group name from the stored group info
              const groupTitle = group.title || groupName;

              console.log(`[${groupTitle}] New message:`, messageText);

              // Detect chain and token addresses
              const chainId = dexscreener.detectChainFromMessage(messageText);
              const foundTokens = dexscreener.extractTokenAddresses(
                messageText,
                chainId
              );

              if (foundTokens.length > 0) {
                console.log(
                  `\n🔍 Found ${foundTokens.length} token address(es) from ${groupTitle}:`
                );

                // Send notification about found tokens
                const tokenNotification = `🔍 Found ${foundTokens.length} new token(s) in ${groupTitle}!\n\n`;
                await sendMessage(client, "hamza_ilyas212", tokenNotification);

                for (const token of foundTokens) {
                  console.log(`\n📍 Token on ${token.chain}:`, token.address);

                  try {
                    const key = `${token.chain}-${token.address.toLowerCase()}`;
                    const existingToken = tokenStorage.getToken(key);

                    if (existingToken) {
                      console.log(
                        `Token already exists, added by: ${existingToken.sourceGroup}`
                      );
                      continue;
                    }

                    // Get initial price before adding token
                    const initialMetrics = await dexscreener.getTokenMetrics(
                      token.chain,
                      token.address
                    );
                    const initialPrice = initialMetrics?.priceUsd || null;

                    // Add new token with initial price
                    const savedToken = await addTokenWithInitialPrice(
                      token.chain,
                      token.address,
                      groupTitle,
                      null,
                      null,
                      message.date,
                      initialPrice
                    );

                    if (savedToken) {
                      const metrics = await tokenStorage.updateTokenPrice(
                        token.chain,
                        token.address
                      );

                      if (metrics && metrics.status === "success") {
                        // Send new token notification
                        await sendNewTokenNotification(
                          client,
                          savedToken,
                          metrics,
                          groupTitle
                        );
                      }
                    }
                  } catch (error) {
                    console.error(
                      `❌ Error processing token ${token.address}:`,
                      error.message
                    );
                    await sendErrorNotification(
                      client,
                      error,
                      `Token Processing Error: ${token.address}`
                    );
                  }
                }

                // Display all tracked tokens after adding new ones
                try {
                  await tokenStorage.displayAllPrices();
                } catch (error) {
                  console.error("❌ Error displaying prices:", error);
                  await sendErrorNotification(
                    client,
                    error,
                    "Price Display Error"
                  );
                }
              }

              // Handle trading signals with error protection
              try {
                if (
                  messageText.toLowerCase().includes("lets scalping") &&
                  (messageText.toLowerCase().includes("buy gold") ||
                    messageText.toLowerCase().includes("sell gold"))
                ) {
                  groups[groupName].isWaitingForSignal = true;
                  const direction = messageText.toLowerCase().includes("buy")
                    ? "BUY"
                    : "SELL";
                  console.log(
                    `\n🚨 [${groupName}] ALERT: Trigger message detected! Waiting for trade signal...`
                  );
                  console.log(`📈 Direction: ${direction}`);
                  console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
                  console.log(`📝 Message: ${message.message}`);

                  // Play a beep sound
                  process.stdout.write("\x07");

                  const signalAlert = `🚨 TRADE ALERT!\n\nGroup: ${groupTitle}\nDirection: ${direction}\nTime: ${new Date().toLocaleTimeString()}\n\nTrigger Message:\n${message.message}`;
                  await sendMessage(client, "hamza_ilyas212", signalAlert);
                } else if (groups[groupName].isWaitingForSignal) {
                  const isBuySignal = messageText.toLowerCase().includes("buy");
                  const isSellSignal = messageText
                    .toLowerCase()
                    .includes("sell");

                  if (
                    (isBuySignal || isSellSignal) &&
                    containsPriceLevels(messageText)
                  ) {
                    console.log(
                      `\n💹 [${groupName}] TRADE SIGNAL DETAILS RECEIVED!`
                    );
                    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
                    console.log(`📈 Type: ${isBuySignal ? "BUY" : "SELL"}`);
                    console.log(`📝 Signal Details: ${message.message}`);

                    groups[groupName].currentSignal = message.message;

                    // Extract and display price levels
                    const lines = message.message.split("\n");
                    lines.forEach((line) => {
                      if (line.includes("@"))
                        console.log(`[${groupName}] 📍 Entry: ${line.trim()}`);
                      if (line.toLowerCase().includes("sl"))
                        console.log(
                          `[${groupName}] 🛑 Stop Loss: ${line.trim()}`
                        );
                      if (line.toLowerCase().includes("tp"))
                        console.log(
                          `[${groupName}] 🎯 Take Profit: ${line.trim()}`
                        );
                    });

                    // Play multiple beeps
                    for (let i = 0; i < 3; i++) {
                      process.stdout.write("\x07");
                      await new Promise((resolve) => setTimeout(resolve, 500));
                    }

                    const signalDetails = `💹 TRADE SIGNAL DETAILS!\n\nGroup: ${groupTitle}\nType: ${isBuySignal ? "BUY" : "SELL"}\nTime: ${new Date().toLocaleTimeString()}\n\nSignal Details:\n${message.message}`;
                    await sendMessage(client, "hamza_ilyas212", signalDetails);
                  } else if (containsManagementInstructions(messageText)) {
                    console.log(`\n⚠️ [${groupName}] Management Instructions:`);
                    console.log(`📝 ${message.message}`);
                    console.log("-------------------");
                    groups[groupName].isWaitingForSignal = false;
                  }
                }
              } catch (error) {
                console.error(
                  `❌ Error processing signal in ${groupName}:`,
                  error
                );
                await sendErrorNotification(
                  client,
                  error,
                  `Signal Processing Error: ${groupName}`
                );
              }
            } catch (error) {
              console.error(
                `❌ Error handling message in ${groupName}:`,
                error
              );
              await sendErrorNotification(
                client,
                error,
                `Message Handling Error: ${groupName}`
              );
            }
          },
          new NewMessage({ chats: [group.entity.id] })
        );
      });

      console.log("\n👀 Listening for signals in all configured groups:");
      Object.keys(groups).forEach((groupName) => {
        console.log(`📱 ${groupName}`);
      });
      console.log("\n✨ Waiting for trigger messages and token addresses...");

      // Send final startup notification
      await sendStatusNotification(
        client,
        "FULLY OPERATIONAL",
        `Bot is now listening to ${connectedGroups} groups and monitoring tokens`
      );

      // Handle disconnections
      client.addEventHandler(async (update) => {
        if (update?.className === "UpdateConnectionState") {
          console.log(`📡 Connection state changed: ${update.state}`);
          if (update.state === "disconnected") {
            console.log("🔄 Attempting to reconnect...");
            await sendErrorNotification(
              client,
              new Error("Telegram connection lost"),
              "Connection Lost"
            );
          } else if (update.state === "connected") {
            await sendStatusNotification(
              client,
              "RECONNECTED",
              "Telegram connection restored"
            );
          }
        }
      });
    } catch (error) {
      console.error("❌ Error waiting for token storage:", error);
      await sendErrorNotification(
        client,
        error,
        "Token Storage Initialization Error"
      );
      // Continue anyway
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);

    // Send fatal error notification
    if (global.telegramClient) {
      await sendErrorNotification(global.telegramClient, error, "Fatal Error");
    }

    // If we've tried less than 3 times, wait and retry
    if (retryCount < 3) {
      console.log(`🔄 Restarting bot (attempt ${retryCount + 1}/3)...`);

      // Send restart notification
      if (global.telegramClient) {
        await sendStatusNotification(
          global.telegramClient,
          "RESTARTING",
          `Attempt ${retryCount + 1}/3 after fatal error`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
      return startBot(retryCount + 1);
    } else {
      console.error(
        "❌ Maximum retry attempts reached. Please check the errors above and restart manually."
      );

      // Send final failure notification
      if (global.telegramClient) {
        await sendErrorNotification(
          global.telegramClient,
          new Error("Maximum retry attempts reached"),
          "Bot Shutdown"
        );
      }
    }
  }
};

// Start the bot
startBot().catch((error) => {
  console.error("❌ Failed to start bot:", error);
});
