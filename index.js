require('dotenv').config();
const Discord = require('discord.js');
const fetch = require('node-fetch');
const client = new Discord.Client();

function getStockPrice(stockSymbol) {
    return fetch(`https://yahoo-finance-low-latency.p.rapidapi.com/v11/finance/quoteSummary/${stockSymbol}?modules=price&region=US&lang=en`, {
        method: 'GET',
        headers: {
            'x-rapidapi-key': process.env.APIKEY,
            'x-rapidapi-host': 'yahoo-finance-low-latency.p.rapidapi.com',
        },
    })
        .then((res) => {
            return res.json();
        })
        .then((json) => {
            return json.quoteSummary.result[0].price.regularMarketPrice.raw;
        });
}

getStockPrice('AMC').then((price) => console.log(price));

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', (msg) => {
    if (msg.content === 'watch') {
        getStockPrice('AMC').then((price) => msg.reply(price));
    }
});

client.login(process.env.TOKEN);
