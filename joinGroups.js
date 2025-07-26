const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram");
const input = require("input");

const apiId = 22610695;
const apiHash = "a8d2da237cb629133af4a026a09355d7";

// Use the same session string from index.js
const currentSession =
  "1BAAOMTQ5LjE1NC4xNjcuOTEAUCODOHKjLGD+H5qU7ZRWXthEL8Ndtjx8zkVTAwEp4JdIU7AsicvZYRANcX4nFaZyaOavi5ysKjQQwcMIbgXaev3emgD8KmGXsEnpBcC7LWX+F3mSHR3n6xlmZElAPhQUNyMF3VZzgxXQR9yBBzGN5mF/Bo3Zd/MkA9Rbjy4W8xCj1lLtL4Y5TiVBJCTE3e6YUo8TzjR6skVVaMrihbksIuoXXA2thLrIsiBBQ43+tGcmzSp7g06HPDtD8mgPAMmX3QoOh4f1jret3VhQmnMlS6SqtuW4PbL0UjY4RsRS2lxNafOTQ3qAqz/W8zfveFRQPsS/T535qKJD/FYNVsA3tCk=";

// List of groups to join - modify this list as needed
const groupsToJoin = [
  // "KOLscope",
  // "Saqlain666",
  // "spydefi",
  // "willygoldkille",
  // "GM_Degencalls",
  // "DegensJournals",
  // "GemsmineEth",
  // "cryptoo_coffee",
  // "nakamoto_gamble",
  // "mad_apes_gambles",
  // "hercules_degen_calls",
  // "KurokoxGems1",
  // "jahmangems",
  // "alphadaocallsgems",
  // "POSEIDON_DEGEN_CALLS",
  // "PrintingShitcoin",
  // "brave_calls",
  // "andyshoutout",
  // "black_deg",
  // "cryptoboyzprivate",
  // "big_apes_call",
  // "Archerrgambles",
  // "degenalertstg",
  // "Milagrosdegencalls",
  // "DoxxedGamble",
  // "Marshmellow100xCalls",
  // "BrodyCalls",
  // "AnimeGems",
  // "TopCallersChannel",
  // "Cryptic_Maestro",
  // "Maestrosdegen",
  // "Dwen_Exchange",
  // "hulkgemscalls_real",
  // "SultanPlays",
  // "ghastlygems",
  // "CrikeyCallz",
  // "DONALD_CALL",
  // "nexuscallofficial",
  // "CNTokenChannel",
  // "PEYOSDEGENHUB",
  // "mooneagle_call",
  // "A3CallChan",
  // "Tanjiroplays",
  // "veigargambles",
  // "RobinhoodReviewer",
  // "PawGems",
  // "ROYAL_DEGEN_CALLS",
  // "GoonsCalls",
  // "BasedchadsGamble",
  // "Brookriskyplays",
  // "DegenSeals",
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
  // Add more groups here as needed
];

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

// Function to create a new session if needed
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

      console.log("\n🔐 New session generated successfully!");
      console.log("📝 New Session String (save this for future use):");
      console.log(client.session.save());

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

