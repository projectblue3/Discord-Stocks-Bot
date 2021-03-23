//todo
//add more detail to yahoo api error handling
//clean up code
//document everything including how to use and set it up on github
//deploy to heroku or raspberry pi

require('dotenv').config();
const Discord = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');

const client = new Discord.Client();

let helpTxt = fs.readFileSync('help.txt'); //Might need error check
let readData = fs.readFileSync('storage.json'); //Might need some error check
let readyData = JSON.parse(readData);

let watchList = readyData.watchlist;
let settings = readyData.settings;

let re = /^[a-zA-Z]{1,4}$/;
let nre = /^\d*\.?\d+$/;

function writeToList() {
    let writeData = JSON.stringify(readyData);

    fs.writeFile('storage.json', writeData, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}

async function comparePrices() {
    let stockArr = [];

    for (stock in watchList) {
        let stockName = stock;

        await getStockPrice(stock).then((s) => {
            if (s > watchList[stockName].goal) {
                stockArr.push(stockName);
            }
        });
    }

    return stockArr;
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
            console.log(json); //need to grab this for quota errors
            return json.quoteSummary.result[0].price.regularMarketPrice.raw;
        })
        .catch((err) => {
            return 'error';
        }); //add more detail
}

getStockPrice('AMC');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', (msg) => {
    //watch
    if (msg.content.startsWith('!watch')) {
        let watchThis = msg.content.split('!watch ')[1];

        if (re.test(watchThis) === true) {
            watchThis = watchThis.toUpperCase();

            getStockPrice(watchThis).then((stock) => {
                if (stock == 'error' || typeof stock === 'undefined' || stock == null) {
                    msg.channel.send('Invalid stock');
                } else {
                    if (watchThis in watchList) {
                        msg.channel.send('Already in watchlist');
                    } else {
                        watchList[watchThis] = { name: watchThis, goal: 0 };
                        writeToList();
                        msg.channel.send(`watching ${watchThis}`);
                    }
                }
            });
        } else {
            msg.channel.send('Invalid input');
        }
    }

    //delete
    if (msg.content.startsWith('!delete')) {
        let deleteThis = msg.content.split('!delete ')[1];

        if (re.test(deleteThis) === true) {
            deleteThis = deleteThis.toUpperCase();

            if (deleteThis in watchList) {
                delete watchList[deleteThis];
                writeToList();
                msg.channel.send(`deleted ${deleteThis} from watch list`);
            } else {
                msg.channel.send('Stock not in watchlist');
            }
        } else {
            msg.channel.send('Invalid input');
        }
    }

    //setgoal
    if (msg.content.startsWith('!setgoal')) {
        let fullText = msg.content.split(' ');
        let goalStock = fullText[1];
        let goalPrice = fullText[2];

        if (re.test(goalStock) === true && nre.test(goalPrice) === true) {
            goalStock = goalStock.toUpperCase();
            goalPrice = parseFloat(goalPrice);

            if (goalStock in watchList) {
                watchList[goalStock].goal = goalPrice;
                writeToList();
                msg.channel.send(`Goal price of \$${goalPrice} for ${goalStock.toUpperCase()} had been set`);
            } else {
                msg.channel.send(`Stock not in watchlist`);
            }
        } else {
            msg.channel.send('Input invalid');
        }
    }

    //showlist
    if (msg.content === '!showlist') {
        let stockList = '';

        for (stock in watchList) {
            stockList = stockList + stock + ', ';
        }

        msg.channel.send(stockList);
    }

    //showprices
    if (msg.content === '!showprices') {
        for (stock in watchList) {
            let stockName = stock;
            getStockPrice(stock).then((s) => msg.reply(`${stockName}: \$${s} Goal: \$${watchList[stockName].goal}`));
        }
    }

    //startwatch
    if (msg.content === '!startgoalwatch') {
        goalTimer = setInterval(function () {
            comparePrices().then((result) => {
                msg.channel.send(result);
            });
        }, settings.goalTime);
    }

    //endwatch
    if (msg.content === '!endgoalwatch') {
        clearInterval(goalTimer);
    }

    //startautolist
    if (msg.content === '!startautolist') {
        //repeating code, fix this maybe
        listTimer = setInterval(function () {
            for (stock in watchList) {
                let stockName = stock;
                getStockPrice(stock).then((s) => msg.reply(`${stockName}: \$${s} Goal: \$${watchList[stockName].goal}`));
            }
        }, settings.listTime);
    }

    //endautolist
    if (msg.content === '!endautolist') {
        clearInterval(listTimer);
    }

    //setgoaltime
    if (msg.content.startsWith('!settimegoal')) {
        let time = msg.content.split('!settimegoal ')[1];
        if (nre.test(time) === true) {
            time = time * 60000;
            settings.goalTime = time;
            writeToList();
            msg.channel.send(`Updated goal time to ${time / 60000} Minutes`);
        } else {
            msg.channel.send('Invalid time');
        }
    }

    //setgoallist
    if (msg.content.startsWith('!settimelist')) {
        let time = msg.content.split('!settimelist ')[1];
        if (nre.test(time) === true) {
            time = time * 60000;
            settings.listTime = time;
            writeToList();
            msg.channel.send(`Updated list time to ${time / 60000} Minutes`);
        } else {
            msg.channel.send('Invalid time');
        }
    }

    //help
    if (msg.content === '!help') {
        msg.channel.send(helpTxt.toString());
    }
});

client.login(process.env.TOKEN);
