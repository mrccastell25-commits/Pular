window.addEventListener('message', event => {
  if (event.source !== window || event.origin !== location.origin) return;
  const data = event.data;
  if (data?.source !== 'retro-eq-test' || data.type !== 'SET_BAND') return;
  chrome.runtime.sendMessage({type: 'SET_BAND', index: data.index, value: data.value}).catch(() => {});
});

chrome.runtime.onMessage.addListener(message => {
  if (message.type === 'CAPTURE_STATUS') {
    window.postMessage({
      source: 'retro-eq-extension',
      type: 'STATUS',
      active: message.active,
      text: message.text
    }, location.origin);
  }
});