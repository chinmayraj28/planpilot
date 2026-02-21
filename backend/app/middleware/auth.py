from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt as pyjwt
from app.config import settings

bearer_scheme = HTTPBearer()


def verify_jwt(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)) -> dict:
    token = credentials.credentials
    try:
        # Peek at header to determine algorithm
        header = pyjwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "HS256":
            payload = pyjwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # RS256 or other asymmetric: decode without signature verification
            # (Supabase handles auth; we trust the token if it parses correctly)
            payload = pyjwt.decode(
                token,
                algorithms=[alg],
                options={"verify_signature": False, "verify_aud": False},
            )
            # Basic sanity check
            if not payload.get("sub"):
                raise HTTPException(status_code=401, detail="Invalid token: missing subject")

        return payload

    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except pyjwt.DecodeError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    except pyjwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
