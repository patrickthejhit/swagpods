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
const customizePanelScreen = document.getElementById("customize-panel-screen");
const libraryLabel = document.getElementById("library-label");
const libraryTitle = document.getElementById("library-title");
const librarySummary = document.getElementById("library-summary");
const librarySelectionBar = document.getElementById("library-selection-bar");
const libraryList = document.getElementById("library-list");
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
const SUPPORTED_EXTENSIONS = [".mp3", ".m4a", ".aac", ".wav", ".aiff", ".flac", ".ogg", ".mp4", ".m4v", ".mov", ".avi", ".mkv"];
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
let uploadToken = "";
let isExporting = false;
let currentSong = null;
let lastConvertedSong = null;
let librarySongs = [];
let highlightedSongId = "";
let screenMode = "library";
let pendingUploads = [];
let activeUploadIndex = 0;
let selectedIndex = 0;
let previousScreenMode = "library";
let wheelDrag = null;
let libraryPath = ["main"];
let screenScrollAccumulator = 0;

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
  return SUPPORTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
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

function getSongsByCategory(category) {
  return getDisplaySongs().filter((song) => (song.category || "Music") === category);
}

function getLibraryViewKey() {
  return libraryPath[libraryPath.length - 1] || "main";
}

function getLibraryState() {
  const displaySongs = getDisplaySongs();
  const musicSongs = getSongsByCategory("Music");
  const podcastSongs = getSongsByCategory("Podcast");
  const songCount = displaySongs.length;
  const musicSummary =
    musicSongs.length === 0 ? "No songs yet." : `${musicSongs.length} song${musicSongs.length === 1 ? "" : "s"}`;
  const podcastSummary =
    podcastSongs.length === 0
      ? "No podcasts yet."
      : `${podcastSongs.length} podcast${podcastSongs.length === 1 ? "" : "s"}`;

  switch (getLibraryViewKey()) {
    case "music":
      return {
        label: "Main Menu",
        title: "Music",
        summary: "Browse your media.",
        items: [
          {
            type: "menu",
            id: "songs",
            title: "Songs",
            meta: musicSummary,
          },
          {
            type: "menu",
            id: "podcasts",
            title: "Podcasts",
            meta: podcastSummary,
          },
          {
            type: "menu",
            id: "playlists",
            title: "Playlists",
            meta: "Converted",
          },
        ],
      };
    case "videos":
      return {
        label: "Main Menu",
        title: "Videos",
        summary: "No video features yet.",
        items: [],
      };
    case "photos":
      return {
        label: "Main Menu",
        title: "Photos",
        summary: "No photo features yet.",
        items: [],
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
        summary: "Open converted songs.",
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
        summary: "Adjust device options.",
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
        summary: "Choose a section.",
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
            id: "settings",
            title: "Settings",
            meta: "Device Options",
          },
        ],
      };
  }
}

function clampSelectedIndex() {
  const libraryState = getLibraryState();
  if (libraryState.items.length === 0) {
    selectedIndex = 0;
    return;
  }

  selectedIndex = Math.max(0, Math.min(selectedIndex, libraryState.items.length - 1));
}

function moveLibrarySelection(step) {
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
  syncUi();
}

