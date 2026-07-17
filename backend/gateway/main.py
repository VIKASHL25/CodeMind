from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import asyncio

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
print("GATEWAY AUTH_SERVICE:", AUTH_SERVICE)
print("GATEWAY ORCHESTRATOR_SERVICE:", ORCHESTRATOR_SERVICE)


async def ping_service(url: str):
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            await client.get(url)
    except Exception:
        pass

def trigger_backend_wakeup():
    asyncio.create_task(ping_service(f"{AUTH_SERVICE}/"))
    asyncio.create_task(ping_service(f"{ORCHESTRATOR_SERVICE}/"))

@app.on_event("startup")
async def startup_event():
    trigger_backend_wakeup()

@app.middleware("http")
async def wakeup_middleware(request: Request, call_next):
    trigger_backend_wakeup()
    return await call_next(request)


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

async def safe_request(method: str, url: str, **kwargs):
    async with httpx.AsyncClient(timeout=120) as client:
        try:
            if method.lower() == "post":
                res = await client.post(url, **kwargs)
            elif method.lower() == "get":
                res = await client.get(url, **kwargs)
            else:
                res = await client.request(method, url, **kwargs)
            return await forward_request(res)
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout) as e:
            print(f"CONNECTION ERROR to {url}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=503,
                detail="The backend service is waking up from sleep mode. Please try again in 10-15 seconds."
            )

#auth middleware
async def verify_token(request: Request):
    auth_header=request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(401, "No token provided")

    try:
        async with httpx.AsyncClient() as client:
            res=await client.get(
                f"{AUTH_SERVICE}/verify",
                headers={"Authorization": auth_header}   
            )
        if res.status_code!=200:
            raise HTTPException(401,"Invalid token")
        return await forward_request(res)
    except (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout) as e:
        print(f"CONNECTION ERROR during token verification: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=503,
            detail="The authentication service is waking up from sleep mode. Please try again in a few seconds."
        )
    
#auth routes 
@app.post("/auth/signup")
async def signup(request: Request):
    body = await request.json()
    return await safe_request("post", f"{AUTH_SERVICE}/signup", json=body)

@app.post("/auth/login")
async def login(request: Request):
    body = await request.json()
    return await safe_request("post", f"{AUTH_SERVICE}/login", json=body)


# Analyze routes 
@app.post("/analyze/code")
async def analyze_code(request: Request):
    await verify_token(request)
    form = await request.form()
    return await safe_request(
        "post",
        f"{ORCHESTRATOR_SERVICE}/analyze/code",
        data={"question": form["question"], "code": form["code"]}
    )


@app.post("/analyze/data")
async def analyze_data(request: Request):
    await verify_token(request)
    form = await request.form()
    return await safe_request(
        "post",
        f"{ORCHESTRATOR_SERVICE}/analyze/data",
        data={"question": form["question"]},
        files={"file": (form["file"].filename, await form["file"].read())}
    )

@app.get("/auth/me")
async def get_me(request: Request):
    user = await verify_token(request)
    return user