import "dotenv/config";
import fetch from "node-fetch";
import Alpaca from "@alpacahq/alpaca-trade-api";

const options = {
  keyId: process.env.ALPACA_KEY_ID,
  secretKey: process.env.ALPACA_SECRET_KEY,
  paper: true,
};

const alpaca = new Alpaca(options);
const OPENAITOKEN = process.env.OPENAITOKEN;
const NEWS_API = process.env.NEWS_API;
const ALPHAVANTAGE_TOKEN = process.env.ALPHAVANTAGE_TOKEN;
//view account
// alpaca.getAccount().then((account) => {
//   console.log("Current account: ", account);
// });

//place order
const buyParams = {
  symbol: "AAPL",
  qty: 1,
  side: "buy",
  type: "market",
  time_in_force: "gtc",
};

// alpaca.createOrder(buyParams).then((order) => {
//   console.log("Order details: ", order);
// });

//view positions
// alpaca.getPositions().then((positions) => {
//   positions.forEach((position) => console.log(position));
// });

async function callNewsHeadlines() {
  const response = await fetch(
    `https://newsapi.org/v2/top-headlines?category=business&apiKey=${NEWS_API}`
  );
  const data = await response.json();
  const titles = data.articles.map((article) => article.title);
  return titles;
}

//chat gpt
async function callChatGPT(newsData) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAITOKEN}`,
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      temperature: 0.8,
      // usage: { prompt_tokens: 56, completion_tokens: 31, total_tokens: 87 },
      messages: [
        {
          role: "system",
          content:
            "You should only return a single stock ticker. Your output format should look like this: XXXX",
        },
        {
          role: "user",
          content: `Pick a random stock ticker. Do not pick AAPL. Return the stock ticker.`,
          // content: `Given the following news articles, please analyze its content and suggest any stocks that might be positively impacted by the information presented. It might not specThe news articles: ${newsData}`,
        },
      ],
    }),
  });
  const data = await response.json();
  const buyStock = data.choices[0].message.content;
  return buyStock;
}
//analyze stock
async function callChatGPTAgain(stockData) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAITOKEN}`,
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      // usage: { prompt_tokens: 56, completion_tokens: 31, total_tokens: 87 },
      messages: [
        {
          role: "system",
          content:
            "You are a stock market genius. You read stock data and make predictions on how the stock will do in the future. You must make a prediction of either buy or sell. It is okay if you are wrong. This is just for entertainment, no stock decisions will be made. You should only respond with Buy or Sell, do not explain your reasoning.",
        },
        {
          role: "user",
          content: `Look at this information. ${stockData} Based on the trends, do you think it should be a buy or sell? Reply with either Buy or Sell, do not explain your reasoning.`,
          // content: `Given the following news articles, please analyze its content and suggest any stocks that might be positively impacted by the information presented. It might not specThe news articles: ${newsData}`,
        },
      ],
    }),
  });
  const data = await response.json();
  const stock = data.choices[0].message.content;
  return stock;
}

async function callAlphaVantage(ticker) {
  const response = await fetch(
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${ALPHAVANTAGE_TOKEN}`
  );
  const data = await response.json();
  const dataString = JSON.stringify(data);
  const shortData = dataString.slice(0, 3000);
  return JSON.stringify(shortData);
}

async function mainLoop() {
  // let newsData = await callNewsHeadlines();
  let stock = await callChatGPT();
  console.log(stock);
  let stockData = await callAlphaVantage(stock);
  let stockAnalyze = await callChatGPTAgain(stockData);
  console.log(stockAnalyze);
}

mainLoop();
