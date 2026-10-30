import io
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image
from service import MockService

app = FastAPI()
service = MockService()

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/predict")
def predict(image: UploadFile = File(...), text: str = Form("")):
    data = image.file.read()
    try:
        img = Image.open(io.BytesIO(data))
        img.load() 
    except Exception:
        raise HTTPException(400, "Could not read the image (use PNG or JPEG)")
    return service.predict(data, text[:2000])