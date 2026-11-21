let audioContext = null;
let mediaStream = null;
let sourceNode = null;
let filters = [];
let outputGain = null;

function status(active, text) {
  chrome.runtime.sendMessage({target: 'content-status', type: 'STATUS', active, text}).catch(() => {});
}
async function stopStream() {
  if (audioContext) {
    try { await audioContext.close(); } catch {}
  }
  if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
  audioContext = null; mediaStream = null; sourceNode = null; filters = []; outputGain = null;
  status(false, 'Captura parada');
}
async function startStream(streamId) {
  await stopStream();
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    },
    video: false
  });
  audioContext = new AudioContext();
  await audioContext.resume();
  sourceNode = audioContext.createMediaStreamSource(mediaStream);
  const frequencies = [60, 150, 400, 1000, 3000, 10000];
  let previous = sourceNode;
  filters = frequencies.map((frequency, i) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = frequency;
    filter.Q.value = 1.0;
    filter.gain.value = 0;
    previous.connect(filter);
    previous = filter;
    return filter;
  });
  outputGain = audioContext.createGain();
  outputGain.gain.value = 0.85;
  previous.connect(outputGain);
  outputGain.connect(audioContext.destination);
  status(true, 'Equalizador ativo');
  return {ok: true};
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return;
  (async () => {
    try {
      if (message.type === 'START_STREAM') sendResponse(await startStream(message.streamId));
      else if (message.type === 'STOP_STREAM') { await stopStream(); sendResponse({ok: true}); }
      else if (message.type === 'SET_BAND') {
        const i = Number(message.index), value = Number(message.value);
        if (filters[i] && Number.isFinite(value)) filters[i].gain.setTargetAtTime(Math.max(-12, Math.min(12, value)), audioContext.currentTime, 0.015);
        sendResponse({ok: true});
      }
    } catch (e) { status(false, `Falha na captura: ${e.message}`); sendResponse({ok: false, error: e.message}); }
  })();
  return true;
});