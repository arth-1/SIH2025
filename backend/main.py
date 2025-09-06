# FastAPI main entry point
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Authenticity Validator Backend is running."}

# Import and include routers here (to be added)
# from routes.certificate import router as certificate_router
# app.include_router(certificate_router)
