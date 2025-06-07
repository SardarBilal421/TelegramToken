//+------------------------------------------------------------------+
//|                                              TelegramSignalTrader.mq5 |
//|                                          Copyright 2024, Your Name     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024"
#property link      ""
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

// Input Parameters
input double LotSize = 0.01;          // Trading Lot Size
input string SignalFile = "signal.txt"; // Signal File Name
input int MaxSlippage = 30;           // Maximum Slippage in Points (higher for Gold)
input int CheckInterval = 1;          // Check interval in seconds
input string SYMBOL = "XAUUSD";       // Trading Symbol (Gold)
input double MinVolume = 0.01;        // Minimum Volume
input double MaxVolume = 5.0;         // Maximum Volume
input bool UseDefaultSL = true;       // Use Default SL if signal SL is too wide
input int DefaultSLPoints = 300;      // Default SL in points if UseDefaultSL is true

// Global Variables
datetime lastSignalTime = 0;
string lastSignal = "";
datetime lastCheckTime = 0;
bool waitingForEntry = false;
double entryLow = 0, entryHigh = 0;
string pendingOrderType = "";
double pendingSL = 0, pendingTP1 = 0, pendingTP2 = 0;

// Trade object
CTrade trade;

//+------------------------------------------------------------------+
//| Get error message                                                  |
//+------------------------------------------------------------------+
string GetErrorText(int error_code)
{
   string error_string;
   
   switch(error_code)
   {
      case 0:                         error_string="No error"; break;
      case 4301:                      error_string="Unknown symbol"; break;
      case 4302:                      error_string="Trade disabled"; break;
      case 4303:                      error_string="Market closed"; break;
      case 4304:                      error_string="Invalid price"; break;
      case 4305:                      error_string="Invalid stops"; break;
      case 4306:                      error_string="Invalid trade volume"; break;
      case 4307:                      error_string="Not enough money"; break;
      case 4308:                      error_string="Price changed"; break;
      case 4309:                      error_string="Trade timeout"; break;
      case 4310:                      error_string="Only long trades allowed"; break;
      case 4311:                      error_string="Only short trades allowed"; break;
      case 4312:                      error_string="Trade context busy"; break;
      default:                        error_string="Error "+IntegerToString(error_code); break;
   }
   
   return error_string;
}

//+------------------------------------------------------------------+
//| Expert initialization function                                      |
//+------------------------------------------------------------------+
int OnInit()
{
   // Verify we're on the correct symbol
   if(_Symbol != SYMBOL) {
      Print("❌ Error: EA must be attached to ", SYMBOL, " chart. Current symbol: ", _Symbol);
      return INIT_PARAMETERS_INCORRECT;
   }
   
   // Setup trade object
   trade.SetExpertMagicNumber(123456);
   trade.SetDeviationInPoints(MaxSlippage);
   trade.SetTypeFilling(ORDER_FILLING_FOK);
   trade.LogLevel(LOG_LEVEL_ALL);
   
   // Get symbol info
   double tickSize = SymbolInfoDouble(SYMBOL, SYMBOL_TRADE_TICK_SIZE);
   double minVol = SymbolInfoDouble(SYMBOL, SYMBOL_VOLUME_MIN);
   double maxVol = SymbolInfoDouble(SYMBOL, SYMBOL_VOLUME_MAX);
   
   Print("✅ Symbol Info for ", SYMBOL, ":");
   Print("Tick Size: ", tickSize);
   Print("Min Volume: ", minVol);
   Print("Max Volume: ", maxVol);
   Print("Points Multiplier: ", _Point);
   
   // Validate lot size
   if(LotSize < minVol || LotSize > maxVol) {
      Print("❌ Error: Invalid lot size. Allowed range: ", minVol, " to ", maxVol);
      return INIT_PARAMETERS_INCORRECT;
   }
   
   EventSetTimer(CheckInterval);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                   |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
   EventKillTimer();
}

//+------------------------------------------------------------------+
//| Timer function                                                     |
//+------------------------------------------------------------------+
void OnTimer()
{
   static datetime lastFileCheck = 0;
   datetime currentTime = TimeLocal();
   
   // Log file checking
   if(currentTime - lastFileCheck >= 5) {
      Print("\n📂 Checking signal file at: ", TimeToString(currentTime));
      string signalPath = TerminalInfoString(TERMINAL_DATA_PATH) + "\\MQL5\\Files\\" + SignalFile;
      Print("📄 Signal file path: ", signalPath);
      Print("📊 File exists: ", FileIsExist(SignalFile) ? "Yes" : "No");
      lastFileCheck = currentTime;
   }
   
   CheckSignalFile();
   if(waitingForEntry) CheckPriceAndTrade();
}

