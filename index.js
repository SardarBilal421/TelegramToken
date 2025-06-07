const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input"); // install with: npm install input
const config = require("./config");
const dexscreener = require("./dexscreener");
const tokenStorage = require("./tokenStorage");

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
const stringSession = new StringSession(
  "1BAAOMTQ5LjE1NC4xNjcuOTEAUASPpxZd2/drCHXtURBaogx2Qy/g4PAY9gq8aIs7rYrlFijMZQ8leF6SgYNVX+Qt7u0uUNpf8AVqKpHMzs16pXW2XtToeZir6xgP1PWPMyKeJP6rvTuJ4fnKkn5P1iaDoGg+JuDE0suyAXX6vmaiXcE+/x1ZICqPNrR9dAkCeL7/XhRVd+djb4DwEBrv0FU0zz3R7S006u6ujhxVyi3g+LwCNvYiozOf8cKuWA/rspAxluXr7zdzJycE/ZC67dm3wkgn3jpyaLW0LIjvU7cD7D67kmfGZak4i6AaXFc5xrhIucOUbTaVwHZ5k6Q+pQUGX79XwYytOvGXS/BwwDALhLc="
); // <-- leave empty first time
// const stringSession = new StringSession(""); // <-- leave empty first time

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

// Function to send message to a specific group
const sendMessage = async (groupName, message) => {
  try {
    if (groups[groupName]) {
      await client.sendMessage(groups[groupName].entity, { message });
      console.log(`✅ Message sent successfully to ${groupName}!`);
    } else {
      console.error(`❌ Group ${groupName} not found!`);
    }
  } catch (error) {
    console.error(`❌ Error sending message to ${groupName}:`, error.message);
  }
};

// Main function with error handling and automatic reconnection
const startBot = async (retryCount = 0) => {
  try {
    console.log("\n📊 Configuration:");
    console.log("API ID:", apiId);
    console.log("API Hash:", apiHash);

    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
      maxReconnects: 10,
      retryDelay: 1000,
      autoReconnect: true,
      floodSleepThreshold: 60,
    });

    await client.start({
      phoneNumber: "+447438139239",
      password: async () =>
        await input.text("Enter your 2FA password (if any): "),
      phoneCode: async () => await input.text("Enter the code you received: "),
      onError: (err) => {
        console.error("❌ Telegram Error:", err);
        // Don't throw, just log
      },
    });

    console.log("✅ Logged in successfully!");
    console.log("💾 Your session string (save it!):", client.session.save());

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
    } catch (error) {
      console.error("❌ Error waiting for token storage:", error);
      // Continue anyway
    }

    // Listen to new messages from all groups
    Object.keys(groups).forEach((groupName) => {
      const group = groups[groupName];

      client.addEventHandler(async (event) => {
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
                    console.log(`\n💎 New Token Added to Tracking:`);
                    console.log(`Symbol: ${metrics.baseToken.symbol}`);
                    console.log(`Chain: ${token.chain.toUpperCase()}`);
                    console.log(`Source Group: ${groupTitle}`);
                    console.log(
                      `Found At: ${new Date(
                        message.date * 1000
                      ).toLocaleString()}`
                    );
                    console.log(`Current Price: $${metrics.priceUsd}`);
                    console.log(`DEX: ${metrics.dex}`);
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
                    console.log(`[${groupName}] 🛑 Stop Loss: ${line.trim()}`);
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
              } else if (containsManagementInstructions(messageText)) {
                console.log(`\n⚠️ [${groupName}] Management Instructions:`);
                console.log(`📝 ${message.message}`);
                console.log("-------------------");
                groups[groupName].isWaitingForSignal = false;
              }
            }
          } catch (error) {
            console.error(`❌ Error processing signal in ${groupName}:`, error);
          }
        } catch (error) {
          console.error(`❌ Error handling message in ${groupName}:`, error);
        }
      }, new NewMessage({ chats: [group.entity.id] }));
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
