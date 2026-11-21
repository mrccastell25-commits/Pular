let capturedTabId = null;

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')]
  });
  if (contexts.length) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Capturar e equalizar o áudio da aba atual.'
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.target === 'content-status') {
        if (capturedTabId != null) {
          await chrome.tabs.sendMessage(capturedTabId, {
            type: 'CAPTURE_STATUS',
            active: message.active,
            text: message.text
          }).catch(() => {});
        }
        sendResponse({ok: true});
      } else if (message.type === 'START_CAPTURE') {
        capturedTabId = message.tabId;
        await ensureOffscreen();
        const streamId = await chrome.tabCapture.getMediaStreamId({targetTabId: message.tabId});
        const response = await chrome.runtime.sendMessage({target: 'offscreen', type: 'START_STREAM', streamId});
        sendResponse(response || {ok: true});
      } else if (message.type === 'STOP_CAPTURE') {
        const response = await chrome.runtime.sendMessage({target: 'offscreen', type: 'STOP_STREAM'});
        capturedTabId = null;
        sendResponse(response || {ok: true});
      } else if (message.type === 'SET_BAND') {
        await chrome.runtime.sendMessage({target: 'offscreen', type: 'SET_BAND', index: message.index, value: message.value});
        sendResponse({ok: true});
      }
    } catch (e) {
      sendResponse({ok: false, error: e.message});
    }
  })();
  return true;
});