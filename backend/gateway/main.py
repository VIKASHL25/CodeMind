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


is_pinging_auth = False
is_pinging_orchestrator = False

async def ping_service(url: str, service_name: str):
    global is_pinging_auth, is_pinging_orchestrator
    
    if service_name == "auth":
        if is_pinging_auth:
            return
        is_pinging_auth = True
    elif service_name == "orchestrator":
        if is_pinging_orchestrator:
            return
        is_pinging_orchestrator = True

    print(f"BACKGROUND WAKE-UP: Starting wake-up loop for {service_name} ({url})...")
    retries = 15
    delay = 5.0
    try:
        for i in range(retries):
            try:
                # verify=False bypasses SSL certificate check for wake-up pings to prevent handshake failures
                async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
                    res = await client.get(url)
                    if res.status_code == 200:
                        print(f"BACKGROUND WAKE-UP: {service_name} ({url}) is now fully awake! (Status 200)")
                        return
                    else:
                        print(f"BACKGROUND WAKE-UP: Ping to {service_name} ({url}) returned status {res.status_code}. Retrying in {delay}s (Attempt {i+1}/{retries})...")
            except Exception as e:
                print(f"BACKGROUND WAKE-UP: Ping to {service_name} ({url}) failed: {str(e)}. Retrying in {delay}s (Attempt {i+1}/{retries})...")
            await asyncio.sleep(delay)
        print(f"BACKGROUND WAKE-UP: Finished wake-up loop for {service_name} ({url}) without status 200.")
    finally:
        if service_name == "auth":
            is_pinging_auth = False
        elif service_name == "orchestrator":
            is_pinging_orchestrator = False

def trigger_backend_wakeup():
    asyncio.create_task(ping_service(f"{AUTH_SERVICE}/", "auth"))
    asyncio.create_task(ping_service(f"{ORCHESTRATOR_SERVICE}/", "orchestrator"))

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
    
# root route for wake-up pings
@app.get("/")
async def root():
    return {"status": "ok", "service": "gateway"}

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