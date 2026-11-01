import sys
import torch
from PIL import Image, ImageOps
from open_clip import create_model_from_pretrained, get_tokenizer

HUB = "hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"
model, preprocess = create_model_from_pretrained(HUB)
tokenizer = get_tokenizer(HUB)
model.eval()
print("visual:", type(model.visual).__name__, "| text:", type(model.text).__name__)

img = Image.open(sys.argv[1]).convert("RGB")
x = preprocess(ImageOps.pad(img, (max(img.size),) * 2)).unsqueeze(0)       # pad to square, then resize to 224
ids = tokenizer(["shortness of breath, decreased breath sounds"], context_length=64)

with torch.no_grad():
    img_tok = model.visual.trunk.forward_features(x)
    txt_tok = model.text.transformer(input_ids=ids, attention_mask=(ids != 0).long()).last_hidden_state

print("input       ", tuple(x.shape))
print("image tokens", tuple(img_tok.shape))
print("text tokens ", tuple(txt_tok.shape))
print("words       ", [t for t in tokenizer.tokenizer.convert_ids_to_tokens(ids[0].tolist()) if t != "[PAD]"])