//+------------------------------------------------------------------+
//| Expert tick function                                               |
//+------------------------------------------------------------------+
void OnTick()
{
   static datetime lastTickLog = 0;
   datetime currentTime = TimeLocal();
   
   // Log tick processing every minute
   if(currentTime - lastTickLog >= 60) {
      Print("🔄 EA is running... Time: ", TimeToString(currentTime));
      Print("⚡ AutoTrading enabled: ", (bool)MQLInfoInteger(MQL_TRADE_ALLOWED) ? "Yes" : "No");
      Print("💰 Current XAUUSD Price - Bid: ", SymbolInfoDouble(SYMBOL, SYMBOL_BID), 
            " Ask: ", SymbolInfoDouble(SYMBOL, SYMBOL_ASK));
      lastTickLog = currentTime;
   }
   
   if(waitingForEntry) {
      Print("👀 Checking price for entry conditions...");
      CheckPriceAndTrade();
   }
}

//+------------------------------------------------------------------+
//| Check if price is in range and execute trade                       |
//+------------------------------------------------------------------+
void CheckPriceAndTrade()
{
   double bid = SymbolInfoDouble(SYMBOL, SYMBOL_BID);
   double ask = SymbolInfoDouble(SYMBOL, SYMBOL_ASK);
   
   // Use appropriate price based on order type
   double currentPrice = (pendingOrderType == "BUY") ? ask : bid;
   
   Print("\n📊 Price Check - Current: ", currentPrice, 
         "\nRange: ", entryLow, "-", entryHigh,
         "\nType: ", pendingOrderType,
         "\nBid: ", bid,
         "\nAsk: ", ask);
   
   if(currentPrice >= entryLow && currentPrice <= entryHigh) {
      Print("💰 Price in range! Executing trade...");
      Print("Current Price: ", currentPrice);
      Print("Entry Range: ", entryLow, "-", entryHigh);
      
      // Validate SL distance
      double slDistance = MathAbs(currentPrice - pendingSL);
      Print("🛡️ SL Distance: ", slDistance, " points");
      
      if(UseDefaultSL && slDistance > DefaultSLPoints * _Point) {
         Print("⚠️ SL distance too wide (", slDistance, "), using default SL: ", DefaultSLPoints, " points");
         pendingSL = (pendingOrderType == "BUY") ? 
                     currentPrice - (DefaultSLPoints * _Point) :
                     currentPrice + (DefaultSLPoints * _Point);
      }
      
      // Place trades at current market price
      Print("\n🎯 Attempting to place trades:");
      Print("Type: ", pendingOrderType);
      Print("Entry: ", currentPrice);
      Print("SL: ", pendingSL);
      Print("TP1: ", pendingTP1);
      Print("TP2: ", pendingTP2);
      Print("Lots: ", LotSize);
      
      PlaceMarketTrade(pendingOrderType, currentPrice, pendingSL, pendingTP1, LotSize);
      PlaceMarketTrade(pendingOrderType, currentPrice, pendingSL, pendingTP2, LotSize);
      
      // Reset waiting state
      waitingForEntry = false;
      entryLow = 0;
      entryHigh = 0;
      pendingOrderType = "";
   } else {
      Print("⏳ Price not in range yet. Waiting...");
   }
}

//+------------------------------------------------------------------+
//| Check signal file for new trades                                   |
//+------------------------------------------------------------------+
void CheckSignalFile()
{
   // Get terminal path
   string terminalPath = TerminalInfoString(TERMINAL_DATA_PATH);
   string fullPath = terminalPath + "\\MQL5\\Files\\" + SignalFile;
   
   int handle = FileOpen(SignalFile, FILE_READ|FILE_TXT|FILE_ANSI);
   if(handle == INVALID_HANDLE) {
      int error = GetLastError();
      if(error != ERR_FILE_NOT_EXIST) {  // Don't log if file simply doesn't exist
         Print("❌ Failed to open signal file. Error code: ", error, 
               " Description: ", GetErrorText(error));
         Print("📂 Full path tried: ", fullPath);
      }
      return;
   }
   
   Print("✅ Signal file opened successfully");
   
   string signal = "";
   datetime signalTime = 0;
   
   while(!FileIsEnding(handle)) {
      signal = FileReadString(handle);
      signalTime = (datetime)StringToInteger(FileReadString(handle));
   }
   
   FileClose(handle);
   
   if(StringLen(signal) > 0) {
      Print("📄 File content read:");
      Print("Signal: ", signal);
      Print("Time: ", TimeToString(signalTime));
      
      if(signalTime > lastSignalTime) {
         Print("🆕 New signal detected! Processing...");
         lastSignalTime = signalTime;
         ProcessSignal(signal);
      } else {
         Print("ℹ️ Signal ignored - Already processed or old signal");
         Print("Current signal time: ", TimeToString(signalTime));
         Print("Last processed time: ", TimeToString(lastSignalTime));
      }
   }
}

