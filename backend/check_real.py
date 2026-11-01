import sys, time, requests

def call(path, text):
    with open(path, "rb") as f:
        data = f.read()
    t = time.time()
    r = requests.post("http://127.0.0.1:8000/predict", files={"image": ("x.jpg", data, "image/jpeg")}, data={"text": text})
    r.raise_for_status()
    return r.json(), time.time() - t

a, ta = call(sys.argv[1], "shortness of breath")
b, tb = call(sys.argv[1], "shortness of breath")
c, tc = call(sys.argv[1], "chest pain and cough")
assert a["mock"] is False
assert len(a["image_attention"]) == 196
assert len(a["tokens"]) == len(a["token_attention"]) and all(len(g) == 196 for g in a["token_attention"])
assert all(abs(a["probs"][k] - b["probs"][k]) < 1e-6 for k in a["probs"]), "same input should give the same output"
print("tokens:", [t["token"] for t in a["tokens"]])
print("scores:", {k: round(v, 3) for k, v in a["probs"].items()})
print("other text:", {k: round(v, 3) for k, v in c["probs"].items()})
print(f"time: first {ta:.2f}s | same image again {tb:.2f}s | new text {tc:.2f}s")