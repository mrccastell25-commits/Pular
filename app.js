const input = document.getElementById('youtubeUrl');
const loadBtn = document.getElementById('loadBtn');
const playerWrap = document.getElementById('playerWrap');
const statusText = document.getElementById('captureStatus');
const dot = document.getElementById('dot');

function getVideoId(raw) {
  try {
    const u = new URL(raw);
    let id = '';
    if (u.hostname === 'youtu.be' || u.hostname.endsWith('.youtu.be')) id = u.pathname.split('/').filter(Boolean)[0] || '';
    else if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
      if (u.pathname === '/watch') id = u.searchParams.get('v') || '';
      else if (/^\/(embed|shorts|live)\//.test(u.pathname)) id = u.pathname.split('/')[2] || '';
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

loadBtn.addEventListener('click', () => {
  const id = getVideoId(input.value.trim());
  if (!id) { alert('Link do YouTube inválido. Cole um link de vídeo válido.'); return; }
  playerWrap.innerHTML = '';
  const frame = document.createElement('iframe');
  frame.title = 'Player do YouTube';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&rel=0`;
  playerWrap.appendChild(frame);
});
input.addEventListener('keydown', e => { if (e.key === 'Enter') loadBtn.click(); });

function sendBand(index, value) {
  // A extensão instala um content script nesta página e encaminha esta mensagem
  // para o documento offscreen que processa o áudio capturado.
  window.postMessage({ source: 'retro-eq-test', type: 'SET_BAND', index, value: Number(value) }, location.origin);
}
document.querySelectorAll('input[type=range][data-band]').forEach(slider => {
  const readout = slider.parentElement.querySelector('.db');
  const update = () => {
    const value = Number(slider.value);
    readout.textContent = `${value > 0 ? '+' : ''}${value.toFixed(1)} dB`;
    sendBand(Number(slider.dataset.band), value);
  };
  slider.addEventListener('input', update);
  update();
});
document.getElementById('flatBtn').addEventListener('click', () => {
  document.querySelectorAll('input[type=range][data-band]').forEach(s => { s.value = 0; s.dispatchEvent(new Event('input')); });
});
window.addEventListener('message', event => {
  if (event.source !== window || event.origin !== location.origin) return;
  if (event.data?.source === 'retro-eq-extension' && event.data.type === 'STATUS') {
    statusText.textContent = event.data.text;
    dot.classList.toggle('on', !!event.data.active);
  }
});
