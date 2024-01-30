const axios = require('axios');

async function pullNewAircraft(tail,returns){
    const options = {
        method: 'GET',
        url: 'https://aerodatabox.p.rapidapi.com/aircrafts/reg/' + tail,
        headers: {
          'X-RapidAPI-Key': process.env.AIRCRAFT_API_KEY,
          'X-RapidAPI-Host': process.env.AIRCRAFT_API_HOST
        }
      };
      try {
          const response = await axios.request(options).then((response) => {
            returns(response);
          });
      } catch (error) {
          returns(null);
      }
}


module.exports = {
        pullNewAircraft: pullNewAircraft
};