const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input"); // install with: npm install input
const config = require("./config");
const dexscreener = require("./dexscreener");
const tokenStorage = require("./tokenStorage");
const fs = require("fs");

// Global error handler
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Don't exit the process
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled Rejection:", error);
  // Don't exit the process
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

// Function to send token price updates
const sendTokenPriceUpdates = async (client) => {
  try {
    const tokens = tokenStorage.getAllTokens();
    if (!tokens || Object.keys(tokens).length === 0) {
      return;
    }

    // Send header message
    const headerMessage =
      "📊 CURRENT TOKEN PRICES UPDATE\n" +
      "==================================================\n" +
      `⏰ Update Time: ${new Date().toLocaleString()}\n\n`;
    await sendMessage(client, "hamza_ilyas212", headerMessage);

    // Send each token's details one by one
    for (const [key, token] of Object.entries(tokens)) {
      try {
        // Update token price before sending
        const metrics = await tokenStorage.updateTokenPrice(
          token.chain,
          token.address
        );

        if (metrics && metrics.status === "success") {
          const tokenMessage =
            `🪙 ${metrics.baseToken.symbol} (${token.chain.toUpperCase()})\n` +
            `📍 Address: ${token.address}\n` +
            `💰 Price: $${metrics.priceUsd}\n` +
            `📈 24h Change: ${metrics.priceChange24h}%\n` +
            `💧 Liquidity: $${metrics.liquidityUsd}\n` +
            `📊 Volume 24h: $${metrics.volume24h}\n` +
            `⚡ Recent Change: ${metrics.priceChange1h}%\n` +
            `🏦 DEX: ${metrics.dex}\n` +
            `🔄 Last Update: ${new Date().toLocaleTimeString()}\n` +
            `--------------------------------------------------`;

          await sendMessage(client, "hamza_ilyas212", tokenMessage);
        }
      } catch (error) {
        console.error(
          `❌ Error updating token ${token.address}:`,
          error.message
        );
      }
    }

    // Send footer message
    const footerMessage =
      "\n📊 End of Price Update\n" +
      "==================================================";
    await sendMessage(client, "hamza_ilyas212", footerMessage);
  } catch (error) {
    console.error("❌ Error sending token price updates:", error);
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
          process.exit(1);
        } else {
          console.log("❌ Session is no longer valid. Creating new session...");
          client = await createNewSession();
        }
      } else {
        throw error;
      }
    }

    // Object to store group entities and their states
    const groups = {};

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
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error(
              `❌ Failed to connect to ${groupName} after 3 attempts:`,
              error.message
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

    // Wait for token storage to initialize with timeout
    console.log("\n⏳ Waiting for token storage to initialize...");
    let initTimeout = setTimeout(() => {
      console.error(
        "⚠️ Token storage initialization timed out, continuing anyway..."
      );
      // Don't reject, just continue
    }, 30000);

    try {
      while (!tokenStorage.initialized) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      clearTimeout(initTimeout);
      console.log("✅ Token storage initialized");

      // Start periodic token price updates
      console.log("🔄 Starting periodic token price updates...");
      setInterval(
        async () => {
          try {
            await sendTokenPriceUpdates(client);
          } catch (error) {
            console.error("❌ Error in periodic price update:", error);
          }
        },
        3 * 60 * 1000
      ); // 3 minutes in milliseconds

      // Send initial price update
      await sendTokenPriceUpdates(client);
    } catch (error) {
      console.error("❌ Error waiting for token storage:", error);
      // Continue anyway
    }

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
                  // Check if token already exists
                  const key = `${token.chain}-${token.address.toLowerCase()}`;
                  const existingToken = tokenStorage.getToken(key);

                  if (existingToken) {
                    console.log(
                      `Token already exists, added by: ${existingToken.sourceGroup}`
                    );
                    continue; // Skip if token already exists
                  }

                  // Add new token to storage with group name and get initial metrics
                  const savedToken = await tokenStorage.addToken(
                    token.chain,
                    token.address,
                    groupTitle, // Use the stored group title
                    null, // symbol
                    null, // name
                    message.date // Add timestamp of when token was found
                  );

                  if (savedToken) {
                    const metrics = await tokenStorage.updateTokenPrice(
                      token.chain,
                      token.address
                    );

                    if (metrics && metrics.status === "success") {
                      const tokenInfo = `💎 New Token Found!\n\nSymbol: ${metrics.baseToken.symbol}\nChain: ${token.chain.toUpperCase()}\nSource: ${groupTitle}\nPrice: $${metrics.priceUsd}\nDEX: ${metrics.dex}\n\nFound at: ${new Date(message.date * 1000).toLocaleString()}`;
                      await sendMessage(client, "hamza_ilyas212", tokenInfo);
                    } else if (metrics) {
                      console.log(`\n⚠️ Token Status:`, metrics.message);
                    }
                  }
                } catch (error) {
                  console.error(
                    `❌ Error processing token ${token.address} from ${groupTitle}:`,
                    error.message
                  );
                  // Continue with next token
                }
              }

              // Display all tracked tokens after adding new ones
              try {
                await tokenStorage.displayAllPrices();
              } catch (error) {
                console.error("❌ Error displaying prices:", error);
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
                const isSellSignal = messageText.toLowerCase().includes("sell");

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
            }
          } catch (error) {
            console.error(`❌ Error handling message in ${groupName}:`, error);
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

    // Handle disconnections
    client.addEventHandler((update) => {
      if (update?.className === "UpdateConnectionState") {
        console.log(`📡 Connection state changed: ${update.state}`);
        if (update.state === "disconnected") {
          console.log("🔄 Attempting to reconnect...");
        }
      }
    });
  } catch (error) {
    console.error("❌ Fatal error:", error);

    // If we've tried less than 3 times, wait and retry
    if (retryCount < 3) {
      console.log(`🔄 Restarting bot (attempt ${retryCount + 1}/3)...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return startBot(retryCount + 1);
    } else {
      console.error(
        "❌ Maximum retry attempts reached. Please check the errors above and restart manually."
      );
    }
  }
};

// Start the bot
startBot().catch((error) => {
  console.error("❌ Failed to start bot:", error);
});
