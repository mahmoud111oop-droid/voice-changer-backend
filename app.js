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
    loadingBarDiv.style.backgroundColor = '#8a2be2'; // إعادة اللون البنفسجي الأصلي للبار
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

    fetch(`${window.location.origin}/convert`, {
    method: "POST",
    body: formData
})
    .then(async response => {
        if (!response.ok) { 
            const errText = await response.text();
            throw new Error(errText || "مشكلة في السيرفر"); 
        }
        return response.blob();
    })
    .then(blob => {
        if (blob.size === 0) {
            throw new Error("الملف الراجع فارغ من السيرفر");
        }
        const fileURL = URL.createObjectURL(blob);
        loadingBarDiv.style.width = '100%';
        resultText.innerText = `✨ اكتمل التعديل بنجاح! شغل النتيجة الآن:`;
        
        if (fileType === 'video') {
            videoPlayer.style.display = 'block';
            videoPlayer.src = fileURL;
            videoPlayer.controls = true;
            videoPlayer.load(); // تحديث المشغل لقراءة الفيديو الجديد
        } else {
            audioPlayer.style.display = 'block';
            audioPlayer.src = fileURL;
            audioPlayer.controls = true;
            audioPlayer.load(); // تحديث المشغل لقراءة الصوت الجديد
        }
    })
    .catch(error => {
        console.error("عطل الـ Fetch:", error);
        resultText.innerText = "❌ عذراً، حصلت مشكلة أثناء معالجة أو تحميل الملف المعدل. تأكد إن السيرفر شغال في الـ VS Code.";
        loadingBarDiv.style.backgroundColor = "#ff0055"; // تحويل البار للون الأحمر عند الخطأ
    });
}