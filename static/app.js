const uploadForm = document.getElementById("upload-form");
const metadataForm = document.getElementById("metadata-form");
const editorPanel = document.getElementById("editor-panel");
const idleState = document.getElementById("idle-state");
const ipodScreen = document.getElementById("ipod-screen");
const ipodDevice = document.getElementById("ipod-device");
const messageBox = document.getElementById("message-box");
const clickWheel = document.querySelector(".click-wheel");
const uploadButton = document.getElementById("upload-button");
const selectButton = document.getElementById("select-button");
const fileInput = document.getElementById("file-input");
const pickerButton = document.getElementById("picker-button");
const menuButton = document.getElementById("menu-button");
const rewindButton = document.getElementById("rewind-button");
const forwardButton = document.getElementById("forward-button");
const fileSummary = document.getElementById("file-summary");
const guessSummary = document.getElementById("guess-summary");
const convertUploadView = document.getElementById("convert-upload-view");
const convertDropzone = document.getElementById("convert-dropzone");
const convertDetails = document.getElementById("convert-details");
const convertSubmitButton = document.getElementById("convert-submit-button");
const convertFormatValue = document.getElementById("convert-format-value");
const audioSetupPanel = document.getElementById("audio-setup-panel");
const videoSetupPanel = document.getElementById("video-setup-panel");
const optimizeForSelect = document.getElementById("optimize-for");
const videoQualitySelect = document.getElementById("video-quality");
const videoPresetLabel = document.getElementById("video-preset-label");
const videoPresetSummary = document.getElementById("video-preset-summary");
const convertResultView = document.getElementById("convert-result-view");
const convertResultArtwork = document.getElementById("convert-result-artwork");
const convertResultPlaceholder = document.getElementById("convert-result-placeholder");
const convertResultTitle = document.getElementById("convert-result-title");
const convertResultArtist = document.getElementById("convert-result-artist");
const convertResultMeta = document.getElementById("convert-result-meta");
const convertDownloadButton = document.getElementById("convert-download-button");
const screenControlHint = document.getElementById("screen-control-hint");
const libraryPanel = document.getElementById("library-panel");
const coverflowPanel = document.getElementById("coverflow-panel");
const syncPanel = document.getElementById("sync-panel");
const photoViewerPanel = document.getElementById("photo-viewer-panel");
const gamePanel = document.getElementById("game-panel");
const customizePanelScreen = document.getElementById("customize-panel-screen");
const libraryLabel = document.getElementById("library-label");
const libraryTitle = document.getElementById("library-title");
const librarySummary = document.getElementById("library-summary");
const librarySelectionBar = document.getElementById("library-selection-bar");
const spotifySearchInput = document.getElementById("spotify-search-input");
const libraryList = document.getElementById("library-list");
const coverflowTitle = document.getElementById("coverflow-title");
const coverflowSummary = document.getElementById("coverflow-summary");
const coverflowAlbum = document.getElementById("coverflow-album");
const coverflowArtist = document.getElementById("coverflow-artist");
const coverflowLeft = document.getElementById("coverflow-left");
const coverflowCenter = document.getElementById("coverflow-center");
const coverflowRight = document.getElementById("coverflow-right");
const syncScreenBody = document.getElementById("sync-screen-body");
const syncIconSet = document.getElementById("sync-icon-set");
const syncHeadline = document.getElementById("sync-headline");
const syncSubheadline = document.getElementById("sync-subheadline");
const syncAction = document.getElementById("sync-action");
const syncActionLabel = document.getElementById("sync-action-label");
const photoViewerImage = document.getElementById("photo-viewer-image");
const photoViewerPlaceholder = document.getElementById("photo-viewer-placeholder");
const photoViewerTitle = document.getElementById("photo-viewer-title");
const photoViewerCounter = document.getElementById("photo-viewer-counter");
const gameStatusTitle = document.getElementById("game-status-title");
const gameScreenBody = document.getElementById("game-screen-body");
const gameHud = document.getElementById("game-hud");
const gameScoreLabel = document.getElementById("game-score-label");
const gameRoundLabel = document.getElementById("game-round-label");
const gameCanvas = document.getElementById("game-canvas");
const gameMessageScreen = document.getElementById("game-message-screen");
const gamePauseOverlay = document.getElementById("game-pause-overlay");
const gameTitle = document.getElementById("game-title");
const gameSubtitle = document.getElementById("game-subtitle");
const gameInstructions = document.getElementById("game-instructions");
const musicQuizPanel = document.getElementById("music-quiz-panel");
const musicQuizPromptLabel = document.getElementById("music-quiz-prompt-label");
const musicQuizPrompt = document.getElementById("music-quiz-prompt");
const musicQuizChoices = document.getElementById("music-quiz-choices");
const gameLives = document.getElementById("game-lives");
const gameFooter = document.getElementById("game-footer");
const nowPlayingPanel = document.getElementById("now-playing-panel");
const playerTitle = document.getElementById("player-title");
const playerArtist = document.getElementById("player-artist");
const playerAlbum = document.getElementById("player-album");
const playerElapsed = document.getElementById("player-elapsed");
const playerRemaining = document.getElementById("player-remaining");
const playerProgressFill = document.getElementById("player-progress-fill");
const downloadNowButton = document.getElementById("download-now-button");
const playbackButton = document.getElementById("playback-button");
const playerArtwork = document.getElementById("player-artwork");
const artworkPlaceholder = document.getElementById("artwork-placeholder");
const previewAudio = document.getElementById("preview-audio");

const AUDIO_METADATA_FIELDS = ["title", "artist", "album", "genre"];
const VIDEO_METADATA_FIELDS = {
  title: "video-title",
  show: "video-show",
  episodeTitle: "video-episode-title",
  seasonNumber: "video-season-number",
  episodeNumber: "video-episode-number",
  artist: "video-artist",
};
const MEDIA_EXTENSIONS = [".mp3", ".m4a", ".aac", ".wav", ".aiff", ".flac", ".ogg", ".mp4", ".m4v", ".mov", ".avi", ".mkv"];
const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const PHOTO_LIBRARY_SESSION_KEY = "swagpods.photoLibrary.v1";
const BRICK_CANVAS_WIDTH = 320;
const BRICK_CANVAS_HEIGHT = 190;
const BRICK_ROWS = 4;
const BRICK_COLUMNS = 6;
const BRICK_PADDING = 6;
const BRICK_TOP_OFFSET = 22;
const BRICK_SIDE_MARGIN = 10;
const MUSIC_QUIZ_ROUNDS = 5;
const WHEEL_RING_INNER_RATIO = 0.36;
const WHEEL_RING_OUTER_RATIO = 0.92;
const WHEEL_RING_HYSTERESIS = 0.08;
const WHEEL_DETENT_ANGLE = 0.15;
const WHEEL_MAX_DELTA = 0.55;
const WHEEL_DELTA_SMOOTHING = 0.32;
const WHEEL_MIN_DELTA = 0.012;
const WHEEL_RADIAL_DRIFT_LIMIT = 0.12;
const WHEEL_ACCELERATION_START = 0.008;
const WHEEL_ACCELERATION_FACTOR = 18;
const WHEEL_ACCELERATION_CAP = 0.85;
const WHEEL_FAST_SPIN_SPEED = 0.022;
const WHEEL_MEDIUM_SPIN_SPEED = 0.012;
const WHEEL_DIRECTION_LOCK_ANGLE = 0.055;
const WHEEL_SCROLL_STEP_DELTA = 24;
const WHEEL_POINTER_PROFILES = {
  coarse: {
    detentAngle: WHEEL_DETENT_ANGLE,
    maxDelta: WHEEL_MAX_DELTA,
    smoothing: WHEEL_DELTA_SMOOTHING,
    minDelta: WHEEL_MIN_DELTA,
    radialDriftLimit: WHEEL_RADIAL_DRIFT_LIMIT,
    accelStart: WHEEL_ACCELERATION_START,
    accelFactor: WHEEL_ACCELERATION_FACTOR,
    accelCap: WHEEL_ACCELERATION_CAP,
    fastSpinSpeed: WHEEL_FAST_SPIN_SPEED,
    mediumSpinSpeed: WHEEL_MEDIUM_SPIN_SPEED,
    directionLockAngle: WHEEL_DIRECTION_LOCK_ANGLE,
    maxStepsFast: 4,
    maxStepsMedium: 2,
  },
  fine: {
    detentAngle: 0.13,
    maxDelta: 0.42,
    smoothing: 0.2,
    minDelta: 0.006,
    radialDriftLimit: 0.09,
    accelStart: 0.005,
    accelFactor: 22,
    accelCap: 1.05,
    fastSpinSpeed: 0.016,
    mediumSpinSpeed: 0.009,
    directionLockAngle: 0.042,
    maxStepsFast: 5,
    maxStepsMedium: 3,
  },
};
const BRICK_LEVEL_LAYOUTS = [
  [
    [1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 1],
    [1, 1, 2, 2, 1, 1],
    [1, 1, 1, 1, 1, 1],
  ],
  [
    [0, 2, 1, 1, 2, 0],
    [1, 2, 2, 2, 2, 1],
    [2, 1, 2, 2, 1, 2],
    [1, 1, 1, 1, 1, 1],
  ],
  [
    [2, 2, 1, 1, 2, 2],
    [1, 2, 2, 2, 2, 1],
    [2, 1, 2, 2, 1, 2],
    [1, 2, 1, 1, 2, 1],
  ],
];
const HAPTIC_PATTERNS = {
  tick: { pattern: 6, cooldown: 26 },
  navigate: { pattern: 8, cooldown: 38 },
  back: { pattern: 14, cooldown: 68 },
  transport: { pattern: 12, cooldown: 58 },
  select: { pattern: 18, cooldown: 82 },
  confirm: { pattern: [12, 22, 16], cooldown: 140 },
  success: { pattern: [14, 28, 18, 32, 24], cooldown: 260 },
};
const HAPTIC_AUDIO_PROFILES = {
  tick: {
    cooldown: 32,
    pulses: [{ delay: 0, duration: 0.012, frequency: 920, gain: 0.016 }],
    visual: "tick",
  },
  navigate: {
    cooldown: 42,
    pulses: [{ delay: 0, duration: 0.014, frequency: 860, gain: 0.019 }],
    visual: "tick",
  },
  back: {
    cooldown: 72,
    pulses: [{ delay: 0, duration: 0.018, frequency: 700, gain: 0.024 }],
    visual: "soft",
  },
  transport: {
    cooldown: 62,
    pulses: [{ delay: 0, duration: 0.015, frequency: 780, gain: 0.021 }],
    visual: "soft",
  },
  select: {
    cooldown: 86,
    pulses: [{ delay: 0, duration: 0.022, frequency: 760, gain: 0.03 }],
    visual: "strong",
  },
  confirm: {
    cooldown: 145,
    pulses: [
      { delay: 0, duration: 0.016, frequency: 780, gain: 0.026 },
      { delay: 0.04, duration: 0.018, frequency: 920, gain: 0.03 },
    ],
    visual: "strong",
  },
  success: {
    cooldown: 270,
    pulses: [
      { delay: 0, duration: 0.014, frequency: 760, gain: 0.028 },
      { delay: 0.05, duration: 0.017, frequency: 900, gain: 0.032 },
      { delay: 0.11, duration: 0.02, frequency: 1080, gain: 0.036 },
    ],
    visual: "success",
  },
};
const DEVICE_PRESETS = {
  "ipod-classic-5g": {
    label: "iPod Classic 5th Gen",
    audioSummary: "MP3 128 kbps",
    videoSummary: "320×240 H.264 / AAC",
  },
  "ipod-classic-5-5g": {
    label: "iPod Classic 5.5th Gen",
    audioSummary: "MP3 160 kbps",
    videoSummary: "320×240 H.264 / AAC",
  },
  "ipod-classic-6g": {
    label: "iPod Classic 6th Gen",
    audioSummary: "MP3 160 kbps",
    videoSummary: "640×480 H.264 / AAC",
  },
  "ipod-classic-7g": {
    label: "iPod Classic 7th Gen",
    audioSummary: "MP3 192 kbps",
    videoSummary: "640×480 H.264 / AAC",
  },
  "ipod-nano": {
    label: "iPod Nano",
    audioSummary: "MP3 128 kbps",
    videoSummary: "320×240 H.264 / AAC",
  },
  "ipod-video": {
    label: "iPod Video",
    audioSummary: "MP3 160 kbps",
    videoSummary: "320×240 H.264 / AAC",
  },
};
const VISIBLE_LIBRARY_ITEMS = 6;
const LIBRARY_ROW_HEIGHT = 35;
const LIBRARY_ROW_GAP = 0;
const GAME_LIBRARY_ITEMS = [
  { id: "brick", title: "Brick", meta: "Arcade", implemented: true },
  { id: "music-quiz", title: "Music Quiz", meta: "Library", implemented: true },
  { id: "parachute", title: "Parachute", meta: "Soon", implemented: false },
  { id: "solitaire", title: "Solitaire", meta: "Soon", implemented: false },
];
let uploadToken = "";
let isExporting = false;
let currentSong = null;
let lastConvertedSong = null;
let librarySongs = [];
let libraryPhotos = [];
let currentPhotoId = "";
let currentGame = null;
let highlightedSongId = "";
let screenMode = "library";
let pendingUploads = [];
let activeUploadIndex = 0;
let selectedIndex = 0;
let previousScreenMode = "library";
let wheelDrag = null;
let librarySelectionPulseTimer = null;
let libraryPath = ["main"];
let screenScrollAccumulator = 0;
let screenScrollDirection = 0;
let syncPollTimer = null;
let brickLoopTimer = null;
let brickCountdownTimer = null;
let syncViewState = {
  state: "no_device",
  headline: "Connect iPod to sync",
  subheadline: "",
  actionLabel: "",
  canStart: false,
  busy: false,
};
let spotifyViewState = {
  configured: false,
  connected: false,
  profileName: "",
  profileImageUrl: "",
  playlists: [],
  error: "",
  scopes: "",
};
let spotifyPlayerState = {
  connected: false,
  hasActiveDevice: false,
  isPlaying: false,
  progressMs: 0,
  deviceName: "",
  deviceType: "",
  deviceId: "",
  contextUri: "",
  shuffleEnabled: false,
  track: null,
};
let spotifyPlayerPollTimer = null;
let spotifyPlaybackContext = {
  selectedTrack: null,
  selectedContextUri: "",
  lastTrack: null,
  lastContextUri: "",
};
let spotifyLibraryData = {
  playlists: [],
  albums: [],
  artists: [],
  tracks: [],
  loading: false,
  loaded: false,
  searchQuery: "",
  searchLoading: false,
  searchError: "",
  searchResults: [],
  warnings: [],
  playlistDetails: {},
  albumDetails: {},
  artistDetails: {},
};
let spotifySdkPlayer = null;
let spotifySdkDeviceId = "";
let spotifySdkReady = false;
let spotifySdkInitPromise = null;
let spotifySearchDebounceTimer = null;
const SPOTIFY_SDK_DEVICE_WAIT_MS = 250;
const SPOTIFY_SDK_DEVICE_WAIT_ATTEMPTS = 12;
const SPOTIFY_PKCE_STORAGE_KEY = "swagpods.spotify.pkce";
const SPOTIFY_AUTH_STORAGE_KEY = "swagpods.spotify.auth";
const REQUIRED_SPOTIFY_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-follow-read",
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-modify-playback-state",
  "streaming",
];

function logSpotifyConsole(level, message, detail = undefined) {
  if (typeof console === "undefined") {
    return;
  }
  const method = typeof console[level] === "function" ? level : "log";
  if (detail === undefined) {
    console[method]("[SwagPods Spotify]", message);
    return;
  }
  console[method]("[SwagPods Spotify]", message, detail);
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function clearSpotifySdkState(reason = "") {
  if (reason) {
    logSpotifyConsole("info", "Resetting Spotify SDK state", {
      reason,
      deviceId: spotifySdkDeviceId || "",
    });
  }
  if (spotifySdkPlayer && typeof spotifySdkPlayer.disconnect === "function") {
    try {
      spotifySdkPlayer.disconnect();
    } catch (error) {
      logSpotifyConsole("warn", "Spotify SDK disconnect failed", {
        reason,
        error: error.message || String(error),
      });
    }
  }
  spotifySdkPlayer = null;
  spotifySdkDeviceId = "";
  spotifySdkReady = false;
}

const haptics = (() => {
  const lastFireTimes = new Map();
  const activeVisualClasses = [
    "is-feedback-tick",
    "is-feedback-soft",
    "is-feedback-strong",
    "is-feedback-success",
  ];
  let audioContext = null;

  function isTouchLikeDevice() {
    return (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      navigator.maxTouchPoints > 0 &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches
    );
  }

  function supportsVibration() {
    return (
      isTouchLikeDevice() &&
      typeof navigator.vibrate === "function" &&
      navigator.vibrate !== undefined
    );
  }

  function getAudioContext() {
    if (!isTouchLikeDevice() || typeof window === "undefined") {
      return null;
    }
    if (!audioContext) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) {
        return null;
      }
      audioContext = new AudioContextCtor();
    }
    return audioContext;
  }

  function prime() {
    const context = getAudioContext();
    if (context && context.state === "suspended") {
      void context.resume().catch(() => {});
    }
  }

  function playAudioFeedback(kind) {
    const profile = HAPTIC_AUDIO_PROFILES[kind];
    const context = getAudioContext();
    if (!profile || !context) {
      return;
    }

    prime();
    const startAt = context.currentTime + 0.001;
    profile.pulses.forEach((pulse) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(pulse.frequency, startAt + pulse.delay);
      gainNode.gain.setValueAtTime(0.0001, startAt + pulse.delay);
      gainNode.gain.exponentialRampToValueAtTime(pulse.gain, startAt + pulse.delay + 0.004);
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        startAt + pulse.delay + pulse.duration
      );
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(startAt + pulse.delay);
      oscillator.stop(startAt + pulse.delay + pulse.duration + 0.012);
    });
  }

  function pulseVisual(kind) {
    if (!isTouchLikeDevice() || !clickWheel) {
      return;
    }

    const profile = HAPTIC_AUDIO_PROFILES[kind];
    const visualClass =
      profile?.visual === "success"
        ? "is-feedback-success"
        : profile?.visual === "strong"
          ? "is-feedback-strong"
          : profile?.visual === "soft"
            ? "is-feedback-soft"
            : "is-feedback-tick";

    activeVisualClasses.forEach((className) => clickWheel.classList.remove(className));
    void clickWheel.offsetWidth;
    clickWheel.classList.add(visualClass);
    window.setTimeout(() => {
      clickWheel.classList.remove(visualClass);
    }, 170);
  }

  function fire(kind) {
    const config = supportsVibration() ? HAPTIC_PATTERNS[kind] : HAPTIC_AUDIO_PROFILES[kind];
    if (!config || !isTouchLikeDevice()) {
      return;
    }

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const lastFiredAt = lastFireTimes.get(kind) || 0;
    if (now - lastFiredAt < config.cooldown) {
      return;
    }

    lastFireTimes.set(kind, now);
    if (supportsVibration()) {
      navigator.vibrate(HAPTIC_PATTERNS[kind].pattern);
    } else {
      playAudioFeedback(kind);
      pulseVisual(kind);
    }
  }

  return {
    prime,
    tick() {
      fire("tick");
    },
    navigate() {
      fire("navigate");
    },
    back() {
      fire("back");
    },
    transport() {
      fire("transport");
    },
    select() {
      fire("select");
    },
    confirm() {
      fire("confirm");
    },
    success() {
      fire("success");
    },
  };
})();

