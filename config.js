module.exports = {
  // MT5 WebAPI settings
  mt5: {
    baseUrl:
      "https://mt-market-data-client-api-v1.agiliumtrade.agiliumtrade.ai",
    login: "5036717722", // Your MT5 account number
    password: "-1UrWnSo", // Your MT5 password
    server: "MetaQuotes-Demo", // Your broker's server
    api_token: "", // You'll need to get this from metaapi.cloud
  },

  // Trading settings
  trading: {
    defaultLotSize: 0.01, // Starting with minimum lot size for safety
    symbol: "XAUUSD", // Gold symbol
    riskPercentage: 1, // Conservative risk percentage
  },
};
