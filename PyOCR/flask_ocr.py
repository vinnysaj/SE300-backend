from flask import Flask
from flask import request
from ocr_handwritten import *
from ocr_compgen import *
app = Flask(__name__)

@app.route('/<int:number>/')
def incrementer(number):
    return "Incremented number is " + str(number+1)


@app.route('/ocr/handwritten/', methods = ['POST'])
def upload_handwritten():
   if request.method == 'POST':
      content = request.json
      imgString = content['b64']
      return (runOcr(imgString))
   else:
       return("This endpoint only accepts POST requests")
       
@app.route('/ocr/compgen/', methods = ['POST'])
def upload_compgen():
   if request.method == 'POST':
      content = request.json
      imgString = content['b64']
      return (run_ocr_compgen(imgString))
   else:
       return("This endpoint only accepts POST requests")
    
    


app.run()
