/**
 * @file main.js
 * @description このアプリケーションのメインスクリプトファイルです。
 *              テーマ管理、ルーティング、UIコンポーネントの初期化など、
 *              アプリケーション全体のエントリーポイントとして機能します。
 */

// アプリケーション全体を管理するメインオブジェクト
const App = {
  /**
   * アプリケーションを初期化します。
   * DOMの読み込みが完了した後に実行されます。
   */
  init() {
    ThemeManager.init();
    UIController.init();
    Router.init();
  },
};

/**
 * テーマ（ライト/ダークモード）の管理を行うオブジェクト
 */
const ThemeManager = {
  htmlElement: document.documentElement,
  themeToggle: null,
  STORAGE_KEY: 'darkMode',

  /**
   * テーマ管理機能を初期化します。
   * ローカルストレージから設定を読み込み、トグルスイッチにイベントリスナーを設定します。
   */
  init() {
    this.themeToggle = document.getElementById('theme-toggle');
    if (!this.themeToggle) return;

    this.loadTheme();
    this.themeToggle.addEventListener('change', this.toggleTheme.bind(this));
  },

  /**
   * ローカルストレージからテーマ設定を読み込み、適用します。
   */
  loadTheme() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const isDarkMode = stored === null ? true : stored === 'enabled';
    this.themeToggle.checked = isDarkMode;
    this.htmlElement.classList.toggle('dark', isDarkMode);
  },

  /**
   * テーマを切り替え、設定をローカルストレージに保存します。
   */
  toggleTheme() {
    const isChecked = this.themeToggle.checked;
    this.htmlElement.classList.toggle('dark', isChecked);
    localStorage.setItem(this.STORAGE_KEY, isChecked ? 'enabled' : 'disabled');
  },
};

/**
 * 各ページで動的に読み込まれるコンテンツに対する
 * イベントリスナーなどの設定を行う関数をまとめたオブジェクト。
 */
const PageScripts = {
  /**
   * トップページのサウンドカードのイベントリスナーを設定します。
   */
  setupTopPage() {
    console.log('Top page loaded and scripts executed.');
    const soundCards = [
      { id: 'rain', name: '雨', file: 'sounds/rain.mp3' },
      { id: 'fire', name: '焚き火', file: 'sounds/fire.mp3' },
      { id: 'cafe', name: 'カフェ', file: 'sounds/cafe.mp3' },
      { id: 'wave', name: '波', file: 'sounds/wave.mp3' },
    ];

    soundCards.forEach(card => {
      SoundManager.loadSound(card.id, card.file);

      const playButton = document.getElementById(`play-${card.id}`);
      const volumeSlider = document.getElementById(`volume-${card.id}`);
      const icon = document.getElementById(`icon-${card.id}`);

      if (playButton && volumeSlider && icon) {
        // 再生/停止ボタンのクリックイベント
        playButton.addEventListener('click', () => {
          const isPlaying = SoundManager.togglePlay(card.id);
          icon.innerHTML = isPlaying
            ? '<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><rect x="5" y="3" width="3" height="12"></rect><rect x="10" y="3" width="3" height="12"></rect></svg>' // Pause Icon
            : '<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><polygon points="5,3 15,9 5,15"></polygon></svg>'; // Play Icon
        });

        // 音量スライダーのイベント
        volumeSlider.addEventListener('input', (e) => {
          SoundManager.setVolume(card.id, e.target.value);
        });
        
        // 初期音量を設定
        SoundManager.setVolume(card.id, volumeSlider.value);
      }
    });
  },
  setupVolumePage() {
    console.log('Volume page loaded and scripts executed.');
    // TODO: 音量調整ページ固有の処理
  },
  setupTimerPage() {
    console.log('Timer page loaded and scripts executed.');
    // TODO: タイマーページ固有の処理
  },
  setupSettingsPage() {
    console.log('Settings page loaded and scripts executed.');
    // TODO: 設定ページ固有の処理
  },
  setupPresetPage() {
    console.log('Preset page loaded and scripts executed.');
    // TODO: プリセットページ固有の処理
  },
};

/**
 * ルーティングとコンテンツの動的読み込みを管理するオブジェクト
 */
