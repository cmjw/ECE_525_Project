import io
import re
import torch
from PIL import Image, ImageOps
from open_clip import create_model_from_pretrained, get_tokenizer

HUB = "hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"
TXT_LEN = 64

def clean(s): 
    s = re.sub(r"X{2,}", "", s or "").strip()
    return s or "no indication provided"

def pad_square(img): 
    img = img.convert("RGB")
    return ImageOps.pad(img, (max(img.size),) * 2)

class Extractor:
    def __init__(self):
        self.model, self.preprocess = create_model_from_pretrained(HUB)
        self.tokenizer = get_tokenizer(HUB)
        self.model.eval()

    @torch.no_grad()
    def image_tokens(self, data: bytes): # (1, 197, 768)
        x = self.preprocess(pad_square(Image.open(io.BytesIO(data)))).unsqueeze(0)
        return self.model.visual.trunk.forward_features(x)

    @torch.no_grad()
    def text_tokens(self, text: str): # (1, 64, 768), ids (1, 64)
        ids = self.tokenizer([clean(text)], context_length=TXT_LEN)
        out = self.model.text.transformer(input_ids=ids, attention_mask=(ids != 0).long()).last_hidden_state
        return out, ids