import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/take_home_test")
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    if "?schema=public" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.split("?")[0]
        
    JWT_ACCESS_SECRET = os.getenv("JWT_ACCESS_SECRET", "953047a430f5185a5a79d749edc6bc4e98d47be173e3e3c35cef406e22912086")
    JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "a5e328d192f4046e269c9fd24c3d756bfdf8f12ea6be59ec3f3ac4528d6c9293")

settings = Settings()