const FACEPLATE_THEMES = {
  classic: {
    "--device-shell-start": "#ffffff",
    "--device-shell-mid": "#f4f4f4",
    "--device-shell-end": "#ececec",
    "--device-shell-glow": "rgba(84, 84, 84, 0.42)",
    "--device-shell-overlay": "linear-gradient(145deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.08) 42%, rgba(255, 255, 255, 0.2) 100%)",
    "--device-shell-outline": "rgba(255, 255, 255, 0.42)",
    "--device-shell-reflection": "linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.06) 18%, rgba(255, 255, 255, 0.02) 46%, rgba(255, 255, 255, 0.12) 100%)",
    "--device-shell-vignette": "linear-gradient(180deg, rgba(28, 34, 40, 0) 0%, rgba(28, 34, 40, 0.03) 100%)",
    "--device-shell-diffusion": "0px",
    "--device-shell-edge-shadow": "inset 0 0 2.2em rgba(84, 84, 84, 0.42)",
    "--device-brand-color": "#b8bcc0",
  },
  graphite: {
    "--device-shell-start": "#69707a",
    "--device-shell-mid": "#4d545d",
    "--device-shell-end": "#353a41",
    "--device-shell-glow": "rgba(20, 23, 27, 0.48)",
    "--device-shell-overlay": "linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 42%, rgba(255, 255, 255, 0.08) 100%)",
    "--device-shell-outline": "rgba(255, 255, 255, 0.1)",
    "--device-shell-reflection": "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 18%, rgba(255, 255, 255, 0.01) 46%, rgba(255, 255, 255, 0.06) 100%)",
    "--device-shell-vignette": "linear-gradient(180deg, rgba(16, 18, 22, 0.02) 0%, rgba(10, 12, 16, 0.14) 100%)",
    "--device-shell-diffusion": "0px",
    "--device-shell-edge-shadow": "inset 0 0 2.2em rgba(20, 23, 27, 0.48)",
    "--device-brand-color": "#d4dae0",
  },
  blue: {
    "--device-shell-start": "#edf4fb",
    "--device-shell-mid": "#d8e5f0",
    "--device-shell-end": "#bdcfdf",
    "--device-shell-glow": "rgba(79, 96, 118, 0.28)",
    "--device-shell-overlay": "linear-gradient(145deg, rgba(255, 255, 255, 0.36) 0%, rgba(255, 255, 255, 0.06) 42%, rgba(255, 255, 255, 0.16) 100%)",
    "--device-shell-outline": "rgba(255, 255, 255, 0.28)",
    "--device-shell-reflection": "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.06) 18%, rgba(255, 255, 255, 0.02) 46%, rgba(255, 255, 255, 0.12) 100%)",
    "--device-shell-vignette": "linear-gradient(180deg, rgba(41, 57, 78, 0) 0%, rgba(41, 57, 78, 0.06) 100%)",
    "--device-shell-diffusion": "0px",
    "--device-shell-edge-shadow": "inset 0 0 2.2em rgba(79, 96, 118, 0.28)",
    "--device-brand-color": "#7f95ad",
  },
  rose: {
    "--device-shell-start": "#fbefef",
    "--device-shell-mid": "#eedddb",
    "--device-shell-end": "#dfc7c5",
    "--device-shell-glow": "rgba(112, 85, 85, 0.24)",
    "--device-shell-overlay": "linear-gradient(145deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.08) 42%, rgba(255, 255, 255, 0.18) 100%)",
    "--device-shell-outline": "rgba(255, 255, 255, 0.28)",
    "--device-shell-reflection": "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.06) 18%, rgba(255, 255, 255, 0.02) 46%, rgba(255, 255, 255, 0.1) 100%)",
    "--device-shell-vignette": "linear-gradient(180deg, rgba(69, 43, 48, 0) 0%, rgba(69, 43, 48, 0.06) 100%)",
    "--device-shell-diffusion": "0px",
    "--device-shell-edge-shadow": "inset 0 0 2.2em rgba(112, 85, 85, 0.24)",
    "--device-brand-color": "#b69494",
  },
  clear: {
    "--device-shell-start": "rgba(245, 247, 251, 0.88)",
    "--device-shell-mid": "rgba(219, 226, 233, 0.72)",
    "--device-shell-end": "rgba(197, 204, 212, 0.62)",
    "--device-shell-glow": "rgba(112, 120, 132, 0.2)",
    "--device-shell-overlay": "linear-gradient(145deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.12) 40%, rgba(255, 255, 255, 0.28) 100%)",
    "--device-shell-outline": "rgba(255, 255, 255, 0.42)",
    "--device-shell-reflection": "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.12) 18%, rgba(255, 255, 255, 0.04) 46%, rgba(255, 255, 255, 0.18) 100%)",
    "--device-shell-vignette": "linear-gradient(180deg, rgba(48, 55, 63, 0.01) 0%, rgba(48, 55, 63, 0.12) 100%)",
    "--device-shell-diffusion": "1.8px",
    "--device-shell-edge-shadow": "inset 0 0 2.6em rgba(91, 100, 111, 0.24)",
    "--device-brand-color": "#98a2ad",
    "--hardware-opacity": "0.78",
    "--hardware-board": "rgba(96, 109, 118, 0.46)",
    "--hardware-board-secondary": "rgba(127, 137, 146, 0.34)",
    "--hardware-chip": "rgba(54, 60, 66, 0.52)",
    "--hardware-ribbon": "rgba(193, 149, 102, 0.46)",
    "--hardware-trace": "rgba(203, 175, 138, 0.44)",
    "--hardware-anchor": "rgba(128, 136, 144, 0.4)",
    "--hardware-blur": "0px",
    "--hardware-saturation": "1.05",
    "--hardware-brightness": "0.98",
  },
  "frosted-clear": {
    "--device-shell-start": "rgba(243, 247, 250, 0.94)",
    "--device-shell-mid": "rgba(222, 228, 235, 0.84)",
    "--device-shell-end": "rgba(205, 214, 223, 0.76)",
    "--device-shell-glow": "rgba(118, 124, 132, 0.16)",
    "--device-shell-overlay": "linear-gradient(145deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 255, 255, 0.16) 40%, rgba(255, 255, 255, 0.32) 100%)",
    "--device-shell-outline": "rgba(255, 255, 255, 0.48)",
    "--device-shell-reflection": "linear-gradient(180deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.16) 18%, rgba(255, 255, 255, 0.06) 46%, rgba(255, 255, 255, 0.2) 100%)",
    "--device-shell-vignette": "linear-gradient(180deg, rgba(64, 70, 78, 0.01) 0%, rgba(64, 70, 78, 0.08) 100%)",
    "--device-shell-diffusion": "4px",
    "--device-shell-edge-shadow": "inset 0 0 2.6em rgba(120, 128, 136, 0.18)",
    "--device-brand-color": "#a5afb8",
    "--hardware-opacity": "0.52",
    "--hardware-board": "rgba(106, 118, 126, 0.38)",
    "--hardware-board-secondary": "rgba(133, 142, 150, 0.28)",
    "--hardware-chip": "rgba(60, 66, 72, 0.42)",
    "--hardware-ribbon": "rgba(198, 158, 118, 0.34)",
    "--hardware-trace": "rgba(208, 182, 146, 0.3)",
    "--hardware-anchor": "rgba(132, 140, 148, 0.32)",
    "--hardware-blur": "1.8px",
    "--hardware-saturation": "0.82",
    "--hardware-brightness": "1.04",
  },
  "smoke-clear": {
    "--device-shell-start": "rgba(117, 126, 138, 0.92)",
    "--device-shell-mid": "rgba(84, 92, 102, 0.82)",
    "--device-shell-end": "rgba(61, 67, 76, 0.86)",
    "--device-shell-glow": "rgba(31, 35, 42, 0.32)",
    "--device-shell-overlay": "linear-gradient(145deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.04) 40%, rgba(255, 255, 255, 0.1) 100%)",
    "--device-shell-outline": "rgba(214, 221, 229, 0.12)",
    "--device-shell-reflection": "linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.04) 18%, rgba(255, 255, 255, 0.01) 46%, rgba(255, 255, 255, 0.08) 100%)",
    "--device-shell-vignette": "linear-gradient(180deg, rgba(15, 18, 22, 0.04) 0%, rgba(15, 18, 22, 0.18) 100%)",
    "--device-shell-diffusion": "1.2px",
    "--device-shell-edge-shadow": "inset 0 0 2.6em rgba(24, 28, 34, 0.42)",
    "--device-brand-color": "#d5dce4",
    "--hardware-opacity": "0.56",
    "--hardware-board": "rgba(141, 151, 162, 0.34)",
    "--hardware-board-secondary": "rgba(166, 174, 183, 0.24)",
    "--hardware-chip": "rgba(225, 230, 236, 0.18)",
    "--hardware-ribbon": "rgba(208, 170, 124, 0.28)",
    "--hardware-trace": "rgba(221, 192, 152, 0.28)",
    "--hardware-anchor": "rgba(202, 209, 217, 0.24)",
    "--hardware-blur": "0.4px",
    "--hardware-saturation": "0.88",
    "--hardware-brightness": "0.88",
  },
  "ice-blue-clear": {
    "--device-shell-start": "rgba(229, 243, 252, 0.94)",
    "--device-shell-mid": "rgba(195, 221, 237, 0.8)",
    "--device-shell-end": "rgba(168, 199, 220, 0.72)",
    "--device-shell-glow": "rgba(76, 111, 137, 0.22)",
    "--device-shell-overlay": "linear-gradient(145deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.12) 40%, rgba(255, 255, 255, 0.28) 100%)",
    "--device-shell-outline": "rgba(255, 255, 255, 0.36)",
    "--device-shell-reflection": "linear-gradient(180deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.12) 18%, rgba(255, 255, 255, 0.04) 46%, rgba(255, 255, 255, 0.18) 100%)",
    "--device-shell-vignette": "linear-gradient(180deg, rgba(40, 74, 102, 0.01) 0%, rgba(40, 74, 102, 0.08) 100%)",
    "--device-shell-diffusion": "2.2px",
    "--device-shell-edge-shadow": "inset 0 0 2.6em rgba(74, 104, 129, 0.24)",
    "--device-brand-color": "#7ea0b7",
    "--hardware-opacity": "0.66",
    "--hardware-board": "rgba(84, 116, 138, 0.34)",
    "--hardware-board-secondary": "rgba(114, 147, 167, 0.24)",
    "--hardware-chip": "rgba(58, 74, 88, 0.4)",
    "--hardware-ribbon": "rgba(190, 151, 107, 0.34)",
    "--hardware-trace": "rgba(205, 179, 145, 0.34)",
    "--hardware-anchor": "rgba(104, 132, 150, 0.28)",
    "--hardware-blur": "0.6px",
    "--hardware-saturation": "1.04",
    "--hardware-brightness": "0.98",
  },
  "pink-clear": {
    "--device-shell-start": "rgba(252, 231, 236, 0.92)",
    "--device-shell-mid": "rgba(240, 194, 205, 0.82)",
    "--device-shell-end": "rgba(221, 171, 183, 0.72)",
    "--device-shell-glow": "rgba(133, 86, 98, 0.2)",
    "--device-shell-overlay": "linear-gradient(145deg, rgba(255, 255, 255, 0.56) 0%, rgba(255, 255, 255, 0.1) 40%, rgba(255, 255, 255, 0.26) 100%)",
    "--device-shell-outline": "rgba(255, 255, 255, 0.34)",
    "--device-shell-reflection": "linear-gradient(180deg, rgba(255, 255, 255, 0.36) 0%, rgba(255, 255, 255, 0.11) 18%, rgba(255, 255, 255, 0.03) 46%, rgba(255, 255, 255, 0.16) 100%)",
    "--device-shell-vignette": "linear-gradient(180deg, rgba(96, 50, 62, 0.01) 0%, rgba(96, 50, 62, 0.08) 100%)",
    "--device-shell-diffusion": "2px",
    "--device-shell-edge-shadow": "inset 0 0 2.6em rgba(127, 82, 93, 0.22)",
    "--device-brand-color": "#ba8592",
    "--hardware-opacity": "0.64",
    "--hardware-board": "rgba(132, 103, 120, 0.32)",
    "--hardware-board-secondary": "rgba(162, 126, 142, 0.24)",
    "--hardware-chip": "rgba(75, 57, 66, 0.4)",
    "--hardware-ribbon": "rgba(201, 162, 125, 0.34)",
    "--hardware-trace": "rgba(213, 183, 151, 0.32)",
    "--hardware-anchor": "rgba(154, 119, 132, 0.28)",
    "--hardware-blur": "0.6px",
    "--hardware-saturation": "1.04",
    "--hardware-brightness": "0.98",
  },
  "green-clear": {
    "--device-shell-start": "rgba(190, 236, 84, 0.92)",
    "--device-shell-mid": "rgba(123, 180, 43, 0.82)",
    "--device-shell-end": "rgba(65, 112, 18, 0.78)",
    "--device-shell-glow": "rgba(32, 66, 10, 0.42)",
    "--device-shell-overlay": "linear-gradient(145deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.1) 20%, rgba(255, 255, 255, 0.04) 48%, rgba(255, 255, 255, 0.22) 100%)",
    "--device-shell-outline": "rgba(163, 219, 72, 0.7)",
    "--device-shell-reflection": "linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.16) 14%, rgba(255, 255, 255, 0.05) 32%, rgba(255, 255, 255, 0.12) 64%, rgba(255, 255, 255, 0.18) 100%)",
    "--device-shell-vignette": "linear-gradient(180deg, rgba(18, 35, 7, 0.02) 0%, rgba(16, 32, 7, 0.18) 100%)",
    "--device-shell-diffusion": "0.45px",
    "--device-shell-edge-shadow": "inset 0 0 0 1px rgba(220, 255, 157, 0.22), inset 0 0 1.5em rgba(31, 67, 8, 0.22), inset 0 -12px 22px rgba(12, 28, 4, 0.18)",
    "--device-brand-color": "rgba(49, 63, 34, 0.18)",
    "--hardware-opacity": "0.8",
    "--hardware-board": "rgba(40, 94, 21, 0.72)",
    "--hardware-board-secondary": "rgba(55, 123, 31, 0.54)",
    "--hardware-chip": "rgba(20, 41, 12, 0.76)",
    "--hardware-ribbon": "rgba(188, 124, 44, 0.56)",
    "--hardware-trace": "rgba(183, 219, 94, 0.26)",
    "--hardware-anchor": "rgba(145, 169, 106, 0.48)",
    "--hardware-blur": "0px",
    "--hardware-saturation": "1.06",
    "--hardware-brightness": "0.9",
  },
};

const FACEPLATE_RESET = {
  "--device-shell-reflection": "linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.06) 18%, rgba(255, 255, 255, 0.02) 46%, rgba(255, 255, 255, 0.12) 100%)",
  "--device-shell-vignette": "linear-gradient(180deg, rgba(28, 34, 40, 0) 0%, rgba(28, 34, 40, 0.03) 100%)",
  "--device-shell-diffusion": "0px",
  "--device-shell-edge-shadow": "inset 0 0 2.2em rgba(84, 84, 84, 0.42)",
  "--hardware-opacity": "0",
  "--hardware-board": "rgba(90, 103, 112, 0.44)",
  "--hardware-board-secondary": "rgba(122, 131, 139, 0.32)",
  "--hardware-chip": "rgba(54, 60, 66, 0.5)",
  "--hardware-ribbon": "rgba(188, 143, 94, 0.44)",
  "--hardware-trace": "rgba(194, 164, 124, 0.42)",
  "--hardware-anchor": "rgba(120, 127, 134, 0.38)",
  "--hardware-blur": "0px",
  "--hardware-saturation": "0.92",
  "--hardware-brightness": "1",
};

const WHEEL_THEMES = {
  classic: {
    "--wheel-surface-start": "#ffffff",
    "--wheel-surface-mid": "#f7f7f7",
    "--wheel-surface-low": "#efefef",
    "--wheel-surface-end": "#e2e3e5",
    "--wheel-surface-overlay": "radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.58) 0%, rgba(255, 255, 255, 0.08) 48%, rgba(255, 255, 255, 0) 100%)",
    "--wheel-center-start": "#efefef",
    "--wheel-center-end": "#ececed",
    "--wheel-center-border": "#d6d8db",
    "--wheel-border": "#c9ccd1",
    "--wheel-text": "#7b7f86",
  },
  silver: {
    "--wheel-surface-start": "#fafafa",
    "--wheel-surface-mid": "#ececee",
    "--wheel-surface-low": "#dcdee2",
    "--wheel-surface-end": "#c9cdd4",
    "--wheel-surface-overlay": "radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.54) 0%, rgba(255, 255, 255, 0.08) 48%, rgba(255, 255, 255, 0) 100%)",
    "--wheel-center-start": "#eceff2",
    "--wheel-center-end": "#d7dce1",
    "--wheel-center-border": "#c4cad1",
    "--wheel-border": "#bcc1c8",
    "--wheel-text": "#6a727a",
  },
  charcoal: {
    "--wheel-surface-start": "#70767d",
    "--wheel-surface-mid": "#5c6168",
    "--wheel-surface-low": "#494e56",
    "--wheel-surface-end": "#3a3f47",
    "--wheel-surface-overlay": "radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.04) 48%, rgba(255, 255, 255, 0) 100%)",
    "--wheel-center-start": "#676d75",
    "--wheel-center-end": "#50555d",
    "--wheel-center-border": "#5d636b",
    "--wheel-border": "#4f545b",
    "--wheel-text": "#edf0f4",
  },
  aqua: {
    "--wheel-surface-start": "#eef7fa",
    "--wheel-surface-mid": "#dcecf2",
    "--wheel-surface-low": "#c6dde7",
    "--wheel-surface-end": "#afcbda",
    "--wheel-surface-overlay": "radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.58) 0%, rgba(255, 255, 255, 0.08) 48%, rgba(255, 255, 255, 0) 100%)",
    "--wheel-center-start": "#d9e9ef",
    "--wheel-center-end": "#c8dbe4",
    "--wheel-center-border": "#b5ccd7",
    "--wheel-border": "#a8c0cc",
    "--wheel-text": "#557284",
  },
  white: {
    "--wheel-surface-start": "#ffffff",
    "--wheel-surface-mid": "#f8f8f8",
    "--wheel-surface-low": "#efefef",
    "--wheel-surface-end": "#e5e6e8",
    "--wheel-surface-overlay": "radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.08) 48%, rgba(255, 255, 255, 0) 100%)",
    "--wheel-center-start": "#f4f4f4",
    "--wheel-center-end": "#eceff1",
    "--wheel-center-border": "#d9dde0",
    "--wheel-border": "#d1d5d9",
    "--wheel-text": "#7b7f86",
  },
  black: {
    "--wheel-surface-start": "#1d1f22",
    "--wheel-surface-mid": "#111214",
    "--wheel-surface-low": "#090a0c",
    "--wheel-surface-end": "#040405",
    "--wheel-surface-overlay": "radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 28%, rgba(255, 255, 255, 0) 56%)",
    "--wheel-center-start": "#121417",
    "--wheel-center-end": "#060708",
    "--wheel-center-border": "#1a1d1f",
    "--wheel-border": "#24282c",
    "--wheel-text": "rgba(248, 250, 252, 0.94)",
  },
};

function createSongRecord(song) {
  return {
    id: song.id || song.fileName,
    fileName: song.fileName,
    title: song.title || "",
    artist: song.artist || "",
    album: song.album || "",
    category: song.category || "Music",
    durationSeconds: song.durationSeconds || 0,
    playbackUrl: song.playbackUrl,
    downloadUrl: song.downloadUrl,
    artworkUrl: song.artworkUrl || null,
  };
}

function createPhotoRecord(photo) {
  return {
    id: photo.id || `${photo.fileName}-${photo.importedAt || Date.now()}`,
    fileName: photo.fileName,
    previewUrl: photo.previewUrl,
    importedAt: photo.importedAt || Date.now(),
  };
}

function createEmptyGameState() {
  return {
    id: "",
    phase: "intro",
    title: "Games",
    subtitle: "",
    instructions: "",
    footer: "",
    score: 0,
    roundLabel: "",
    showHud: false,
    brick: null,
    promptLabel: "",
    prompt: "",
    choices: [],
    selectedChoice: 0,
    totalRounds: 0,
    roundIndex: 0,
    correctChoice: 0,
    lastCorrectLabel: "",
    resultText: "",
    implemented: true,
  };
}

function hasPendingUploads() {
  return pendingUploads.length > 0;
}

function getActiveUpload() {
  return pendingUploads[activeUploadIndex] || null;
}

function isAudioUpload(upload) {
  return (upload?.mediaType || "audio") === "audio";
}

function isVideoUpload(upload) {
  return upload?.mediaType === "video";
}

