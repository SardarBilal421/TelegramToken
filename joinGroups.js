const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram");
const input = require("input");
const fs = require("fs");
const path = require("path");

const apiId = 22610695;
const apiHash = "a8d2da237cb629133af4a026a09355d7";

// Function to load session
function loadSession() {
  try {
    const sessionFile = path.join(__dirname, "session.json");
    if (fs.existsSync(sessionFile)) {
      const data = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
      return data.session;
    }
  } catch (error) {
    console.log("No saved session found");
  }
  return "";
}

// Function to save session
function saveSession(session) {
  try {
    const sessionFile = path.join(__dirname, "session.json");
    fs.writeFileSync(sessionFile, JSON.stringify({ session }, null, 2));
    console.log("✅ Session saved successfully");
  } catch (error) {
    console.error("❌ Error saving session:", error.message);
  }
}

// Function to delete session
function deleteSession() {
  try {
    const sessionFile = path.join(__dirname, "session.json");
    if (fs.existsSync(sessionFile)) {
      fs.unlinkSync(sessionFile);
      console.log("🗑️ Deleted invalid session");
    }
  } catch (error) {
    console.error("❌ Error deleting session:", error.message);
  }
}

// Array of group names to join
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
];

// Sleep function for delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to handle flood wait
async function handleFloodWait(error) {
  if (error.errorMessage === "FLOOD" && error.seconds) {
    const waitSeconds = error.seconds;
    console.log(`⏳ Flood wait required, waiting ${waitSeconds} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
    return true;
  }
  return false;
}

async function joinGroups(retryCount = 0) {
  console.log("📱 Starting Telegram Group Joiner");
  console.log("=================================");

  try {
    // Initialize the client with saved session
    const savedSession = loadSession();
    const stringSession = new StringSession(savedSession);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    try {
      // Start the client
      if (!savedSession) {
        console.log("No saved session found, please login:");
        try {
          await client.start({
            phoneNumber: "+447438139239",
            password: async () =>
              await input.text("Please enter your password: "),
            phoneCode: async () =>
              await input.text("Please enter the code you received: "),
            onError: async (err) => {
              console.log(err);
              if (err.errorMessage === "FLOOD") {
                await handleFloodWait(err);
              }
            },
          });

          // Save the new session
          const newSession = client.session.save();
          saveSession(newSession);
          console.log("💾 New session saved for future use");
        } catch (loginError) {
          if (await handleFloodWait(loginError)) {
            if (retryCount < 3) {
              console.log("🔄 Retrying after flood wait...");
              return joinGroups(retryCount + 1);
            }
          } else if (loginError.message.includes("AUTH_KEY_DUPLICATED")) {
            console.log(
              "⚠️ Session conflict detected, creating new session..."
            );
            deleteSession();
            if (retryCount < 3) {
              return joinGroups(retryCount + 1);
            }
          }
          throw loginError;
        }
      } else {
        console.log("🔑 Using saved session");
        await client.connect();
      }
    } catch (error) {
      if (error.message.includes("AUTH_KEY_DUPLICATED")) {
        console.log("⚠️ Session conflict detected, creating new session...");
        deleteSession();
        if (retryCount < 3) {
          return joinGroups(retryCount + 1);
        }
      }
      throw error;
    }

    console.log("✅ Successfully connected to Telegram!");

    // Store successful and failed joins
    const results = {
      successful: [],
      failed: [],
      alreadyMember: [],
    };

    // Join each group with proper rate limiting
    for (const groupName of groupNames) {
      try {
        console.log(`\n🔄 Processing ${groupName}...`);

        // Try to get the entity first
        let entity;
        try {
          entity = await client.getEntity(groupName);
        } catch (entityError) {
          console.log(
            `❌ Could not find group ${groupName}: ${entityError.message}`
          );
          results.failed.push({ name: groupName, error: "Group not found" });
          continue;
        }

        // Check if we're already a member
        try {
          const fullChannel = await client.invoke(
            new Api.channels.GetFullChannel({
              channel: entity,
            })
          );

          if (fullChannel.fullChat.participants_count > 0) {
            console.log(`ℹ️ Already a member of ${groupName}`);
            results.alreadyMember.push(groupName);
            continue;
          }
        } catch (error) {
          // If we can't get channel info, proceed with join attempt
        }

        // Try to join the group
        try {
          await client.invoke(
            new Api.channels.JoinChannel({
              channel: entity,
            })
          );
          console.log(`✅ Successfully joined ${groupName}`);
          results.successful.push(groupName);

          // Wait between joins to avoid rate limits
          // Telegram typically allows 20 joins per hour = 180 seconds between joins to be safe
          console.log("⏳ Waiting 180 seconds before next join...");
          await sleep(180000); // 3 minutes
        } catch (joinError) {
          if (joinError.message.includes("CHAT_ADMIN_REQUIRED")) {
            console.log(`⚠️ Need admin approval for ${groupName}`);
            results.failed.push({
              name: groupName,
              error: "Requires admin approval",
            });
          } else if (joinError.message.includes("CHANNEL_PRIVATE")) {
            console.log(`⚠️ Cannot join private channel ${groupName}`);
            results.failed.push({ name: groupName, error: "Private channel" });
          } else {
            console.log(`❌ Failed to join ${groupName}: ${joinError.message}`);
            results.failed.push({ name: groupName, error: joinError.message });
          }
          // Still wait between attempts even if failed
          await sleep(180000);
        }
      } catch (error) {
        console.error(`❌ Error processing ${groupName}:`, error.message);
        results.failed.push({ name: groupName, error: error.message });
        await sleep(180000);
      }
    }

    // Print summary
    console.log("\n📊 Join Operation Summary");
    console.log("=======================");
    console.log(`✅ Successfully joined: ${results.successful.length} groups`);
    console.log(`ℹ️ Already member of: ${results.alreadyMember.length} groups`);
    console.log(`❌ Failed to join: ${results.failed.length} groups\n`);

    if (results.successful.length > 0) {
      console.log("Successfully joined groups:");
      results.successful.forEach((group) => console.log(`- ${group}`));
    }

    if (results.alreadyMember.length > 0) {
      console.log("\nAlready member of:");
      results.alreadyMember.forEach((group) => console.log(`- ${group}`));
    }

    if (results.failed.length > 0) {
      console.log("\nFailed to join:");
      results.failed.forEach((fail) =>
        console.log(`- ${fail.name}: ${fail.error}`)
      );
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
  }
}

// Start the join operation
joinGroups().catch(console.error);
