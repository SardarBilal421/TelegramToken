const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");
const fs = require("fs");
const path = require("path");

const apiId = 22610695;
const apiHash = "a8d2da237cb629133af4a026a09355d7";
const stringSession = new StringSession(
  "1BAAOMTQ5LjE1NC4xNjcuOTEAUASPpxZd2/drCHXtURBaogx2Qy/g4PAY9gq8aIs7rYrlFijMZQ8leF6SgYNVX+Qt7u0uUNpf8AVqKpHMzs16pXW2XtToeZir6xgP1PWPMyKeJP6rvTuJ4fnKkn5P1iaDoGg+JuDE0suyAXX6vmaiXcE+/x1ZICqPNrR9dAkCeL7/XhRVd+djb4DwEBrv0FU0zz3R7S006u6ujhxVyi3g+LwCNvYiozOf8cKuWA/rspAxluXr7zdzJycE/ZC67dm3wkgn3jpyaLW0LIjvU7cD7D67kmfGZak4i6AaXFc5xrhIucOUbTaVwHZ5k6Q+pQUGX79XwYytOvGXS/BwwDALhLc="
);

// MT5 Data File settings
const MT5_TERMINAL_PATH =
  process.env.MT5_PATH || "C:\\Program Files\\MetaTrader 5";
const SIGNAL_FILE = "signal.txt";

// Add this function at the top with the other imports
const writeFileWithRetry = async (
  filePath,
  data,
  maxRetries = 5,
  delay = 1000
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      fs.writeFileSync(filePath, data);
      return true;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries} - Waiting ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
};

// Replace the writeSignalToMT5 function with this:
const writeSignalToMT5 = async (signal) => {
  try {
    const signalPath = path.join(
      MT5_TERMINAL_PATH,
      "MQL5",
      "Files",
      SIGNAL_FILE
    );
    const signalData = `${signal}\n${Math.floor(Date.now() / 1000)}\n`;

    console.log("\n📝 Preparing to write signal:");
    console.log("📍 Signal path:", signalPath);
    console.log("📄 Signal content:", signal);
    console.log("⏰ Timestamp:", Math.floor(Date.now() / 1000));

    // Create MQL5/Files directory if it doesn't exist
    const dirPath = path.join(MT5_TERMINAL_PATH, "MQL5", "Files");
    if (!fs.existsSync(dirPath)) {
      console.log("📁 Creating directory:", dirPath);
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Try to write with retry
    console.log("✍️ Attempting to write signal file...");
    const success = await writeFileWithRetry(signalPath, signalData);

    if (success) {
      console.log("✅ Signal written to MT5 successfully");
      // Verify file was written
      if (fs.existsSync(signalPath)) {
        const stats = fs.statSync(signalPath);
        console.log("📊 File details:");
        console.log("- Size:", stats.size, "bytes");
        console.log("- Created:", stats.birthtime);
        console.log("- Modified:", stats.mtime);

        // Read back the file to verify content
        const content = fs.readFileSync(signalPath, "utf8");
        console.log("📄 File content verification:");
        console.log(content);
      }
    } else {
      console.error("❌ Failed to write signal after multiple retries");
    }
  } catch (error) {
    console.error("\n❌ Error writing signal:");
    console.error("- Message:", error.message);
    console.error("- Code:", error.code);
    console.error("- Stack:", error.stack);

    console.log("\n⚠️ Troubleshooting tips:");
    console.log("1. MT5 Path exists?", fs.existsSync(MT5_TERMINAL_PATH));
    console.log(
      "2. Files directory exists?",
      fs.existsSync(path.join(MT5_TERMINAL_PATH, "MQL5", "Files"))
    );
    console.log("3. Write permissions?", "Try running as administrator");
    console.log("4. MT5 Terminal Path:", MT5_TERMINAL_PATH);
  }
};

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: "+447438139239",
    password: async () =>
      await input.text("Enter your 2FA password (if any): "),
    phoneCode: async () => await input.text("Enter the code you received: "),
    onError: (err) => console.log("Error:", err),
  });

  console.log("✅ Logged in successfully!");

  // Try to get the user by username
  const group = await client.getEntity("Saqlain666");

  let isWaitingForSignal = false;
  let currentSignal = "";

  // Function to check if message contains price levels
  const containsPriceLevels = (text) => {
    return (
      (text.includes("@") || text.includes("sl") || text.includes("tp")) &&
      text.match(/\d{4}/) // Contains at least one 4-digit number
    );
  };

  // Listen to new messages
  client.addEventHandler(async (event) => {
    try {
      const message = event.message;
      const messageText = message.message.toLowerCase();

      // Log every message received
      console.log("\n📨 Received message:", message.message);
      console.log("⏰ Time:", new Date().toLocaleTimeString());

      // Safely get sender info
      let senderInfo = "Unknown";
      if (message.sender) {
        senderInfo =
          message.sender.username ||
          message.sender.firstName ||
          message.sender.id ||
          "Unknown";
      }
      console.log("👤 From:", senderInfo);

      // Check for the trigger message
      if (
        messageText.includes("lets scalping") &&
        (messageText.includes("buy gold") || messageText.includes("sell gold"))
      ) {
        isWaitingForSignal = true;
        const direction = messageText.includes("buy") ? "BUY" : "SELL";
        console.log("\n🚨 TRIGGER DETECTED!");
        console.log("📈 Direction:", direction);
        console.log("⏰ Time:", new Date().toLocaleTimeString());
        console.log("📝 Message:", message.message);
        console.log("⚡ Status: Waiting for detailed signal...");

        process.stdout.write("\x07");
      }
      // Check for the detailed signal message
      else if (isWaitingForSignal) {
        const isBuySignal = messageText.includes("buy");
        const isSellSignal = messageText.includes("sell");

        console.log("\n🔍 Analyzing potential signal:");
        console.log("- Is Buy Signal:", isBuySignal);
        console.log("- Is Sell Signal:", isSellSignal);
        console.log(
          "- Contains Price Levels:",
          containsPriceLevels(messageText)
        );

        if ((isBuySignal || isSellSignal) && containsPriceLevels(messageText)) {
          console.log("\n💹 VALID SIGNAL DETECTED!");
          console.log("⏰ Time:", new Date().toLocaleTimeString());
          console.log("📈 Type:", isBuySignal ? "BUY" : "SELL");
          console.log("📝 Signal Details:", message.message);

          // Parse and display price levels
          const lines = message.message.split("\n");
          console.log("\n📊 Extracted Levels:");
          lines.forEach((line) => {
            if (line.includes("@")) console.log("📍 Entry:", line.trim());
            if (line.toLowerCase().includes("sl"))
              console.log("🛑 Stop Loss:", line.trim());
            if (line.toLowerCase().includes("tp"))
              console.log("🎯 Take Profit:", line.trim());
          });

          // Write signal to MT5
          console.log("\n📤 Sending signal to MT5...");
          await writeSignalToMT5(message.message);

          // Play multiple beeps
          for (let i = 0; i < 3; i++) {
            process.stdout.write("\x07");
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } else {
          console.log("ℹ️ Message ignored - Not a valid signal format");
        }
      }
    } catch (error) {
      console.error("\n❌ Error processing message:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
  }, new NewMessage({ chats: [group.id] }));

  console.log("\n👀 Listening for signals in 'Saqlain666'...");
  console.log(
    "✨ Waiting for trigger messages like 'Lets scalping buy/sell gold'"
  );
  console.log("📁 Signals will be written to MT5 file:", SIGNAL_FILE);
})();
