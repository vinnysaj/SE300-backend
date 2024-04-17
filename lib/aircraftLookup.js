const axios = require('axios');

async function pullNewAircraft(tail) {
  console.log("User requested info on tail #:" + tail);
  const options = {
    method: 'GET',
    url: 'https://aerodatabox.p.rapidapi.com/aircrafts/reg/' + tail,
    headers: {
      'X-RapidAPI-Key': process.env.AIRCRAFT_API_KEY,
      'X-RapidAPI-Host': process.env.AIRCRAFT_API_HOST
    }
  };
  try {
    const response = await axios.request(options);
    return response;
  } catch (error) {
    console.error('Error fetching aircraft data:', error);
    return null;
  }
}



module.exports = {
    pullNewAircraft: pullNewAircraft
};