function isSupportedFile(file) {
  const lowerName = file.name.toLowerCase();
  return MEDIA_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

function isPhotoFile(file) {
  const lowerName = file.name.toLowerCase();
  return file.type.startsWith("image/") || PHOTO_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

function getVideoMetadataFields() {
  return Object.entries(VIDEO_METADATA_FIELDS);
}

function getCurrentMetadataFields(upload = getActiveUpload()) {
  return isVideoUpload(upload) ? Object.keys(VIDEO_METADATA_FIELDS) : AUDIO_METADATA_FIELDS;
}

function getDevicePreset(presetKey) {
  return DEVICE_PRESETS[presetKey] || DEVICE_PRESETS["ipod-classic-5-5g"];
}

function buildVideoMetaSummary(metadata) {
  const episodeBits = [];
  if (metadata.seasonNumber) {
    episodeBits.push(`S${metadata.seasonNumber}`);
  }
  if (metadata.episodeNumber) {
    episodeBits.push(`E${metadata.episodeNumber}`);
  }

  return [metadata.show, metadata.episodeTitle, episodeBits.join(" • ")].filter(Boolean).join(" • ");
}

function buildConvertResultSummary(result) {
  if (!result) {
    return { title: "", subtitle: "", meta: "" };
  }

  if (result.mediaType === "video") {
    const metadata = result.metadata || {};
    return {
      title: metadata.title || result.fileName,
      subtitle: metadata.show || metadata.artist || "Video Ready",
      meta: [buildVideoMetaSummary(metadata), result.presetLabel].filter(Boolean).join(" • "),
    };
  }

  const metadata = result.metadata || {};
  return {
      title: metadata.title || result.title || result.fileName,
      subtitle: metadata.artist || result.artist || "Unknown Artist",
      meta: [metadata.album || result.album || "", result.presetLabel || "", result.category || ""].filter(Boolean).join(" • "),
    };
  }

function getDisplaySongs() {
  return librarySongs.slice().reverse();
}

function getDisplayPhotos() {
  return libraryPhotos.slice().sort((left, right) => right.importedAt - left.importedAt);
}

function getSongsByCategory(category) {
  return getDisplaySongs().filter((song) => (song.category || "Music") === category);
}

function getQuizSongs() {
  return getDisplaySongs().filter((song) => (song.category || "Music") === "Music");
}

function shuffleArray(values) {
  const copy = values.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function getLibraryViewKey() {
  return libraryPath[libraryPath.length - 1] || "main";
}

function getLibraryState() {
  const displaySongs = getDisplaySongs();
  const displayPhotos = getDisplayPhotos();
  const musicSongs = getSongsByCategory("Music");
  const podcastSongs = getSongsByCategory("Podcast");
  const songCount = displaySongs.length;
  const photoCount = displayPhotos.length;
  const musicSummary =
    musicSongs.length === 0 ? "No songs yet." : `${musicSongs.length} song${musicSongs.length === 1 ? "" : "s"}`;
  const podcastSummary =
    podcastSongs.length === 0
      ? "No podcasts yet."
      : `${podcastSongs.length} podcast${podcastSongs.length === 1 ? "" : "s"}`;
  const photoSummary =
    photoCount === 0 ? "No photos yet." : `${photoCount} photo${photoCount === 1 ? "" : "s"}`;
  const spotifyConnectedMeta = spotifyViewState.connected
    ? spotifyViewState.profileName || "Connected"
    : spotifyViewState.configured
      ? "Connect"
      : "Setup";
  const spotifySummary = !spotifyViewState.configured
    ? "Spotify is not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI."
    : spotifyLibraryData.loading
      ? "Loading your Spotify library..."
    : spotifyViewState.connected
      ? `Spotify Connected${spotifyViewState.profileName ? ` • ${spotifyViewState.profileName}` : ""}`
      : "Connect Spotify to read your playlists.";
  const spotifyViewKey = getLibraryViewKey();

  if (spotifyViewKey.startsWith("spotify-playlist-detail:")) {
    const playlistId = spotifyViewKey.split(":")[1] || "";
    const detail = spotifyLibraryData.playlistDetails[playlistId] || null;
    return {
      label: "Playlists",
      title: detail?.name || "Playlist",
      summary: detail && detail.tracks.length === 0 ? "No playable tracks returned." : "",
      items: [
        {
          type: "action",
          id: `spotify-playlist-shuffle:${playlistId}`,
          title: "Shuffle Play",
          meta: detail?.tracks?.length ? `${detail.tracks.length} track${detail.tracks.length === 1 ? "" : "s"}` : "Start Music",
          spotifyPlaylist: detail,
        },
        ...(detail?.tracks || []).map((track) => ({
          type: "action",
          id: `spotify-track:${track.id}`,
          title: track.title || "Spotify Track",
          meta: track.artist || "Spotify",
          spotifyTrack: track,
          spotifyContextUri: detail?.uri || "",
        })),
      ],
    };
  }

  if (spotifyViewKey.startsWith("spotify-album-detail:")) {
    const albumId = spotifyViewKey.split(":")[1] || "";
    const detail = spotifyLibraryData.albumDetails[albumId] || null;
    return {
      label: "Albums",
      title: detail?.name || "Album",
      summary: detail?.artist || "",
      items: (detail?.tracks || []).map((track) => ({
        type: "action",
        id: `spotify-track:${track.id}`,
        title: track.title || "Spotify Track",
        meta: track.artist || detail?.artist || "Spotify",
        spotifyTrack: track,
        spotifyContextUri: detail?.uri || "",
      })),
    };
  }

  if (spotifyViewKey.startsWith("spotify-artist-detail:")) {
    const artistId = spotifyViewKey.split(":")[1] || "";
    const detail = spotifyLibraryData.artistDetails[artistId] || null;
    return {
      label: "Artists",
      title: detail?.name || "Artist",
      summary: detail && detail.albums.length === 0 ? "No albums returned." : "",
      items: (detail?.albums || []).map((album) => ({
        type: "menu",
        id: `spotify-album-detail:${album.id}`,
        title: album.name || "Album",
        meta: `${album.trackCount || 0} track${album.trackCount === 1 ? "" : "s"}`,
        spotifyAlbum: album,
      })),
    };
  }

  switch (getLibraryViewKey()) {
    case "music":
      return {
        label: "Main Menu",
        title: "Music",
        summary: "",
        items: [
          {
            type: "action",
            id: "now-playing",
            title: "Now Playing",
            meta: currentSong
              ? currentSong.title || "Ready"
              : spotifyViewState.connected || musicSongs.length > 0
                ? "Auto Start"
                : "No Track",
          },
          {
            type: "menu",
            id: "spotify",
            title: "Spotify",
            meta: spotifyConnectedMeta,
          },
          {
            type: "menu",
            id: "downloaded",
            title: "Downloaded",
            meta: musicSummary,
          },
          {
            type: "action",
            id: "music-shuffle",
            title: "Shuffle",
            meta: spotifyViewState.connected ? "All Sources" : "Downloaded",
          },
        ],
      };
    case "downloaded":
      return {
        label: "Music",
        title: "Downloaded",
        summary:
          musicSongs.length === 0
            ? "No downloaded songs yet."
            : `${musicSongs.length} song${musicSongs.length === 1 ? "" : "s"} available`,
        items: musicSongs.map((song) => ({
          type: "song",
          id: song.id,
          song,
        })),
      };
    case "videos":
      return {
        label: "Main Menu",
        title: "Videos",
        summary: "No videos added yet.",
        items: [],
      };
    case "photos":
      return {
        label: "Main Menu",
        title: "Photos",
        summary: photoCount === 0 ? "No photos added yet." : `${photoCount} photo${photoCount === 1 ? "" : "s"} available`,
        items: displayPhotos.map((photo) => ({
          type: "photo",
          id: photo.id,
          photo,
        })),
      };
    case "games":
      return {
        label: "Main Menu",
        title: "Games",
        summary: "",
        items: GAME_LIBRARY_ITEMS.map((game) => ({
          type: "game",
          id: game.id,
          title: game.title,
          meta: game.meta,
          implemented: game.implemented,
        })),
      };
    case "spotify":
      return {
        label: "Music",
        title: "Spotify",
        summary: spotifySummary,
        items: spotifyViewState.connected
          ? [
              {
                type: "action",
                id: "spotify-now-playing",
                title: "Now Playing",
                meta: spotifyPlayerState.isPlaying ? "Playing" : "Auto Start",
              },
              ...(spotifyLibraryData.playlists.length > 0
                ? [
                    {
                      type: "menu",
                      id: "spotify-playlists",
                      title: "Playlists",
                      meta: `${spotifyLibraryData.playlists.length} playlist${spotifyLibraryData.playlists.length === 1 ? "" : "s"}`,
                    },
                  ]
                : []),
              ...(spotifyLibraryData.artists.length > 0
                ? [
                    {
                      type: "menu",
                      id: "spotify-artists",
                      title: "Artists",
                      meta: `${spotifyLibraryData.artists.length} artist${spotifyLibraryData.artists.length === 1 ? "" : "s"}`,
                    },
                  ]
                : []),
              ...(spotifyLibraryData.albums.length > 0
                ? [
                    {
                      type: "menu",
                      id: "spotify-albums",
                      title: "Albums",
                      meta: `${spotifyLibraryData.albums.length} album${spotifyLibraryData.albums.length === 1 ? "" : "s"}`,
                    },
                  ]
                : []),
              ...(spotifyLibraryData.tracks.length > 0
                ? [
                    {
                      type: "menu",
                      id: "spotify-songs",
                      title: "Songs",
                      meta: `${spotifyLibraryData.tracks.length} song${spotifyLibraryData.tracks.length === 1 ? "" : "s"}`,
                    },
                  ]
                : []),
              ...(spotifyLibraryData.albums.length > 0
                ? [
                    {
                      type: "menu",
                      id: "spotify-cover-flow",
                      title: "Cover Flow",
                      meta: `${spotifyLibraryData.albums.length} album${spotifyLibraryData.albums.length === 1 ? "" : "s"}`,
                    },
                  ]
                : []),
              {
                type: "action",
                id: "spotify-search",
                title: "Search",
                meta: "Find Music",
              },
              {
                type: "action",
                id: "spotify-shuffle",
                title: "Shuffle Play",
                meta: "Start Music",
              },
              {
                type: "action",
                id: "spotify-disconnect",
                title: "Disconnect",
                meta: "Sign out",
              },
            ]
          : [
              {
                type: "action",
                id: "spotify-connect",
                title: "Connect Spotify",
                meta: spotifyViewState.configured ? "OAuth PKCE" : "Setup Required",
              },
            ],
      };
    case "spotify-library":
      return {
        label: "Spotify",
        title: "Library",
        summary: !spotifyViewState.connected
          ? "Connect Spotify first."
          : "Browse Spotify like it lives inside the iPod.",
        items: !spotifyViewState.connected
          ? []
          : [
              {
                type: "menu",
                id: "spotify-playlists",
                title: "Playlists",
                meta: `${spotifyLibraryData.playlists.length} item${spotifyLibraryData.playlists.length === 1 ? "" : "s"}`,
              },
              {
                type: "menu",
                id: "spotify-albums",
                title: "Albums",
                meta: `${spotifyLibraryData.albums.length} item${spotifyLibraryData.albums.length === 1 ? "" : "s"}`,
              },
              {
                type: "menu",
                id: "spotify-artists",
                title: "Artists",
                meta: `${spotifyLibraryData.artists.length} item${spotifyLibraryData.artists.length === 1 ? "" : "s"}`,
              },
              {
                type: "menu",
                id: "spotify-songs",
                title: "Songs",
                meta: `${spotifyLibraryData.tracks.length} item${spotifyLibraryData.tracks.length === 1 ? "" : "s"}`,
              },
            ],
      };
    case "spotify-playlists":
      return {
        label: "Spotify",
        title: "Playlists",
        summary: spotifyLibraryData.playlists.length === 0 ? "No playlists returned from Spotify." : "",
        items: spotifyLibraryData.playlists.map((playlist) => ({
          type: "menu",
          id: `spotify-playlist-detail:${playlist.id}`,
          title: playlist.name || "Untitled Playlist",
          meta: `${playlist.trackCount || 0} track${playlist.trackCount === 1 ? "" : "s"}`,
          spotifyPlaylist: playlist,
        })),
      };
    case "spotify-albums":
      return {
        label: "Spotify",
        title: "Albums",
        summary: spotifyLibraryData.albums.length === 0 ? "No saved albums returned from Spotify." : "",
        items: spotifyLibraryData.albums.map((album) => ({
          type: "menu",
          id: `spotify-album-detail:${album.id}`,
          title: album.name || "Untitled Album",
          meta: album.artist || `${album.trackCount || 0} tracks`,
          spotifyAlbum: album,
        })),
      };
    case "spotify-artists":
      return {
        label: "Spotify",
        title: "Artists",
        summary: spotifyLibraryData.artists.length === 0 ? "No artists returned from Spotify." : "",
        items: spotifyLibraryData.artists.map((artist) => ({
          type: "menu",
          id: `spotify-artist-detail:${artist.id}`,
          title: artist.name || "Unknown Artist",
          meta: "Albums",
          spotifyArtist: artist,
        })),
      };
    case "spotify-songs":
      return {
        label: "Spotify",
        title: "Songs",
        summary: spotifyLibraryData.tracks.length === 0 ? "No Spotify songs returned." : "",
        items: spotifyLibraryData.tracks.map((track) => ({
          type: "action",
          id: `spotify-track:${track.id}`,
          title: track.title || "Spotify Track",
          meta: track.artist || "Spotify",
          spotifyTrack: track,
          spotifyContextUri: track.contextUri || "",
        })),
      };
    case "spotify-cover-flow":
      return {
        label: "Spotify",
        title: "Cover Flow",
        summary: spotifyLibraryData.albums.length === 0 ? "No albums returned from Spotify." : "Browse albums like the iPod cover view.",
        items: spotifyLibraryData.albums.map((album) => ({
          type: "menu",
          id: `spotify-album-detail:${album.id}`,
          title: album.name || "Untitled Album",
          meta: album.artist || `${album.trackCount || 0} tracks`,
          spotifyAlbum: album,
        })),
      };
    case "spotify-search-results":
      return {
        label: "Spotify",
        title: "Search",
        summary: spotifyLibraryData.searchResults.length === 0 ? "No search results yet." : "",
        items: spotifyLibraryData.searchResults.map((track) => ({
          type: "action",
          id: `spotify-track:${track.id}`,
          title: track.title || "Spotify Track",
          meta: track.artist || "Spotify",
          spotifyTrack: track,
        })),
      };
    case "spotify-search":
      return {
        label: "Spotify",
        title: "Search",
        summary: spotifyLibraryData.searchLoading
          ? `Searching for "${spotifyLibraryData.searchQuery}"...`
          : spotifyLibraryData.searchError
            ? spotifyLibraryData.searchError
            : spotifyLibraryData.searchQuery
              ? `Results for "${spotifyLibraryData.searchQuery}"`
              : "Type to search Spotify.",
        items: [
          {
            type: "action",
            id: "spotify-search-clear",
            title: spotifyLibraryData.searchQuery ? `Query: ${spotifyLibraryData.searchQuery}` : "Start Typing",
            meta: spotifyLibraryData.searchQuery ? "Center to clear" : "Keyboard input",
          },
          ...spotifyLibraryData.searchResults.map((track) => ({
            type: "action",
            id: `spotify-track:${track.id}`,
            title: track.title || "Spotify Track",
            meta: track.artist || "Spotify",
            spotifyTrack: track,
          })),
        ],
      };
    case "podcasts":
      return {
        label: "Music",
        title: "Podcasts",
        summary:
          podcastSongs.length === 0
            ? "No converted podcasts yet."
            : `${podcastSongs.length} podcast${podcastSongs.length === 1 ? "" : "s"} available`,
        items: podcastSongs.map((song) => ({
          type: "song",
          id: song.id,
          song,
        })),
      };
    case "playlists":
      return {
        label: "Music",
        title: "Playlists",
        summary: "",
        items: [
          {
            type: "menu",
            id: "converted",
            title: "Converted",
            meta: musicSummary,
          },
        ],
      };
    case "songs":
      return {
        label: "Music",
        title: "Songs",
        summary:
          musicSongs.length === 0
            ? "No converted songs yet."
            : `${musicSongs.length} song${musicSongs.length === 1 ? "" : "s"} available`,
        items: musicSongs.map((song) => ({
          type: "song",
          id: song.id,
          song,
        })),
      };
    case "converted":
      return {
        label: "Playlists",
        title: "Converted",
        summary: songCount === 0 ? "No converted songs yet." : `${songCount} song${songCount === 1 ? "" : "s"} saved`,
        items: displaySongs.map((song) => ({
          type: "song",
          id: song.id,
          song,
        })),
      };
    case "settings":
      return {
        label: "Main Menu",
        title: "Settings",
        summary: "",
        items: [
          {
            type: "action",
            id: "customize",
            title: "Customize",
            meta: "Shell & Wheel",
          },
          {
            type: "menu",
            id: "settings-model",
            title: "iPod Model",
            meta: getDevicePreset(optimizeForSelect.value).label,
          },
          {
            type: "menu",
            id: "settings-theme",
            title: "Theme / Appearance",
            meta: "Display",
          },
          {
            type: "menu",
            id: "settings-about",
            title: "About",
            meta: "SwagPods",
          },
        ],
      };
    case "settings-model":
      return {
        label: "Settings",
        title: "iPod Model",
        summary: `${getDevicePreset(optimizeForSelect.value).label} selected for new conversions.`,
        items: [],
      };
    case "settings-theme":
      return {
        label: "Settings",
        title: "Theme / Appearance",
        summary: "Open Customize to change shell and wheel styling.",
        items: [],
      };
    case "settings-about":
      return {
        label: "Settings",
        title: "About",
        summary: "SwagPods iPod-style converter demo.",
        items: [],
      };
    case "main":
    default:
      return {
        label: "iPod",
        title: "Main Menu",
        summary: "",
        items: [
          {
            type: "action",
            id: "convert",
            title: "Converter",
            meta: "Universal Media",
          },
          {
            type: "menu",
            id: "music",
            title: "Music",
            meta: musicSummary,
          },
          {
            type: "menu",
            id: "videos",
            title: "Videos",
            meta: "Coming Soon",
          },
          {
            type: "menu",
            id: "photos",
            title: "Photos",
            meta: photoSummary,
          },
          {
            type: "menu",
            id: "games",
            title: "Games",
            meta: "Built-in",
          },
          {
            type: "action",
            id: "sync",
            title: "Sync",
            meta: "Utility",
          },
          {
            type: "menu",
            id: "settings",
            title: "Settings",
            meta: "Device Options",
          },
        ],
      };
  }
}

function clampSelectedIndex() {
  if (screenMode === "coverflow") {
    const albums = getCoverflowAlbums();
    if (albums.length === 0) {
      selectedIndex = 0;
      return;
    }
    selectedIndex = Math.max(0, Math.min(selectedIndex, albums.length - 1));
    return;
  }

  const libraryState = getLibraryState();
  if (libraryState.items.length === 0) {
    selectedIndex = 0;
    return;
  }

  selectedIndex = Math.max(0, Math.min(selectedIndex, libraryState.items.length - 1));
}

function pulseLibrarySelection() {
  if (!librarySelectionBar || !libraryPanel) {
    return;
  }

  libraryPanel.classList.remove("is-selection-feedback");
  librarySelectionBar.classList.remove("is-feedback");
  void libraryPanel.offsetWidth;
  void librarySelectionBar.offsetWidth;
  libraryPanel.classList.add("is-selection-feedback");
  librarySelectionBar.classList.add("is-feedback");
  if (librarySelectionPulseTimer) {
    window.clearTimeout(librarySelectionPulseTimer);
  }
  librarySelectionPulseTimer = window.setTimeout(() => {
    libraryPanel.classList.remove("is-selection-feedback");
    librarySelectionBar.classList.remove("is-feedback");
    librarySelectionPulseTimer = null;
  }, 140);
}

function handleWheelStep(step) {
  if (screenMode === "library") {
    moveLibrarySelection(step, "wheel");
    return;
  }

  if (screenMode === "coverflow") {
    moveCoverflowSelection(step, "wheel");
    return;
  }

  if (screenMode === "game") {
    haptics.tick();
    handleGameDirection(step);
  }
}

function getCoverflowAlbums() {
  return spotifyLibraryData.albums;
}

function moveCoverflowSelection(step, source = "generic") {
  const albums = getCoverflowAlbums();
  if (screenMode !== "coverflow" || albums.length === 0 || step === 0) {
    return;
  }
  const nextIndex = Math.max(0, Math.min(selectedIndex + step, albums.length - 1));
  if (nextIndex === selectedIndex) {
    return;
  }
  selectedIndex = nextIndex;
  if (source === "wheel") {
    haptics.tick();
  } else {
    haptics.navigate();
  }
  syncUi();
}

function moveLibrarySelection(step, source = "generic") {
  const libraryState = getLibraryState();
  if (screenMode !== "library" || libraryState.items.length === 0 || step === 0) {
    return;
  }

  const nextIndex = Math.max(0, Math.min(selectedIndex + step, libraryState.items.length - 1));
  if (nextIndex === selectedIndex) {
    return;
  }

  selectedIndex = nextIndex;
  const selectedItem = libraryState.items[selectedIndex];
  highlightedSongId = selectedItem?.type === "song" ? selectedItem.id : "";
  if (source === "wheel") {
    haptics.tick();
    pulseLibrarySelection();
  } else {
    haptics.navigate();
    pulseLibrarySelection();
  }
  syncUi();
}

function getWheelPolarPosition(event) {
  const rect = clickWheel.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const deltaX = event.clientX - centerX;
  const deltaY = event.clientY - centerY;
  const radius = Math.hypot(deltaX, deltaY);
  const normalizedRadius = radius / (Math.min(rect.width, rect.height) / 2);
  return {
    angle: Math.atan2(deltaY, deltaX),
    normalizedRadius,
  };
}

function normalizeAngleDelta(delta) {
  if (delta > Math.PI) {
    return delta - Math.PI * 2;
  }

  if (delta < -Math.PI) {
    return delta + Math.PI * 2;
  }

  return delta;
}

function isWheelRingPosition(position) {
  return (
    position.normalizedRadius >= WHEEL_RING_INNER_RATIO &&
    position.normalizedRadius <= WHEEL_RING_OUTER_RATIO
  );
}

function isWheelDragPosition(position) {
  return (
    position.normalizedRadius >= WHEEL_RING_INNER_RATIO - WHEEL_RING_HYSTERESIS &&
    position.normalizedRadius <= WHEEL_RING_OUTER_RATIO + WHEEL_RING_HYSTERESIS
  );
}

function getWheelPointerProfile(pointerType = "") {
  return pointerType === "mouse" || pointerType === "pen"
    ? WHEEL_POINTER_PROFILES.fine
    : WHEEL_POINTER_PROFILES.coarse;
}

function stopWheelDrag() {
  if (!wheelDrag) {
    return;
  }

  if (wheelDrag.rafId) {
    window.cancelAnimationFrame(wheelDrag.rafId);
  }
  clickWheel.classList.remove("is-scrolling");
  wheelDrag = null;
}

function bindWheelSectorHighlight(button) {
  if (!button) {
    return;
  }

  const clearPressed = () => {
    button.classList.remove("is-pressed");
  };

  button.addEventListener("pointerdown", () => {
    button.classList.add("is-pressed");
  });
  button.addEventListener("pointerup", clearPressed);
  button.addEventListener("pointercancel", clearPressed);
  button.addEventListener("lostpointercapture", clearPressed);
  button.addEventListener("pointerleave", clearPressed);
  button.addEventListener("blur", clearPressed);
}

function bindCenterButtonHighlight(button) {
  if (!button) {
    return;
  }

  const clearPressed = () => {
    button.classList.remove("is-pressed");
  };

  button.addEventListener("pointerdown", () => {
    button.classList.add("is-pressed");
  });
  button.addEventListener("pointerup", clearPressed);
  button.addEventListener("pointercancel", clearPressed);
  button.addEventListener("lostpointercapture", clearPressed);
  button.addEventListener("pointerleave", clearPressed);
  button.addEventListener("blur", clearPressed);
}

function handleWheelScrollDelta(deltaY) {
  const supportsWheelGesture =
    screenMode === "library" ||
    screenMode === "coverflow" ||
    (screenMode === "game" && (currentGame?.id === "brick" || currentGame?.id === "music-quiz"));
  if (!supportsWheelGesture) {
    return false;
  }

  if (screenMode === "library" && getLibraryState().items.length === 0) {
    return false;
  }

  if (screenMode === "coverflow" && getCoverflowAlbums().length === 0) {
    return false;
  }

  const direction = Math.sign(deltaY);
  if (direction !== 0 && screenScrollDirection !== 0 && direction !== screenScrollDirection) {
    screenScrollAccumulator = 0;
  }
  if (direction !== 0) {
    screenScrollDirection = direction;
  }

  screenScrollAccumulator += deltaY;

  while (screenScrollAccumulator >= WHEEL_SCROLL_STEP_DELTA) {
    handleWheelStep(1);
    screenScrollAccumulator -= WHEEL_SCROLL_STEP_DELTA;
  }

  while (screenScrollAccumulator <= -WHEEL_SCROLL_STEP_DELTA) {
    handleWheelStep(-1);
    screenScrollAccumulator += WHEEL_SCROLL_STEP_DELTA;
  }

  return true;
}

function scheduleWheelFrame() {
  if (!wheelDrag || wheelDrag.rafId) {
    return;
  }

  wheelDrag.rafId = window.requestAnimationFrame(() => {
    if (!wheelDrag) {
      return;
    }

    wheelDrag.rafId = 0;
    wheelDrag.detentAccumulator += wheelDrag.pendingDelta;
    wheelDrag.pendingDelta = 0;

    const profile = wheelDrag.profile || WHEEL_POINTER_PROFILES.coarse;
    const speed = Math.abs(wheelDrag.smoothedVelocity);
    const detentAngle =
      speed >= profile.fastSpinSpeed
        ? profile.detentAngle * 0.82
        : speed >= profile.mediumSpinSpeed
          ? profile.detentAngle * 0.9
          : profile.detentAngle;
    const maxSteps =
      speed >= profile.fastSpinSpeed ? profile.maxStepsFast : speed >= profile.mediumSpinSpeed ? profile.maxStepsMedium : 1;
    let stepsTaken = 0;

    while (wheelDrag.detentAccumulator >= detentAngle && stepsTaken < maxSteps) {
      handleWheelStep(1);
      wheelDrag.detentAccumulator -= detentAngle;
      stepsTaken += 1;
    }

    while (wheelDrag.detentAccumulator <= -detentAngle && stepsTaken < maxSteps) {
      handleWheelStep(-1);
      wheelDrag.detentAccumulator += detentAngle;
      stepsTaken += 1;
    }

    if (
      wheelDrag &&
      (Math.abs(wheelDrag.pendingDelta) > 0 || Math.abs(wheelDrag.detentAccumulator) >= detentAngle)
    ) {
      scheduleWheelFrame();
    }
  });
}

function applyThemeVariables(theme) {
  Object.entries(theme).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value);
  });
}

function setFaceplateTheme(themeName) {
  if (ipodDevice) {
    ipodDevice.dataset.faceplateTheme = themeName;
  }
}

function syncActiveThemeButtons(group, value) {
  document.querySelectorAll(`[data-${group}-theme]`).forEach((button) => {
    button.classList.toggle("is-active", button.dataset[`${group}Theme`] === value);
  });
}

function normalizeSyncViewState(payload = {}) {
  return {
    state: payload.state || "no_device",
    headline: payload.headline || "Connect iPod to sync",
    subheadline: payload.subheadline || "",
    actionLabel: payload.actionLabel || "",
    canStart: Boolean(payload.canStart),
    busy: Boolean(payload.busy),
  };
}

function normalizeSpotifyViewState(payload = {}) {
  return {
    configured: Boolean(payload.configured),
    connected: Boolean(payload.connected),
    profileName: payload.profileName || "",
    profileImageUrl: payload.profileImageUrl || "",
    playlists: Array.isArray(payload.playlists) ? payload.playlists : [],
    error: payload.error || "",
    scopes: payload.scopes || "",
  };
}

function normalizeSpotifyPlayerState(payload = {}) {
  return {
    connected: Boolean(payload.connected),
    hasActiveDevice: Boolean(payload.hasActiveDevice),
    isPlaying: Boolean(payload.isPlaying),
    progressMs: Number.isFinite(Number(payload.progressMs)) ? Number(payload.progressMs) : 0,
    deviceName: payload.deviceName || "",
    deviceType: payload.deviceType || "",
    deviceId: payload.deviceId || "",
    contextUri: payload.contextUri || "",
    shuffleEnabled: Boolean(payload.shuffleEnabled),
    track: payload.track || null,
  };
}

function extractSpotifyCollectionTrack(item) {
  if (!item || typeof item !== "object") {
    return null;
  }
  const candidate = item.item && typeof item.item === "object"
    ? item.item
    : item.track && typeof item.track === "object"
      ? item.track
      : null;
  if (!candidate) {
    return null;
  }
  const trackType = String(candidate.type || "track").toLowerCase();
  return trackType && trackType !== "track" ? null : candidate;
}

function normalizeSpotifyTrack(track, contextUri = "") {
  if (!track || typeof track !== "object") {
    return null;
  }

  const rawAlbum = track.album && typeof track.album === "object" ? track.album : null;
  const albumName = rawAlbum?.name || track.album || "";
  const artists = Array.isArray(track.artists)
    ? track.artists
        .map((artist) => {
          if (!artist) {
            return null;
          }
          if (typeof artist === "string") {
            return { id: "", name: artist };
          }
          return {
            id: artist.id || "",
            name: artist.name || "",
          };
        })
        .filter((artist) => artist && (artist.id || artist.name))
    : [];
  const artworkUrl =
    track.artworkUrl ||
    rawAlbum?.images?.[0]?.url ||
    track.images?.[0]?.url ||
    "";
  const normalizedContextUri =
    track.contextUri ||
    track.context?.uri ||
    contextUri ||
    "";

  return {
    id: track.id || track.uri || "",
    title: track.title || track.name || "Spotify Track",
    artist:
      track.artist ||
      (artists.length > 0 ? artists.map((artist) => artist.name).filter(Boolean).join(", ") : "Spotify"),
    artists,
    album: albumName || "Spotify",
    durationMs: Number(track.durationMs || track.duration_ms || (Number(track.durationSeconds || 0) * 1000)),
    artworkUrl,
    spotifyUrl: track.spotifyUrl || track?.external_urls?.spotify || "",
    uri: track.uri || "",
    contextUri: normalizedContextUri,
  };
}

function buildSpotifySong(track, contextUri = "") {
  const normalizedTrack = normalizeSpotifyTrack(track, contextUri);
  if (!normalizedTrack) {
    return null;
  }
  return {
    id: normalizedTrack.id || `spotify-${normalizedTrack.title || "track"}`,
    fileName: "",
    title: normalizedTrack.title || "Spotify Track",
    artist: normalizedTrack.artist || "Spotify",
    album: normalizedTrack.album || "Spotify",
    durationMs: Number(normalizedTrack.durationMs || 0),
    durationSeconds: Math.max(0, (Number(normalizedTrack.durationMs) || 0) / 1000),
    playbackUrl: "",
    downloadUrl: normalizedTrack.spotifyUrl || "#",
    spotifyUrl: normalizedTrack.spotifyUrl || "",
    artworkUrl: normalizedTrack.artworkUrl || null,
    uri: normalizedTrack.uri || "",
    contextUri: normalizedTrack.contextUri || "",
    source: "spotify",
  };
}

function rememberSpotifyTrackSelection(track, contextUri = "") {
  const normalizedTrack = normalizeSpotifyTrack(track, contextUri);
  if (!normalizedTrack) {
    return null;
  }
  spotifyPlaybackContext.selectedTrack = normalizedTrack;
  spotifyPlaybackContext.selectedContextUri = normalizedTrack.contextUri || contextUri || "";
  spotifyPlaybackContext.lastTrack = normalizedTrack;
  spotifyPlaybackContext.lastContextUri =
    normalizedTrack.contextUri || spotifyPlaybackContext.lastContextUri || "";
  return normalizedTrack;
}

function setSpotifyCurrentSong(track, contextUri = "") {
  const normalizedTrack = rememberSpotifyTrackSelection(track, contextUri);
  if (!normalizedTrack) {
    return null;
  }
  const song = buildSpotifySong(normalizedTrack);
  setCurrentSong(song);
  return normalizedTrack;
}

function isSpotifyPlaceholderSong(song = currentSong) {
  return Boolean(isSpotifyRemoteSong(song) && !song?.uri);
}

function getCurrentSpotifyPlaylistDetail() {
  const spotifyViewKey = getLibraryViewKey();
  if (!spotifyViewKey.startsWith("spotify-playlist-detail:")) {
    return null;
  }
  const playlistId = spotifyViewKey.split(":")[1] || "";
  return spotifyLibraryData.playlistDetails[playlistId] || null;
}

function getSpotifyFallbackSelection() {
  if (spotifyPlayerState.track?.uri) {
    return {
      track: normalizeSpotifyTrack(spotifyPlayerState.track, spotifyPlayerState.contextUri),
      contextUri: spotifyPlayerState.contextUri || spotifyPlayerState.track?.contextUri || "",
    };
  }

  if (spotifyPlaybackContext.selectedTrack?.uri) {
    return {
      track: normalizeSpotifyTrack(
        spotifyPlaybackContext.selectedTrack,
        spotifyPlaybackContext.selectedContextUri
      ),
      contextUri: spotifyPlaybackContext.selectedContextUri || "",
    };
  }

  if (spotifyPlaybackContext.lastTrack?.uri) {
    return {
      track: normalizeSpotifyTrack(
        spotifyPlaybackContext.lastTrack,
        spotifyPlaybackContext.lastContextUri
      ),
      contextUri: spotifyPlaybackContext.lastContextUri || "",
    };
  }

  const currentPlaylist = getCurrentSpotifyPlaylistDetail();
  if (currentPlaylist?.tracks?.length > 0) {
    return {
      track: normalizeSpotifyTrack(currentPlaylist.tracks[0], currentPlaylist.uri || ""),
      contextUri: currentPlaylist.uri || "",
    };
  }

  if (spotifyLibraryData.tracks.length > 0) {
    return {
      track: normalizeSpotifyTrack(spotifyLibraryData.tracks[0]),
      contextUri: spotifyLibraryData.tracks[0]?.contextUri || "",
    };
  }

  const firstPlaylist = spotifyLibraryData.playlists[0] || null;
  if (firstPlaylist?.id) {
    const detail = spotifyLibraryData.playlistDetails[firstPlaylist.id] || null;
    if (detail?.tracks?.length > 0) {
      return {
        track: normalizeSpotifyTrack(detail.tracks[0], detail.uri || ""),
        contextUri: detail.uri || "",
      };
    }
  }

  return { track: null, contextUri: "" };
}

function stopSyncPolling() {
  if (syncPollTimer) {
    window.clearInterval(syncPollTimer);
    syncPollTimer = null;
  }
}

