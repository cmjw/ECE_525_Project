import sys
import torch
from fusion import FusionClassifier

ck = torch.load("fusion.pt", map_location="cpu")
cfg = ck["cfg"]
net = FusionClassifier(len(ck["labels"]), d=cfg["d"], heads=cfg["heads"], layers=cfg["layers"])
print(net.load_state_dict(ck["state"]))    
net.eval()

cache = torch.load(sys.argv[1], mmap=True)  # path to openi_biomedclip_feats.pt
r = ck["ref"]["row"]
with torch.no_grad():
    probs = net(cache["img"][r:r+1], cache["txt"][r:r+1], (cache["ids"][r:r+1] == 0)).sigmoid()[0]

diff = (probs - ck["ref"]["probs"]).abs().max().item()
print(dict(zip(ck["labels"], [round(p, 3) for p in probs.tolist()])))
print("max |diff| vs notebook:", diff, "->", "PASS" if diff < 1e-4 else "FAIL")