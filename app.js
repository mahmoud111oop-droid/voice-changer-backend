const artists = [
    { id: 'female', name: 'صوت نسائي حاد', icon: '👩‍🎤', desc: 'نبرة رفيعة وحادة' },
    { id: 'cartoon', name: 'صوت كرتون', icon: '👶', desc: 'نبرة طفولية مرحة' },
    { id: 'deep', name: 'صوت رجالي عميق', icon: '🧔', desc: 'نبرة ضخمة وخشنة' },
    { id: 'chipmunk', name: 'صوت السنجاب', icon: '🐿️', desc: 'سريع ومضحك جداً' },
    { id: 'radio', name: 'صوت اللاسلكي', icon: '📻', desc: 'تأثير راديو قديم' },
    { id: 'robot', name: 'مؤثر آلي ريبوت', icon: '🤖', desc: 'نبرة إلكترونية مستقبلية' },
    { id: 'echo', name: 'صدى صوت سينما', icon: '🏛️', desc: 'تأثير قاعة حفلات واسعة' }
];
let selectedFile = null;
let fileType = null;
let selectedVoiceModel = null;

function renderArtists() {
    const grid = document.getElementById('celebritiesGrid');
    grid.innerHTML = '';
    
    artists.forEach(artist => {
        const card = document.createElement('div');
        card.className = 'celeb-card';
        card.id = `card-${artist.id}`;
        card.setAttribute('onclick', `selectVoice('${artist.id}')`);
        
        card.innerHTML = `
            <div class="voice-icon-wrapper">
                <span class="mic-icon">🎙️</span>
                <div class="checkmark">✓</div>
            </div>
            <p>${artist.name}</p>
        `;
        grid.appendChild(card);
    });
}

renderArtists();

function triggerUpload() {
    document.getElementById('mediaInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file;
        
        if (file.type.startsWith('video/')) {
            fileType = 'video';
            document.getElementById('uploadIcon').innerText = '🎬';
            document.getElementById('fileStatus').innerText = `🎬 فيديو جاهز: ${file.name}`;
        } else if (file.type.startsWith('audio/')) {
            fileType = 'audio';
            document.getElementById('uploadIcon').innerText = '🎵';
            document.getElementById('fileStatus').innerText = `🎵 أغنية جاهزة: ${file.name}`;
        }
    }
}

function selectVoice(voiceId) {
    document.querySelectorAll('.celeb-card').forEach(card => card.classList.remove('selected'));
    document.getElementById(`card-${voiceId}`).classList.add('selected');
    selectedVoiceModel = voiceId;
}

function startConversion() {
    if (!selectedFile) {
        alert("يا غالي ارفع ملف الأغنية أو الفيديو الأول! 😉");
        return;
    }
    if (!selectedVoiceModel) {
        alert("اختر الفنان اللي عايز تركب صوته!");
        return;
    }

    const resultSection = document.getElementById('resultSection');
    const loadingBarDiv = document.querySelector('.loading-bar div');
    const resultText = document.getElementById('resultText');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');

    resultSection.style.display = 'block';
    loadingBarDiv.style.width = '0%';
    audioPlayer.style.display = 'none';
    videoPlayer.style.display = 'none';

    const artistName = artists.find(a => a.id === selectedVoiceModel).name;
    if (fileType === 'video') {
        resultText.innerText = `🎬 جاري فصل صوت الفيديو وتحويله إلى نبرة ${artistName}...`;
    } else {
        resultText.innerText = `🎵 جاري عزل اللحن وتحويل الأكابيلا إلى صوت ${artistName}...`;
    }

    setTimeout(() => { loadingBarDiv.style.width = '50%'; }, 100);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("artist", selectedVoiceModel);

    fetch("http://127.0.0.1:8000/convert", {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) { throw new Error("مشكلة في السيرفر"); }
        return response.blob();
    })
    .then(blob => {
        const fileURL = URL.createObjectURL(blob);
        loadingBarDiv.style.width = '100%';
        resultText.innerText = `✨ اكتمل التعديل بنجاح! شغل النتيجة الآن:`;
        
        if (fileType === 'video') {
            videoPlayer.style.display = 'block';
            videoPlayer.src = fileURL;
        } else {
            audioPlayer.style.display = 'block';
            audioPlayer.src = fileURL;
        }
    })
    .catch(error => {
        console.error(error);
        resultText.innerText = "❌ عذراً، السيرفر مش مستجيب. اتأكد إنك مشغل ملف main.py";
        loadingBarDiv.style.backgroundColor = "#ff0055";
    });
}