async function fetchSyncPayload(url, options = {}) {
  const response = await fetch(url, options);
  const responseText = await response.text();

  try {
    return responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    return {
      state: "no_device",
      headline: "Connect iPod to sync",
      subheadline: "",
      actionLabel: "",
      canStart: false,
      busy: false,
    };
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const responseText = await response.text();
  let payload = {};
  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function isSpotifyRemoteSong(song = currentSong) {
  return Boolean(song && song.source === "spotify");
}

async function getSpotifyWebPlaybackToken() {
  return ensureSpotifyAccessToken();
}

function isSpotifySdkAvailable() {
  return typeof window !== "undefined" && Boolean(window.Spotify);
}

function saveSpotifyPkceState(payload) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(SPOTIFY_PKCE_STORAGE_KEY, JSON.stringify(payload));
}

function loadSpotifyPkceState() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  try {
    const value = window.localStorage.getItem(SPOTIFY_PKCE_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function clearSpotifyPkceState() {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.removeItem(SPOTIFY_PKCE_STORAGE_KEY);
}

function saveSpotifyAuthState(payload) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(SPOTIFY_AUTH_STORAGE_KEY, JSON.stringify(payload));
}

function loadSpotifyAuthState() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  try {
    const value = window.localStorage.getItem(SPOTIFY_AUTH_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function clearSpotifyAuthState() {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.removeItem(SPOTIFY_AUTH_STORAGE_KEY);
}

function getSpotifyOAuthConfig() {
  return {
    clientId: window.APP_CONFIG?.spotifyClientId || "",
    redirectUri: window.APP_CONFIG?.spotifyRedirectUri || `${window.location.origin}/spotify/callback`,
    scopes: window.APP_CONFIG?.spotifyScopes || "",
  };
}

function getGrantedSpotifyScopes(authState = loadSpotifyAuthState()) {
  const granted = String(authState?.scopes || "").trim();
  return new Set(granted ? granted.split(/\s+/).filter(Boolean) : []);
}

function getMissingSpotifyScopes(authState = loadSpotifyAuthState()) {
  const grantedScopes = getGrantedSpotifyScopes(authState);
  return REQUIRED_SPOTIFY_SCOPES.filter((scope) => !grantedScopes.has(scope));
}

function getSpotifyPlaybackDiagnostics() {
  const authState = loadSpotifyAuthState();
  const expiresAt = Number(authState?.expiresAt || 0);
  const expiresInSeconds = expiresAt > 0 ? Math.max(0, Math.round((expiresAt - Date.now()) / 1000)) : 0;
  return {
    sdkReady: spotifySdkReady,
    sdkDeviceId: spotifySdkDeviceId || "",
    activeDeviceId: spotifyPlayerState.deviceId || "",
    hasAccessToken: Boolean(authState?.accessToken),
    hasRefreshToken: Boolean(authState?.refreshToken),
    expiresInSeconds,
    missingScopes: getMissingSpotifyScopes(authState),
  };
}

function isSpotifyPlaybackApiUrl(url) {
  return /\/me\/player(?:\/|$)/.test(url);
}

function buildSpotifyApiLogDetail(url, method, status, payload = {}) {
  const normalizedPayload = payload && typeof payload === "object" ? payload : {};
  const detail = {
    method,
    path: url.replace(/^https:\/\/api\.spotify\.com\/v1/, ""),
    status,
  };
  const deviceId = normalizedPayload?.device?.id || normalizedPayload?.deviceId || "";
  const contextUri = normalizedPayload?.context?.uri || normalizedPayload?.contextUri || "";
  const errorMessage =
    normalizedPayload?.error?.message ||
    normalizedPayload?.error_description ||
    normalizedPayload?.error ||
    "";
  if (deviceId) {
    detail.deviceId = deviceId;
  }
  if (contextUri) {
    detail.contextUri = contextUri;
  }
  if (typeof normalizedPayload?.is_playing === "boolean") {
    detail.isPlaying = normalizedPayload.is_playing;
  }
  if (typeof normalizedPayload?.isPlaying === "boolean") {
    detail.isPlaying = normalizedPayload.isPlaying;
  }
  if (errorMessage) {
    detail.error = errorMessage;
  }
  return detail;
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createRandomSpotifyString(length = 64) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (value) => alphabet[value % alphabet.length]).join("");
}

async function createSpotifyCodeChallenge(verifier) {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", encoded);
  return base64UrlEncode(digest);
}

async function exchangeSpotifyToken(formData) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(formData),
  });
  const responseText = await response.text();
  let payload = {};
  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    payload = {};
  }
  if (!response.ok) {
    const detail = payload.error_description || payload.error || "Spotify token exchange failed.";
    throw new Error(detail);
  }
  return payload;
}

function storeSpotifyTokenPayload(payload, previousAuth = loadSpotifyAuthState()) {
  const expiresIn = Number(payload.expires_in || 3600);
  const authState = {
    accessToken: payload.access_token || previousAuth?.accessToken || "",
    refreshToken: payload.refresh_token || previousAuth?.refreshToken || "",
    tokenType: payload.token_type || previousAuth?.tokenType || "Bearer",
    expiresAt: Date.now() + expiresIn * 1000,
    scopes: payload.scope || previousAuth?.scopes || getSpotifyOAuthConfig().scopes,
    connectedAt: previousAuth?.connectedAt || new Date().toISOString(),
    profileName: previousAuth?.profileName || "",
    profileImageUrl: previousAuth?.profileImageUrl || "",
  };
  saveSpotifyAuthState(authState);
  return authState;
}

async function refreshSpotifyAccessToken() {
  const config = getSpotifyOAuthConfig();
  const authState = loadSpotifyAuthState();
  if (!authState?.refreshToken || !config.clientId) {
    throw new Error("Spotify session is missing or expired.");
  }
  const payload = await exchangeSpotifyToken({
    grant_type: "refresh_token",
    refresh_token: authState.refreshToken,
    client_id: config.clientId,
  });
  const updatedAuth = storeSpotifyTokenPayload(payload, authState);
  return updatedAuth.accessToken;
}

async function ensureSpotifyAccessToken() {
  const authState = loadSpotifyAuthState();
  if (!authState?.accessToken) {
    throw new Error("Connect Spotify first.");
  }
  if (Number(authState.expiresAt || 0) > Date.now() + 60000) {
    return authState.accessToken;
  }
  return refreshSpotifyAccessToken();
}

async function spotifyApiRequest(pathOrUrl, options = {}, retry = true) {
  const accessToken = await ensureSpotifyAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")
    ? pathOrUrl
    : `https://api.spotify.com/v1${pathOrUrl}`;
  const method = options.method || "GET";
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    if (isSpotifyPlaybackApiUrl(url)) {
      logSpotifyConsole("info", "Spotify playback API response", {
        method,
        path: url.replace(/^https:\/\/api\.spotify\.com\/v1/, ""),
        status: 204,
      });
    }
    return null;
  }

  const responseText = await response.text();
  let payload = {};
  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    payload = {};
  }

  if (response.status === 401 && retry) {
    if (isSpotifyPlaybackApiUrl(url)) {
      logSpotifyConsole("warn", "Spotify playback API returned 401, refreshing token", buildSpotifyApiLogDetail(url, method, response.status, payload));
    }
    await refreshSpotifyAccessToken();
    return spotifyApiRequest(pathOrUrl, options, false);
  }

  if (isSpotifyPlaybackApiUrl(url)) {
    logSpotifyConsole(response.ok ? "info" : "warn", "Spotify playback API response", buildSpotifyApiLogDetail(url, method, response.status, payload));
  }

  if (!response.ok) {
    const rawMessage = payload?.error?.message || payload.error_description || payload.error || "Spotify request failed.";
    if (response.status === 403) {
      if (url.includes("/me/player") || url.includes("/player/")) {
        throw new Error("Spotify playback was denied. Premium playback or a fresh reconnect may be required.");
      }
      if (
        url.includes("/me/tracks") ||
        url.includes("/me/albums") ||
        url.includes("/me/following")
      ) {
        throw new Error("Spotify denied access to this library section. Disconnect and reconnect Spotify to grant the latest permissions.");
      }
      if (url.includes("/search")) {
        throw new Error("Spotify search was denied for this session. Disconnect and reconnect Spotify.");
      }
    }
    const message = rawMessage;
    throw new Error(message);
  }

  return payload;
}

async function spotifyPaginatedRequest(pathOrUrl) {
  const items = [];
  let nextPath = pathOrUrl;
  while (nextPath) {
    const payload = await spotifyApiRequest(nextPath);
    if (Array.isArray(payload?.items)) {
      items.push(...payload.items);
    }
    nextPath = payload?.next || "";
  }
  return items;
}

function isSpotifyLibraryPath(value) {
  return (
    value === "spotify-library" ||
    value === "spotify-cover-flow" ||
    value === "spotify-playlists" ||
    value === "spotify-albums" ||
    value === "spotify-artists" ||
    value === "spotify-songs" ||
    value === "spotify-search-results" ||
    value.startsWith("spotify-playlist-detail:") ||
    value.startsWith("spotify-album-detail:") ||
    value.startsWith("spotify-artist-detail:")
  );
}

function startSyncPolling() {
  stopSyncPolling();
  syncPollTimer = window.setInterval(() => {
    if (screenMode === "sync") {
      void refreshSyncStatus();
    }
  }, 2000);
}

function setScreenMode(nextMode) {
  if (nextMode !== "now-playing" || !isSpotifyRemoteSong()) {
    stopSpotifyPlayerPolling();
  }
  if (nextMode !== "library") {
    previousScreenMode = nextMode;
  }
  screenMode = nextMode;
  ipodScreen.dataset.screen = nextMode;
  [
    ["idle", idleState],
    ["edit", editorPanel],
    ["library", libraryPanel],
    ["coverflow", coverflowPanel],
    ["sync", syncPanel],
    ["photo-viewer", photoViewerPanel],
    ["game", gamePanel],
    ["customize", customizePanelScreen],
    ["now-playing", nowPlayingPanel],
  ].forEach(([mode, panel]) => {
    const isActive = nextMode === mode;
    panel.classList.toggle("hidden", !isActive);
    panel.classList.toggle("is-active", isActive);
  });
}

function syncSelectButton() {
  const libraryState = getLibraryState();
  const hasLibrarySelection = libraryState.items.length > 0;
  let shouldDisable =
    isExporting ||
    (screenMode === "sync" && (!syncViewState.canStart || syncViewState.busy)) ||
    screenMode === "idle" ||
    screenMode === "photo-viewer" ||
    screenMode === "now-playing" ||
    screenMode === "customize" ||
    (screenMode === "edit" && !hasPendingUploads()) ||
    (screenMode === "library" && !hasLibrarySelection);

  if (screenMode === "coverflow") {
    shouldDisable = false;
  }

  selectButton.disabled = shouldDisable;
}

function syncPlaybackButton() {
  const spotifyRemoteActive = isSpotifyRemoteSong();
  const spotifyNowPlayingReady =
    screenMode === "now-playing" && spotifyViewState.connected;
  const canUseSpotifyPlayback =
    (spotifyRemoteActive && spotifyViewState.connected) || spotifyNowPlayingReady;
  playbackButton.disabled =
    screenMode === "sync" ||
    screenMode === "photo-viewer" ||
    screenMode === "game" ||
    (!currentSong && !spotifyNowPlayingReady && !spotifyRemoteActive) ||
    ((spotifyRemoteActive || spotifyNowPlayingReady) && !canUseSpotifyPlayback);
  playbackButton.classList.toggle(
    "is-playing",
    spotifyRemoteActive ? spotifyPlayerState.isPlaying : Boolean(currentSong) && !previewAudio.paused
  );
}

function syncWheelButtons() {
  menuButton.disabled = false;
  if (screenMode === "sync") {
    rewindButton.disabled = true;
    forwardButton.disabled = true;
    return;
  }

  if (screenMode === "photo-viewer") {
    rewindButton.disabled = libraryPhotos.length < 2;
    forwardButton.disabled = libraryPhotos.length < 2;
    return;
  }

  if (screenMode === "game") {
    rewindButton.disabled = false;
    forwardButton.disabled = false;
    return;
  }

  if (screenMode === "edit" && Boolean(getActiveUpload())) {
    rewindButton.disabled = false;
    forwardButton.disabled = false;
    return;
  }

  if (isSpotifyRemoteSong()) {
    const disableRemote = !spotifyViewState.connected;
    rewindButton.disabled = disableRemote;
    forwardButton.disabled = disableRemote;
    return;
  }

  rewindButton.disabled = librarySongs.length < 2 || !currentSong;
  forwardButton.disabled = librarySongs.length < 2 || !currentSong;
}

function formatGuessSummary(upload, index) {
  if (!upload) {
    return "Choose a file to begin.";
  }

  const mediaPrefix = isVideoUpload(upload)
    ? "Video detected. Review the preset and metadata."
    : "Audio detected. Review the cleaned tags.";

  if ((upload.inferredFields || []).length > 0) {
    return `${mediaPrefix} Filename guess used for: ${upload.inferredFields.join(", ")}.`;
  }

  return `${mediaPrefix} Using embedded metadata when available.`;
}

function saveActiveMetadata() {
  const activeUpload = getActiveUpload();
  if (!activeUpload) {
    return;
  }

  activeUpload.metadata = getMetadata(activeUpload);
  activeUpload.conversionOptions = getConversionOptions();
}

function renderBatchList() {
  // Batch UI was replaced by a single-file universal converter flow.
}

function renderConvertScreen() {
  const hasUploads = hasPendingUploads();
  const showResult = !hasUploads && Boolean(lastConvertedSong);
  const activeUpload = getActiveUpload();
  const showSetup = Boolean(activeUpload);

  convertUploadView.classList.toggle("hidden", showSetup || showResult);
  convertResultView.classList.toggle("hidden", !showResult);
  convertDetails.classList.toggle("hidden", !showSetup);
  convertSubmitButton.disabled = isExporting || !showSetup;
  convertSubmitButton.textContent = isExporting ? "Converting" : "Convert";
  pickerButton.disabled = isExporting;
  convertDropzone.classList.toggle("is-dragging", ipodScreen.classList.contains("is-dragging"));

  if (showResult) {
    const resultSummary = buildConvertResultSummary(lastConvertedSong);
    convertResultTitle.textContent = resultSummary.title;
    convertResultArtist.textContent = resultSummary.subtitle;
    convertResultMeta.textContent = resultSummary.meta;
    convertDownloadButton.href = lastConvertedSong.downloadUrl;
    convertDownloadButton.setAttribute("download", lastConvertedSong.fileName);
    convertDownloadButton.removeAttribute("aria-disabled");
    convertDownloadButton.classList.remove("is-disabled");

    if (lastConvertedSong.artworkUrl) {
      convertResultArtwork.src = lastConvertedSong.artworkUrl;
      convertResultArtwork.classList.remove("hidden");
      convertResultPlaceholder.classList.add("hidden");
    } else {
      convertResultArtwork.removeAttribute("src");
      convertResultArtwork.classList.add("hidden");
      convertResultPlaceholder.classList.remove("hidden");
    }

    screenControlHint.classList.add("hidden");
    return;
  }

  convertDownloadButton.href = "#";
  convertDownloadButton.setAttribute("aria-disabled", "true");
  convertDownloadButton.classList.add("is-disabled");
  convertDownloadButton.removeAttribute("download");
  convertResultArtwork.removeAttribute("src");
  convertResultArtwork.classList.add("hidden");
  convertResultPlaceholder.classList.remove("hidden");
  convertResultTitle.textContent = "";
  convertResultArtist.textContent = "";
  convertResultMeta.textContent = "";

  if (!showSetup) {
    fileSummary.textContent = "No file selected";
    guessSummary.textContent = "Choose an audio or video file for your iPod.";
    convertFormatValue.textContent = "Ready";
    audioSetupPanel.classList.add("hidden");
    videoSetupPanel.classList.add("hidden");
    screenControlHint.classList.add("hidden");
    return;
  }

  fileSummary.textContent = activeUpload.originalName;
  guessSummary.textContent = formatGuessSummary(activeUpload, activeUploadIndex);
  screenControlHint.classList.remove("hidden");

  const preset = getDevicePreset(activeUpload.conversionOptions?.optimizeFor || "ipod-classic-5-5g");
  optimizeForSelect.value = activeUpload.conversionOptions?.optimizeFor || "ipod-classic-5-5g";
  videoPresetLabel.textContent = preset.label;

  if (isVideoUpload(activeUpload)) {
    convertFormatValue.textContent = "iPod Video MP4";
    audioSetupPanel.classList.add("hidden");
    videoSetupPanel.classList.remove("hidden");
    videoQualitySelect.value = activeUpload.conversionOptions?.quality || "standard";
    videoPresetSummary.textContent = preset.videoSummary;
    screenControlHint.textContent = "Use wheel left/right to change Optimize For.";
    return;
  }

  convertFormatValue.textContent = "Optimized MP3";
  audioSetupPanel.classList.remove("hidden");
  videoSetupPanel.classList.add("hidden");
  videoPresetSummary.textContent = preset.audioSummary;
  screenControlHint.textContent = "Use wheel left/right to change Optimize For.";
}

function renderSyncScreen() {
  syncScreenBody.dataset.syncState = syncViewState.state;
  syncIconSet.dataset.syncState = syncViewState.state;
  syncHeadline.textContent = syncViewState.headline;
  syncSubheadline.textContent = syncViewState.subheadline;
  syncSubheadline.classList.toggle("hidden", !syncViewState.subheadline);
  syncActionLabel.textContent = syncViewState.actionLabel || "Sync Now";
  syncAction.classList.toggle("hidden", !syncViewState.canStart);
  syncAction.setAttribute("aria-hidden", syncViewState.canStart ? "false" : "true");
}

function createBrickBricks(level) {
  const layout = BRICK_LEVEL_LAYOUTS[Math.max(0, level - 1)] || BRICK_LEVEL_LAYOUTS[0];
  const brickWidth = (BRICK_CANVAS_WIDTH - BRICK_SIDE_MARGIN * 2 - BRICK_PADDING * (BRICK_COLUMNS - 1)) / BRICK_COLUMNS;
  const brickHeight = 14;
  const bricks = [];

  for (let rowIndex = 0; rowIndex < layout.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < BRICK_COLUMNS; columnIndex += 1) {
      const hitPoints = layout[rowIndex][columnIndex] || 0;
      if (hitPoints === 0) {
        continue;
      }
      bricks.push({
        x: BRICK_SIDE_MARGIN + columnIndex * (brickWidth + BRICK_PADDING),
        y: BRICK_TOP_OFFSET + rowIndex * (brickHeight + BRICK_PADDING),
        width: brickWidth,
        height: brickHeight,
        alive: true,
        hitPoints,
        maxHitPoints: hitPoints,
      });
    }
  }

  return bricks;
}

function getBrickBaseSpeed(level) {
  return 2.45 + (level - 1) * 0.22;
}

function resetBrickBall(brickSession, level, direction = Math.random() < 0.5 ? -1 : 1) {
  const speed = getBrickBaseSpeed(level);
  brickSession.ballSpeed = speed;
  brickSession.ballX = BRICK_CANVAS_WIDTH / 2;
  brickSession.ballY = BRICK_CANVAS_HEIGHT - 38;
  brickSession.ballRadius = 5;
  brickSession.ballVX = direction * speed * 0.62;
  brickSession.ballVY = -speed * 0.96;
  brickSession.lastPaddleStep = 0;
}

function createBrickSession(level) {
  const brickSession = {
    paddleX: BRICK_CANVAS_WIDTH / 2 - 34,
    paddleWidth: 68,
    paddleHeight: 8,
    bricks: createBrickBricks(level),
    ballSpeed: getBrickBaseSpeed(level),
    lastPaddleStep: 0,
  };
  resetBrickBall(brickSession, level);
  return brickSession;
}

function stopBrickCountdown() {
  if (brickCountdownTimer) {
    window.clearInterval(brickCountdownTimer);
    brickCountdownTimer = null;
  }
}

function stopBrickLoop() {
  if (brickLoopTimer) {
    window.clearInterval(brickLoopTimer);
    brickLoopTimer = null;
  }
}

function buildMusicQuizQuestion() {
  const quizSongs = shuffleArray(getQuizSongs());
  if (quizSongs.length < 2) {
    return null;
  }

  const correctSong = quizSongs[0];
  const hasArtistChoices = quizSongs.some((song) => song.id !== correctSong.id && (song.artist || "").trim());
  const useArtistPrompt = Boolean((correctSong.artist || "").trim()) && hasArtistChoices;

  const promptLabel = useArtistPrompt ? "Song by" : "Pick this title";
  const prompt = useArtistPrompt ? correctSong.artist : (correctSong.title || correctSong.fileName);
  const answerLabel = useArtistPrompt
    ? (correctSong.title || correctSong.fileName)
    : (correctSong.artist || correctSong.album || correctSong.fileName);
  const distractors = quizSongs
    .slice(1)
    .map((song) =>
      useArtistPrompt ? (song.title || song.fileName) : (song.artist || song.album || song.fileName)
    )
    .filter((label) => label && label !== answerLabel);

  const choicePool = shuffleArray([answerLabel, ...distractors]).slice(0, Math.min(4, quizSongs.length));
  if (!choicePool.includes(answerLabel)) {
    choicePool[choicePool.length - 1] = answerLabel;
  }

  const choices = shuffleArray(choicePool).map((label, index) => ({
    id: `${correctSong.id}-${index}-${label}`,
    label,
    correct: label === answerLabel,
  }));

  return {
    promptLabel,
    prompt,
    choices,
    correctChoice: choices.findIndex((choice) => choice.correct),
    answerLabel,
  };
}

function createBrickGameState() {
  return {
    ...createEmptyGameState(),
    id: "brick",
    phase: "intro",
    title: "Brick",
    subtitle: "Level 1",
    instructions: "Press center to start",
    footer: "",
    score: 0,
    level: 1,
    lives: 3,
    brick: createBrickSession(1),
    showHud: true,
    roundLabel: "L1",
  };
}

function createMusicQuizGameState() {
  if (getQuizSongs().length < 2) {
    return {
      ...createEmptyGameState(),
      id: "music-quiz",
      phase: "empty",
      title: "Music Quiz",
      subtitle: "No music for quiz",
      instructions: "Add music to play",
      footer: "Import songs, then come back",
      showHud: false,
    };
  }

  return {
    ...createEmptyGameState(),
    id: "music-quiz",
    phase: "intro",
    title: "Music Quiz",
    subtitle: "Test your library",
    instructions: "Press center to start",
    footer: "Left/Right choose answer",
    totalRounds: MUSIC_QUIZ_ROUNDS,
    showHud: true,
  };
}

function createUnavailableGameState(gameId) {
  const game = GAME_LIBRARY_ITEMS.find((item) => item.id === gameId);
  return {
    ...createEmptyGameState(),
    id: gameId,
    phase: "unavailable",
    title: game?.title || "Game",
    subtitle: "Coming Soon",
    instructions: "Press Menu to return",
    footer: "More games are on the way",
    implemented: false,
  };
}

function getGameMenuIndex(gameId) {
  return GAME_LIBRARY_ITEMS.findIndex((item) => item.id === gameId);
}

function renderBrickCanvas() {
  if (!gameCanvas || !currentGame || currentGame.id !== "brick" || !currentGame.brick) {
    return;
  }

  const context = gameCanvas.getContext("2d");
  if (!context) {
    return;
  }

  const { brick } = currentGame;
  context.clearRect(0, 0, BRICK_CANVAS_WIDTH, BRICK_CANVAS_HEIGHT);
  context.fillStyle = "#071014";
  context.fillRect(0, 0, BRICK_CANVAS_WIDTH, BRICK_CANVAS_HEIGHT);

  context.strokeStyle = "rgba(193, 234, 203, 0.24)";
  context.lineWidth = 1;
  context.strokeRect(0.5, 0.5, BRICK_CANVAS_WIDTH - 1, BRICK_CANVAS_HEIGHT - 1);

  brick.bricks.forEach((block, index) => {
    if (!block.alive) {
      return;
    }
    const depth = block.maxHitPoints > 1 ? 36 : 0;
    const shade = 210 - (index % BRICK_COLUMNS) * 12 - depth;
    context.fillStyle = `rgb(${shade}, ${Math.max(162, shade - 24)}, ${Math.max(136, shade - 58)})`;
    context.fillRect(block.x, block.y, block.width, block.height);
  });

  context.fillStyle = "#e7f7ed";
  context.fillRect(brick.paddleX, BRICK_CANVAS_HEIGHT - 20, brick.paddleWidth, brick.paddleHeight);

  context.beginPath();
  context.arc(brick.ballX, brick.ballY, brick.ballRadius, 0, Math.PI * 2);
  context.fillStyle = "#fef6cf";
  context.fill();
}

function renderGameScreen() {
  const gameState = currentGame || createEmptyGameState();
  const isBrick = gameState.id === "brick";
  const isMusicQuiz = gameState.id === "music-quiz";
  const isQuizQuestion = isMusicQuiz && gameState.phase === "question";
  const isBrickPaused = isBrick && gameState.phase === "paused";
  const showCanvas = isBrick;
  const showMessage = isBrick ? gameState.phase !== "playing" : !isQuizQuestion;
  const showGameHud = Boolean(gameState.showHud) && (
    !isBrick || gameState.phase === "playing" || gameState.phase === "paused"
  );

  gameScreenBody.dataset.gameId = gameState.id || "";
  gameScreenBody.dataset.gamePhase = gameState.phase || "intro";
  gameStatusTitle.textContent = gameState.title || "Games";
  gameHud.classList.toggle("hidden", !showGameHud);
  gameScoreLabel.textContent = showGameHud ? `Score ${String(gameState.score || 0).padStart(3, "0")}` : "";
  gameRoundLabel.textContent = showGameHud ? gameState.roundLabel || "" : "";
  gameCanvas.classList.toggle("hidden", !showCanvas);
  gameCanvas.setAttribute("aria-hidden", showCanvas ? "false" : "true");
  gameMessageScreen.classList.toggle("hidden", !showMessage);
  musicQuizPanel.classList.toggle("hidden", !isQuizQuestion);
  gamePauseOverlay.classList.toggle("hidden", !isBrickPaused);
  gamePauseOverlay.setAttribute("aria-hidden", isBrickPaused ? "false" : "true");
  gameTitle.textContent = isBrickPaused ? "" : (gameState.title || "");
  gameSubtitle.textContent = isBrickPaused ? "" : (gameState.subtitle || "");
  gameInstructions.textContent = isBrickPaused ? "" : (gameState.instructions || "");
  gameFooter.textContent = gameState.footer || "";
  gameLives.innerHTML = "";
  gameLives.classList.toggle("hidden", !(isBrick && Number.isFinite(gameState.lives) && gameState.lives > 0));
  gameLives.setAttribute("aria-hidden", isBrick && Number.isFinite(gameState.lives) && gameState.lives > 0 ? "false" : "true");

  if (isBrick && Number.isFinite(gameState.lives) && gameState.lives > 0) {
    Array.from({ length: gameState.lives }).forEach(() => {
      const heart = document.createElement("span");
      heart.className = "game-life-heart";
      gameLives.appendChild(heart);
    });
  }

  if (showCanvas) {
    renderBrickCanvas();
  } else if (gameCanvas) {
    const context = gameCanvas.getContext("2d");
    if (context) {
      context.clearRect(0, 0, BRICK_CANVAS_WIDTH, BRICK_CANVAS_HEIGHT);
    }
  }

  musicQuizChoices.innerHTML = "";
  if (isQuizQuestion) {
    musicQuizPromptLabel.textContent = gameState.promptLabel || "";
    musicQuizPrompt.textContent = gameState.prompt || "";

    gameState.choices.forEach((choice, index) => {
      const item = document.createElement("li");
      item.className = `music-quiz-choice${index === gameState.selectedChoice ? " is-selected" : ""}`;
      item.textContent = choice.label;
      musicQuizChoices.appendChild(item);
    });
  } else {
    musicQuizPromptLabel.textContent = "";
    musicQuizPrompt.textContent = "";
  }
}