//+------------------------------------------------------------------+
//| Process the trading signal                                         |
//+------------------------------------------------------------------+
void ProcessSignal(string signal) {
   if(signal == lastSignal) return;
   lastSignal = signal;
   
   Print("📊 Processing new signal: ", signal);
   
   string type = "";
   double entryStart = 0, entryEnd = 0, sl = 0, tp1 = 0, tp2 = 0;
   
   if(ParseSignal(signal, type, entryStart, entryEnd, sl, tp1, tp2)) {
      Print("✅ Signal parsed successfully:");
      Print("Type: ", type);
      Print("Entry Range: ", entryStart, "-", entryEnd);
      Print("SL: ", sl);
      Print("TP1: ", tp1, " TP2: ", tp2);
      
      // Validate price levels
      double currentPrice = SymbolInfoDouble(SYMBOL, SYMBOL_BID);
      if(MathAbs(currentPrice - entryStart) > 1000 * _Point || 
         MathAbs(currentPrice - entryEnd) > 1000 * _Point) {
         Print("❌ Error: Entry prices too far from current price");
         return;
      }
      
      waitingForEntry = true;
      entryLow = MathMin(entryStart, entryEnd);
      entryHigh = MathMax(entryStart, entryEnd);
      pendingOrderType = type;
      pendingSL = sl;
      pendingTP1 = tp1;
      pendingTP2 = tp2;
      
      Print("👀 Waiting for price to enter range: ", entryLow, "-", entryHigh);
   } else {
      Print("❌ Failed to parse signal");
   }
}

//+------------------------------------------------------------------+
//| Parse the signal text into trade components                        |
//+------------------------------------------------------------------+
bool ParseSignal(string signal, string &type, double &entryStart, double &entryEnd, 
                double &sl, double &tp1, double &tp2) {
   string signalLower = StringToLower(signal);
   
   // Only process XAUUSD/Gold signals
   if(StringFind(signalLower, "gold") < 0) {
      Print("❌ Signal not for Gold, ignoring");
      return false;
   }
   
   if(StringFind(signalLower, "buy") >= 0) type = "BUY";
   else if(StringFind(signalLower, "sell") >= 0) type = "SELL";
   else return false;
   
   int entryPos = StringFind(signal, "@");
   if(entryPos >= 0) {
      string entryStr = StringSubstr(signal, entryPos + 1);
      string entries[];
      StringSplit(entryStr, '-', entries);
      if(ArraySize(entries) >= 2) {
         entryStart = StringToDouble(entries[0]);
         entryEnd = StringToDouble(entries[1]);
      }
   }
   
   int slPos = StringFind(signalLower, "sl :");
   if(slPos >= 0) {
      string slStr = StringSubstr(signal, slPos + 4, 6);
      sl = StringToDouble(slStr);
   }
   
   int tp1Pos = StringFind(signalLower, "tp1 :");
   if(tp1Pos >= 0) {
      string tp1Str = StringSubstr(signal, tp1Pos + 5, 6);
      tp1 = StringToDouble(tp1Str);
   }
   
   int tp2Pos = StringFind(signalLower, "tp2 :");
   if(tp2Pos >= 0) {
      string tp2Str = StringSubstr(signal, tp2Pos + 5, 6);
      tp2 = StringToDouble(tp2Str);
   }
   
   return (entryStart > 0 && entryEnd > 0 && sl > 0 && tp1 > 0 && tp2 > 0);
}

//+------------------------------------------------------------------+
//| Place a market trade with the given parameters                     |
//+------------------------------------------------------------------+
void PlaceMarketTrade(string type, double price, double sl, double tp, double lots)
{
   Print("🔄 Sending trade request:");
   Print("Symbol: ", SYMBOL);
   Print("Volume: ", DoubleToString(lots, 2));
   Print("Type: ", type);
   Print("Price: ", DoubleToString(price, 2));
   Print("SL: ", DoubleToString(sl, 2));
   Print("TP: ", DoubleToString(tp, 2));
   Print("Deviation: ", MaxSlippage);
   
   bool result = false;
   
   if(type == "BUY") {
      result = trade.Buy(lots, SYMBOL, price, sl, tp, "Telegram Signal");
   } else if(type == "SELL") {
      result = trade.Sell(lots, SYMBOL, price, sl, tp, "Telegram Signal");
   }
   
   if(result) {
      Print("✅ Order placed successfully!");
      Print("🔢 Order ticket: ", trade.ResultOrder());
      Print("💰 Entry Price: ", DoubleToString(trade.ResultPrice(), 2));
      Print("📊 Volume: ", DoubleToString(trade.ResultVolume(), 2));
   } else {
      Print("❌ Order failed with error code: ", trade.ResultRetcode());
      Print("Error description: ", GetErrorText(trade.ResultRetcode()));
      Print("Comment: ", trade.ResultComment());
   }
} 