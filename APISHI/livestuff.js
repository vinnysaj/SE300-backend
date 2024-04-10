const axios = require('axios');

const options = {
  method: 'GET',
  url: 'https://adsbexchange-com1.p.rapidapi.com/v2/registration/N8737L/',
  headers: {
    'X-RapidAPI-Key': 'b754e9b703msh2b797c658462d0ep14e4e5jsndb6efa07e20c',
    'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com'
  }
};

try {
	const response = await axios.request(options);
	console.log(response.data);
} catch (error) {
	console.error(error);
}