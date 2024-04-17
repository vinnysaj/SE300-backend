const fetch = require("fetch").fetchUrl;
const axios = require("axios");

async function getCompgen(b64String) {
    url = "127.0.0.1:5000/ocr/compgen/"
    axios.post(url, {
      b64: b64String,
    })
    .then((response) => {
      return(response);
    });
}

async function getHandwritten(b64String) {
    url = "127.0.0.1:5000/ocr/handwritten/"
    axios.post(url, {
        b64: b64String,
      })
      .then((response) => {
        return(response);
      });
}
module.exports = {
  getCompgen: getCompgen,
  getHandwritten: getHandwritten
}

