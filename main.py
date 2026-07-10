import os
import shutil
import subprocess
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/tmp/uploads"
OUTPUT_DIR = "/tmp/output"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

def process_voice_pitch(input_audio, output_audio, effect):
    print(f"🎛️ جاري تطبيق المؤثر الصوتي الحقيقي: {effect}...")
    
    # 1. صوت نسائي حاد
    if effect == "female":
        filter_cmd = "asetrate=44100*1.35,atempo=1/1.35"
        
    # 2. صوت طفلي / كرتون مرح
    elif effect == "cartoon":
        filter_cmd = "asetrate=44100*1.6,atempo=1/1.6"
        
    # 3. صوت رجالي عميق وضخم
    elif effect == "deep":
        filter_cmd = "asetrate=44100*0.75,atempo=1/0.75"
        
    # 4. صوت السنجاب الشهير (سريع وحاد)
    elif effect == "chipmunk":
        filter_cmd = "asetrate=44100*1.45"
        
    # 5. مؤثر الراديو القديم واللاسلكي
    elif effect == "radio":
        filter_cmd = "equalizer=f=1000:width_type=h:width=200:g=-20,equalizer=f=3000:width_type=h:width=200:g=10,bandpass=f=2000:width=1000"
        
    # 6. مؤثر آلي (ريبوت ومستقبلي)
    elif effect == "robot":
        filter_cmd = "flanger=delay=2:depth=10:regen=50"
        
    # 7. صدى صوت السينما أو الحفلات
    elif effect == "echo":
        filter_cmd = "aecho=0.8:0.9:1000:0.3"
        
    # الافتراضي (بدون تغيير)
    else:
        filter_cmd = "anull"
        
    cmd = f"ffmpeg -y -i \"{input_audio}\" -af \"{filter_cmd}\" \"{output_audio}\""
    subprocess.run(cmd, shell=True)

def process_video_voice(video_path, output_path, effect):
    temp_audio = os.path.join(UPLOAD_DIR, "temp_extracted.wav")
    temp_converted_audio = os.path.join(OUTPUT_DIR, "temp_converted.wav")
    
    # فصل الصوت
    subprocess.run(f"ffmpeg -y -i \"{video_path}\" -vn -acodec pcm_s16le -ar 44100 -ac 2 \"{temp_audio}\"", shell=True)
    
    # تعديل النبرة
    process_voice_pitch(temp_audio, temp_converted_audio, effect)
    
    # دمج الصوت مع الفيديو
    cmd = f"ffmpeg -y -i \"{video_path}\" -i \"{temp_converted_audio}\" -c:v copy -map 0:v:0 -map 1:a:0 \"{output_path}\""
    subprocess.run(cmd, shell=True)
    
    if os.path.exists(temp_audio): os.remove(temp_audio)
    if os.path.exists(temp_converted_audio): os.remove(temp_converted_audio)

def process_audio_voice(audio_path, output_path, effect):
    temp_converted = os.path.join(OUTPUT_DIR, "temp_audio_converted.wav")
    process_voice_pitch(audio_path, temp_converted, effect)
    shutil.copy(temp_converted, output_path)
    if os.path.exists(temp_converted): os.remove(temp_converted)

@app.post("/convert")
async def convert_media(file: UploadFile = File(...), artist: str = Form(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_extension = file.filename.split(".")[-1].lower()
    is_video = file_extension in ["mp4", "mkv", "avi", "mov"]
    
    output_filename = f"converted_{artist}_{file.filename}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    if is_video:
        process_video_voice(file_location, output_path, artist)
    else:
        process_audio_voice(file_location, output_path, artist)

    return FileResponse(output_path, media_type=file.content_type, filename=output_filename)