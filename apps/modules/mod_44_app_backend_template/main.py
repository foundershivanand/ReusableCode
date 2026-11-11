from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Factory App Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "HEALTHY", "version": "1.0.0"}

@app.get("/api/v1/user/profile", tags=["User"])
def get_user_profile():
    return {"user_id": "u_sample", "tier": "pro"}
