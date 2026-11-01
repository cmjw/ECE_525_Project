import io
import os
import threading
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image

if os.getenv("MOCK", "").strip().strip('"') == "1":
    from mock_service import MockService
    service = MockService()
else:
    from service import RealService
    service = RealService("fusion.pt")

app = FastAPI()
lock = threading.Lock()          # one model call at a time (shared image-feature cache)

@app.get("/health")
def health():
    return {"ok": True, "mock": service.mock}

@app.post("/predict")
def predict(image: UploadFile = File(...), text: str = Form("")):
    data = image.file.read()
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception:
        raise HTTPException(400, "Could not read the image (use PNG or JPEG)")
    with lock:
        return service.predict(data, text[:2000])