const axios = require("axios");
const config = require("./config");

class MT5Trader {
  constructor(customConfig = {}) {
    // Use custom config or default from config file
    const mt5Config = customConfig.mt5 || config.mt5;
    const tradingConfig = customConfig.trading || config.trading;

    this.baseUrl = mt5Config.baseUrl;
    this.login = mt5Config.login;
    this.password = mt5Config.password;
    this.server = mt5Config.server;

    this.defaultLotSize = tradingConfig.defaultLotSize;
    this.symbol = tradingConfig.symbol;
    this.riskPercentage = tradingConfig.riskPercentage;
  }

  async connect() {
    try {
      console.log("🔄 Connecting to MT5...");
      console.log(`📍 Server: ${this.server}`);
      console.log(`🔑 Login: ${this.login}`);

      const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
        login: this.login,
        password: this.password,
        server: this.server,
      });

      this.token = response.data.token;
      console.log("✅ Connected to MT5 successfully!");
      return true;
    } catch (error) {
      console.error("❌ MT5 Connection error:", error.message);
      if (error.message.includes("ECONNREFUSED")) {
        console.log("\n⚠️ Common solutions:");
        console.log("1. Make sure MT5 terminal is running");
        console.log(
          "2. Check if WebAPI is enabled in MT5 (Tools → Options → Expert Advisors → Allow WebRequest)"
        );
        console.log(
          "3. Verify the WebAPI port number matches your baseUrl port"
        );
        console.log(`4. Try accessing ${this.baseUrl} in your browser`);
      }
      return false;
    }
  }

  async placeTrade(signal) {
    try {
      // Parse the signal
      const { type, entry, sl, tp1, tp2 } = this.parseSignal(signal);

      // Place the main trade with TP1
      const mainOrder = await this.sendOrder({
        symbol: this.symbol,
        volume: this.defaultLotSize,
        type: type === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL",
        price: entry,
        sl: sl,
        tp: tp1,
      });

      // Place second trade with TP2
      const secondOrder = await this.sendOrder({
        symbol: this.symbol,
        volume: this.defaultLotSize,
        type: type === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL",
        price: entry,
        sl: sl,
        tp: tp2,
      });

      console.log("\n✅ Trades placed successfully!");
      console.log(`📊 Symbol: ${this.symbol}`);
      console.log(`💰 Lot Size: ${this.defaultLotSize}`);
      console.log(`📈 Type: ${type}`);
      console.log(`📍 Entry: ${entry}`);
      console.log(`🛑 Stop Loss: ${sl}`);
      console.log(`🎯 Take Profit 1: ${tp1}`);
      console.log(`🎯 Take Profit 2: ${tp2}`);
      console.log(`\n📈 Order 1: ${mainOrder.order}`);
      console.log(`📈 Order 2: ${secondOrder.order}`);

      return true;
    } catch (error) {
      console.error("❌ Error placing trade:", error.message);
      if (error.message.includes("Invalid price")) {
        console.log(
          "\n⚠️ Price Error: Make sure your broker accepts these price levels"
        );
      }
      return false;
    }
  }

  async sendOrder(orderParams) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/trade/order`, {
        ...orderParams,
        token: this.token,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send order: ${error.message}`);
    }
  }

  parseSignal(signal) {
    try {
      // Extract numbers from the signal text
      const numbers = signal.match(/\d+/g).map(Number);

      // Determine if it's a buy or sell signal
      const type = signal.toLowerCase().includes("buy") ? "BUY" : "SELL";

      // Parse entry, usually format is like "Buy Gold @3355-3350"
      const entryText = signal.match(/@[\d-]+/)[0];
      const entry = Number(entryText.split("-")[0].replace("@", ""));

      // Find SL and TP levels
      const sl = numbers.find((n) => signal.toLowerCase().includes(`sl :${n}`));
      const [tp1, tp2] = numbers.filter((n) =>
        signal.toLowerCase().includes(`tp${numbers.indexOf(n) + 1} :${n}`)
      );

      // Validate the parsed values
      if (!entry || !sl || !tp1 || !tp2) {
        throw new Error("Could not parse all required price levels");
      }

      return {
        type,
        entry,
        sl,
        tp1,
        tp2,
      };
    } catch (error) {
      throw new Error(`Signal parsing error: ${error.message}`);
    }
  }
}

module.exports = MT5Trader;
