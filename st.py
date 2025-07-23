import json
import pyperclip

with open("C:/Users/Luke/Documents/web test 2/websynthpubdat-e9612543e4aa.json", "r") as f:
    raw = f.read()

# Escape newlines for .env usage
escaped = raw.replace("\n", "\\n")

# Optional: remove leading/trailing whitespace
escaped = escaped.strip()

# Output the env line
print(f"GOOGLE_CREDENTIALS={escaped}")
pyperclip.copy(f"GOOGLE_CREDENTIALS={escaped}")
