const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

// Web Audio APIのAnalyserNodeのセットアップ (グローバルで初期化)
const analyser = audioContext.createAnalyser();
analyser.fftSize = 128;
let dataArray;
let bufferLength;

// 各サウンドの音源とゲインノードを格納するオブジェクト
const sounds = {
    rain: {
        url: 'sounds/rain.mp3',
        buffer: null,
        source: null,
        gainNode: null,
        isPlaying: false
    },
    fire: {
        url: 'sounds/fire.mp3',
        buffer: null,
        source: null,
        gainNode: null,
        isPlaying: false
    },
    cafe: {
        url: 'sounds/cafe.mp3',
        buffer: null,
        source: null,
        gainNode: null,
        isPlaying: false
    },
    wave: {
        url: 'sounds/wave.mp3',
        buffer: null,
        source: null,
        gainNode: null,
        isPlaying: false
    }
};

// オーディオファイルを読み込む関数
async function loadSound(name) {
    try {
        const response = await fetch(sounds[name].url);
        const arrayBuffer = await response.arrayBuffer();
        sounds[name].buffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log(`${name} のサウンドが読み込まれました。`);
    } catch (error) {
        console.error(`サウンド ${name} の読み込みエラー:`, error);
    }
}

// サウンドの再生/停止を切り替える関数
async function toggleSound(name) {
    console.log(`Toggle Sound for: ${name}`);
    console.log(`AudioContext state before resume: ${audioContext.state}`);

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log("AudioContext resumed.");
    }
    console.log(`AudioContext state after resume: ${audioContext.state}`);

    const sound = sounds[name];

    if (sound.isPlaying) {
        if (sound.source) {
            sound.source.stop();
            sound.source.disconnect();
            sound.source = null;
        }
        sound.isPlaying = false;
        document.getElementById(`${name}-button`).textContent = sound.url.split('/')[1].split('.')[0];
    } else {
        if (!sound.buffer) {
            loadSound(name).then(() => playSound(name));
        } else {
            playSound(name);
        }
    }
}

// サウンドを再生する関数
function playSound(name) {
    const sound = sounds[name];
    if (!sound.buffer) {
        console.error(`サウンド ${name} はまだ読み込まれていません。`);
        return;
    }

    sound.source = audioContext.createBufferSource();
    sound.source.buffer = sound.buffer;
    sound.source.loop = true;

    if (!sound.gainNode) {
        sound.gainNode = audioContext.createGain();
        sound.gainNode.gain.value = 1.0; // 初期音量を最大に設定
    }

    // 新しいソースをゲインノードに接続
    sound.source.connect(sound.gainNode);
    console.log(`${name} sound.source connected to sound.gainNode.`);

    // ゲインノードをアナライザーとオーディオ出力にそれぞれ接続
    sound.gainNode.connect(analyser);
    sound.gainNode.connect(audioContext.destination);
    console.log(`${name} sound.gainNode connected to analyser and audioContext.destination.`);

    sound.source.start(0);
    sound.isPlaying = true;
    document.getElementById(`${name}-button`).textContent = `${sound.url.split('/')[1].split('.')[0]} (再生中)`;
}

// Three.js のセットアップ
let scene, camera, renderer, cube;

function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('threejs-container').appendChild(renderer.domElement);

    // AnalyserNodeの初期設定（グローバルで作成済み）
    analyser.fftSize = 128;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    window.addEventListener('resize', onWindowResize, false);
}

// ウィンドウのリサイズ時にカメラのアスペクト比とレンダラーのサイズを調整
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);

    // AnalyserNodeから時間領域データを取得 (デバッグ用)
    analyser.getByteTimeDomainData(dataArray);

    // デバッグ用: dataArrayの内容と最大値をコンソールに出力
    let maxDataValue = 0;
    for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > maxDataValue) {
            maxDataValue = dataArray[i];
        }
    }
    console.log("Raw time domain data (max):", maxDataValue);

    // デバッグ用: dataArrayの先頭10要素をコンソールに出力
    console.log("Raw dataArray (first 10 elements):", dataArray.slice(0, 10));

    // 周波数データの平均値に基づいて立方体のスケールを調整（今回は時間領域データを使用）
    // AnalyserNodeから時間領域データを取得した場合は、値が0-255で中心が128なので、その変動を見る
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        // 128からの差分の絶対値を合計する
        sum += Math.abs(dataArray[i] - 128);
    }
    let average = sum / bufferLength;

    // デバッグ用: averageの値をコンソールに出力
    console.log("Average time domain data (deviation from 128):", average);

    if (cube) {
        // スケールは平均の変動に基づいて調整
        const scale = 1 + average / 64; // 適度な感度になるように調整
        cube.scale.set(scale, scale, scale);
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
    }

    renderer.render(scene, camera);
}

