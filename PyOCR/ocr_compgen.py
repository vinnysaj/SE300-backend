import pytesseract
from pytesseract import Output
from PIL import Image
import cv2
from io import BytesIO
import base64

def run_ocr_compgen(blobData):
    #data = base64String
    #image = Image.open(BytesIO(base64.b64decode(data))).convert("RGB")
    image = Image.open(BytesIO(blobData)).convert("RGB")
    text = pytesseract.image_to_string(image,lang='eng')
    return(text)
    

