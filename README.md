# ECE 525 Project

This project uses Microsoft's pretrained [BiomedCLIP architecture](https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224) [1], a multimodal medical transformer model, with a custom fusion head for cross attention between vision transformer and text transformer model.

The backend was developed using Python, and the frontend was developed using FastAPI and React. The app has been tested on Windows x64 only, not on MacOS or Linux.

## Dependencies and Installation

### Dependencies

- Python 3.12+
- Node.js version 18+

### How to Run

1. Clone repository

2. Run backend:
```
cd backend 
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app:app --port 8000
```

3. Run frontend:
```
cd frontend
npm install && npm run dev
```

4. Interact with the web app, hosted at http://localhost:5173.

## References

- [1] Zhang, S., Xu, Y., Usuyama, N., Xu, H., Bagga, J., Tinn, R., Preston, S., Rao, R., Wei, M., Valluri, N., Wong, C., Tupini, A., Wang, Y., Mazzola, M., Shukla, S., Liden, L., Gao, J., Crabtree, A., Piening, B., … Poon, H. (2025). BiomedCLIP: A multimodal biomedical foundation model pretrained from fifteen million scientific image-text pairs (arXiv:2303.00915). arXiv. https://doi.org/10.48550/arXiv.2303.00915