// Function to join a group
const joinGroup = async (client, groupName) => {
  try {
    console.log(`🔄 Attempting to join: ${groupName}`);

    // Try to get the entity first
    const entity = await client.getEntity(groupName);

    // Try to join the group using the proper API method
    try {
      await client.invoke(
        new Api.channels.JoinChannel({
          channel: entity,
        })
      );

      console.log(`✅ Successfully joined: ${groupName}`);
      return { success: true, alreadyMember: false };
    } catch (joinError) {
      // Check if the error indicates we're already a member
      if (
        joinError.message.includes("ALREADY_PARTICIPANT") ||
        joinError.message.includes("USER_ALREADY_PARTICIPANT")
      ) {
        console.log(`✅ Already a member of: ${groupName}`);
        return { success: true, alreadyMember: true };
      } else {
        throw joinError;
      }
    }
  } catch (error) {
    console.error(`❌ Failed to join ${groupName}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Main function to join all groups
const joinAllGroups = async () => {
  try {
    console.log("\n🚀 Starting group joining process...");
    console.log(`📋 Total groups to process: ${groupsToJoin.length}`);
    console.log("--------------------------------------------------");

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
        console.log("❌ Session is no longer valid. Creating new session...");
        client = await createNewSession();
      } else {
        throw error;
      }
    }

    // Get current user info
    const me = await client.getMe();
    console.log(
      `👤 Logged in as: ${me.firstName} ${me.lastName || ""} (@${me.username || "no username"})`
    );
    console.log("--------------------------------------------------");

    let successCount = 0;
    let alreadyMemberCount = 0;
    let failureCount = 0;
    const failedGroups = [];

    // Process groups with delay to avoid rate limits
    for (let i = 0; i < groupsToJoin.length; i++) {
      const groupName = groupsToJoin[i];

      console.log(
        `\n[${i + 1}/${groupsToJoin.length}] Processing: ${groupName}`
      );

      const result = await joinGroup(client, groupName);

      if (result.success) {
        if (result.alreadyMember) {
          alreadyMemberCount++;
        } else {
          successCount++;
        }
      } else {
        failureCount++;
        failedGroups.push({ name: groupName, error: result.error });
      }

      // Add delay between requests to avoid rate limits
      if (i < groupsToJoin.length - 1) {
        console.log("⏳ Waiting 2 seconds before next request...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 JOINING SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Successfully joined: ${successCount} groups`);
    console.log(`👥 Already members: ${alreadyMemberCount} groups`);
    console.log(`❌ Failed to join: ${failureCount} groups`);
    console.log(`📋 Total processed: ${groupsToJoin.length} groups`);

    if (failedGroups.length > 0) {
      console.log("\n❌ Failed Groups:");
      failedGroups.forEach((group) => {
        console.log(`   - ${group.name}: ${group.error}`);
      });
    }

    console.log("\n🎉 Group joining process completed!");

    // Disconnect client
    await client.disconnect();
    console.log("🔌 Disconnected from Telegram");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
};

// Function to add a single group to the list
const addGroupToList = (groupName) => {
  if (!groupsToJoin.includes(groupName)) {
    groupsToJoin.push(groupName);
    console.log(`✅ Added ${groupName} to the list`);
  } else {
    console.log(`⚠️ ${groupName} is already in the list`);
  }
};

// Function to remove a group from the list
const removeGroupFromList = (groupName) => {
  const index = groupsToJoin.indexOf(groupName);
  if (index > -1) {
    groupsToJoin.splice(index, 1);
    console.log(`✅ Removed ${groupName} from the list`);
  } else {
    console.log(`⚠️ ${groupName} not found in the list`);
  }
};

// Function to display current list
const displayGroupList = () => {
  console.log("\n📋 Current Groups List:");
  console.log("=".repeat(30));
  groupsToJoin.forEach((group, index) => {
    console.log(`${index + 1}. ${group}`);
  });
  console.log(`\nTotal: ${groupsToJoin.length} groups`);
};

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "join":
    joinAllGroups();
    break;
  case "add":
    if (args[1]) {
      addGroupToList(args[1]);
    } else {
      console.log(
        "❌ Please provide a group name: node joinGroups.js add <group_name>"
      );
    }
    break;
  case "remove":
    if (args[1]) {
      removeGroupFromList(args[1]);
    } else {
      console.log(
        "❌ Please provide a group name: node joinGroups.js remove <group_name>"
      );
    }
    break;
  case "list":
    displayGroupList();
    break;
  default:
    console.log("\n🤖 Telegram Group Joiner Tool");
    console.log("=".repeat(30));
    console.log("Usage:");
    console.log(
      "  node joinGroups.js join          - Join all groups in the list"
    );
    console.log("  node joinGroups.js add <group>   - Add a group to the list");
    console.log(
      "  node joinGroups.js remove <group> - Remove a group from the list"
    );
    console.log(
      "  node joinGroups.js list          - Display current group list"
    );
    console.log("\nExample:");
    console.log("  node joinGroups.js join");
    console.log("  node joinGroups.js add mygroup");
    console.log("  node joinGroups.js remove mygroup");
    console.log("  node joinGroups.js list");
    break;
}
