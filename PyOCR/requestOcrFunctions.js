export default async function getFromOcrEndpointCompgen(b64String) {
    url = "127.0.0.1:5000/ocr/compgen/"
    const response = await fetch(url, {
        method: "POST", 
        mode: "cors", 
        headers: {
            "Content-Type": "application/json", //Body will be in json format
        },
        body: {
            b64: b64String
        },
      });
      return response.json();
}

export default async function getFromOcrEndpointHandwritten(b64String) {
    url = "127.0.0.1:5000/ocr/handwritten/"
    const response = await fetch(url, {
        method: "POST", 
        mode: "cors", 
        headers: {
            "Content-Type": "application/json", //Body will be in json format
        },
        body: {
            b64: b64String
        },
      });
      return response.json();
}

