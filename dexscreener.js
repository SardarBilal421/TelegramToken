const axios = require("axios");

// Supported chains and their address formats
const SUPPORTED_CHAINS = {
  ethereum: {
    id: "ethereum",
    addressRegex: /0x[a-fA-F0-9]{40}/i,
    name: "Ethereum",
    dexscreenerId: "ethereum",
  },
  bsc: {
    id: "bsc",
    addressRegex: /0x[a-fA-F0-9]{40}/i,
    name: "BSC",
    dexscreenerId: "bsc",
  },
  solana: {
    id: "solana",
    addressRegex: /[1-9A-HJ-NP-Za-km-z]{32,44}/,
    name: "Solana",
    dexscreenerId: "solana",
  },
  polygon: {
    id: "polygon",
    addressRegex: /0x[a-fA-F0-9]{40}/i,
    name: "Polygon",
    dexscreenerId: "polygon",
  },
  arbitrum: {
    id: "arbitrum",
    addressRegex: /0x[a-fA-F0-9]{40}/i,
    name: "Arbitrum",
    dexscreenerId: "arbitrum",
  },
  avalanche: {
    id: "avalanche",
    addressRegex: /0x[a-fA-F0-9]{40}/i,
    name: "Avalanche",
    dexscreenerId: "avalanche",
  },
};

// Function to detect chain from message context
function detectChainFromMessage(messageText) {
  const lowerText = messageText.toLowerCase();

  // Chain detection mapping
  const chainKeywords = {
    solana: ["solana", "sol ", "sol.", "sol,"],
    bsc: ["bsc", "binance", "bnb"],
    polygon: ["polygon", "matic"],
    arbitrum: ["arbitrum", "arb"],
    avalanche: ["avalanche", "avax"],
    ethereum: ["ethereum", "eth ", "eth.", "eth,"],
  };

  for (const [chain, keywords] of Object.entries(chainKeywords)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return chain;
    }
  }

  // Try to detect chain from address format
  for (const [chain, info] of Object.entries(SUPPORTED_CHAINS)) {
    const matches = messageText.match(info.addressRegex);
    if (matches) {
      return chain;
    }
  }

  return "ethereum"; // default to ethereum
}

// Enhanced token address extraction
function extractTokenAddresses(messageText, chainId = null) {
  const addresses = [];
  const targetChains = chainId
    ? [SUPPORTED_CHAINS[chainId]]
    : Object.values(SUPPORTED_CHAINS);

  targetChains.forEach((chain) => {
    const matches = messageText.match(new RegExp(chain.addressRegex, "g"));
    if (matches) {
      matches.forEach((address) => {
        // Clean the address (remove spaces, normalize case for non-Solana chains)
        const cleanAddress =
          chain.id === "solana" ? address.trim() : address.trim().toLowerCase();

        addresses.push({
          address: cleanAddress,
          chain: chain.id,
        });
      });
    }
  });

  return addresses;
}

