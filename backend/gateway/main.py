from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI(title="CodeMind Gateway")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,   
    allow_methods=["*"],
    allow_headers=["*"],
)


AUTH_SERVICE         = os.getenv("AUTH_SERVICE",         "http://localhost:8001")
ORCHESTRATOR_SERVICE = os.getenv("ORCHESTRATOR_SERVICE", "http://localhost:8002")


#auth middleware
async def verify_token(request: Request):
    auth_header=request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(401, "No token provided")

    async with httpx.AsyncClient() as client:
        res=await client.get(
            f"{AUTH_SERVICE}/verify",
            headers={"Authorization": auth_header}   
        )

    if res.status_code!=200:
        raise HTTPException(401,"Invalid token")

    return res.json()
    
#auth routes 
@app.post("/auth/signup")
async def signup(request: Request):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{AUTH_SERVICE}/signup", json=body)
        return res.json()

@app.post("/auth/login")
async def login(request: Request):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{AUTH_SERVICE}/login", json=body)
        return res.json()


# Analyze routes 
@app.post("/analyze/code")
async def analyze_code(request: Request):
    await verify_token(request)
    form = await request.form()
    async with httpx.AsyncClient(timeout=120) as client:
        res = await client.post(
            f"{ORCHESTRATOR_SERVICE}/analyze/code",
            data={"question": form["question"], "code": form["code"]}
        )
        return res.json()


@app.post("/analyze/data")
async def analyze_data(request: Request):
    await verify_token(request)
    form = await request.form()
    async with httpx.AsyncClient(timeout=120) as client:
        res = await client.post(
            f"{ORCHESTRATOR_SERVICE}/analyze/data",
            data={"question": form["question"]},
            files={"file": (form["file"].filename, await form["file"].read())}
        )
        return res.json()

@app.get("/auth/me")
async def get_me(request: Request):
    user = await verify_token(request)
    return user