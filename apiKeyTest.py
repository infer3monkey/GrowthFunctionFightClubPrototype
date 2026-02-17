import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("api_key")

client = genai.Client(api_key = api_key)

response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents="What is the name of a 6v6 hero shooter game based on marvel?",
)

print(response.text)