// 各ボタンにイベントリスナーを追加
document.getElementById('rain-button').addEventListener('click', () => toggleSound('rain'));
document.getElementById('fire-button').addEventListener('click', () => toggleSound('fire'));
document.getElementById('cafe-button').addEventListener('click', () => toggleSound('cafe'));
document.getElementById('wave-button').addEventListener('click', () => toggleSound('wave'));

// アプリケーション開始時にすべてのサウンドを事前に読み込む
Object.keys(sounds).forEach(name => loadSound(name));

// ポモドーロタイマーのセットアップ
const timerDisplay = document.getElementById('timer-display');
const startTimerButton = document.getElementById('start-timer-button');
const pauseTimerButton = document.getElementById('pause-timer-button');
const resetTimerButton = document.getElementById('reset-timer-button');

let minutes = 25;
let seconds = 0;
let intervalId = null;
let isRunning = false;

function updateTimerDisplay() {
    const displayMinutes = String(minutes).padStart(2, '0');
    const displaySeconds = String(seconds).padStart(2, '0');
    timerDisplay.textContent = `${displayMinutes}:${displaySeconds}`;
}

function startTimer() {
    if (isRunning) return;

    isRunning = true;
    intervalId = setInterval(() => {
        if (seconds === 0) {
            if (minutes === 0) {
                clearInterval(intervalId);
                isRunning = false;
                alert('時間です！休憩しましょう！');
                resetTimer();
                return;
            }
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        updateTimerDisplay();
    }, 1000);
}

function pauseTimer() {
    clearInterval(intervalId);
    isRunning = false;
}

function resetTimer() {
    clearInterval(intervalId);
    isRunning = false;
    minutes = 25;
    seconds = 0;
    updateTimerDisplay();
}

// ボタンにイベントリスナーを追加 (ポモドーロタイマー)
startTimerButton.addEventListener('click', startTimer);
pauseTimerButton.addEventListener('click', pauseTimer);
resetTimerButton.addEventListener('click', resetTimer);

// タスクリストのセットアップ
const newTaskInput = document.getElementById('new-task-input');
const addTaskButton = document.getElementById('add-task-button');
const tasksList = document.getElementById('tasks');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// タスクを保存する関数
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// タスクをレンダリングする関数
function renderTasks() {
    tasksList.innerHTML = ''; // リストをクリア
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.innerHTML = `
            <span>${task.text}</span>
            <div>
                <button data-action="toggle" data-index="${index}">完了/未完了</button>
                <button data-action="delete" data-index="${index}">削除</button>
            </div>
        `;
        tasksList.appendChild(li);
    });
}

// タスクを追加する関数
function addTask() {
    const taskText = newTaskInput.value.trim();
    if (taskText !== '') {
        tasks.push({ text: taskText, completed: false });
        newTaskInput.value = '';
        saveTasks();
        renderTasks();
    }
}

// タスクの完了状態を切り替える関数
function toggleTaskComplete(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

// タスクを削除する関数
function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

// タスクリストのボタンにイベントリスナーを追加
addTaskButton.addEventListener('click', addTask);
tasksList.addEventListener('click', (e) => {
    const target = e.target;
    if (target.tagName === 'BUTTON') {
        const action = target.dataset.action;
        const index = parseInt(target.dataset.index);
        if (action === 'toggle') {
            toggleTaskComplete(index);
        } else if (action === 'delete') {
            deleteTask(index);
        }
    }
});

// アプリケーション初期化
initThreeJS();
animate();
updateTimerDisplay();
renderTasks();