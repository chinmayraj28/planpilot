import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    db_url = os.environ.get("DATABASE_URL")
    print(f"Testing connection to: {db_url.split('@')[1]}") # Print host only for security
    
    try:
        conn = await asyncpg.connect(db_url)
        print("Successfully connected!")
        await conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
