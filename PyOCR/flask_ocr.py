from flask import Flask
from flask import request
from ocr_handwritten import *
from ocr_compgen import *
app = Flask(__name__)



@app.route('/ocr/handwritten/', methods = ['POST'])
def upload_handwritten():
   if request.method == 'POST':
      content = request.json
      imgBlob = content['blob']
      return (runOcr(imgBlob))
   else:
       return("This endpoint only accepts POST requests")
       
@app.route('/ocr/compgen/', methods = ['POST'])
def upload_compgen():
   if request.method == 'POST':
      content = request.json
      imgBlob = content['blob']
      return (run_ocr_compgen(imgBlob))
   else:
       return("This endpoint only accepts POST requests")
    
    


app.run()