function syncGameHud() {
  if (!currentGame) {
    return;
  }
  gameScoreLabel.textContent = currentGame.showHud ? `Score ${String(currentGame.score || 0).padStart(3, "0")}` : "";
  gameRoundLabel.textContent = currentGame.roundLabel || "";
}

function updateBrickRoundLabel() {
  if (!currentGame || currentGame.id !== "brick") {
    return;
  }
  currentGame.roundLabel = `L${currentGame.level}`;
  syncGameHud();
}

function startBrickCountdown(label = "3") {
  stopBrickLoop();
  stopBrickCountdown();
  let remaining = Number(label) || 3;
  currentGame.phase = "countdown";
  currentGame.title = "Brick";
  currentGame.subtitle = String(remaining);
  currentGame.instructions = "Get ready";
  currentGame.footer = "";
  syncUi();

  brickCountdownTimer = window.setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      stopBrickCountdown();
      currentGame.phase = "playing";
      currentGame.title = "Brick";
      currentGame.subtitle = `Level ${currentGame.level}`;
      currentGame.instructions = "";
      currentGame.footer = "";
      startBrickLoop();
      syncUi();
      return;
    }

    currentGame.subtitle = String(remaining);
    syncUi();
  }, 650);
}

function advanceBrickLevel() {
  stopBrickLoop();
  stopBrickCountdown();
  if (currentGame.level < BRICK_LEVEL_LAYOUTS.length) {
    currentGame.level += 1;
    currentGame.brick = createBrickSession(currentGame.level);
    updateBrickRoundLabel();
    currentGame.phase = "level-complete";
    currentGame.title = "Level Clear";
    currentGame.subtitle = `Next: Level ${currentGame.level}`;
    currentGame.instructions = "Press center to continue";
    currentGame.footer = "";
    syncUi();
    return;
  }

  currentGame.phase = "gameover";
  currentGame.title = "You Win";
  currentGame.subtitle = `Score ${currentGame.score}`;
  currentGame.instructions = "Press center to restart";
  currentGame.footer = "";
  syncUi();
}

function finishBrickLife() {
  stopBrickLoop();
  stopBrickCountdown();
  currentGame.lives -= 1;
  if (currentGame.lives <= 0) {
    currentGame.phase = "gameover";
    currentGame.title = "Game Over";
    currentGame.subtitle = `Score ${currentGame.score}`;
    currentGame.instructions = "Press center to restart";
    currentGame.footer = "";
    syncUi();
    return;
  }

  resetBrickBall(currentGame.brick, currentGame.level);
  updateBrickRoundLabel();
  currentGame.phase = "lost-ball";
  currentGame.title = "Ball Lost";
  currentGame.subtitle = `${currentGame.lives} balls left`;
  currentGame.instructions = "Press center to continue";
  currentGame.footer = "";
  syncUi();
}

function tickBrickGame() {
  if (!currentGame || currentGame.id !== "brick" || currentGame.phase !== "playing" || !currentGame.brick) {
    return;
  }

  const { brick } = currentGame;
  brick.ballX += brick.ballVX;
  brick.ballY += brick.ballVY;

  if (brick.ballX <= brick.ballRadius || brick.ballX >= BRICK_CANVAS_WIDTH - brick.ballRadius) {
    brick.ballVX *= -1;
    brick.ballX = Math.max(brick.ballRadius, Math.min(BRICK_CANVAS_WIDTH - brick.ballRadius, brick.ballX));
  }

  if (brick.ballY <= brick.ballRadius + 2) {
    brick.ballVY *= -1;
    brick.ballY = brick.ballRadius + 2;
  }

  const paddleY = BRICK_CANVAS_HEIGHT - 20;
  if (
    brick.ballY + brick.ballRadius >= paddleY &&
    brick.ballY + brick.ballRadius <= paddleY + brick.paddleHeight &&
    brick.ballX >= brick.paddleX &&
    brick.ballX <= brick.paddleX + brick.paddleWidth &&
    brick.ballVY > 0
  ) {
    const relativeHit = (brick.ballX - (brick.paddleX + brick.paddleWidth / 2)) / (brick.paddleWidth / 2);
    const currentSpeed = Math.min(4.9, Math.hypot(brick.ballVX, brick.ballVY) + 0.06);
    const bounceAngle = relativeHit * 1.05 + brick.lastPaddleStep * 0.08;
    brick.ballVX = currentSpeed * Math.sin(bounceAngle);
    brick.ballVY = -Math.max(2.5, currentSpeed * Math.cos(bounceAngle));
    if (Math.abs(brick.ballVX) < 0.85) {
      brick.ballVX = 0.85 * (brick.ballVX < 0 ? -1 : 1);
    }
    brick.ballSpeed = Math.hypot(brick.ballVX, brick.ballVY);
    brick.lastPaddleStep = 0;
  }

  for (const block of brick.bricks) {
    if (
      !block.alive ||
      brick.ballX + brick.ballRadius < block.x ||
      brick.ballX - brick.ballRadius > block.x + block.width ||
      brick.ballY + brick.ballRadius < block.y ||
      brick.ballY - brick.ballRadius > block.y + block.height
    ) {
      continue;
    }

    block.hitPoints -= 1;
    block.alive = block.hitPoints > 0;
    brick.ballVY *= -1;
    currentGame.score += block.alive ? 5 : 15;
    const currentSpeed = Math.max(0.001, Math.hypot(brick.ballVX, brick.ballVY));
    const nextSpeed = Math.min(5.2, currentSpeed + 0.05);
    const directionX = brick.ballVX === 0 ? 1 : Math.sign(brick.ballVX);
    const directionY = brick.ballVY === 0 ? -1 : Math.sign(brick.ballVY);
    brick.ballVX = directionX * Math.max(0.9, (Math.abs(brick.ballVX) / currentSpeed) * nextSpeed);
    brick.ballVY = directionY * Math.max(2.1, (Math.abs(brick.ballVY) / currentSpeed) * nextSpeed);
    const normalizedSpeed = Math.max(0.001, Math.hypot(brick.ballVX, brick.ballVY));
    const scale = nextSpeed / normalizedSpeed;
    brick.ballVX *= scale;
    brick.ballVY *= scale;
    brick.ballSpeed = Math.hypot(brick.ballVX, brick.ballVY);
    syncGameHud();
    break;
  }

  if (brick.bricks.every((block) => !block.alive)) {
    advanceBrickLevel();
    return;
  }

  if (brick.ballY - brick.ballRadius > BRICK_CANVAS_HEIGHT) {
    finishBrickLife();
    return;
  }

  renderBrickCanvas();
}

function startBrickLoop() {
  stopBrickLoop();
  brickLoopTimer = window.setInterval(tickBrickGame, 1000 / 30);
}

function beginBrickGame() {
  stopBrickLoop();
  stopBrickCountdown();
  currentGame = createBrickGameState();
  updateBrickRoundLabel();
  haptics.confirm();
  startBrickCountdown(3);
}

function beginMusicQuizRound() {
  if (!currentGame || currentGame.id !== "music-quiz") {
    return;
  }

  const question = buildMusicQuizQuestion();
  if (!question) {
    currentGame.phase = "empty";
    currentGame.title = "Music Quiz";
    currentGame.subtitle = "No music for quiz";
    currentGame.instructions = "Add music to play";
    currentGame.footer = "Import songs, then come back";
    currentGame.showHud = false;
    syncUi();
    return;
  }

  currentGame.phase = "question";
  currentGame.title = "Music Quiz";
  currentGame.subtitle = "";
  currentGame.instructions = "";
  currentGame.promptLabel = question.promptLabel;
  currentGame.prompt = question.prompt;
  currentGame.choices = question.choices;
  currentGame.selectedChoice = 0;
  currentGame.correctChoice = question.correctChoice;
  currentGame.lastCorrectLabel = question.answerLabel;
  currentGame.showHud = true;
  currentGame.roundLabel = `Rnd ${currentGame.roundIndex + 1}/${currentGame.totalRounds}`;
  currentGame.footer = "Left/Right move • Center choose";
  syncUi();
}

function beginMusicQuizGame() {
  currentGame = createMusicQuizGameState();
  if (currentGame.phase === "empty") {
    screenMode = "game";
    syncUi();
    return;
  }

  currentGame.score = 0;
  currentGame.roundIndex = 0;
  currentGame.roundLabel = `Rnd 1/${currentGame.totalRounds}`;
  haptics.confirm();
  screenMode = "game";
  beginMusicQuizRound();
}

function openGame(gameId) {
  previewAudio.pause();
  stopSyncPolling();
  stopBrickLoop();

  if (gameId === "brick") {
    currentGame = createBrickGameState();
  } else if (gameId === "music-quiz") {
    currentGame = createMusicQuizGameState();
  } else {
    currentGame = createUnavailableGameState(gameId);
  }

  screenMode = "game";
  syncUi();
}

function moveBrickPaddle(step) {
  if (!currentGame || currentGame.id !== "brick" || !currentGame.brick) {
    return;
  }

  currentGame.brick.lastPaddleStep = step;
  currentGame.brick.paddleX = Math.max(
    8,
    Math.min(BRICK_CANVAS_WIDTH - currentGame.brick.paddleWidth - 8, currentGame.brick.paddleX + step * 26)
  );
  renderBrickCanvas();
}

function moveMusicQuizChoice(step) {
  if (!currentGame || currentGame.id !== "music-quiz" || currentGame.phase !== "question" || currentGame.choices.length === 0) {
    return;
  }

  const nextIndex = Math.max(0, Math.min(currentGame.choices.length - 1, currentGame.selectedChoice + step));
  if (nextIndex === currentGame.selectedChoice) {
    return;
  }
  currentGame.selectedChoice = nextIndex;
  renderGameScreen();
}

function handleGameDirection(step) {
  if (!currentGame) {
    return;
  }

  if (currentGame.id === "brick") {
    moveBrickPaddle(step);
    return;
  }

  if (currentGame.id === "music-quiz") {
    moveMusicQuizChoice(step);
  }
}

function handleGameSelect() {
  if (!currentGame) {
    return;
  }

  if (currentGame.id === "brick") {
    if (currentGame.phase === "intro" || currentGame.phase === "gameover") {
      beginBrickGame();
      return;
    }

    if (currentGame.phase === "lost-ball" || currentGame.phase === "level-complete") {
      haptics.confirm();
      startBrickCountdown(3);
      return;
    }

    if (currentGame.phase === "countdown") {
      return;
    }

    haptics.select();
    if (currentGame.phase === "playing") {
      currentGame.phase = "paused";
      currentGame.title = "Brick";
      currentGame.subtitle = "Paused";
      currentGame.instructions = "";
      currentGame.footer = "";
      stopBrickLoop();
      syncUi();
      return;
    }

    if (currentGame.phase === "paused") {
      startBrickCountdown(3);
    }
    return;
  }

  if (currentGame.id === "music-quiz") {
    if (currentGame.phase === "intro") {
      beginMusicQuizGame();
      return;
    }

    if (currentGame.phase === "empty" || currentGame.phase === "unavailable") {
      return;
    }

    haptics.select();
    if (currentGame.phase === "question") {
      const selectedChoice = currentGame.choices[currentGame.selectedChoice];
      const isCorrect = Boolean(selectedChoice?.correct);
      if (isCorrect) {
        currentGame.score += 1;
      }
      currentGame.phase = "feedback";
      currentGame.title = isCorrect ? "Correct" : "Wrong";
      currentGame.subtitle = isCorrect ? selectedChoice.label : `Answer: ${currentGame.lastCorrectLabel}`;
      currentGame.instructions = "Press center to continue";
      currentGame.footer = `Score ${currentGame.score} of ${currentGame.roundIndex + 1}`;
      syncUi();
      return;
    }

    if (currentGame.phase === "feedback") {
      if (currentGame.roundIndex + 1 >= currentGame.totalRounds) {
        currentGame.phase = "gameover";
        currentGame.title = "Quiz Complete";
        currentGame.subtitle = `${currentGame.score}/${currentGame.totalRounds} correct`;
        currentGame.instructions = "Press center to play again";
        currentGame.footer = "Menu returns to Games";
        syncUi();
        return;
      }

      currentGame.roundIndex += 1;
      beginMusicQuizRound();
      return;
    }

    if (currentGame.phase === "gameover") {
      beginMusicQuizGame();
    }
  }
}

function getPhotoIndex(photoId) {
  return getDisplayPhotos().findIndex((photo) => photo.id === photoId);
}

function getCurrentPhoto() {
  return getDisplayPhotos().find((photo) => photo.id === currentPhotoId) || null;
}

function persistPhotoLibrary() {
  try {
    const serialized = libraryPhotos.map((photo) => ({
      id: photo.id,
      fileName: photo.fileName,
      previewUrl: photo.previewUrl,
      importedAt: photo.importedAt,
    }));
    window.sessionStorage.setItem(PHOTO_LIBRARY_SESSION_KEY, JSON.stringify(serialized));
  } catch (error) {
    // Ignore browser storage errors and keep photos in-memory for the current page.
  }
}

function loadPersistedPhotos() {
  try {
    const rawValue = window.sessionStorage.getItem(PHOTO_LIBRARY_SESSION_KEY);
    if (!rawValue) {
      libraryPhotos = [];
      return;
    }

    const parsed = JSON.parse(rawValue);
    libraryPhotos = Array.isArray(parsed)
      ? parsed
          .filter((photo) => photo && typeof photo.previewUrl === "string" && typeof photo.fileName === "string")
          .map((photo) => createPhotoRecord(photo))
      : [];
  } catch (error) {
    libraryPhotos = [];
  }
}

function renderPhotoViewer() {
  const currentPhoto = getCurrentPhoto();
  if (!currentPhoto) {
    photoViewerImage.removeAttribute("src");
    photoViewerImage.classList.add("hidden");
    photoViewerPlaceholder.classList.remove("hidden");
    photoViewerTitle.textContent = "";
    photoViewerCounter.textContent = "";
    return;
  }

  const photoIndex = getPhotoIndex(currentPhoto.id);
  photoViewerImage.src = currentPhoto.previewUrl;
  photoViewerImage.alt = currentPhoto.fileName;
  photoViewerImage.classList.remove("hidden");
  photoViewerPlaceholder.classList.add("hidden");
  photoViewerTitle.textContent = currentPhoto.fileName;
  photoViewerCounter.textContent =
    photoIndex === -1 ? "" : `${photoIndex + 1} of ${libraryPhotos.length}`;
}

