import { formatUnits } from "ethers";
import addresses from "../../contracts/addresses.json";

// Define mainnet addresses with known mappings
const MAINNET_ADDRESSES: { [key: string]: string } = {
    USDT: "ethereum:0xdac17f958d2ee523a2206206994597c13d831ec7",
    WBASE: "base:0x4200000000000000000000000000000000000006", // WETH
    WBTC: "ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    XRP: "binance:0x1d2f0da169ceb9fc7a1b00a3404fddef70000000",
    UNI: "ethereum:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    LINK: "ethereum:0x514910771af9ca656af840dff83e8264ecf986ca",
    DOGE: "binance:0xba2ae424d960c26247dd6c32edc70b295c744c43",
    SHIB: "ethereum:0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    PEPE: "ethereum:0x6982508145454ce325ddbe47a25d4ec3d2311933",
    FLOKI: "ethereum:0x43f11c02439e2736800433b4594994bd43cd066d"
};

// Create mapping from Sepolia to mainnet addresses
export const TOKEN_PRICE_MAPPING = Object.entries(addresses.tokens).reduce((acc, [symbol, address]) => {
    if (MAINNET_ADDRESSES[symbol]) {
        acc[address.toLowerCase()] = MAINNET_ADDRESSES[symbol];
    }
    return acc;
}, {} as { [key: string]: string });

interface TokenPriceResponse {
    coins: {
        [key: string]: {
            symbol: string;
            prices: Array<{
                timestamp: number;
                price: number;
                confidence: number;
            }>;
        };
    };
}


export const fetchTokenPrices = async (tokenAddresses: string[], amounts: bigint[], days: number, decimals = 18) => {
    // Get timestamps for last 7 days at midnight UTC
    const now = Math.floor(Date.now() / 1000);
    const dayInSeconds = 86400;
    const timestamps = Array.from({ length: days }, (_, i) => {
        const date = new Date((now - (days - i) * dayInSeconds) * 1000);
        date.setUTCHours(0, 0, 0, 0);
        return Math.floor(date.getTime() / 1000);
    });

    // Prepare coins parameter
    const coinsParam: Record<string, number[]> = {};
    tokenAddresses.forEach(addr => {
        const mainnetAddr = TOKEN_PRICE_MAPPING[addr.toLowerCase()];
        if (mainnetAddr) {
            coinsParam[mainnetAddr] = timestamps;
        }
    });

    try {
        const baseUrl = 'https://coins.llama.fi/batchHistorical';
        const coinsStr = encodeURIComponent(JSON.stringify(coinsParam));
        const url = `${baseUrl}?coins=${coinsStr}&searchWidth=12h`; // Increased search width

        console.log("Fetching prices from URL:", url);

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch prices');

        const data: TokenPriceResponse = await response.json();

        // Process into time series with proper calculations
        const timeSeriesData = timestamps.map(timestamp => {
            let totalValueUSD = 0;

            tokenAddresses.forEach((addr, index) => {
                const mainnetAddr = TOKEN_PRICE_MAPPING[addr.toLowerCase()];
                if (mainnetAddr && data.coins[mainnetAddr]) {
                    const pricePoint = data.coins[mainnetAddr].prices
                        .sort((a, b) => Math.abs(a.timestamp - timestamp) - Math.abs(b.timestamp - timestamp))
                    [0];

                    if (pricePoint) {
                        const tokenAmount = Number(formatUnits(amounts[index], decimals));
                        const valueUSD = tokenAmount * pricePoint.price;
                        totalValueUSD += valueUSD;
                    }
                }
            });

            return {
                time: timestamp,
                value: totalValueUSD
            };
        });

        console.log("Final time series data:", timeSeriesData);
        return timeSeriesData;

    } catch (error) {
        console.error('Error fetching token prices:', error);
        return null;
    }
};

// Helper to format the chart data for display
export const formatChartValue = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};