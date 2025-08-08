from flask import Flask, render_template, jsonify
from google.oauth2 import service_account
from googleapiclient.discovery import build
import os
import json
from dotenv import load_dotenv
import io
from googleapiclient.http import MediaIoBaseDownload


load_dotenv()

# Path to your service account key file
# info = json.loads(os.environ['GOOGLE_CREDENTIALS'])

# creds = service_account.Credentials.from_service_account_info(
#     info,
#     scopes=["https://www.googleapis.com/auth/drive.readonly"]
# )

# drive_service = build('drive', 'v3', credentials=creds)
# FOLDER_ID = '190UY56-VYS5Tzmd_u8GAO5XRQk6upp54'

# query = f"'{FOLDER_ID}' in parents and trashed = false"
# results = drive_service.files().list(
#     q=query,
#     fields="files(id, name, mimeType)"
# ).execute()









# files = results.get('files', [])
# for file in files:
#     print(f"{file['name']} ({file['id']})")



app = Flask(__name__)
app.static_folder = 'static'


@app.route('/files')
def list_files():
    # folder_id = FOLDER_ID
    # results = drive_service.files().list(
    #     q=query,
    #     fields="files(id, name)"
    # ).execute()
    # files = results.get('files', [])
    
    # file_contents = []
    # for file in files:
    #     file_id = file['id']
    #     file_name = file['name']
    #     # Download file content
    #     request = drive_service.files().get_media(fileId=file_id)
    #     fh = io.BytesIO()
    #     downloader = MediaIoBaseDownload(fh, request)
    #     done = False
    #     while done is False:
    #         status, done = downloader.next_chunk()
    #     content = fh.getvalue().decode('utf-8')
    #     file_contents.append({
    #         'name': file_name,
    #         'content': content
    #     })
    
    return jsonify("")




@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(port=5000,host="0.0.0.0)