const Router = {
  contentContainer: null,
  initialPage: './_toppage.html',

  // 各ページに対応する初期化関数をマッピング
  pageInitializers: {
    _toppage: PageScripts.setupTopPage,
    _volume: PageScripts.setupVolumePage,
    _timer: PageScripts.setupTimerPage,
    _settings: PageScripts.setupSettingsPage,
    _preset: PageScripts.setupPresetPage,
  },

  /**
   * ルーターを初期化します。
   * 初期コンテンツを読み込み、ナビゲーションリンクにイベントリスナーを設定します。
   */
  init() {
    this.contentContainer = document.getElementById('content-container');
    const routeLinks = document.querySelectorAll('.route-link');

    routeLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const href = link.getAttribute('href');
        this.loadContent(href);
      });
    });

    this.loadContent(this.initialPage);
  },

  /**
   * 指定されたURLからコンテンツを非同期で読み込み、表示します。
   * 読み込み後、対応するページの初期化関数を実行します。
   * @param {string} url - 読み込むHTMLファイルのURL
   */
  loadContent(url) {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((html) => {
        this.contentContainer.innerHTML = html;
        this.executePageScript(url);
      })
      .catch((error) => {
        console.error(`コンテンツの読み込みに失敗しました: ${url}`, error);
        this.contentContainer.innerHTML =
          '<p class="text-red-500">コンテンツの読み込みに失敗しました。</p>';
      });
  },

  /**
   * 読み込まれたページに対応するスクリプトを実行します。
   * @param {string} url - 読み込まれたページのURL
   */
  executePageScript(url) {
    // URLからページ名を抽出 (例: '_toppage.html' -> '_toppage')
    const pageName = url.split('/').pop().split('.')[0];
    const initializer = this.pageInitializers[pageName];
    if (typeof initializer === 'function') {
      initializer();
    }
  },
};

/**
 * 音声再生を管理するオブジェクト
 */
const SoundManager = {
  sounds: {}, // { id: { audio: HTMLAudioElement, isPlaying: boolean } }
  
  /**
   * サウンドを読み込み、管理対象に追加します。
   * @param {string} id - サウンドの識別子 (例: 'rain')
   * @param {string} src - 音声ファイルのパス
   */
  loadSound(id, src) {
    if (this.sounds[id]) return; // 既に読み込み済みなら何もしない

    const audio = new Audio(src);
    audio.loop = true;
    this.sounds[id] = {
      audio: audio,
      isPlaying: false,
    };
  },

  /**
   * サウンドの再生/停止を切り替えます。
   * @param {string} id - サウンドの識別子
   */
  togglePlay(id) {
    const sound = this.sounds[id];
    if (!sound) return;

    if (sound.isPlaying) {
      sound.audio.pause();
    } else {
      sound.audio.play();
    }
    sound.isPlaying = !sound.isPlaying;
    return sound.isPlaying;
  },

  /**
   * サウンドの音量を設定します。
   * @param {string} id - サウンドの識別子
   * @param {number} volume - 音量 (0.0 から 1.0)
   */
  setVolume(id, volume) {
    const sound = this.sounds[id];
    if (sound) {
      sound.audio.volume = volume;
    }
  },
};


/**
 * ドロップダウンメニューなど、共通のUIコンポーネントを管理するオブジェクト
 */
const UIController = {
  /**
   * UIコンポーネントを初期化します。
   */
  init() {
    this.setupDropdownMenu();
  },

  /**
   * ドロップダウンメニューの開閉ロジックを設定します。
   */
  setupDropdownMenu() {
    const menuDropdownBtn = document.getElementById('menuDropdownBtn');
    const menuDropdown = document.getElementById('menuDropdown');

    if (!menuDropdownBtn || !menuDropdown) return;

    menuDropdownBtn.addEventListener('click', (event) => {
      event.stopPropagation(); // 親要素へのイベント伝播を停止
      menuDropdown.classList.toggle('hidden');
    });

    // ドキュメントのどこかをクリックしたらメニューを閉じる
    document.addEventListener('click', (event) => {
      if (
        !menuDropdown.classList.contains('hidden') &&
        !menuDropdownBtn.contains(event.target) &&
        !menuDropdown.contains(event.target)
      ) {
        menuDropdown.classList.add('hidden');
      }
    });
  },
};

// DOMの準備ができたらアプリケーションを起動
document.addEventListener('DOMContentLoaded', App.init);

