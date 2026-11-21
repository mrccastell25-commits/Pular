const statusEl = document.getElementById('status');
document.getElementById('start').addEventListener('click', async () => {
  statusEl.textContent = 'Iniciando captura...';
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const result = await chrome.runtime.sendMessage({type: 'START_CAPTURE', tabId: tab.id});
    statusEl.textContent = result?.ok ? 'Captura ativa. Volte à página e reproduza o YouTube.' : `Erro: ${result?.error || 'não foi possível iniciar'}`;
  } catch (e) { statusEl.textContent = `Erro: ${e.message}`; }
});
document.getElementById('stop').addEventListener('click', async () => {
  const result = await chrome.runtime.sendMessage({type: 'STOP_CAPTURE'});
  statusEl.textContent = result?.ok ? 'Captura encerrada.' : `Erro: ${result?.error || 'não foi possível parar'}`;
});