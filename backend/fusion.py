import torch
import torch.nn as nn


class FusionLayer(nn.Module):
    def __init__(self, d, heads):
        super().__init__()
        self.n1, self.n2 = nn.LayerNorm(d), nn.LayerNorm(d)
        self.attn = nn.MultiheadAttention(d, heads, dropout=0.1, batch_first=True)
        self.mlp = nn.Sequential(nn.Linear(d, 4 * d), nn.GELU(), nn.Dropout(0.1), nn.Linear(4 * d, d))

    def forward(self, x, pad):
        h = self.n1(x)
        a, w = self.attn(h, h, h, key_padding_mask=pad, need_weights=True, average_attn_weights=True)
        x = x + a
        return x + self.mlp(self.n2(x)), w                  # w: (B, N, N), averaged over heads

class FusionClassifier(nn.Module):
    def __init__(self, n_labels, d_in=768, d=256, heads=4, layers=2):
        super().__init__()
        self.img_proj, self.txt_proj = nn.Linear(d_in, d), nn.Linear(d_in, d)
        self.mod = nn.Embedding(2, d)                        # modality embedding: 0 = image, 1 = text
        self.cls = nn.Parameter(torch.randn(1, 1, d) * 0.02)
        self.layers = nn.ModuleList(FusionLayer(d, heads) for _ in range(layers))
        self.head = nn.Sequential(nn.LayerNorm(d), nn.Linear(d, n_labels))

    def forward(self, img, txt, txt_pad, drop_img=None, drop_txt=None, return_attn=False):
        B, ni = img.size(0), img.size(1)
        x = torch.cat([self.cls.expand(B, -1, -1),
                       self.img_proj(img.float()) + self.mod.weight[0],
                       self.txt_proj(txt.float()) + self.mod.weight[1]], 1)
        pad = torch.cat([torch.zeros(B, 1 + ni, dtype=torch.bool, device=img.device), txt_pad], 1)
        if drop_img is not None: pad[:, 1:1 + ni] |= drop_img[:, None]     # hide a whole modality per sample
        if drop_txt is not None: pad[:, 1 + ni:] |= drop_txt[:, None]
        attns = []
        for layer in self.layers:
            x, w = layer(x, pad)
            attns.append(w)
        logits = self.head(x[:, 0])
        return (logits, attns) if return_attn else logits