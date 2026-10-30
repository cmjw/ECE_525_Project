import io
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image

app = FastAPI()

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
    return {"width": img.width, "height": img.height, "mode": img.mode,
            "bytes": len(data), "text_chars": len(text)}