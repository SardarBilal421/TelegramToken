const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input"); // install with: npm install input
const config = require("./config");

const apiId = 22610695;
const apiHash = "a8d2da237cb629133af4a026a09355d7";
const stringSession = new StringSession(
  "1BAAOMTQ5LjE1NC4xNjcuOTEAUASPpxZd2/drCHXtURBaogx2Qy/g4PAY9gq8aIs7rYrlFijMZQ8leF6SgYNVX+Qt7u0uUNpf8AVqKpHMzs16pXW2XtToeZir6xgP1PWPMyKeJP6rvTuJ4fnKkn5P1iaDoGg+JuDE0suyAXX6vmaiXcE+/x1ZICqPNrR9dAkCeL7/XhRVd+djb4DwEBrv0FU0zz3R7S006u6ujhxVyi3g+LwCNvYiozOf8cKuWA/rspAxluXr7zdzJycE/ZC67dm3wkgn3jpyaLW0LIjvU7cD7D67kmfGZak4i6AaXFc5xrhIucOUbTaVwHZ5k6Q+pQUGX79XwYytOvGXS/BwwDALhLc="
); // <-- leave empty first time
// const stringSession = new StringSession(""); // <-- leave empty first time

(async () => {
  console.log("\n📊 Configuration:");
  console.log("API ID:", apiId);
  console.log("API Hash:", apiHash);

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
  console.log("💾 Your session string (save it!):", client.session.save());

  // Try to get the user by username
  const group = await client.getEntity("KOLscope");

  let isWaitingForSignal = false;
  let currentSignal = "";

  // Function to check if message contains price levels
  const containsPriceLevels = (text) => {
    return (
      (text.includes("@") || text.includes("sl") || text.includes("tp")) &&
      text.match(/\d{4}/) // Contains at least one 4-digit number
    );
  };

  // Function to check if message contains management instructions
  const containsManagementInstructions = (text) => {
    return (
      text.includes("enter slowly") ||
      text.includes("proper money management") ||
      text.includes("do not rush")
    );
  };

  // Function to send message
  const sendMessage = async (message) => {
    try {
      await client.sendMessage(group, { message });
      console.log("✅ Message sent successfully!");
    } catch (error) {
      console.error("❌ Error sending message:", error.message);
    }
  };

  // Listen to new messages
  client.addEventHandler(async (event) => {
    const message = event.message;
    const messageText = message.message.toLowerCase();

    console.log("==================>>>>>>>>>>>>>>>>>>>>>>>>>>>>", messageText);

    // // Check for the trigger message
    // if (
    //   messageText.includes("lets scalping") &&
    //   (messageText.includes("buy gold") || messageText.includes("sell gold"))
    // ) {
    //   isWaitingForSignal = true;
    //   const direction = messageText.includes("buy") ? "BUY" : "SELL";
    //   console.log(
    //     "\n🚨 ALERT: Trigger message detected! Waiting for trade signal..."
    //   );
    //   console.log("📈 Direction:", direction);
    //   console.log("⏰ Time:", new Date().toLocaleTimeString());
    //   console.log("📝 Message:", message.message);

    //   // Play a beep sound
    //   process.stdout.write("\x07");
    // }
    // // Check for the detailed signal message
    // else if (isWaitingForSignal) {
    //   const isBuySignal = messageText.includes("buy");
    //   const isSellSignal = messageText.includes("sell");

    //   if ((isBuySignal || isSellSignal) && containsPriceLevels(messageText)) {
    //     console.log("\n💹 TRADE SIGNAL DETAILS RECEIVED!");
    //     console.log("⏰ Time:", new Date().toLocaleTimeString());
    //     console.log("📈 Type:", isBuySignal ? "BUY" : "SELL");
    //     console.log("📝 Signal Details:", message.message);

    //     // Store the complete signal
    //     currentSignal = message.message;

    //     // Extract and display price levels
    //     const lines = message.message.split("\n");
    //     lines.forEach((line) => {
    //       if (line.includes("@")) console.log("📍 Entry:", line.trim());
    //       if (line.toLowerCase().includes("sl"))
    //         console.log("🛑 Stop Loss:", line.trim());
    //       if (line.toLowerCase().includes("tp"))
    //         console.log("🎯 Take Profit:", line.trim());
    //     });

    //     // Play multiple beeps
    //     for (let i = 0; i < 3; i++) {
    //       process.stdout.write("\x07");
    //       await new Promise((resolve) => setTimeout(resolve, 500));
    //     }
    //   }
    //   // Check for management instructions
    //   else if (containsManagementInstructions(messageText)) {
    //     console.log("\n⚠️ Management Instructions:");
    //     console.log("📝", message.message);
    //     console.log("-------------------");
    //     isWaitingForSignal = false; // Reset after receiving management instructions
    //   }
    // }
  }, new NewMessage({ chats: [group.id] }));

  console.log("👀 Listening for signals in 'Saqlain666'...");
  console.log(
    "✨ Waiting for trigger messages like 'Lets scalping buy/sell gold'"
  );
})();
