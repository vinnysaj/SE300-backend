import pytesseract
from pytesseract import Output
from PIL import Image
import cv2
from io import BytesIO
import base64

def run_ocr_compgen(blobData):
    image = Image.open(BytesIO(base64.b64decode(blobData))).convert("RGB")
    #image = Image.open(BytesIO(blobData)).convert("RGB")
    text = pytesseract.image_to_string(image,lang='eng')
    return(text)
    

