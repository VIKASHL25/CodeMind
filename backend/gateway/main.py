from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI(title="CodeMind Gateway")
CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
print("ALLOWED CORS ORIGINS:", CORS_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,   
    allow_methods=["*"],
    allow_headers=["*"],
)


AUTH_SERVICE         = os.getenv("AUTH_SERVICE",         "http://localhost:8001")
ORCHESTRATOR_SERVICE = os.getenv("ORCHESTRATOR_SERVICE", "http://localhost:8002")


async def forward_request(res: httpx.Response):
    if res.status_code >= 400:
        try:
            detail = res.json()
        except Exception:
            detail = res.text
        raise HTTPException(status_code=res.status_code, detail=detail)
    try:
        return res.json()
    except Exception:
        raise HTTPException(status_code=500, detail=f"Backend service did not return JSON: {res.text}")

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

    return await forward_request(res)
    
#auth routes 
@app.post("/auth/signup")
async def signup(request: Request):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{AUTH_SERVICE}/signup", json=body)
        return await forward_request(res)

@app.post("/auth/login")
async def login(request: Request):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{AUTH_SERVICE}/login", json=body)
        return await forward_request(res)


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
        return await forward_request(res)


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
        return await forward_request(res)

@app.get("/auth/me")
async def get_me(request: Request):
    user = await verify_token(request)
    return user