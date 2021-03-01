// resquests data from the Binance API and uses it to create the ranking object

// keys for the binance api
require('dotenv').config;
const ccxt = require('ccxt');
// object that stores the volume of each market upon request
const volumeInfo = {};
// list that implements a ranking which is updated every time a request is made to the server
const ranking = [];
// set to true if volume data has already been fetched by the server at least once
let masterBool = false;
// set to true if the ranking has already been created
let servantBool = false;


const exchangeId = 'binance'
    , exchangeClass = ccxt[exchangeId]
    , binance = new exchangeClass({
        'apiKey': process.env.API_KEY,
        'secret': process.env.API_SECRET
    });



const getVolumes = async () => {
    const tickers = await binance.fetchTickers();
    let count = 0;
    let tempVolume, tempPrice;
    if (masterBool) {
        for (const [key, value] of Object.entries(tickers)) {
            if (value.baseVolume === 0 || volumeInfo[[key]].volumes[0] === 0) {
                count++;
                continue;
            }
            tempVolume = volumeInfo[[key]].volumes[0];
            tempPrice = volumeInfo[[key]]['closing prices'][0];
            if (value.baseVolume / tempVolume < 2) {
                volumeInfo[[key]] = {
                    'volumes': [value.baseVolume, tempVolume],
                    'pump index': [value.baseVolume / tempVolume],
                    'closing prices': [value.close, tempPrice]
                };
            }
            count++;
        }
    } else {
        for (const [key, value] of Object.entries(tickers)) {
            volumeInfo[[key]] = {
                'volumes': [value.baseVolume, 0],
                'pump index': [0],
                'closing prices': [value.close, 0]
            };
            count++;
        }
        masterBool = true;
    }
}


const getRanking = async () => {

    await binance.loadMarkets();
    await getVolumes();
    const alertArray = [];

    const tempArray = [];
    for (let property in volumeInfo) {
        tempArray.push({ [property]: volumeInfo[property] });
    }
    tempArray.sort((a, b) => (a[Object.keys(a)[0]]['pump index'] < b[Object.keys(b)[0]]['pump index']) ? 1 : ((b[Object.keys(b)[0]]['pump index'] < a[Object.keys(a)[0]]['pump index']) ? -1 : 0));

    if (servantBool) {
        let tempIndex = 0;
        for (let i = 0; i < 30; i++) {
            for (let j = tempIndex; j < 30; j++) {
                if (ranking[i][Object.keys(ranking[i])[0]]['pump index'] < tempArray[j][Object.keys(tempArray[j])[0]]['pump index']) {
                    ranking.splice(i, 0, tempArray[j]);
                    ranking.pop();

                    if (tempArray[j][Object.keys(tempArray[j])[0]]['closing prices'][0] != tempArray[j][Object.keys(tempArray[j])[0]]['closing prices'][1] && ranking[i][Object.keys(ranking[i])[0]]['pump index'] > 1.1) {
                        alertArray.push({
                            'pair': Object.keys(tempArray[j])[0],
                            'pump index': ((ranking[i][Object.keys(ranking[i])[0]]['pump index'] - 1) * 100).toFixed(2).toString() + '%',
                            'price increase': (((tempArray[j][Object.keys(tempArray[j])[0]]['closing prices'][0] / tempArray[j][Object.keys(tempArray[j])[0]]['closing prices'][1]) - 1) * 100).toFixed(2).toString()
                        });
                    }

                    tempIndex = j + 1;
                    break;
                }
            }
            if (tempIndex == 29) break;
        }
    } else {
        for (let i = 0; i < 30; i++) {
            ranking.push(tempArray[i]);
        }
        servantBool = true;
    }

    return [ranking, alertArray];
}

module.exports = {
    getRanking
};
