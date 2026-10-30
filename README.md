# ECE 525 Project

- Pretrained model: BiomedCLIP
    - https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224
    - Fusion head
    
- FastAPI + React


Run backend:
```
cd backend && pip install -r requirements.txt && MOCK=1 uvicorn app:app --port 8000
```

Run frontend:
```
cd frontend && npm install && npm run dev
```

Web app hosted at http://localhost:8000

## References

- https://arxiv.org/abs/2303.00915