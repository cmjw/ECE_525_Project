import sys, requests, numpy as np

def call(path, text, patch="", word=""):
    with open(path, "rb") as f:
        data = f.read()
    r = requests.post("http://127.0.0.1:8000/predict", files={"image": ("x.jpg", data, "image/jpeg")},
                      data={"text": text, "patch_mask": patch, "word_mask": word})
    r.raise_for_status()
    return r.json()

def delta(a, b):
    return {k: round(a["probs"][k] - b["probs"][k], 3) for k in a["probs"]}

path, text = sys.argv[1], "shortness of breath and chest pain"
base = call(path, text)

none = call(path, text, "0" * 196)
assert all(abs(base["probs"][k] - none["probs"][k]) < 1e-6 for k in base["probs"]), "an empty mask must change nothing"
print("1. empty mask matches no mask: ok")

grid = np.zeros(196, int)
grid[[14 * r + c for r in range(5, 9) for c in range(5, 9)]] = 1          # 4x4 block in the middle
m = call(path, text, "".join(map(str, grid)))
assert (np.array(m["image_attention"])[grid == 1] == 0).all(), "masked patches must get exactly 0 attention"
print("2. masked patches get 0 attention: ok | score change:", delta(m, base))

w = call(path, text, "", "2")                                              # mask the third word ("breath")
assert w["tokens"][2]["score"] == 0, "a masked word must get 0 score"
print("3. masked word", repr(w["tokens"][2]["token"]), "gets 0 score: ok | score change:", delta(w, base))

allp = call(path, text, "1" * 196)
print("4. ALL 196 patches masked | score change:", delta(allp, base))