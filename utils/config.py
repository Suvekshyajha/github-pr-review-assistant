from dotenv import load_dotenv
import os

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
IF GITHUB_TOKEN is None:
    raise ValueError("GITHUB_TOKEN is not set in the environment variables.")