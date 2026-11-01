import io, requests
from PIL import Image

buf = io.BytesIO(); Image.new("L", (300, 400), 128).save(buf, "PNG")

def call(text):
    r = requests.post("http://127.0.0.1:8000/predict",
                      files={"image": ("t.png", buf.getvalue(), "image/png")}, data={"text": text})
    r.raise_for_status()
    return r.json()

a, b = call("shortness of breath"), call("shortness of breath")
assert a == b, "mock should be deterministic"
assert len(a["image_attention"]) == 196
assert len(a["tokens"]) == len(a["token_attention"]) == 3
assert all(len(g) == 196 for g in a["token_attention"])
print("contract ok", list(a))