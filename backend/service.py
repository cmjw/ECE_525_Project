import hashlib
import numpy as np
import torch
from features import Extractor
from fusion import FusionClassifier

NP = 196  # image patches (14 x 14)
T0 = 1 + 197  # first text position in the fusion sequence: [fusion CLS] + 197 image tokens
SPECIAL = {"[CLS]", "[SEP]", "[PAD]"}

def norm(a):
    a = np.asarray(a, dtype=float)
    span = a.max() - a.min()
    return (np.ones_like(a) if span < 1e-8 else (a - a.min()) / span).tolist()

class RealService:
    mock = False

    def __init__(self, weights="fusion.pt"):
        self.ext = Extractor()
        ck = torch.load(weights, map_location="cpu")
        cfg = ck["cfg"]
        self.labels = ck["labels"]
        self.net = FusionClassifier(len(self.labels), d=cfg["d"], heads=cfg["heads"], layers=cfg["layers"])
        self.net.load_state_dict(ck["state"])
        self.net.eval()
        self._img = (None, None) # (hash of the last image, its tokens): skip the ViT on text-only edits

    def _image_tokens(self, data):
        key = hashlib.sha1(data).hexdigest()
        if self._img[0] != key:
            self._img = (key, self.ext.image_tokens(data))
        return self._img[1]

    @torch.no_grad()
    def predict(self, data, text, patch_mask=None, word_mask=None):
        patch_mask, word_mask = patch_mask or [], word_mask or []
        img = self._image_tokens(data)
        txt, ids = self.ext.text_tokens(text)
        toks = self.ext.tokenizer.tokenizer.convert_ids_to_tokens(ids[0].tolist())

        # the BERT tokenizer splits some tokens with "##" when they are not in its vocabulary.
        # test a phrase on the raw tokenizer: .venv\Scripts\python -c "from open_clip import get_tokenizer; 
        # t=get_tokenizer('hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224'); print(t.tokenizer.tokenize('cardiomegaly pneumothorax shortness of breath'))"
        # Merge them back together
        keep = [j for j, t in enumerate(toks) if t not in SPECIAL]
        words = []  
        for j in keep:
            if toks[j].startswith("##") and words:
                words[-1][0] += toks[j][2:]
                words[-1][1].append(j)
            else:
                words.append([toks[j], [j]])

        # Fusion sequence: [fusion CLS] [ViT CLS] [196 patches] [64 text tokens]; True = hidden from attention
        extra = torch.zeros(1, T0 + ids.size(1), dtype=torch.bool)
        for k in patch_mask:
            extra[0, 2 + k] = True
        for i in word_mask:
            if 0 <= i < len(words):
                for j in words[i][1]:
                    extra[0, T0 + j] = True

        logits, attn = self.net(img, txt, ids == 0, return_attn=True, extra_pad=extra)
        w = attn[-1][0].numpy()  # last fusion layer, heads averaged

        keep_patch = np.ones(NP); keep_patch[patch_mask] = 0  # masked cells are forced to exactly 0 after normalizing
        keep_word = np.array([0.0 if i in word_mask else 1.0 for i in range(len(words))])
        scores = np.array(norm([max(w[0, T0 + j] for j in js) for _, js in words])) * keep_word
        return {
            "mock": False,
            "probs": dict(zip(self.labels, logits.sigmoid()[0].tolist())),
            "image_attention": (np.array(norm(w[0, 2:2 + NP])) * keep_patch).tolist(),
            "tokens": [{"token": t, "score": float(s)} for (t, _), s in zip(words, scores)],
            "token_attention": [(np.array(norm(np.mean([w[T0 + j, 2:2 + NP] for j in js], axis=0))) * keep_patch).tolist()
                                for _, js in words],
        }