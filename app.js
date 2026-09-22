const MODEL = 'gemini-2.0-flash';
const form = document.querySelector('#chat-form');
const apiKeyInput = document.querySelector('#api-key');
const chatInput = document.querySelector('#chat-input');
const chatLog = document.querySelector('#chat-log');
const sendButton = form.querySelector('button');
const suggestions = document.querySelectorAll('[data-prompt]');

const systemInstruction = `You are the warm, concise personal shopping stylist for Fetecart, an editorial store for thoughtfully selected everyday objects. Recommend categories and styling ideas rather than inventing exact products, prices, stock, or links. Keep replies under 90 words, practical, and tasteful. Ask one clarifying question when useful.`;
let conversation = [];

function addMessage(text, role) {
  const message = document.createElement('div');
  message.className = `message ${role}-message`;
  message.textContent = text;
  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function askGemini(apiKey, prompt) {
  const contents = [...conversation, { role: 'user', parts: [{ text: prompt }] }];
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents, generationConfig: { temperature: 0.75, maxOutputTokens: 180 } })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'The stylist could not respond.');
  return data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || 'I could not find a suggestion this time. Try asking another way.';
}

async function handleSubmit(event) {
  event.preventDefault();
  const apiKey = apiKeyInput.value.trim();
  const prompt = chatInput.value.trim();
  if (!apiKey || !prompt) return;
  addMessage(prompt, 'user-message');
  conversation.push({ role: 'user', parts: [{ text: prompt }] });
  chatInput.value = '';
  sendButton.disabled = true;
  sendButton.textContent = '…';
  try {
    const answer = await askGemini(apiKey, prompt);
    addMessage(answer, 'assistant-message');
    conversation.push({ role: 'model', parts: [{ text: answer }] });
  } catch (error) {
    addMessage(`Sorry — ${error.message} Check your API key and try again.`, 'assistant-message');
  } finally {
    sendButton.disabled = false;
    sendButton.innerHTML = 'Send <span>→</span>';
  }
}

suggestions.forEach(button => button.addEventListener('click', () => {
  chatInput.value = button.dataset.prompt;
  chatInput.focus();
}));
form.addEventListener('submit', handleSubmit);
