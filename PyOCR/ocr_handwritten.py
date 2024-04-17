from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import requests
from IPython.display import display
from PIL import Image
from io import BytesIO
import base64

def runOcr(blobData):
    processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
    model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")

    # load image from the IAM dataset
    #url = "https://fki.tic.heia-fr.ch/static/img/a01-122-02.jpg"
    #image = Image.open(requests.get(url, stream=True).raw).convert("RGB")
    #data = base64String
    image = Image.open(BytesIO(base64.b64decode(blobData))).convert("RGB")
    #image = Image.open(BytesIO(blobData)).convert("RGB")

    pixel_values = processor(image, return_tensors="pt").pixel_values
    generated_ids = model.generate(pixel_values, max_new_tokens = 255)

    generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

    return(generated_text)