function renderPlayer() {
  if (!currentSong) {
    if (screenMode === "now-playing" && spotifyViewState.connected) {
      playerTitle.textContent = spotifyPlayerState.hasActiveDevice ? "Click Play To Start" : "Select A Device";
      playerArtist.textContent = "Spotify";
      playerAlbum.textContent = spotifyPlayerState.hasActiveDevice ? "Click play to start." : "Select a playback device.";
      playerArtwork.classList.add("hidden");
      artworkPlaceholder.classList.remove("hidden");
      playerArtwork.removeAttribute("src");
      downloadNowButton.setAttribute("href", "#");
      downloadNowButton.setAttribute("aria-disabled", "true");
      downloadNowButton.classList.add("is-disabled");
      downloadNowButton.removeAttribute("download");
      downloadNowButton.textContent = "Open in Spotify";
      playerElapsed.textContent = "0:00";
      playerRemaining.textContent = "-0:00";
      playerProgressFill.style.width = "0%";
      syncPlaybackButton();
      return;
    }

    playerTitle.textContent = "";
    playerArtist.textContent = "";
    playerAlbum.textContent = "";
    playerArtwork.classList.add("hidden");
    artworkPlaceholder.classList.remove("hidden");
    playerArtwork.removeAttribute("src");
    downloadNowButton.setAttribute("href", "#");
    downloadNowButton.setAttribute("aria-disabled", "true");
    downloadNowButton.classList.add("is-disabled");
    downloadNowButton.removeAttribute("download");
    previewAudio.pause();
    previewAudio.removeAttribute("src");
    previewAudio.load();
    renderProgress();
    syncPlaybackButton();
    return;
  }

  playerTitle.textContent = currentSong.title || currentSong.fileName;
  playerArtist.textContent = currentSong.artist ? currentSong.artist : "Unknown Artist";
  playerAlbum.textContent = currentSong.album ? currentSong.album : "Unknown Album";

  if (isSpotifyRemoteSong(currentSong)) {
    downloadNowButton.href = currentSong.spotifyUrl || "#";
    downloadNowButton.textContent = currentSong.spotifyUrl ? "Open in Spotify" : "Spotify Track";
    if (currentSong.spotifyUrl) {
      downloadNowButton.removeAttribute("download");
      downloadNowButton.removeAttribute("aria-disabled");
      downloadNowButton.classList.remove("is-disabled");
      downloadNowButton.setAttribute("target", "_blank");
      downloadNowButton.setAttribute("rel", "noopener noreferrer");
    } else {
      downloadNowButton.setAttribute("aria-disabled", "true");
      downloadNowButton.classList.add("is-disabled");
    }
  } else {
    downloadNowButton.textContent = "Download Now";
    downloadNowButton.href = currentSong.downloadUrl;
    downloadNowButton.setAttribute("download", currentSong.fileName);
    downloadNowButton.removeAttribute("aria-disabled");
    downloadNowButton.classList.remove("is-disabled");
    downloadNowButton.removeAttribute("target");
    downloadNowButton.removeAttribute("rel");
  }

  if (currentSong.artworkUrl) {
    playerArtwork.src = currentSong.artworkUrl;
    playerArtwork.classList.remove("hidden");
    artworkPlaceholder.classList.add("hidden");
  } else {
    playerArtwork.removeAttribute("src");
    playerArtwork.classList.add("hidden");
    artworkPlaceholder.classList.remove("hidden");
  }

  renderProgress();
  syncPlaybackButton();
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function renderProgress() {
  if (isSpotifyRemoteSong()) {
    const duration = Number(currentSong?.durationSeconds || 0);
    const currentTime = Math.max(0, spotifyPlayerState.progressMs / 1000);
    const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
    const remaining = duration > 0 ? Math.max(0, duration - currentTime) : 0;

    playerElapsed.textContent = formatTime(currentTime);
    playerRemaining.textContent = spotifyPlayerState.hasActiveDevice
      ? `-${formatTime(remaining)}`
      : "Select device";
    playerProgressFill.style.width = `${progressPercent}%`;
    return;
  }

  const duration = Number.isFinite(previewAudio.duration) ? previewAudio.duration : 0;
  const currentTime = Number.isFinite(previewAudio.currentTime) ? previewAudio.currentTime : 0;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const remaining = duration > 0 ? Math.max(0, duration - currentTime) : 0;

  playerElapsed.textContent = formatTime(currentTime);
  playerRemaining.textContent = `-${formatTime(remaining)}`;
  playerProgressFill.style.width = `${progressPercent}%`;
}

async function activateLibraryItem(itemData) {
  if (!itemData) {
    return;
  }

  if (itemData.type === "action" && itemData.id === "convert") {
    clearPendingUploads();
    lastConvertedSong = null;
    screenMode = "edit";
    syncUi();
    return;
  }

  if (itemData.type === "action" && itemData.id === "sync") {
    await openSyncUtility();
    return;
  }

  if (itemData.type === "action" && itemData.id === "customize") {
    screenMode = "customize";
    syncUi();
    return;
  }

  if (itemData.type === "action" && itemData.id === "now-playing") {
    try {
      if (isSpotifyRemoteSong() || (!currentSong && spotifyViewState.connected)) {
        await openSpotifyNowPlaying();
        return;
      }

      const localSong = currentSong || getSongsByCategory("Music")[0] || librarySongs[0] || null;
      if (!localSong) {
        if (spotifyViewState.connected) {
          await openSpotifyNowPlaying();
          return;
        }
        throw new Error("No songs are available yet.");
      }

      if (!currentSong || currentSong.id !== localSong.id) {
        setCurrentSong(localSong);
      }
      screenMode = "now-playing";
      syncUi();
      if (previewAudio.paused) {
        await previewAudio.play();
      }
    } catch (error) {
      if (spotifyViewState.connected && (isSpotifyRemoteSong() || !currentSong)) {
        presentSpotifyPlaybackFailure(error, spotifyPlaybackContext.selectedTrack, spotifyPlaybackContext.selectedContextUri);
      } else {
        setMessage(error.message || "Playback could not start.", "error");
        syncUi();
      }
    }
    return;
  }

  if (itemData.type === "action" && itemData.id === "spotify-connect") {
    try {
      await connectSpotify();
    } catch (error) {
      setMessage(error.message, "error");
      syncUi();
    }
    return;
  }

  if (itemData.type === "action" && itemData.id === "spotify-disconnect") {
    try {
      await disconnectSpotify();
    } catch (error) {
      setMessage(error.message, "error");
      syncUi();
    }
    return;
  }

  if (itemData.type === "action" && itemData.id === "spotify-shuffle") {
    try {
      if (spotifyLibraryData.tracks.length === 0 && spotifyLibraryData.playlists.length === 0) {
        await refreshSpotifyLibrary();
      }
      await startSpotifyShufflePlayback();
      screenMode = "now-playing";
      syncUi();
      startSpotifyPlayerPolling();
    } catch (error) {
      presentSpotifyPlaybackFailure(error);
    }
    return;
  }

  if (itemData.type === "action" && itemData.id === "spotify-search") {
    spotifyLibraryData.searchError = "";
    libraryPath = ["main", "music", "spotify", "spotify-search"];
    selectedIndex = 0;
    highlightedSongId = "";
    if (spotifySearchInput) {
      spotifySearchInput.value = spotifyLibraryData.searchQuery || "";
    }
    syncUi();
    return;
  }

  if (itemData.type === "action" && itemData.id === "spotify-search-clear") {
    spotifyLibraryData.searchQuery = "";
    spotifyLibraryData.searchResults = [];
    spotifyLibraryData.searchError = "";
    spotifyLibraryData.searchLoading = false;
    if (spotifySearchInput) {
      spotifySearchInput.value = "";
      spotifySearchInput.focus();
    }
    syncUi();
    return;
  }

  if (itemData.type === "action" && itemData.id === "spotify-account") {
    setMessage(
      spotifyViewState.profileName
        ? `Spotify Connected: ${spotifyViewState.profileName}`
        : "Spotify Connected",
      "success"
    );
    syncUi();
    return;
  }

  if (itemData.type === "action" && itemData.id === "spotify-now-playing") {
    try {
      await openSpotifyNowPlaying();
    } catch (error) {
      presentSpotifyPlaybackFailure(error);
    }
    return;
  }

  if (itemData.type === "action" && String(itemData.id || "").startsWith("spotify-playlist-shuffle:")) {
    try {
      await startSpotifyShufflePlayback(itemData.spotifyPlaylist || null);
      screenMode = "now-playing";
      syncUi();
      startSpotifyPlayerPolling();
    } catch (error) {
      presentSpotifyPlaybackFailure(error);
    }
    return;
  }

  if (itemData.type === "action" && itemData.id === "music-shuffle") {
    try {
      await shuffleMusicSources();
    } catch (error) {
      setMessage(error.message, "error");
      syncUi();
    }
    return;
  }

  if (itemData.type === "action" && String(itemData.id || "").startsWith("spotify-playlist:")) {
    const playlist = itemData.spotifyPlaylist || null;
    try {
      await startSpotifyPlaylistPlayback(playlist);
    } catch (error) {
      presentSpotifyPlaybackFailure(error);
    }
    return;
  }

  if (itemData.type === "action" && String(itemData.id || "").startsWith("spotify-track:")) {
    try {
      await playSpotifyTrack(itemData.spotifyTrack, itemData.spotifyContextUri || "");
    } catch (error) {
      presentSpotifyPlaybackFailure(error, itemData.spotifyTrack, itemData.spotifyContextUri || "");
    }
    return;
  }

  if (itemData.type === "game") {
    openGame(itemData.id);
    return;
  }

  if (itemData.type === "menu") {
    if (itemData.id === "spotify") {
      if (!spotifyViewState.connected) {
        try {
          await connectSpotify();
        } catch (error) {
          setMessage(error.message, "error");
          syncUi();
        }
        return;
      }
      if (!spotifyLibraryData.loaded && !spotifyLibraryData.loading) {
        try {
          await refreshSpotifyLibrary();
        } catch (error) {
          setMessage(error.message, "error");
        }
      }
      libraryPath = [...libraryPath, itemData.id];
      selectedIndex = 0;
      highlightedSongId = "";
      syncUi();
      return;
    }

    if (itemData.id === "spotify-cover-flow") {
      if (!spotifyLibraryData.loaded && !spotifyLibraryData.loading) {
        try {
          await refreshSpotifyLibrary();
        } catch (error) {
          setMessage(error.message, "error");
          syncUi();
          return;
        }
      }
      if (spotifyLibraryData.albums.length === 0) {
        setMessage("No saved Spotify albums are available for Cover Flow.", "error");
        syncUi();
        return;
      }
      libraryPath = ["main", "music", "spotify", "spotify-cover-flow"];
      selectedIndex = 0;
      highlightedSongId = "";
      screenMode = "coverflow";
      syncUi();
      return;
    }

    if (
      itemData.id === "spotify-library" ||
      itemData.id === "spotify-playlists" ||
      itemData.id === "spotify-albums" ||
      itemData.id === "spotify-artists" ||
      itemData.id === "spotify-songs"
    ) {
      if (!spotifyLibraryData.loaded && !spotifyLibraryData.loading) {
        try {
          await refreshSpotifyLibrary();
        } catch (error) {
          setMessage(error.message, "error");
          syncUi();
          return;
        }
      }
      libraryPath = [...libraryPath, itemData.id];
      selectedIndex = 0;
      highlightedSongId = "";
      syncUi();
      return;
    }

    if (String(itemData.id || "").startsWith("spotify-playlist-detail:")) {
      const playlistId = itemData.id.split(":")[1] || "";
      let detail = null;
      try {
        await ensureSpotifyPlaylistDetail(playlistId);
        detail = spotifyLibraryData.playlistDetails[playlistId] || itemData.spotifyPlaylist || null;
      } catch (error) {
        setMessage(error.message, "error");
        syncUi();
        return;
      }
      libraryPath = [...libraryPath, itemData.id];
      selectedIndex = 0;
      highlightedSongId = detail?.tracks?.[0]?.id || "";
      try {
        await startSpotifyPlaylistPlayback(detail);
      } catch (error) {
        presentSpotifyPlaybackFailure(error, detail?.tracks?.[0] || null, detail?.uri || "");
      }
      return;
    }

    if (String(itemData.id || "").startsWith("spotify-album-detail:")) {
      const albumId = itemData.id.split(":")[1] || "";
      try {
        await ensureSpotifyAlbumDetail(albumId);
      } catch (error) {
        setMessage(error.message, "error");
        syncUi();
        return;
      }
    }

    if (String(itemData.id || "").startsWith("spotify-artist-detail:")) {
      const artistId = itemData.id.split(":")[1] || "";
      try {
        await ensureSpotifyArtistDetail(artistId);
      } catch (error) {
        setMessage(error.message, "error");
        syncUi();
        return;
      }
    }
    libraryPath = [...libraryPath, itemData.id];
    selectedIndex = 0;
    highlightedSongId = "";
    syncUi();
    return;
  }

  if (itemData.type === "photo") {
    currentPhotoId = itemData.id;
    screenMode = "photo-viewer";
    syncUi();
    return;
  }

  highlightedSongId = itemData.id;
  const selectedSongIndex = getSongIndex(itemData.id);
  if (selectedSongIndex !== -1) {
    await playSongAtIndex(selectedSongIndex);
  }
}

function renderLibrary() {
  libraryList.innerHTML = "";
  const libraryState = getLibraryState();
  libraryLabel.textContent = libraryState.label;
  libraryTitle.textContent = libraryState.title;
  libraryPanel.dataset.libraryView = getLibraryViewKey();
  clampSelectedIndex();
  const { items } = libraryState;
  const shouldShowSummary = Boolean(libraryState.summary);

  if (items.length === 0) {
    librarySummary.textContent = libraryState.summary;
    librarySummary.classList.toggle("hidden", !shouldShowSummary);
    librarySelectionBar.classList.add("hidden");
    librarySelectionBar.style.transform = "translateY(0)";
    return;
  }

  librarySummary.textContent = libraryState.summary;
  librarySummary.classList.add("hidden");

  const halfWindow = Math.floor(VISIBLE_LIBRARY_ITEMS / 2);
  let startIndex = Math.max(0, selectedIndex - halfWindow);
  let endIndex = Math.min(items.length, startIndex + VISIBLE_LIBRARY_ITEMS);
  startIndex = Math.max(0, endIndex - VISIBLE_LIBRARY_ITEMS);
  const visibleSelectedIndex = selectedIndex - startIndex;

  librarySelectionBar.classList.remove("hidden");
  librarySelectionBar.style.transform = `translateY(${visibleSelectedIndex * (LIBRARY_ROW_HEIGHT + LIBRARY_ROW_GAP)}px)`;

  items.slice(startIndex, endIndex).forEach((itemData, offset) => {
    const item = document.createElement("li");
    const row = document.createElement("button");
    const itemTitle = document.createElement("span");
    const itemMeta = document.createElement("span");
    const itemIndex = startIndex + offset;
    const isSelected = itemIndex === selectedIndex;
    const isPlayingTrack =
      Boolean(currentSong) &&
      ((itemData.type === "song" && itemData.id === currentSong.id) ||
        (itemData.spotifyTrack?.id && itemData.spotifyTrack.id === currentSong.id));

    const isMenuLike = itemData.type === "menu" || itemData.type === "action";
    row.className = `library-item${isSelected ? " is-selected" : ""}${isMenuLike ? " is-menu-item" : ""}${isPlayingTrack ? " is-playing" : ""}`;
    row.setAttribute("aria-selected", isSelected ? "true" : "false");
    row.type = "button";
    itemTitle.className = "library-song";
    itemMeta.className = "library-meta";

    if (itemData.type === "song") {
      const song = itemData.song;
      itemTitle.textContent = song.title || song.fileName;
      itemMeta.textContent = [song.artist || "Unknown Artist", song.category || "Music"].join(" • ");
    } else if (itemData.type === "photo") {
      itemTitle.textContent = itemData.photo.fileName;
      itemMeta.textContent = "Photo";
    } else if (itemData.type === "game") {
      itemTitle.textContent = itemData.title;
      itemMeta.textContent = itemData.meta || "";
    } else {
      itemTitle.textContent = itemData.title;
      itemMeta.textContent = itemData.meta || "";
    }

    if (isPlayingTrack && itemMeta.textContent) {
      itemMeta.textContent = `Now Playing • ${itemMeta.textContent}`;
    }

    row.appendChild(itemTitle);
    row.appendChild(itemMeta);
    row.addEventListener("mouseenter", () => {
      if (navigator.maxTouchPoints > 0) {
        return;
      }
      if (selectedIndex === itemIndex) {
        return;
      }

      selectedIndex = itemIndex;
      highlightedSongId = itemData.type === "song" ? itemData.id : "";
      syncUi();
    });
    row.addEventListener("click", async () => {
      selectedIndex = itemIndex;
      highlightedSongId = itemData.type === "song" ? itemData.id : "";
      await activateLibraryItem(itemData);
    });

    item.appendChild(row);
    libraryList.appendChild(item);
  });
}

function renderCoverflowCard(element, album, variant) {
  if (!element) {
    return;
  }
  element.className = variant;
  if (!album) {
    element.innerHTML = "";
    return;
  }
  const imageUrl = album.artworkUrl || "";
  const title = album.name || "Album";
  element.innerHTML = `
    ${imageUrl ? `<img src="${imageUrl}" alt="${title} cover art">` : ""}
    <figcaption>${title}</figcaption>
  `;
}

function renderCoverflow() {
  const albums = getCoverflowAlbums();
  const currentAlbum = albums[selectedIndex] || null;
  const previousAlbum = albums[selectedIndex - 1] || null;
  const nextAlbum = albums[selectedIndex + 1] || null;

  coverflowTitle.textContent = "Cover Flow";
  coverflowSummary.textContent = albums.length === 0 ? "Spotify didn't return any albums yet." : "Spin the wheel to browse albums.";
  coverflowAlbum.textContent = currentAlbum?.name || "No Albums";
  coverflowArtist.textContent = currentAlbum?.artist || "";

  renderCoverflowCard(coverflowLeft, previousAlbum, "coverflow-card is-side");
  renderCoverflowCard(coverflowCenter, currentAlbum, "coverflow-card is-center");
  renderCoverflowCard(coverflowRight, nextAlbum, "coverflow-card is-side");
}

function buildSpotifyTrackRecord(track, contextUri = "") {
  return normalizeSpotifyTrack(track, contextUri);
}

function buildSpotifyAlbumRecord(album) {
  if (!album) {
    return null;
  }
  return {
    id: album.id || "",
    name: album.name || "Untitled Album",
    artist: Array.isArray(album.artists) ? album.artists.map((artist) => artist?.name).filter(Boolean).join(", ") : "",
    artists: Array.isArray(album.artists)
      ? album.artists.map((artist) => ({
          id: artist?.id || "",
          name: artist?.name || "",
        })).filter((artist) => artist.id || artist.name)
      : [],
    trackCount: Number(album.total_tracks || 0),
    spotifyUrl: album?.external_urls?.spotify || "",
    artworkUrl: album?.images?.[0]?.url || "",
    uri: album?.uri || "",
  };
}

function mergeSpotifyRecords(records, getKey) {
  const seen = new Set();
  return records.filter((record) => {
    const key = getKey(record);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function setCurrentSong(song) {
  currentSong = song;
  if (isSpotifyRemoteSong(song) && song?.uri) {
    rememberSpotifyTrackSelection(song, song.contextUri || "");
  }
  highlightedSongId = song ? song.id : "";
  if (!isSpotifyRemoteSong(song)) {
    previewAudio.pause();
    previewAudio.src = song ? song.playbackUrl : "";
  } else {
    previewAudio.pause();
    previewAudio.removeAttribute("src");
    previewAudio.load();
  }
  renderPlayer();
  syncPlaybackButton();
}

function clearPendingUploads() {
  pendingUploads = [];
  activeUploadIndex = 0;
  uploadToken = "";
  metadataForm.reset();
  fileSummary.textContent = "No file selected";
  guessSummary.textContent = "Choose an audio or video file for your iPod.";
  optimizeForSelect.value = "ipod-classic-5-5g";
  videoQualitySelect.value = "standard";
  fileInput.value = "";
}

function loadActiveUpload(index) {
  const upload = pendingUploads[index];
  if (!upload) {
    return;
  }

  activeUploadIndex = index;
  uploadToken = upload.token;
  setMetadata(upload.metadata, upload);
  lastConvertedSong = null;
  screenMode = "edit";
  syncUi();
}

function syncUi() {
  clampSelectedIndex();
  setScreenMode(screenMode);
  syncSelectButton();
  syncPlaybackButton();
  syncWheelButtons();
  if (screenMode === "edit") {
    renderConvertScreen();
    return;
  }
  if (screenMode === "library") {
    renderLibrary();
    if (getLibraryViewKey() === "spotify-search" && spotifySearchInput) {
      window.setTimeout(() => spotifySearchInput.focus(), 0);
    }
    return;
  }
  if (screenMode === "coverflow") {
    renderCoverflow();
    return;
  }
  if (screenMode === "sync") {
    renderSyncScreen();
    return;
  }
  if (screenMode === "photo-viewer") {
    renderPhotoViewer();
    return;
  }
  if (screenMode === "game") {
    renderGameScreen();
    return;
  }
  if (screenMode === "now-playing") {
    renderPlayer();
  }
}

async function refreshSyncStatus() {
  const previousState = syncViewState.state;
  const payload = await fetchSyncPayload("/api/sync/status");
  syncViewState = normalizeSyncViewState(payload);
  if (previousState !== "success" && syncViewState.state === "success") {
    haptics.success();
  }
  syncUi();
}

async function startSyncNow() {
  if (!syncViewState.canStart || syncViewState.busy) {
    return;
  }

  haptics.confirm();
  const previousState = syncViewState.state;
  const payload = await fetchSyncPayload("/api/sync/start", {
    method: "POST",
  });
  syncViewState = normalizeSyncViewState(payload);
  if (previousState !== "success" && syncViewState.state === "success") {
    haptics.success();
  }
  syncUi();
}

async function openSyncUtility() {
  previewAudio.pause();
  screenMode = "sync";
  syncViewState = normalizeSyncViewState();
  syncUi();
  await refreshSyncStatus();
  startSyncPolling();
}

async function refreshSpotifyStatus() {
  const config = getSpotifyOAuthConfig();
  if (!config.clientId) {
    spotifyViewState = normalizeSpotifyViewState({
      configured: false,
      connected: false,
      error: "Spotify is not configured yet. Add SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI.",
      scopes: config.scopes,
    });
    return;
  }

  const authState = loadSpotifyAuthState();
  if (!authState?.accessToken && !authState?.refreshToken) {
    spotifyViewState = normalizeSpotifyViewState({
      configured: true,
      connected: false,
      error: "",
      scopes: config.scopes,
    });
    return;
  }

  const missingScopes = getMissingSpotifyScopes(authState);
  if (missingScopes.length > 0) {
    clearSpotifyAuthState();
    spotifyViewState = normalizeSpotifyViewState({
      configured: true,
      connected: false,
      error: "Reconnect Spotify to grant the updated permissions required for playlists, artists, albums, and playback.",
      scopes: config.scopes,
    });
    return;
  }

  // Treat a stored Spotify token as connected immediately so the UI
  // stops looping back into the auth flow while profile hydration catches up.
  spotifyViewState = normalizeSpotifyViewState({
    configured: true,
    connected: true,
    profileName: authState?.profileName || "",
    profileImageUrl: authState?.profileImageUrl || "",
    playlists: spotifyLibraryData.playlists,
    error: "",
    scopes: config.scopes,
  });

  try {
    const profile = await spotifyApiRequest("/me");
    const profileName = profile?.display_name || profile?.id || authState?.profileName || "Spotify User";
    const profileImageUrl = Array.isArray(profile?.images) ? profile.images[0]?.url || "" : "";
    saveSpotifyAuthState({
      ...authState,
      profileName,
      profileImageUrl,
    });
    spotifyViewState = normalizeSpotifyViewState({
      configured: true,
      connected: true,
      profileName,
      profileImageUrl,
      playlists: spotifyLibraryData.playlists,
      error: "",
      scopes: config.scopes,
    });
  } catch (error) {
    spotifyViewState = normalizeSpotifyViewState({
      configured: true,
      connected: true,
      profileName: authState?.profileName || "",
      profileImageUrl: authState?.profileImageUrl || "",
      playlists: spotifyLibraryData.playlists,
      error: error.message,
      scopes: config.scopes,
    });
  }
}

async function initializeSpotifySdk() {
  if (!spotifyViewState.connected) {
    return;
  }
  if (spotifySdkReady && spotifySdkPlayer && spotifySdkDeviceId) {
    return;
  }
  if (spotifySdkInitPromise) {
    return spotifySdkInitPromise;
  }

  spotifySdkInitPromise = new Promise((resolve, reject) => {
    let settled = false;
    const resolveReady = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };
    const rejectReady = (error) => {
      const normalizedError = error instanceof Error ? error : new Error(String(error || "Spotify playback failed."));
      if (settled) {
        logSpotifyConsole("error", "Spotify SDK error after initialization", {
          error: normalizedError.message,
          deviceId: spotifySdkDeviceId || "",
        });
        return;
      }
      settled = true;
      reject(normalizedError);
    };
    const handlePlayerError = (eventName, message, rejectInitialization = false) => {
      const normalizedMessage = String(message || "Spotify playback failed.").trim() || "Spotify playback failed.";
      logSpotifyConsole(rejectInitialization ? "error" : "warn", `Spotify SDK ${eventName}`, {
        message: normalizedMessage,
        deviceId: spotifySdkDeviceId || "",
      });
      if (!rejectInitialization) {
        setMessage(normalizedMessage, "error");
        return;
      }
      clearSpotifySdkState(`sdk ${eventName}`);
      rejectReady(new Error(normalizedMessage));
    };
    const startPlayer = () => {
      if (!isSpotifySdkAvailable()) {
        rejectReady(new Error("Spotify browser playback is not available in this browser."));
        return;
      }

      if (spotifySdkPlayer && !spotifySdkReady) {
        clearSpotifySdkState("restarting stale SDK player");
      }

      if (spotifySdkPlayer) {
        logSpotifyConsole("info", "Reusing ready Spotify SDK player", {
          deviceId: spotifySdkDeviceId || "",
        });
        resolveReady();
        return;
      }

      const player = new window.Spotify.Player({
        name: "SwagPods Web Player",
        getOAuthToken: async (callback) => {
          try {
            const token = await getSpotifyWebPlaybackToken();
            callback(token);
          } catch (error) {
            setMessage(error.message, "error");
          }
        },
        volume: 0.8,
      });
      spotifySdkPlayer = player;
      logSpotifyConsole("info", "Initializing Spotify Web Playback SDK", getSpotifyPlaybackDiagnostics());

      player.addListener("ready", ({ device_id }) => {
        spotifySdkDeviceId = device_id;
        spotifySdkReady = true;
        logSpotifyConsole("info", "Spotify SDK ready", { deviceId: device_id || "" });
        resolveReady();
      });
      player.addListener("not_ready", ({ device_id }) => {
        const offlineDeviceId = device_id || spotifySdkDeviceId || "";
        spotifySdkReady = false;
        logSpotifyConsole("warn", "Spotify SDK device not ready", {
          deviceId: offlineDeviceId,
        });
      });
      player.addListener("initialization_error", ({ message }) => handlePlayerError("initialization_error", message, true));
      player.addListener("authentication_error", ({ message }) => handlePlayerError("authentication_error", message, true));
      player.addListener("account_error", ({ message }) => handlePlayerError("account_error", message, true));
      player.addListener("playback_error", ({ message }) => handlePlayerError("playback_error", message, false));
      player.addListener("player_state_changed", (state) => {
        if (!state || !state.track_window?.current_track) {
          return;
        }
        const currentTrack = state.track_window.current_track;
        const normalizedTrack = normalizeSpotifyTrack({
          ...currentTrack,
          durationMs: Number(state.duration || currentTrack.duration_ms || 0),
          album: currentTrack.album,
          spotifyUrl: "",
        });
        spotifyPlayerState = {
          ...spotifyPlayerState,
          connected: true,
          hasActiveDevice: true,
          isPlaying: !state.paused,
          progressMs: Number(state.position || 0),
          deviceName: "SwagPods Web Player",
          deviceType: "Web",
          deviceId: spotifySdkDeviceId,
          contextUri: state.context?.uri || spotifyPlayerState.contextUri || "",
          track: normalizedTrack,
        };
        if (normalizedTrack) {
          rememberSpotifyTrackSelection(normalizedTrack, spotifyPlayerState.contextUri || "");
        }
        if (screenMode === "now-playing") {
          void refreshSpotifyPlayerState().catch(() => {});
        }
      });

      player.connect().then((connected) => {
        logSpotifyConsole("info", "Spotify SDK connect result", { connected: Boolean(connected) });
        if (!connected) {
          clearSpotifySdkState("sdk connect returned false");
          rejectReady(new Error("Spotify browser playback could not connect."));
          return;
        }
      }).catch((error) => {
        clearSpotifySdkState("sdk connect failed");
        rejectReady(new Error(error.message || "Spotify browser playback failed to connect."));
      });
    };

    if (isSpotifySdkAvailable()) {
      startPlayer();
      return;
    }

    const previousHandler = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      if (typeof previousHandler === "function") {
        previousHandler();
      }
      startPlayer();
    };
  }).finally(() => {
    spotifySdkInitPromise = null;
  });

  return spotifySdkInitPromise;
}

async function buildSpotifyPlaylistCatalog(playlists) {
  const catalog = {
    tracks: [],
    albums: [],
    artists: [],
  };
  const playlistEntries = Array.isArray(playlists) ? playlists.slice(0, 8) : [];
  if (playlistEntries.length === 0) {
    return catalog;
  }
  const playablePlaylistEntries = playlistEntries.filter((playlist) => playlist?.id);

  const playlistPayloads = await Promise.allSettled(
    playablePlaylistEntries.map((playlist) => spotifyPaginatedRequest(`/playlists/${playlist.id}/items?limit=50`))
  );

  playlistPayloads.forEach((payload, index) => {
    if (payload.status !== "fulfilled") {
      return;
    }
    const contextUri = playablePlaylistEntries[index]?.uri || "";
    const tracks = (Array.isArray(payload.value) ? payload.value : [])
      .map((item) => buildSpotifyTrackRecord(extractSpotifyCollectionTrack(item), contextUri))
      .filter(Boolean);

    tracks.forEach((track) => {
      catalog.tracks.push(track);
      if (track.album) {
        catalog.albums.push({
          id: track.id ? `${track.id}:${track.album}` : track.album,
          name: track.album,
          artist: track.artist,
          artists: track.artists || [],
          trackCount: 0,
          spotifyUrl: "",
          artworkUrl: track.artworkUrl || "",
          uri: contextUri,
        });
      }
      (track.artists || []).forEach((artist) => {
        catalog.artists.push({
          id: artist.id || artist.name.toLowerCase(),
          name: artist.name || "Unknown Artist",
          spotifyUrl: "",
          uri: "",
          artworkUrl: "",
        });
      });
    });
  });

  catalog.tracks = mergeSpotifyRecords(catalog.tracks, (track) => track.uri || track.id);
  catalog.albums = mergeSpotifyRecords(catalog.albums, (album) => album.name.toLowerCase());
  catalog.artists = mergeSpotifyRecords(catalog.artists, (artist) => artist.id || artist.name.toLowerCase());
  return catalog;
}

async function refreshSpotifyLibrary() {
  spotifyLibraryData.loading = true;
  syncUi();

  const [playlistsPayload, tracksPayload, albumsPayload, artistsPayload] = await Promise.allSettled([
    spotifyApiRequest("/me/playlists?limit=50"),
    spotifyApiRequest("/me/tracks?limit=50"),
    spotifyApiRequest("/me/albums?limit=50"),
    spotifyApiRequest("/me/following?type=artist&limit=50"),
  ]);

  const warnings = [];
  const playlists = playlistsPayload.status === "fulfilled"
    ? (Array.isArray(playlistsPayload.value?.items) ? playlistsPayload.value.items : []).map((playlist) => ({
        id: playlist.id || "",
        name: playlist.name || "Untitled Playlist",
        trackCount: Number(playlist?.items?.total || playlist?.tracks?.total || 0),
        spotifyUrl: playlist?.external_urls?.spotify || "",
        ownerName: playlist?.owner?.display_name || playlist?.owner?.id || "",
        artworkUrl: playlist?.images?.[0]?.url || "",
        uri: playlist?.uri || "",
      }))
    : [];
  if (playlistsPayload.status === "rejected") {
    warnings.push(playlistsPayload.reason?.message || "Could not load Spotify playlists.");
  }

  const tracks = tracksPayload.status === "fulfilled"
    ? (Array.isArray(tracksPayload.value?.items) ? tracksPayload.value.items : [])
        .map((item) => buildSpotifyTrackRecord(item?.track))
        .filter(Boolean)
    : [];
  if (tracksPayload.status === "rejected") {
    warnings.push(tracksPayload.reason?.message || "Could not load Spotify liked songs.");
  }

  const albums = albumsPayload.status === "fulfilled"
    ? (Array.isArray(albumsPayload.value?.items) ? albumsPayload.value.items : [])
        .map((item) => buildSpotifyAlbumRecord(item?.album))
        .filter(Boolean)
    : [];
  if (albumsPayload.status === "rejected") {
    warnings.push(albumsPayload.reason?.message || "Could not load Spotify albums.");
  }

  const followedArtists = artistsPayload.status === "fulfilled"
    ? (Array.isArray(artistsPayload.value?.artists?.items) ? artistsPayload.value.artists.items : []).map((artist) => ({
        id: artist.id || "",
        name: artist.name || "Unknown Artist",
        spotifyUrl: artist?.external_urls?.spotify || "",
        uri: artist?.uri || "",
        artworkUrl: artist?.images?.[0]?.url || "",
      }))
    : [];
  if (artistsPayload.status === "rejected") {
    warnings.push(artistsPayload.reason?.message || "Could not load followed Spotify artists.");
  }

  const playlistCatalog =
    playlists.length > 0 && (tracks.length === 0 || albums.length === 0 || followedArtists.length === 0)
      ? await buildSpotifyPlaylistCatalog(playlists)
      : { tracks: [], albums: [], artists: [] };

  const artistIndex = {};
  albums.forEach((album) => {
    (album.artists || []).forEach((artist) => {
      const key = artist.id || artist.name.toLowerCase();
      if (!key) {
        return;
      }
      if (!artistIndex[key]) {
        artistIndex[key] = {
          id: artist.id || key,
          name: artist.name || "Unknown Artist",
          spotifyUrl: "",
          uri: "",
        };
      }
    });
  });
  tracks.forEach((track) => {
    (track.artists || []).forEach((artist) => {
      const key = artist.id || artist.name.toLowerCase();
      if (!key) {
        return;
      }
      if (!artistIndex[key]) {
        artistIndex[key] = {
          id: artist.id || key,
          name: artist.name || "Unknown Artist",
          spotifyUrl: "",
          uri: "",
        };
      }
    });
  });
  playlistCatalog.tracks.forEach((track) => {
    (track.artists || []).forEach((artist) => {
      const key = artist.id || artist.name.toLowerCase();
      if (!key) {
        return;
      }
      if (!artistIndex[key]) {
        artistIndex[key] = {
          id: artist.id || key,
          name: artist.name || "Unknown Artist",
          spotifyUrl: "",
          uri: "",
        };
      }
    });
  });

  spotifyLibraryData = {
    ...spotifyLibraryData,
    playlists,
    albums: mergeSpotifyRecords([...albums, ...playlistCatalog.albums], (album) => album.id || album.name.toLowerCase()),
    artists: [...followedArtists, ...Object.values(artistIndex)]
      .reduce((accumulator, artist) => {
        const key = artist.id || artist.name.toLowerCase();
        if (key && !accumulator.some((entry) => (entry.id || entry.name.toLowerCase()) === key)) {
          accumulator.push(artist);
        }
        return accumulator;
      }, [])
      .sort((left, right) => left.name.localeCompare(right.name)),
    tracks: mergeSpotifyRecords([...tracks, ...playlistCatalog.tracks], (track) => track.uri || track.id),
    loading: false,
    loaded: true,
    warnings,
  };
  const failedSections = [playlistsPayload, tracksPayload, albumsPayload, artistsPayload].every(
    (payload) => payload.status === "rejected"
  );
  if (failedSections) {
    spotifyLibraryData.loading = false;
    throw new Error(warnings[0] || "Spotify data did not load.");
  }
  if (spotifyLibraryData.warnings.length > 0) {
    setMessage(spotifyLibraryData.warnings[0], "error");
  }
  syncUi();
}

async function ensureSpotifyPlaylistDetail(playlistId) {
  if (!playlistId || spotifyLibraryData.playlistDetails[playlistId]) {
    return;
  }
  const details = await spotifyApiRequest(`/playlists/${playlistId}`);
  const tracksPayload = await spotifyPaginatedRequest(`/playlists/${playlistId}/items?limit=50`);
  spotifyLibraryData.playlistDetails[playlistId] = {
    id: details.id || playlistId,
    name: details.name || "Playlist",
    spotifyUrl: details?.external_urls?.spotify || "",
    tracks: (Array.isArray(tracksPayload) ? tracksPayload : [])
      .map((item) => buildSpotifyTrackRecord(extractSpotifyCollectionTrack(item), details?.uri || ""))
      .filter(Boolean),
    uri: details?.uri || "",
  };
}

async function ensureSpotifyAlbumDetail(albumId) {
  if (!albumId || spotifyLibraryData.albumDetails[albumId]) {
    return;
  }
  const payload = await spotifyApiRequest(`/albums/${albumId}`);
  spotifyLibraryData.albumDetails[albumId] = {
    id: payload.id || albumId,
    name: payload.name || "Album",
    artist: Array.isArray(payload.artists) ? payload.artists.map((artist) => artist?.name).filter(Boolean).join(", ") : "",
    spotifyUrl: payload?.external_urls?.spotify || "",
    tracks: (Array.isArray(payload?.tracks?.items) ? payload.tracks.items : [])
      .map((track) => buildSpotifyTrackRecord({ ...track, album: payload }, payload?.uri || ""))
      .filter(Boolean),
    uri: payload?.uri || "",
  };
}

async function ensureSpotifyArtistDetail(artistId) {
  if (!artistId || spotifyLibraryData.artistDetails[artistId]) {
    return;
  }
  const artist = await spotifyApiRequest(`/artists/${artistId}`);
  const payload = await spotifyApiRequest(`/artists/${artistId}/albums?include_groups=album,single&limit=50`);
  spotifyLibraryData.artistDetails[artistId] = {
    id: artist.id || artistId,
    name: artist.name || "Artist",
    spotifyUrl: artist?.external_urls?.spotify || "",
    albums: (Array.isArray(payload?.items) ? payload.items : []).map((album) => ({
      id: album.id || "",
      name: album.name || "Album",
      artist: Array.isArray(album.artists) ? album.artists.map((entry) => entry?.name).filter(Boolean).join(", ") : "",
      trackCount: Number(album.total_tracks || 0),
      spotifyUrl: album?.external_urls?.spotify || "",
      artworkUrl: album?.images?.[0]?.url || "",
      uri: album?.uri || "",
    })),
  };
}

async function searchSpotifyLibrary(query) {
  const trimmedQuery = String(query || "").trim();
  spotifyLibraryData.searchQuery = trimmedQuery;
  spotifyLibraryData.searchError = "";
  if (!trimmedQuery) {
    spotifyLibraryData.searchResults = [];
    spotifyLibraryData.searchLoading = false;
    syncUi();
    return;
  }
  spotifyLibraryData.searchLoading = true;
  syncUi();
  const payload = await spotifyApiRequest(`/search?type=track&limit=10&q=${encodeURIComponent(trimmedQuery)}`);
  const items = Array.isArray(payload?.tracks?.items) ? payload.tracks.items : [];
  spotifyLibraryData.searchResults = items.map((track) => buildSpotifyTrackRecord(track)).filter(Boolean);
  spotifyLibraryData.searchLoading = false;
  libraryPath = ["main", "music", "spotify", "spotify-search"];
  selectedIndex = 0;
  syncUi();
}

function scheduleSpotifySearch(query) {
  spotifyLibraryData.searchQuery = query;
  spotifyLibraryData.searchError = "";
  if (spotifySearchDebounceTimer) {
    window.clearTimeout(spotifySearchDebounceTimer);
  }
  if (!query.trim()) {
    spotifyLibraryData.searchResults = [];
    spotifyLibraryData.searchLoading = false;
    syncUi();
    return;
  }
  spotifyLibraryData.searchLoading = true;
  syncUi();
  spotifySearchDebounceTimer = window.setTimeout(async () => {
    try {
      await searchSpotifyLibrary(query);
    } catch (error) {
      spotifyLibraryData.searchLoading = false;
      spotifyLibraryData.searchError = error.message;
      syncUi();
    }
  }, 260);
}

async function connectSpotify() {
  const config = getSpotifyOAuthConfig();
  if (!config.clientId) {
    setMessage(
      "Spotify is not configured on the server. Add SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI first.",
      "error"
    );
    return;
  }
  try {
    const payload = await fetchJson("/api/spotify/connect", {
      method: "POST",
    });
    if (!payload.authorizeUrl) {
      throw new Error("Spotify authorize URL was not returned.");
    }
    saveSpotifyPkceState({
      state: payload.state || "",
      codeVerifier: payload.codeVerifier || "",
      redirectUri: payload.redirectUri || config.redirectUri,
    });
    window.location.assign(payload.authorizeUrl);
  } catch (error) {
    const verifier = createRandomSpotifyString(96);
    const challenge = await createSpotifyCodeChallenge(verifier);
    const state = createRandomSpotifyString(48);
    saveSpotifyPkceState({
      state,
      codeVerifier: verifier,
      redirectUri: config.redirectUri,
    });
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: "code",
      redirect_uri: config.redirectUri,
      scope: config.scopes,
      code_challenge_method: "S256",
      code_challenge: challenge,
      state,
    });
    window.location.assign(`https://accounts.spotify.com/authorize?${params.toString()}`);
  }
}

