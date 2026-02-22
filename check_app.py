import asyncio
import sys
import httpx
import os
from dotenv import load_dotenv

# Load backend env
load_dotenv(os.path.join("backend", ".env"))

async def check_backend():
    print("1. Checking Backend Health...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:8000/api/v1/health", timeout=5)
            if resp.status_code == 200:
                print("✅ Backend is UP")
                return True
            else:
                print(f"❌ Backend returned {resp.status_code}")
                return False
    except Exception as e:
        print(f"❌ Backend is DOWN: {e}")
        return False

async def check_frontend():
    print("\n2. Checking Frontend Availability...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:3000", timeout=5)
            if resp.status_code == 200:
                print("✅ Frontend is UP")
                return True
            else:
                print(f"❌ Frontend returned {resp.status_code}")
                return False
    except Exception as e:
        print(f"❌ Frontend is DOWN: {e}")
        return False

async def check_db_connection():
    print("\n3. Checking Database Connection...")
    try:
        import asyncpg
        db_url = os.environ.get("DATABASE_URL")
        # Mask password for display
        safe_url = db_url.split("@")[1] if "@" in db_url else "INVALID_URL"
        print(f"   Connecting to: {safe_url}")
        
        conn = await asyncpg.connect(db_url)
        # Run a simple query
        version = await conn.fetchval("SELECT version()")
        print(f"✅ Database Connected! ({version[:50]}...)")
        await conn.close()
        return True
    except ImportError:
        print("⚠️  'asyncpg' not installed in this environment. Skipping DB check.")
        return False
    except Exception as e:
        print(f"❌ Database Connection FAILED: {e}")
        return False

async def main():
    print("🔍 RUNNING SYSTEM CHECKS\n" + "="*30)
    
    backend_ok = await check_backend()
    frontend_ok = await check_frontend()
    db_ok = await check_db_connection()
    
    print("\n" + "="*30)
    if backend_ok and frontend_ok and db_ok:
        print("🚀 ALL SYSTEMS GO! You are ready to demo.")
    else:
        print("⚠️  SOME SYSTEMS FAILED. Check the error messages above.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
