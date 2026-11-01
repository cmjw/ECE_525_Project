import sys, requests, numpy as np

# run using .venv\Scripts\python check_attention.py ..\img\chest_xray.jpg "shortness of breath and chest pain with cough"

with open(sys.argv[1], "rb") as f:
    data = f.read()
r = requests.post("http://127.0.0.1:8000/predict", files={"image": ("x.jpg", data, "image/jpeg")},
                  data={"text": sys.argv[2]})
r.raise_for_status()
out = r.json()

overall = np.array(out["image_attention"])
maps = np.array(out["token_attention"]) 
for t, m in zip(out["tokens"], maps):
    print(f"{t['token']:14s} corr with overall map: {np.corrcoef(m, overall)[0, 1]:.3f}")

resid = maps - maps.mean(0)
print("\nword-specific share of variation:", round(float(resid.std() / maps.std()), 3))