// Function to get token pair data by chain and pair address
async function getPairData(chainId, pairAddress) {
  try {
    const chain = SUPPORTED_CHAINS[chainId];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/pairs/${chain.dexscreenerId}/${pairAddress}`,
      {
        timeout: 10000,
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching pair data:", error.message);
    return null;
  }
}

// Function to search for pairs
async function searchPairs(query) {
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(
        query
      )}`,
      {
        timeout: 10000,
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error searching pairs:", error.message);
    return null;
  }
}

// Function to get all pairs for a token with retries
async function getTokenPairs(chainId, tokenAddress, retries = 3) {
  const chain = SUPPORTED_CHAINS[chainId];
  if (!chain) {
    return {
      status: "error",
      message: `Unsupported chain: ${chainId}`,
      pairs: [],
    };
  }

  // Clean and validate address
  const cleanAddress =
    chainId === "solana" ? tokenAddress : tokenAddress.toLowerCase();
  if (!cleanAddress.match(chain.addressRegex)) {
    return {
      status: "error",
      message: `Invalid token address format for chain ${chainId}`,
      pairs: [],
    };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Add delay between retries
      if (attempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }

      // Use the correct API endpoint format
      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/search/?q=${cleanAddress}`,
        {
          timeout: 10000,
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0",
          },
        }
      );

      if (!response.data || !response.data.pairs) {
        console.log(
          `Attempt ${attempt}: No pairs found for token ${cleanAddress} on ${chainId}`
        );
        if (attempt === retries) {
          return {
            status: "not_found",
            message: `No pairs found for token ${cleanAddress} on ${chainId}. This might be a new token.`,
            pairs: [],
          };
        }
        continue;
      }

      // Filter pairs for the specific chain and token
      const relevantPairs = response.data.pairs.filter((pair) => {
        const isCorrectChain = pair.chainId === chain.dexscreenerId;
        const isBaseToken =
          pair.baseToken.address.toLowerCase() === cleanAddress.toLowerCase();
        const isQuoteToken =
          pair.quoteToken.address.toLowerCase() === cleanAddress.toLowerCase();
        return isCorrectChain && (isBaseToken || isQuoteToken);
      });

      if (relevantPairs.length === 0) {
        if (attempt === retries) {
          return {
            status: "not_found",
            message: `No pairs found for token ${cleanAddress} on ${chainId}. This might be a new token.`,
            pairs: [],
          };
        }
        continue;
      }

      return {
        status: "success",
        pairs: relevantPairs,
      };
    } catch (error) {
      console.error(
        `Attempt ${attempt}: Error fetching token pairs:`,
        error.message
      );
      if (attempt === retries) {
        return {
          status: "error",
          message: error.message,
          pairs: [],
        };
      }
    }
  }
}

// Enhanced metrics calculation
function calculateAdditionalMetrics(pair) {
  const priceChange24h = parseFloat(pair.priceChange?.h24) || 0;
  const priceChange1h = parseFloat(pair.priceChange?.h1) || 0;
  const volume24h = parseFloat(pair.volume?.h24) || 0;
  const liquidity = parseFloat(pair.liquidity?.usd) || 0;

  return {
    volatility: Math.abs(priceChange24h),
    momentum:
      priceChange1h > 0 ? "Bullish" : priceChange1h < 0 ? "Bearish" : "Neutral",
    liquidityScore:
      liquidity > 100000 ? "High" : liquidity > 10000 ? "Medium" : "Low",
    volumeToLiquidity: liquidity > 0 ? (volume24h / liquidity).toFixed(2) : 0,
  };
}

// Function to get real-time token price and other metrics
async function getTokenMetrics(chainId, tokenAddress) {
  try {
    const pairs = await getTokenPairs(chainId, tokenAddress);
    if (!pairs.pairs || pairs.pairs.length === 0) {
      return {
        status: "not_found",
        message: `No pairs found for token ${tokenAddress} on ${chainId}. This might be a new token or incorrect address.`,
        chainName: SUPPORTED_CHAINS[chainId]?.name || chainId,
        timestamp: new Date().toISOString(),
      };
    }

    // Get the most liquid pair
    const mostLiquidPair = pairs.pairs.reduce((prev, current) => {
      const prevLiquidity = prev.liquidity?.usd || 0;
      const currentLiquidity = current.liquidity?.usd || 0;
      return prevLiquidity > currentLiquidity ? prev : current;
    });

    const additionalMetrics = calculateAdditionalMetrics(mostLiquidPair);

    return {
      status: "success",
      priceUsd: mostLiquidPair.priceUsd,
      priceNative: mostLiquidPair.priceNative,
      liquidity: mostLiquidPair.liquidity,
      volume24h: mostLiquidPair.volume?.h24,
      priceChange: mostLiquidPair.priceChange,
      pairAddress: mostLiquidPair.pairAddress,
      dex: mostLiquidPair.dexId,
      baseToken: mostLiquidPair.baseToken,
      quoteToken: mostLiquidPair.quoteToken,
      chainName: SUPPORTED_CHAINS[chainId]?.name || chainId,
      timestamp: new Date().toISOString(),
      ...additionalMetrics,
    };
  } catch (error) {
    console.error("Error getting token metrics:", error.message);
    return {
      status: "error",
      message: error.message,
      chainName: SUPPORTED_CHAINS[chainId]?.name || chainId,
      timestamp: new Date().toISOString(),
    };
  }
}

// Price alert thresholds
const ALERT_THRESHOLDS = {
  PRICE_CHANGE_THRESHOLD: 5, // 5% price change
  VOLUME_SPIKE_THRESHOLD: 200, // 200% volume increase
  LIQUIDITY_DROP_THRESHOLD: 20, // 20% liquidity decrease
};

// Function to check if metrics warrant an alert
function shouldAlert(previousMetrics, currentMetrics) {
  if (!previousMetrics) return false;

  const priceChange =
    ((currentMetrics.priceUsd - previousMetrics.priceUsd) /
      previousMetrics.priceUsd) *
    100;
  const volumeChange =
    ((currentMetrics.volume24h - previousMetrics.volume24h) /
      previousMetrics.volume24h) *
    100;
  const liquidityChange =
    ((currentMetrics.liquidity.usd - previousMetrics.liquidity.usd) /
      previousMetrics.liquidity.usd) *
    100;

  return {
    shouldAlert:
      Math.abs(priceChange) >= ALERT_THRESHOLDS.PRICE_CHANGE_THRESHOLD ||
      volumeChange >= ALERT_THRESHOLDS.VOLUME_SPIKE_THRESHOLD ||
      liquidityChange <= -ALERT_THRESHOLDS.LIQUIDITY_DROP_THRESHOLD,
    alerts: {
      price:
        Math.abs(priceChange) >= ALERT_THRESHOLDS.PRICE_CHANGE_THRESHOLD
          ? `Price ${priceChange > 0 ? "increased" : "decreased"} by ${Math.abs(
              priceChange
            ).toFixed(2)}%`
          : null,
      volume:
        volumeChange >= ALERT_THRESHOLDS.VOLUME_SPIKE_THRESHOLD
          ? `Volume spiked by ${volumeChange.toFixed(2)}%`
          : null,
      liquidity:
        liquidityChange <= -ALERT_THRESHOLDS.LIQUIDITY_DROP_THRESHOLD
          ? `Liquidity dropped by ${Math.abs(liquidityChange).toFixed(2)}%`
          : null,
    },
  };
}

module.exports = {
  getPairData,
  searchPairs,
  getTokenPairs,
  getTokenMetrics,
  extractTokenAddresses,
  detectChainFromMessage,
  shouldAlert,
  SUPPORTED_CHAINS,
};
