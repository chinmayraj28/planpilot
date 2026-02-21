from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_jwt_secret: str
    database_url: str
    gemini_api_key: str
    epc_api_key: str
    epc_api_email: str
    ibex_api_key: str
    ibex_base_url: str = "https://api.ibexplanning.co.uk/v1"
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