async function disconnectSpotify() {
  clearSpotifyPkceState();
  clearSpotifyAuthState();
  stopSpotifyPlayerPolling();
  clearSpotifySdkState("spotify disconnected");
  spotifyPlayerState = normalizeSpotifyPlayerState();
  spotifyPlaybackContext = {
    selectedTrack: null,
    selectedContextUri: "",
    lastTrack: null,
    lastContextUri: "",
  };
  spotifyViewState = normalizeSpotifyViewState({
    configured: Boolean(getSpotifyOAuthConfig().clientId),
    connected: false,
    error: "",
    scopes: getSpotifyOAuthConfig().scopes,
  });
  spotifyLibraryData = {
    playlists: [],
    albums: [],
    artists: [],
    tracks: [],
    loading: false,
    loaded: false,
    searchQuery: "",
    searchLoading: false,
    searchError: "",
    searchResults: [],
    warnings: [],
    playlistDetails: {},
    albumDetails: {},
    artistDetails: {},
  };
  if (isSpotifyRemoteSong()) {
    setCurrentSong(null);
    if (screenMode === "now-playing") {
      screenMode = "library";
    }
  }
  await refreshSpotifyStatus();
  setMessage("Spotify disconnected.", "success");
  if (getLibraryViewKey() === "spotify-library") {
    libraryPath = ["main", "spotify"];
    selectedIndex = 0;
  }
  syncUi();
}

async function refreshSpotifyPlayerState() {
  const payload = await fetchJson("/api/spotify/player");
  return applySpotifyPlayerResponse(
    payload,
    spotifyPlaybackContext.selectedTrack,
    spotifyPlaybackContext.selectedContextUri
  );
}

function stopSpotifyPlayerPolling() {
  if (spotifyPlayerPollTimer) {
    window.clearInterval(spotifyPlayerPollTimer);
    spotifyPlayerPollTimer = null;
  }
}

function startSpotifyPlayerPolling() {
  stopSpotifyPlayerPolling();
  spotifyPlayerPollTimer = window.setInterval(() => {
    if (screenMode === "now-playing" && isSpotifyRemoteSong()) {
      void refreshSpotifyPlayerState().catch(() => {});
    }
  }, 3000);
}

async function openSpotifyNowPlaying() {
  screenMode = "now-playing";
  syncUi();
  await ensureSpotifyPlaybackOnNowPlaying();
  startSpotifyPlayerPolling();
}

function applySpotifyPlayerResponse(payload = {}, fallbackTrack = null, fallbackContextUri = "") {
  const normalizedContextUri =
    payload?.contextUri ||
    fallbackContextUri ||
    spotifyPlaybackContext.selectedContextUri ||
    "";
  const resolvedDeviceId =
    payload?.deviceId ||
    payload?.targetDeviceId ||
    (spotifySdkReady ? spotifySdkDeviceId : "") ||
    "";
  const hasActiveDevice =
    typeof payload?.hasActiveDevice === "boolean"
      ? payload.hasActiveDevice || Boolean(resolvedDeviceId)
      : Boolean(resolvedDeviceId);
  const normalizedTrack = normalizeSpotifyTrack(payload?.track || fallbackTrack, normalizedContextUri);

  spotifyPlayerState = normalizeSpotifyPlayerState({
    ...payload,
    connected: payload?.connected ?? spotifyViewState.connected,
    hasActiveDevice,
    deviceName: payload?.deviceName || (hasActiveDevice && spotifySdkReady ? "SwagPods Web Player" : ""),
    deviceType: payload?.deviceType || (hasActiveDevice && spotifySdkReady ? "Web" : ""),
    deviceId: resolvedDeviceId,
    contextUri: normalizedContextUri,
    track: normalizedTrack,
  });

  if (normalizedTrack) {
    rememberSpotifyTrackSelection(normalizedTrack, normalizedContextUri);
    const song = buildSpotifySong(normalizedTrack, normalizedContextUri);
    if (song) {
      setCurrentSong(song);
    }
  } else if (screenMode === "now-playing" || isSpotifyRemoteSong()) {
    showSpotifyPlaybackHelp(
      spotifyPlayerState.hasActiveDevice
        ? "Pick a song to start music."
        : "Select a playback device."
    );
  }

  syncUi();
  return spotifyPlayerState;
}

async function waitForSpotifySdkDevice() {
  if (spotifySdkReady && spotifySdkDeviceId) {
    return spotifySdkDeviceId;
  }
  if (!spotifySdkInitPromise && !spotifySdkPlayer) {
    return "";
  }
  for (let attempt = 0; attempt < SPOTIFY_SDK_DEVICE_WAIT_ATTEMPTS; attempt += 1) {
    if (spotifySdkReady && spotifySdkDeviceId) {
      return spotifySdkDeviceId;
    }
    await sleep(SPOTIFY_SDK_DEVICE_WAIT_MS);
  }
  return spotifySdkDeviceId || "";
}

async function ensureSpotifyPlaybackGesture() {
  let initializationError = null;
  try {
    await initializeSpotifySdk();
  } catch (error) {
    initializationError = error;
    spotifySdkReady = false;
    logSpotifyConsole("warn", "Spotify SDK initialization did not complete", {
      error: error.message || String(error),
    });
  }
  if (spotifySdkPlayer && typeof spotifySdkPlayer.activateElement === "function") {
    try {
      await spotifySdkPlayer.activateElement();
      logSpotifyConsole("info", "Spotify playback activated from user gesture", {
        deviceId: spotifySdkDeviceId || "",
      });
    } catch (error) {
      logSpotifyConsole("warn", "Spotify playback activation failed", {
        error: error.message || String(error),
        deviceId: spotifySdkDeviceId || "",
      });
      if (!initializationError) {
        initializationError = error;
      }
    }
  }
  const readyDeviceId = await waitForSpotifySdkDevice();
  if (readyDeviceId) {
    logSpotifyConsole("info", "Spotify playback device ready", {
      deviceId: readyDeviceId,
    });
  } else if (initializationError) {
    logSpotifyConsole("warn", "Spotify playback continuing without local SDK device", {
      error: initializationError.message || String(initializationError),
    });
  }
}

async function requestSpotifyPlayerCommand(action, options = {}) {
  const fallbackTrack =
    normalizeSpotifyTrack(options.track, options.contextUri) ||
    spotifyPlayerState.track ||
    spotifyPlaybackContext.selectedTrack ||
    spotifyPlaybackContext.lastTrack ||
    null;
  const fallbackContextUri =
    options.contextUri ||
    spotifyPlayerState.contextUri ||
    fallbackTrack?.contextUri ||
    spotifyPlaybackContext.selectedContextUri ||
    spotifyPlaybackContext.lastContextUri ||
    "";
  const requestedDeviceId =
    options.deviceId ||
    (await waitForSpotifySdkDevice()) ||
    spotifySdkDeviceId ||
    spotifyPlayerState.deviceId ||
    "";
  const payload = {
    action,
    deviceId: requestedDeviceId,
  };
  if (fallbackTrack?.uri) {
    payload.trackUri = fallbackTrack.uri;
  }
  if (fallbackContextUri) {
    payload.contextUri = fallbackContextUri;
  }
  if (Number.isFinite(Number(options.positionMs)) && Number(options.positionMs) > 0) {
    payload.positionMs = Number(options.positionMs);
  }
  if (typeof options.shuffle === "boolean") {
    payload.shuffle = options.shuffle;
  }
  logSpotifyConsole("info", "Sending Spotify player command", {
    action,
    requestedDeviceId,
    trackUri: payload.trackUri || "",
    contextUri: payload.contextUri || "",
    shuffle: Boolean(payload.shuffle),
    diagnostics: getSpotifyPlaybackDiagnostics(),
  });
  try {
    const response = await fetchJson("/api/spotify/player/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    logSpotifyConsole("info", "Spotify player command completed", {
      action,
      requestedDeviceId,
      targetDeviceId: response?.targetDeviceId || response?.deviceId || "",
      isPlaying: Boolean(response?.isPlaying),
    });
    return applySpotifyPlayerResponse(response, fallbackTrack, fallbackContextUri);
  } catch (error) {
    logSpotifyConsole("error", "Spotify player command failed", {
      action,
      requestedDeviceId,
      trackUri: payload.trackUri || "",
      contextUri: payload.contextUri || "",
      error: error.message || String(error),
    });
    throw error;
  }
}

async function sendSpotifyPlayerCommand(action, options = {}) {
  await ensureSpotifyPlaybackGesture();
  return requestSpotifyPlayerCommand(action, options);
}

async function playSpotifyContext(contextUri, track = null, options = {}) {
  if (!contextUri) {
    throw new Error("Spotify context URI is missing.");
  }
  const startingTrack = track ? setSpotifyCurrentSong(track, contextUri) : null;
  if (options.enterNowPlaying !== false) {
    screenMode = "now-playing";
    syncUi();
  }
  await ensureSpotifyPlaybackGesture();
  await requestSpotifyPlayerCommand("play-context", {
    track: startingTrack,
    contextUri,
    shuffle: Boolean(options.shuffle),
  });
  startSpotifyPlayerPolling();
}

async function playSpotifyTrack(track, contextUri = "", options = {}) {
  const normalizedTrack = setSpotifyCurrentSong(track, contextUri);
  if (!normalizedTrack?.uri) {
    throw new Error("Spotify track URI is missing.");
  }
  if (options.enterNowPlaying !== false) {
    screenMode = "now-playing";
    syncUi();
  }
  await ensureSpotifyPlaybackGesture();
  await requestSpotifyPlayerCommand("play-track", {
    track: normalizedTrack,
    contextUri: normalizedTrack.contextUri || contextUri || "",
    shuffle: Boolean(options.shuffle),
  });
  startSpotifyPlayerPolling();
}

async function shuffleMusicSources() {
  if (spotifyViewState.connected && spotifyLibraryData.tracks.length === 0) {
    await refreshSpotifyLibrary();
  }

  const localTracks = getSongsByCategory("Music").map((song) => ({
    source: "downloaded",
    song,
  }));
  const spotifyTracks = spotifyViewState.connected
    ? spotifyLibraryData.tracks.map((track) => ({
        source: "spotify",
        track,
      }))
    : [];

  const pool = shuffleArray([...localTracks, ...spotifyTracks]);
  const nextItem = pool[0] || null;
  if (!nextItem) {
    throw new Error("No songs available to shuffle.");
  }

  if (nextItem.source === "spotify") {
    await playSpotifyTrack(nextItem.track);
    return;
  }

  const songIndex = getSongIndex(nextItem.song.id);
  if (songIndex === -1) {
    throw new Error("Downloaded track is no longer available.");
  }
  await playSongAtIndex(songIndex);
}

async function startSpotifyPlaybackFromEmptyState() {
  if (!spotifyViewState.connected) {
    throw new Error("Connect Spotify first.");
  }

  if (!spotifyLibraryData.loaded && !spotifyLibraryData.loading) {
    await refreshSpotifyLibrary();
  }

  if (spotifyPlayerState.track?.uri) {
    await sendSpotifyPlayerCommand("resume", {
      track: spotifyPlayerState.track,
      contextUri: spotifyPlayerState.contextUri || "",
    });
    return;
  }

  const fallbackSelection = getSpotifyFallbackSelection();
  if (fallbackSelection.track?.uri) {
    await playSpotifyTrack(fallbackSelection.track, fallbackSelection.contextUri, { enterNowPlaying: false });
    return;
  }

  const firstPlaylist = spotifyLibraryData.playlists[0] || null;
  if (firstPlaylist?.id && !spotifyLibraryData.playlistDetails[firstPlaylist.id]) {
    await ensureSpotifyPlaylistDetail(firstPlaylist.id);
  }
  const playlistDetail = firstPlaylist?.id ? spotifyLibraryData.playlistDetails[firstPlaylist.id] || null : null;
  if (playlistDetail?.tracks?.length > 0) {
    await playSpotifyTrack(playlistDetail.tracks[0], playlistDetail.uri || "", { enterNowPlaying: false });
    return;
  }

  throw new Error("No Spotify tracks were found in your saved songs or playlists.");
}

async function startSpotifyPlaylistPlayback(playlistDetail = null) {
  if (!spotifyViewState.connected) {
    throw new Error("Connect Spotify first.");
  }

  if (!spotifyLibraryData.loaded && !spotifyLibraryData.loading) {
    await refreshSpotifyLibrary();
  }

  let activePlaylist = playlistDetail || getCurrentSpotifyPlaylistDetail();
  if (!activePlaylist?.id) {
    const playlistId = activePlaylist?.id || "";
    if (playlistId && !spotifyLibraryData.playlistDetails[playlistId]) {
      await ensureSpotifyPlaylistDetail(playlistId);
    }
    activePlaylist = playlistId ? spotifyLibraryData.playlistDetails[playlistId] || activePlaylist : activePlaylist;
  }

  if (activePlaylist?.id && !spotifyLibraryData.playlistDetails[activePlaylist.id]) {
    await ensureSpotifyPlaylistDetail(activePlaylist.id);
    activePlaylist = spotifyLibraryData.playlistDetails[activePlaylist.id] || activePlaylist;
  }

  if (activePlaylist?.uri && activePlaylist?.tracks?.length > 0) {
    const firstTrack = activePlaylist.tracks[0];
    await playSpotifyContext(activePlaylist.uri, firstTrack, {
      shuffle: false,
      enterNowPlaying: true,
    });
    return activePlaylist;
  }

  throw new Error("No playable tracks were found in this Spotify playlist.");
}

function showSpotifyPlaybackHelp(message) {
  const normalizedMessage = String(message || "").trim();
  const needsDevice = normalizedMessage.toLowerCase().includes("device");
  setCurrentSong({
    id: "spotify-help",
    fileName: "",
    title: needsDevice ? "Select A Device" : "Click Play To Start",
    artist: "Spotify",
    album: normalizedMessage || "Click play to start.",
    durationSeconds: 0,
    playbackUrl: "",
    downloadUrl: "#",
    spotifyUrl: "",
    artworkUrl: null,
    uri: "",
    contextUri: "",
    source: "spotify",
  });
  screenMode = "now-playing";
  syncUi();
}

function showSpotifyPlaybackError(message, track = null, contextUri = "") {
  const normalizedMessage = String(message || "Spotify playback failed.").trim() || "Spotify playback failed.";
  const selectedTrack = normalizeSpotifyTrack(track, contextUri);
  const sourceTrack = selectedTrack || spotifyPlaybackContext.selectedTrack || spotifyPlaybackContext.lastTrack || null;
  const fallbackSong = sourceTrack ? buildSpotifySong(sourceTrack, sourceTrack.contextUri || contextUri || "") : null;
  setCurrentSong(
    fallbackSong || {
      id: "spotify-error",
      fileName: "",
      title: "Playback Failed",
      artist: "Spotify",
      album: normalizedMessage,
      durationSeconds: 0,
      playbackUrl: "",
      downloadUrl: "#",
      spotifyUrl: "",
      artworkUrl: null,
      uri: "",
      contextUri: "",
      source: "spotify",
    }
  );
  screenMode = "now-playing";
  syncUi();
}

function presentSpotifyPlaybackFailure(error, track = null, contextUri = "") {
  const message = error?.message || String(error || "Spotify playback failed.");
  if (String(message).toLowerCase().includes("playback device")) {
    showSpotifyPlaybackHelp("Select a playback device.");
  } else {
    showSpotifyPlaybackError(message, track, contextUri);
  }
  setMessage(message, "error");
}

async function ensureSpotifyPlaybackOnNowPlaying() {
  if (!spotifyViewState.connected) {
    throw new Error("Connect Spotify first.");
  }

  try {
    await refreshSpotifyPlayerState();
  } catch (error) {
    if (!spotifyLibraryData.loaded && !spotifyLibraryData.loading) {
      await refreshSpotifyLibrary();
    }
  }

  if (spotifyPlayerState.track?.uri) {
    if (!spotifyPlayerState.isPlaying) {
      await sendSpotifyPlayerCommand("resume", {
        track: spotifyPlayerState.track,
        contextUri: spotifyPlayerState.contextUri || "",
      });
    }
    return;
  }

  await startSpotifyPlaybackFromEmptyState();
}

async function startSpotifyShufflePlayback(playlistDetail = null) {
  if (!spotifyViewState.connected) {
    throw new Error("Connect Spotify first.");
  }

  if (!spotifyLibraryData.loaded && !spotifyLibraryData.loading) {
    await refreshSpotifyLibrary();
  }

  let activePlaylist = playlistDetail || getCurrentSpotifyPlaylistDetail();
  if (!activePlaylist && spotifyLibraryData.playlists.length > 0) {
    const firstPlaylist = spotifyLibraryData.playlists[0];
    if (firstPlaylist?.id && !spotifyLibraryData.playlistDetails[firstPlaylist.id]) {
      await ensureSpotifyPlaylistDetail(firstPlaylist.id);
    }
    activePlaylist = firstPlaylist?.id ? spotifyLibraryData.playlistDetails[firstPlaylist.id] || null : null;
  }

  if (activePlaylist?.uri && activePlaylist?.tracks?.length > 0) {
    const shuffledTrack = shuffleArray(activePlaylist.tracks)[0];
    await playSpotifyContext(activePlaylist.uri, shuffledTrack, {
      shuffle: true,
      enterNowPlaying: false,
    });
    return;
  }

  const randomTrack = shuffleArray(spotifyLibraryData.tracks)[0] || null;
  if (randomTrack?.uri) {
    await playSpotifyTrack(randomTrack, randomTrack.contextUri || "", {
      shuffle: Boolean(randomTrack.contextUri),
      enterNowPlaying: false,
    });
    return;
  }

  throw new Error("No Spotify tracks were found in your saved songs or playlists.");
}

function setMessage(text, kind = "success") {
  if (!text) {
    messageBox.innerHTML = "";
    return;
  }

  messageBox.innerHTML = `<p class="message ${kind}">${text}</p>`;
}

function setMetadata(metadata, upload = getActiveUpload()) {
  if (isVideoUpload(upload)) {
    getVideoMetadataFields().forEach(([field, id]) => {
      const input = document.getElementById(id);
      input.value = metadata[field] || "";
    });
    if (upload?.conversionOptions) {
      optimizeForSelect.value = upload.conversionOptions.optimizeFor || "ipod-classic-5-5g";
      videoQualitySelect.value = upload.conversionOptions.quality || "standard";
    }
    return;
  }

  AUDIO_METADATA_FIELDS.forEach((field) => {
    const input = document.getElementById(field);
    input.value = metadata[field] || "";
  });
  optimizeForSelect.value = upload?.conversionOptions?.optimizeFor || "ipod-classic-5-5g";
}

function getMetadata(upload = getActiveUpload()) {
  if (isVideoUpload(upload)) {
    return getVideoMetadataFields().reduce((values, [field, id]) => {
      values[field] = document.getElementById(id).value.trim();
      return values;
    }, {});
  }

  return AUDIO_METADATA_FIELDS.reduce((values, field) => {
    values[field] = document.getElementById(field).value.trim();
    return values;
  }, {});
}