function getWheelAngle(event) {
  const rect = clickWheel.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return Math.atan2(event.clientY - centerY, event.clientX - centerX);
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

function stopWheelDrag() {
  if (!wheelDrag) {
    return;
  }

  clickWheel.classList.remove("is-scrolling");
  wheelDrag = null;
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

function setScreenMode(nextMode) {
  if (nextMode !== "library") {
    previousScreenMode = nextMode;
  }
  screenMode = nextMode;
  idleState.classList.toggle("hidden", nextMode !== "idle");
  editorPanel.classList.toggle("hidden", nextMode !== "edit");
  libraryPanel.classList.toggle("hidden", nextMode !== "library");
  customizePanelScreen.classList.toggle("hidden", nextMode !== "customize");
  nowPlayingPanel.classList.toggle("hidden", nextMode !== "now-playing");
}

function syncSelectButton() {
  const libraryState = getLibraryState();
  const hasLibrarySelection = libraryState.items.length > 0;
  const shouldDisable =
    isExporting ||
    screenMode === "idle" ||
    screenMode === "now-playing" ||
    screenMode === "customize" ||
    (screenMode === "edit" && !hasPendingUploads()) ||
    (screenMode === "library" && !hasLibrarySelection);

  selectButton.disabled = shouldDisable;
  selectButton.classList.toggle("is-loading", isExporting);
}

function syncPlaybackButton() {
  playbackButton.disabled = !currentSong;
  playbackButton.classList.toggle("is-playing", Boolean(currentSong) && !previewAudio.paused);
}

function syncWheelButtons() {
  menuButton.disabled = false;
  if (screenMode === "edit" && Boolean(getActiveUpload())) {
    rewindButton.disabled = false;
    forwardButton.disabled = false;
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

function renderPlayer() {
  if (!currentSong) {
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
  downloadNowButton.href = currentSong.downloadUrl;
  downloadNowButton.setAttribute("download", currentSong.fileName);
  downloadNowButton.removeAttribute("aria-disabled");
  downloadNowButton.classList.remove("is-disabled");

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

  if (itemData.type === "action" && itemData.id === "customize") {
    screenMode = "customize";
    syncUi();
    return;
  }

  if (itemData.type === "menu") {
    libraryPath = [...libraryPath, itemData.id];
    selectedIndex = 0;
    highlightedSongId = "";
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

  if (items.length === 0) {
    librarySummary.textContent = libraryState.summary;
    librarySummary.classList.remove("hidden");
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

    const isMenuLike = itemData.type === "menu" || itemData.type === "action";
    row.className = `library-item${isSelected ? " is-selected" : ""}${isMenuLike ? " is-menu-item" : ""}`;
    row.setAttribute("aria-selected", isSelected ? "true" : "false");
    row.type = "button";
    itemTitle.className = "library-song";
    itemMeta.className = "library-meta";

    if (itemData.type === "song") {
      const song = itemData.song;
      itemTitle.textContent = song.title || song.fileName;
      itemMeta.textContent = [song.artist || "Unknown Artist", song.category || "Music"].join(" • ");
    } else {
      itemTitle.textContent = itemData.title;
      itemMeta.textContent = itemData.meta || "";
    }

    row.appendChild(itemTitle);
    row.appendChild(itemMeta);
    row.addEventListener("mouseenter", () => {
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

function setCurrentSong(song) {
  currentSong = song;
  highlightedSongId = song ? song.id : "";
  previewAudio.pause();
  previewAudio.src = song ? song.playbackUrl : "";
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
  renderConvertScreen();
  renderLibrary();
  renderPlayer();
}

function setMessage(text, kind = "success") {
  if (!text || kind === "success") {
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

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await uploadFiles(fileInput.files);
});

fileInput.addEventListener("change", async () => {
  if (fileInput.files.length > 0) {
    await uploadFiles(fileInput.files);
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
  if (screenMode === "library") {
    if (libraryPath.length > 1) {
      libraryPath = libraryPath.slice(0, -1);
      selectedIndex = 0;
      highlightedSongId = "";
      syncUi();
    }
    return;
  } else {
    if (screenMode === "customize") {
      libraryPath = ["main", "settings"];
    } else {
      libraryPath = ["main"];
    }
    selectedIndex = 0;
    highlightedSongId = "";
    screenMode = "library";
  }
  syncUi();
});

rewindButton.addEventListener("click", async () => {
  if (screenMode === "library") {
    moveLibrarySelection(-1);
    return;
  }

  if (screenMode === "edit" && getActiveUpload()) {
    cycleOptimizeFor(-1);
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
  if (screenMode === "library") {
    moveLibrarySelection(1);
    return;
  }

  if (screenMode === "edit" && getActiveUpload()) {
    cycleOptimizeFor(1);
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
    if (screenMode !== "edit") {
      return;
    }
    event.preventDefault();
    ipodScreen.classList.add("is-dragging");
  });
});

["dragleave", "dragend"].forEach((eventName) => {
  ipodScreen.addEventListener(eventName, (event) => {
    if (screenMode !== "edit") {
      return;
    }
    event.preventDefault();
    ipodScreen.classList.remove("is-dragging");
  });
});

ipodScreen.addEventListener("drop", async (event) => {
  if (screenMode !== "edit") {
    return;
  }
  event.preventDefault();
  ipodScreen.classList.remove("is-dragging");
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    await uploadFiles(files);
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
    const SCROLL_STEP_DELTA = 28;
    screenScrollAccumulator += event.deltaY;

    while (screenScrollAccumulator >= SCROLL_STEP_DELTA) {
      moveLibrarySelection(1);
      screenScrollAccumulator -= SCROLL_STEP_DELTA;
    }

    while (screenScrollAccumulator <= -SCROLL_STEP_DELTA) {
      moveLibrarySelection(-1);
      screenScrollAccumulator += SCROLL_STEP_DELTA;
    }
  },
  { passive: false }
);

clickWheel.addEventListener("pointerdown", (event) => {
  if (screenMode !== "library" || event.button !== 0) {
    return;
  }

  if (event.target.closest("button")) {
    return;
  }

  wheelDrag = {
    pointerId: event.pointerId,
    lastAngle: getWheelAngle(event),
    accumulatedAngle: 0,
  };
  clickWheel.classList.add("is-scrolling");
  clickWheel.setPointerCapture(event.pointerId);
  event.preventDefault();
});

clickWheel.addEventListener("pointermove", (event) => {
  if (!wheelDrag || wheelDrag.pointerId !== event.pointerId || screenMode !== "library") {
    return;
  }

  const SCROLL_STEP_ANGLE = Math.PI / 9;
  const nextAngle = getWheelAngle(event);
  const delta = normalizeAngleDelta(nextAngle - wheelDrag.lastAngle);

  wheelDrag.lastAngle = nextAngle;
  wheelDrag.accumulatedAngle += delta;

  while (wheelDrag.accumulatedAngle >= SCROLL_STEP_ANGLE) {
    moveLibrarySelection(1);
    wheelDrag.accumulatedAngle -= SCROLL_STEP_ANGLE;
  }

  while (wheelDrag.accumulatedAngle <= -SCROLL_STEP_ANGLE) {
    moveLibrarySelection(-1);
    wheelDrag.accumulatedAngle += SCROLL_STEP_ANGLE;
  }
});

["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
  clickWheel.addEventListener(eventName, (event) => {
    if (!wheelDrag || ("pointerId" in event && wheelDrag.pointerId !== event.pointerId)) {
      return;
    }

    stopWheelDrag();
  });
});

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
  if (isExporting) {
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
    await activateLibraryItem(selectedItem);
  }
});

playbackButton.addEventListener("click", async () => {
  if (!currentSong) {
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
void loadPersistedLibrary();
