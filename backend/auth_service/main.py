from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import motor.motor_asyncio, os
from dotenv import load_dotenv

load_dotenv()
app=FastAPI(title="CodeMind Auth Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

client=motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGO_URL"))
db=client[os.getenv("DB_NAME")]
pwd= CryptContext(schemes=["bcrypt"])
SECRET=os.getenv("SECRET_KEY", "changeme")

class UserSignup(BaseModel):
    name:str
    email:str
    password:str

class UserLogin(BaseModel):
    email:str
    password:str

@app.post("/signup",status_code=200)
async def signup(data:UserSignup):
    if await db["users"].find_one({"email":data.email}):
        raise HTTPException(400,"email already exists")
    await db["users"].insert_one({
        "name":data.name,
        "email":data.email,
        "password":pwd.hash(data.password),
        "created_at":datetime.utcnow()
    })

    token=jwt.encode(
        {"email":data.email,"exp":datetime.utcnow()+timedelta(days=2)},
        SECRET,algorithm="HS256"
    )
    return {"access_token":token,"user":{"name":data.name,"email":data.email}}

@app.post("/login",status_code=200)
async def login(data:UserLogin):
    user=await db["users"].find_one({"email":data.email})
    if not user or not pwd.verify(data.password,user["password"]):
        raise HTTPException(401,"Invalid credentials")
    token=jwt.encode(
        {"email":data.email,"exp":datetime.utcnow()+timedelta(days=2)},
        SECRET,algorithm="HS256"
    )
    return {
        "access_token":token,
        "user":{"name":user["name"],"email":user["email"]}
    }

@app.get("/verify")
async def verify(token:str):
    try:
        payload=jwt.decode(token,SECRET,algorithms=["HS256"])
        return {"email":payload["email"],"valid":True}
    
    except:
        raise HTTPException(401,"invalid token")
    
