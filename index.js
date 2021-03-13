//todo
//add more detail to yahoo api error handling
//add function to alert on certain stock price
//add a help function
//add a start and stop function
//clean up code
//document everything including how to use and set it up on github
//deploy to heroku or raspberry pi

require('dotenv').config();
const Discord = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');

const client = new Discord.Client();

let jsonDirectory = 'fix this';
let readData = fs.readFileSync('data.json'); //Might need some error check here
let readyData = JSON.parse(readData);
let watchList = readyData.watchlist;
let settings = readyData.settings;
let goals = readyData.goals;

let re = /^[a-zA-Z]{1,4}$/;

function writeToList() {
    let writeData = JSON.stringify(readyData);

    fs.writeFile('data.json', writeData, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}

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
        })
        .catch((err) => {
            return 'error';
        }); //add more detail
}

//getStockPrice('AMC').then((price) => console.log(price));

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', (msg) => {
    if (msg.content.startsWith('!watch')) {
        let watchThis = msg.content.split('!watch ')[1];

        if (re.test(watchThis) === true) {
            watchThis = watchThis.toUpperCase();

            getStockPrice(watchThis).then((stock) => {
                if (stock == 'error' || typeof stock === 'undefined' || stock == null) {
                    msg.channel.send('Invalid stock');
                } else {
                    watchList[watchThis] = watchThis;
                    writeToList();
                    msg.channel.send(`watching ${watchThis}`);
                }
            });
        } else {
            msg.channel.send('Invalid input');
        }
    }

    if (msg.content.startsWith('!delete')) {
        let deleteThis = msg.content.split('!delete ')[1];

        if (re.test(deleteThis) === true) {
            deleteThis = deleteThis.toUpperCase();

            if (deleteThis in watchList) {
                delete watchList[deleteThis];
                writeToList();
                msg.channel.send(`deleted ${deleteThis} from watch list`);
            } else {
                msg.channel.send('Stock not in watch list');
            }
        } else {
            msg.channel.send('Invalid input');
        }
    }

    if (msg.content === '!showlist') {
        let stockList = '';

        for (stock in watchList) {
            stockList = stockList + stock + ', ';
        }

        msg.channel.send(stockList);
    }

    if (msg.content === '!startwatch') {
        for (stock in watchList) {
            let stockName = stock;
            getStockPrice(stock)
                .then((s) => msg.reply(`${stockName} : ${s}`))
                .catch((err) => console.log('fix error')); //add more detail
        }
    }
});

client.login(process.env.TOKEN);
