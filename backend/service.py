import hashlib
import numpy as np

def norm(a):
    a = np.asarray(a, dtype=float)
    span = a.max() - a.min()
    return (np.ones_like(a) if span < 1e-8 else (a - a.min()) / span).tolist()

class MockService:
    mock = True
    labels = ["normal", "opacity", "cardiomegaly", "pleural effusion", "atelectasis"]

    @staticmethod
    def _blob(rng):   # fake 14x14 attention: one soft hotspot, flattened to 196
        cy, cx = rng.uniform(3, 10, 2)
        yy, xx = np.mgrid[0:14, 0:14]
        return norm(np.exp(-((yy - cy) ** 2 + (xx - cx) ** 2) / (2 * 2.5 ** 2)).ravel())

    def predict(self, data, text):
        rng = np.random.default_rng(int(hashlib.sha1(data + text.encode()).hexdigest()[:8], 16))
        words = text.split()[:24] or ["no", "indication", "provided"]
        return {
            "mock": True,
            "probs": dict(zip(self.labels, rng.uniform(0.05, 0.95, len(self.labels)).tolist())),
            "image_attention": self._blob(rng),   
            "tokens": [{"token": w, "score": s} for w, s in zip(words, norm(rng.uniform(size=len(words))))],
            "token_attention": [self._blob(rng) for _ in words],  # one 196-value map per word
        }