function getConversionOptions() {
  return {
    optimizeFor: optimizeForSelect.value || "ipod-classic-5-5g",
    quality: videoQualitySelect.value || "standard",
  };
}

function cycleOptimizeFor(step) {
  const activeUpload = getActiveUpload();
  if (!activeUpload || step === 0) {
    return;
  }

  const options = Array.from(optimizeForSelect.options);
  const currentIndex = Math.max(
    0,
    options.findIndex((option) => option.value === optimizeForSelect.value)
  );
  const nextIndex = Math.max(0, Math.min(options.length - 1, currentIndex + step));
  if (nextIndex === currentIndex) {
    return;
  }

  optimizeForSelect.value = options[nextIndex].value;
  activeUpload.conversionOptions = getConversionOptions();
  const preset = getDevicePreset(activeUpload.conversionOptions.optimizeFor);
  videoPresetLabel.textContent = preset.label;
  videoPresetSummary.textContent = isVideoUpload(activeUpload) ? preset.videoSummary : preset.audioSummary;
  syncUi();
}

function getSongIndex(songId) {
  return librarySongs.findIndex((song) => song.id === songId);
}

async function playSongAtIndex(index) {
  const song = librarySongs[index];
  if (!song) {
    return;
  }

  setCurrentSong(song);
  screenMode = "now-playing";
  syncUi();

  try {
    await previewAudio.play();
  } catch (error) {
    setMessage("The browser blocked playback. Click play again to allow audio.", "error");
  }
}

async function loadPersistedLibrary() {
  try {
    const response = await fetch("/api/library");
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not load local library.");
    }

    librarySongs = Array.isArray(result.songs) ? result.songs.map(createSongRecord) : [];
    highlightedSongId = librarySongs[0]?.id || "";
    selectedIndex = 0;
    syncUi();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function loadSpotifyState() {
  try {
    if (window.APP_CONFIG?.spotifyAuthState === "connected") {
      libraryPath = ["main", "music", "spotify"];
      selectedIndex = 0;
      screenMode = "library";
      syncUi();
    }

    if (window.APP_CONFIG?.spotifyAuthState === "callback" && window.APP_CONFIG?.spotifyAuthCode) {
      const config = getSpotifyOAuthConfig();
      const pkceState = loadSpotifyPkceState();
      if (pkceState?.state && pkceState.state !== window.APP_CONFIG.spotifyAuthCallbackState) {
        setMessage("Spotify sign-in state did not match. Try Connect Spotify again.", "error");
        clearSpotifyPkceState();
      } else {
        const payload = await fetchJson("/api/spotify/exchange", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: window.APP_CONFIG.spotifyAuthCode,
            codeVerifier: pkceState?.codeVerifier || "",
            redirectUri: pkceState?.redirectUri || config.redirectUri,
            state: window.APP_CONFIG.spotifyAuthCallbackState,
          }),
        });
        storeSpotifyTokenPayload(payload);
        clearSpotifyPkceState();
        window.APP_CONFIG.spotifyAuthState = "connected";
      }
    }

    await refreshSpotifyStatus();
    if (spotifyViewState.connected) {
      try {
        await initializeSpotifySdk();
      } catch (error) {
        spotifySdkReady = false;
        if (String(error.message || "").toLowerCase().includes("premium")) {
          setMessage(error.message, "error");
        }
      }
    }
    if (spotifyViewState.connected) {
      try {
        await refreshSpotifyPlayerState();
      } catch (error) {
        spotifyPlayerState = normalizeSpotifyPlayerState();
      }
    } else {
      spotifyPlayerState = normalizeSpotifyPlayerState();
    }
    if (spotifyViewState.connected && !spotifyLibraryData.loaded && !spotifyLibraryData.loading) {
      await refreshSpotifyLibrary();
    }
    if (window.APP_CONFIG?.spotifyAuthState === "connected" && spotifyViewState.connected) {
      setMessage(
        spotifyViewState.profileName
          ? `Spotify Connected: ${spotifyViewState.profileName}`
          : "Spotify Connected",
        "success"
      );
      libraryPath = ["main", "music", "spotify"];
      selectedIndex = 0;
      screenMode = "library";
      syncUi();
    } else if (window.APP_CONFIG?.spotifyAuthError) {
      setMessage(window.APP_CONFIG.spotifyAuthError, "error");
    } else if (spotifyViewState.error) {
      setMessage(spotifyViewState.error, "error");
    }
    if (window.APP_CONFIG?.spotifyAuthState || window.APP_CONFIG?.spotifyAuthError) {
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    syncUi();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error(`Could not import ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

async function importPhotoFiles(fileList) {
  const photoFiles = Array.from(fileList || []).filter(isPhotoFile);
  if (photoFiles.length === 0) {
    return 0;
  }

  const importedPhotos = [];
  for (const file of photoFiles) {
    const previewUrl = await readFileAsDataUrl(file);
    importedPhotos.push(
      createPhotoRecord({
        id:
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        fileName: file.name,
        previewUrl,
        importedAt: Date.now() + importedPhotos.length,
      })
    );
  }

  libraryPhotos.push(...importedPhotos);
  persistPhotoLibrary();
  currentPhotoId = importedPhotos[importedPhotos.length - 1]?.id || currentPhotoId;
  return importedPhotos.length;
}

async function uploadSingleFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Upload failed.");
  }

  return {
    token: result.token,
    originalName: result.originalName,
    mediaType: result.mediaType || "audio",
    metadata: result.metadata,
    inferredFields: result.inferredFields || [],
    durationSeconds: result.durationSeconds || 0,
    conversionOptions: {
      optimizeFor: result.defaultOptimizeFor || "ipod-classic-5-5g",
      quality: result.defaultQuality || "standard",
    },
    uploadPath: result.uploadPath,
  };
}

async function uploadFiles(fileList) {
  const files = Array.from(fileList || []);
  if (files.length === 0) {
    setMessage("Choose one file first.", "error");
    return;
  }

  const chosenFile = files.find(isSupportedFile);
  if (!chosenFile) {
    setMessage("Choose a supported audio or video file first.", "error");
    return;
  }

  uploadButton.disabled = true;
  pickerButton.disabled = true;
  setMessage(`Uploading ${chosenFile.name}...`);

  try {
    const upload = await uploadSingleFile(chosenFile);
    clearPendingUploads();
    pendingUploads = [upload];
    lastConvertedSong = null;
    setCurrentSong(null);
    loadActiveUpload(0);
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    uploadButton.disabled = false;
    pickerButton.disabled = false;
    ipodScreen.classList.remove("is-dragging");
  }
}

async function handleImportedFiles(fileList) {
  const files = Array.from(fileList || []);
  fileInput.value = "";
  if (files.length === 0) {
    setMessage("Choose a supported file first.", "error");
    return;
  }

  const photoFiles = files.filter(isPhotoFile);
  const mediaFiles = files.filter(isSupportedFile);

  if (photoFiles.length > 0) {
    try {
      await importPhotoFiles(photoFiles);
    } catch (error) {
      setMessage(error.message, "error");
      return;
    }
  }

  if (mediaFiles.length > 0) {
    await uploadFiles(mediaFiles);
    return;
  }

  if (photoFiles.length > 0) {
    libraryPath = ["main", "photos"];
    selectedIndex = 0;
    highlightedSongId = "";
    screenMode = "library";
    syncUi();
    setMessage("");
    return;
  }

  setMessage("Choose a supported audio, video, or photo file first.", "error");
}

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleImportedFiles(fileInput.files);
});

fileInput.addEventListener("change", async () => {
  if (fileInput.files.length > 0) {
    await handleImportedFiles(fileInput.files);
  }
});

pickerButton.addEventListener("click", () => {
  fileInput.value = "";
  fileInput.click();
});

convertDropzone.addEventListener("click", (event) => {
  if (event.target.closest("button")) {
    return;
  }

  fileInput.value = "";
  fileInput.click();
});

[optimizeForSelect, videoQualitySelect].forEach((select) => {
  select.addEventListener("change", () => {
    const activeUpload = getActiveUpload();
    if (!activeUpload) {
      return;
    }

    activeUpload.conversionOptions = getConversionOptions();
    const preset = getDevicePreset(activeUpload.conversionOptions.optimizeFor);
    videoPresetLabel.textContent = preset.label;
    videoPresetSummary.textContent = isVideoUpload(activeUpload) ? preset.videoSummary : preset.audioSummary;
  });
});

document.querySelectorAll("[data-faceplate-theme]").forEach((button) => {
  button.addEventListener("click", () => {
    const themeName = button.dataset.faceplateTheme;
    const theme = FACEPLATE_THEMES[themeName];
    if (!theme) {
      return;
    }

    applyThemeVariables(FACEPLATE_RESET);
    applyThemeVariables(theme);
    setFaceplateTheme(themeName);
    syncActiveThemeButtons("faceplate", themeName);
  });
});

document.querySelectorAll("[data-wheel-theme]").forEach((button) => {
  button.addEventListener("click", () => {
    const themeName = button.dataset.wheelTheme;
    const theme = WHEEL_THEMES[themeName];
    if (!theme) {
      return;
    }

    applyThemeVariables(theme);
    syncActiveThemeButtons("wheel", themeName);
  });
});

menuButton.addEventListener("click", () => {
  haptics.prime();
  haptics.back();
  if (screenMode === "library") {
    if (libraryPath.length > 1) {
      libraryPath = libraryPath.slice(0, -1);
      selectedIndex = 0;
      highlightedSongId = "";
      syncUi();
    }
    return;
  } else if (screenMode === "coverflow") {
    screenMode = "library";
    libraryPath = ["main", "music", "spotify"];
    selectedIndex = 0;
    highlightedSongId = "";
    syncUi();
    return;
  } else {
    if (screenMode === "sync") {
      stopSyncPolling();
    }
    if (screenMode === "game") {
      stopBrickLoop();
      stopBrickCountdown();
      libraryPath = ["main", "games"];
      selectedIndex = Math.max(0, getGameMenuIndex(currentGame?.id || ""));
      currentGame = null;
      highlightedSongId = "";
      screenMode = "library";
      syncUi();
      return;
    }
    if (screenMode === "photo-viewer") {
      libraryPath = ["main", "photos"];
      selectedIndex = Math.max(0, getPhotoIndex(currentPhotoId));
      highlightedSongId = "";
      screenMode = "library";
      syncUi();
      return;
    }
    if (screenMode === "customize") {
      libraryPath = ["main", "settings"];
    } else if (screenMode === "sync") {
      libraryPath = ["main"];
      stopSpotifyPlayerPolling();
    } else {
      libraryPath = ["main"];
      selectedIndex = 0;
      stopSpotifyPlayerPolling();
    }
    highlightedSongId = "";
    screenMode = "library";
  }
  syncUi();
});

rewindButton.addEventListener("click", async () => {
  haptics.prime();
  haptics.transport();
  if (screenMode === "library") {
    moveLibrarySelection(-1, "button");
    return;
  }

  if (screenMode === "coverflow") {
    moveCoverflowSelection(-1, "button");
    return;
  }

  if (screenMode === "game") {
    handleGameDirection(-1);
    return;
  }

  if (screenMode === "photo-viewer") {
    const currentIndex = getPhotoIndex(currentPhotoId);
    if (currentIndex <= 0) {
      return;
    }
    currentPhotoId = getDisplayPhotos()[currentIndex - 1]?.id || currentPhotoId;
    selectedIndex = currentIndex - 1;
    syncUi();
    return;
  }

  if (screenMode === "edit" && getActiveUpload()) {
    cycleOptimizeFor(-1);
    return;
  }

  if (isSpotifyRemoteSong()) {
    try {
      await sendSpotifyPlayerCommand("previous");
    } catch (error) {
      presentSpotifyPlaybackFailure(
        error,
        spotifyPlayerState.track || spotifyPlaybackContext.selectedTrack,
        spotifyPlayerState.contextUri || spotifyPlaybackContext.selectedContextUri
      );
    }
    return;
  }

  if (!currentSong || librarySongs.length < 2) {
    return;
  }

  const currentIndex = getSongIndex(currentSong.id);
  if (currentIndex <= 0) {
    return;
  }

  await playSongAtIndex(currentIndex - 1);
});

forwardButton.addEventListener("click", async () => {
  haptics.prime();
  haptics.transport();
  if (screenMode === "library") {
    moveLibrarySelection(1, "button");
    return;
  }

  if (screenMode === "coverflow") {
    moveCoverflowSelection(1, "button");
    return;
  }

  if (screenMode === "game") {
    handleGameDirection(1);
    return;
  }

  if (screenMode === "photo-viewer") {
    const currentIndex = getPhotoIndex(currentPhotoId);
    const displayPhotos = getDisplayPhotos();
    if (currentIndex === -1 || currentIndex >= displayPhotos.length - 1) {
      return;
    }
    currentPhotoId = displayPhotos[currentIndex + 1]?.id || currentPhotoId;
    selectedIndex = currentIndex + 1;
    syncUi();
    return;
  }

  if (screenMode === "edit" && getActiveUpload()) {
    cycleOptimizeFor(1);
    return;
  }

  if (isSpotifyRemoteSong()) {
    try {
      await sendSpotifyPlayerCommand("next");
    } catch (error) {
      presentSpotifyPlaybackFailure(
        error,
        spotifyPlayerState.track || spotifyPlaybackContext.selectedTrack,
        spotifyPlayerState.contextUri || spotifyPlaybackContext.selectedContextUri
      );
    }
    return;
  }

  if (!currentSong || librarySongs.length < 2) {
    return;
  }

  const currentIndex = getSongIndex(currentSong.id);
  if (currentIndex === -1 || currentIndex >= librarySongs.length - 1) {
    return;
  }

  await playSongAtIndex(currentIndex + 1);
});

["dragenter", "dragover"].forEach((eventName) => {
  ipodScreen.addEventListener(eventName, (event) => {
    const types = Array.from(event.dataTransfer?.types || []);
    if (!types.includes("Files")) {
      return;
    }
    event.preventDefault();
    ipodScreen.classList.add("is-dragging");
  });
});

["dragleave", "dragend"].forEach((eventName) => {
  ipodScreen.addEventListener(eventName, (event) => {
    event.preventDefault();
    ipodScreen.classList.remove("is-dragging");
  });
});

ipodScreen.addEventListener("drop", async (event) => {
  event.preventDefault();
  ipodScreen.classList.remove("is-dragging");
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    await handleImportedFiles(files);
  }
});

ipodScreen.addEventListener(
  "wheel",
  (event) => {
    if (screenMode !== "library") {
      return;
    }

    const libraryState = getLibraryState();
    if (libraryState.items.length === 0) {
      return;
    }

    event.preventDefault();
    handleWheelScrollDelta(event.deltaY);
  },
  { passive: false }
);

clickWheel.addEventListener(
  "wheel",
  (event) => {
    if (!handleWheelScrollDelta(event.deltaY)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  },
  { passive: false }
);

clickWheel.addEventListener("pointerdown", (event) => {
  const supportsWheelGesture =
    screenMode === "library" ||
    (screenMode === "game" && (currentGame?.id === "brick" || currentGame?.id === "music-quiz"));
  if (!supportsWheelGesture || event.button !== 0) {
    return;
  }

  if (event.target.closest("button")) {
    return;
  }

  const position = getWheelPolarPosition(event);
  if (!isWheelRingPosition(position)) {
    return;
  }

  haptics.prime();
  const profile = getWheelPointerProfile(event.pointerType);
  wheelDrag = {
    pointerId: event.pointerId,
    profile,
    lastAngle: position.angle,
    lastRadius: position.normalizedRadius,
    lastTimestamp: event.timeStamp || performance.now(),
    detentAccumulator: 0,
    pendingDelta: 0,
    smoothedDelta: 0,
    smoothedVelocity: 0,
    direction: 0,
    rafId: 0,
  };
  clickWheel.classList.add("is-scrolling");
  clickWheel.setPointerCapture(event.pointerId);
  event.preventDefault();
});

clickWheel.addEventListener("pointermove", (event) => {
  const supportsWheelGesture =
    screenMode === "library" ||
    (screenMode === "game" && (currentGame?.id === "brick" || currentGame?.id === "music-quiz"));
  if (!wheelDrag || wheelDrag.pointerId !== event.pointerId || !supportsWheelGesture) {
    return;
  }

  const position = getWheelPolarPosition(event);
  const nextAngle = position.angle;
  let delta = normalizeAngleDelta(nextAngle - wheelDrag.lastAngle);
  const radialDrift = Math.abs(position.normalizedRadius - wheelDrag.lastRadius);
  const timestamp = event.timeStamp || performance.now();
  const deltaTime = Math.max(8, timestamp - wheelDrag.lastTimestamp);
  wheelDrag.lastAngle = nextAngle;
  wheelDrag.lastRadius = position.normalizedRadius;
  wheelDrag.lastTimestamp = timestamp;

  if (!isWheelDragPosition(position)) {
    wheelDrag.smoothedDelta *= 0.6;
    event.preventDefault();
    return;
  }

  const profile = wheelDrag.profile || WHEEL_POINTER_PROFILES.coarse;

  if (Math.abs(delta) > profile.maxDelta) {
    delta = Math.sign(delta) * profile.maxDelta;
  }

  if (radialDrift > profile.radialDriftLimit && Math.abs(delta) < profile.detentAngle * 0.7) {
    event.preventDefault();
    return;
  }

  if (Math.abs(delta) < profile.minDelta) {
    event.preventDefault();
    return;
  }

  if (
    wheelDrag.direction !== 0 &&
    Math.sign(delta) !== wheelDrag.direction &&
    Math.abs(delta) < profile.directionLockAngle &&
    Math.abs(wheelDrag.detentAccumulator) > profile.detentAngle * 0.24
  ) {
    event.preventDefault();
    return;
  }

  wheelDrag.smoothedDelta =
    wheelDrag.smoothedDelta * profile.smoothing +
    delta * (1 - profile.smoothing);
  wheelDrag.direction = Math.sign(wheelDrag.smoothedDelta) || wheelDrag.direction;
  wheelDrag.smoothedVelocity =
    wheelDrag.smoothedVelocity * 0.72 +
    (wheelDrag.smoothedDelta / deltaTime) * 0.28;
  const accelerationBoost = 1 + Math.min(
    profile.accelCap,
    Math.max(0, Math.abs(wheelDrag.smoothedVelocity) - profile.accelStart) * profile.accelFactor
  );
  wheelDrag.pendingDelta += wheelDrag.smoothedDelta * accelerationBoost;
  scheduleWheelFrame();

  event.preventDefault();
});

["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
  clickWheel.addEventListener(eventName, (event) => {
    if (!wheelDrag || ("pointerId" in event && wheelDrag.pointerId !== event.pointerId)) {
      return;
    }

    stopWheelDrag();
  });
});

[menuButton, rewindButton, forwardButton, selectButton, playbackButton].forEach((button) => {
  button.addEventListener("pointerdown", () => {
    haptics.prime();
  });
});

[menuButton, rewindButton, forwardButton, playbackButton].forEach(bindWheelSectorHighlight);
bindCenterButtonHighlight(selectButton);

metadataForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isExporting) {
    return;
  }

  const activeUpload = getActiveUpload();
  if (!activeUpload) {
    setMessage("Upload a file before converting.", "error");
    return;
  }

  saveActiveMetadata();
  isExporting = true;
  haptics.prime();
  haptics.confirm();
  syncSelectButton();
  setMessage(`Converting ${activeUpload.originalName}...`);

  try {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
        body: JSON.stringify({
          token: activeUpload.token,
          metadata: activeUpload.metadata,
          conversionOptions: activeUpload.conversionOptions,
        }),
      });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Conversion failed.");
    }

    clearPendingUploads();
    lastConvertedSong = {
      mediaType: result.mediaType || activeUpload.mediaType,
      fileName: result.fileName,
      downloadUrl: result.downloadUrl,
      artworkUrl: result.artworkUrl || null,
      metadata: result.metadata || activeUpload.metadata,
      presetLabel: result.presetLabel || "",
      category: result.category || "",
      title: (result.metadata || {}).title || "",
      artist:
        (result.metadata || {}).artist ||
        (result.metadata || {}).show ||
        "",
      album: (result.metadata || {}).album || "",
    };

    if ((result.mediaType || activeUpload.mediaType) === "audio") {
      const exportedSong = createSongRecord({
        id: result.fileName,
        fileName: result.fileName,
        title: (result.metadata || {}).title || activeUpload.metadata.title,
        artist: (result.metadata || {}).artist || activeUpload.metadata.artist,
        album: (result.metadata || {}).album || activeUpload.metadata.album,
        category: result.category,
        durationSeconds: result.durationSeconds,
        playbackUrl: result.playbackUrl,
        downloadUrl: result.downloadUrl,
        artworkUrl: result.artworkUrl,
      });
      librarySongs.push(exportedSong);
      setCurrentSong(exportedSong);
      lastConvertedSong = {
        ...lastConvertedSong,
        ...exportedSong,
        mediaType: "audio",
        metadata: result.metadata || activeUpload.metadata,
      };
    }

    screenMode = "edit";
    haptics.success();
    syncUi();
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    isExporting = false;
    syncUi();
  }
});

selectButton.addEventListener("click", async () => {
  haptics.prime();
  if (isExporting) {
    return;
  }

  if (screenMode === "game") {
    handleGameSelect();
    return;
  }

  if (screenMode === "coverflow") {
    const album = getCoverflowAlbums()[selectedIndex] || null;
    if (!album?.id) {
      return;
    }
    try {
      await ensureSpotifyAlbumDetail(album.id);
      libraryPath = ["main", "music", "spotify", `spotify-album-detail:${album.id}`];
      selectedIndex = 0;
      screenMode = "library";
      syncUi();
    } catch (error) {
      setMessage(error.message, "error");
      syncUi();
    }
    return;
  }

  if (screenMode === "sync") {
    await startSyncNow();
    return;
  }

  if (screenMode === "edit") {
    metadataForm.requestSubmit();
    return;
  }

  if (screenMode === "library") {
    const libraryState = getLibraryState();
    const selectedItem = libraryState.items[selectedIndex];
    if (!selectedItem) {
      return;
    }
    if (selectedItem.type === "action" || selectedItem.type === "game") {
      haptics.confirm();
    } else {
      haptics.select();
    }
    await activateLibraryItem(selectedItem);
  }
});

playbackButton.addEventListener("click", async () => {
  haptics.prime();
  haptics.transport();
  if (!currentSong && screenMode === "now-playing" && spotifyViewState.connected) {
    try {
      await startSpotifyPlaybackFromEmptyState();
    } catch (error) {
      presentSpotifyPlaybackFailure(error, spotifyPlaybackContext.selectedTrack, spotifyPlaybackContext.selectedContextUri);
    }
    return;
  }

  if (!currentSong) {
    return;
  }

  if (isSpotifyRemoteSong()) {
    try {
      if (spotifyPlayerState.isPlaying) {
        await sendSpotifyPlayerCommand("pause", {
          track: spotifyPlayerState.track || spotifyPlaybackContext.selectedTrack,
          contextUri: spotifyPlayerState.contextUri || spotifyPlaybackContext.selectedContextUri,
        });
      } else if (spotifyPlayerState.track?.uri) {
        await sendSpotifyPlayerCommand("resume", {
          track: spotifyPlayerState.track,
          contextUri: spotifyPlayerState.contextUri || "",
        });
      } else if (isSpotifyPlaceholderSong()) {
        await startSpotifyPlaybackFromEmptyState();
      } else {
        await startSpotifyPlaybackFromEmptyState();
      }
    } catch (error) {
      presentSpotifyPlaybackFailure(
        error,
        spotifyPlayerState.track || spotifyPlaybackContext.selectedTrack,
        spotifyPlayerState.contextUri || spotifyPlaybackContext.selectedContextUri
      );
    }
    return;
  }
  if (!previewAudio.src) {
    previewAudio.src = currentSong.playbackUrl;
  }

  if (previewAudio.paused) {
    try {
      await previewAudio.play();
    } catch (error) {
      setMessage("The browser blocked playback. Click play again to allow audio.", "error");
    }
  } else {
    previewAudio.pause();
  }

  syncPlaybackButton();
});

if (spotifySearchInput) {
  spotifySearchInput.addEventListener("input", (event) => {
    if (screenMode !== "library" || getLibraryViewKey() !== "spotify-search") {
      return;
    }
    scheduleSpotifySearch(event.target.value || "");
  });
}

window.addEventListener("keydown", (event) => {
  if (screenMode !== "library" || getLibraryViewKey() !== "spotify-search" || !spotifySearchInput) {
    return;
  }
  if ((event.metaKey || event.ctrlKey || event.altKey) && event.key !== "Backspace") {
    return;
  }
  spotifySearchInput.focus();
});

previewAudio.addEventListener("play", syncPlaybackButton);
previewAudio.addEventListener("pause", syncPlaybackButton);
previewAudio.addEventListener("ended", () => {
  syncPlaybackButton();
  renderProgress();
});
previewAudio.addEventListener("timeupdate", renderProgress);
previewAudio.addEventListener("loadedmetadata", renderProgress);
previewAudio.addEventListener("durationchange", renderProgress);

playerArtwork.addEventListener("error", () => {
  playerArtwork.classList.add("hidden");
  artworkPlaceholder.classList.remove("hidden");
});

convertResultArtwork.addEventListener("error", () => {
  convertResultArtwork.classList.add("hidden");
  convertResultPlaceholder.classList.remove("hidden");
});

syncUi();
renderPlayer();
loadPersistedPhotos();
syncUi();
void loadPersistedLibrary();
void loadSpotifyState();
