
const axios =  require('axios');

async function getGainersAndLosers(req, queryFn) {
    const reqData = req.body;
    try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
        const data = response.data;
    
        // Sort the data based on percent change
        const topGainers = data.sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent)).slice(0, 20);
        const topLosers = data.sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent)).slice(0, 20);
    
        // topGainers.forEach(gainer => {
        //   console.log(`${gainer.symbol}: ${gainer.priceChangePercent}%`);
        // });
        return {gainers:topGainers, losers:topLosers};
      } catch (error) {
        console.error('Error fetching data:', error);
   }
}

module.exports = {
    getGainersAndLosers
}
