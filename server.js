const express = require('express');
const app = express();
require('dotenv').config;
const getRanking = require('./api');
const twitter = require('./twit');
var PORT = process.env.PORT || 3000

let oneMinuteRanking = [];
let oneMinuteResult = [];
let fiveMinuteRanking = [];
let fiveMinuteResult = [];
let tenMinuteRanking = [];
let tenMinuteResult = [];

// test comment

const tweeted = (err, data, response) => {
    if (err) console.log('Something went wrong\n', err);
    else console.log('It worked!');
}


const createTweet = (pair, pumpIndex, priceDifference, minutes, s) => {
  if (priceDifference > 0) {
    return 'PUMP ALERT: ' + '$' + pair.split('/')[0] +' / ' + '$' + pair.split('/')[1] + ' volume has increased by ' + pumpIndex + ' in the past ' + minutes + 'minute' + s + '. Price is up ' + priceDifference + '%.';
  }
  return 'DUMP ALERT: ' + '$' + pair.split('/')[0] + ' / ' + '$' + pair.split('/')[1] + ' volume has increased by ' + pumpIndex + ' in the past ' + minutes + 'minute' + s + '. Price is down ' + priceDifference + '%.';
}


setInterval(async () => {
    const rankingPumpOne = await getRanking['getRanking']();
    oneMinuteRanking = rankingPumpOne[0];
    if (rankingPumpOne[1].length > 0) {
      oneMinuteResult.push(rankingPumpOne[1]);
      const pairObj = oneMinuteResult[oneMinuteResult.length - 1][0];
      const tweet =  {
          status: createTweet(pairObj.pair, pairObj['pump index'], pairObj['price increase'], '', '')
        }
        twitter.post('statuses/update', tweet, tweeted);
        if (oneMinuteResult.length > 10) oneMinuteResult.splice(0, 1);
    }
}, 60 * 1000);

setInterval(async () => {
    const rankingPumpFive = await getRanking['getRanking']();
    fiveMinuteRanking = rankingPumpFive[0];
    if (rankingPumpFive[1].length > 0) {
        fiveMinuteResult.push(rankingPumpFive[1]);
        const pairObj = fiveMinuteResult[fiveMinuteResult.length - 1][0];
        const tweet =  {
            status: createTweet(pairObj.pair, pairObj['pump index'], pairObj['price increase'], 'five ', 's')
          }
          twitter.post('statuses/update', tweet, tweeted);
          if (fiveMinuteResult.length > 10) oneMinuteResult.splice(0, 1);
      }
}, 300 * 1000);

setInterval(async () => {
    const rankingPumpTen = await getRanking['getRanking']();
    tenMinuteRanking = rankingPumpTen[0];
    if (rankingPumpTen[1].length > 0) {
        tenMinuteResult.push(rankingPumpTen[1]);
        const pairObj = tenMinuteResult[tenMinuteResult.length - 1][0];
        const tweet =  {
            status: createTweet(pairObj.pair, pairObj['pump index'], pairObj['price increase'], 'ten ' , 's')
          }
          twitter.post('statuses/update', tweet, tweeted);
          if (tenMinuteResult.length > 10) oneMinuteResult.splice(0, 1);
      }
}, 600 * 1000);

app.get('/volumes/1', async (req, res) => {
    res.json(oneMinuteRanking);
});

app.get('/results/1', async(req, res) => {
    res.json(oneMinuteResult);
});

app.get('/volumes/5', async (req, res) => {
    res.json(fiveMinuteRanking);
});

app.get('/results/5', async(req, res) => {
    res.json(fiveMinuteResult);
});

app.get('/volumes/10', async (req, res) => {
    res.json(tenMinuteRanking);
});

app.get('/results/10', async(req, res) => {
    res.json(tenMinuteResult);
});

app.listen(PORT);
