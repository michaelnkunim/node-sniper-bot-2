const WebSocket = require('ws');
const crypto = require('crypto');


const generateSecWebSocketKey = () => {z
  const randomBytes = crypto.randomBytes(16);
  return randomBytes.toString('base64');
};

const TYPES = ['pairs', 'latestBlock'];


const calculateTimeAgo = (givenTime) => {
  const givenDate = new Date(givenTime);
  const currentDate = new Date();

  const differenceMs = currentDate - givenDate;
  const seconds = Math.floor(differenceMs / 1000);
  const minutes = Math.floor(seconds / 60);
  return  {minutes, seconds}
};

module.exports = {
dexscreenerScraper
}