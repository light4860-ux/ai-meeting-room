import { GoogleGenerativeAI } from "@google/generative-ai";

const AGENTS = [
  { id: 'pmo', name: 'PM (Project Manager)', icon: '<i class="fa-solid fa-user-tie"></i>', role: 'Management', color: '#4dabf7' },
  { id: 'ux', name: 'UX Designer', icon: '<i class="fa-solid fa-palette"></i>', role: 'Design', color: '#ff922b' },
  { id: 'fe', name: 'FE Developer', icon: '<i class="fa-solid fa-code"></i>', role: 'Development', color: '#51cf66' },
  { id: 'be', name: 'BE Developer', icon: '<i class="fa-solid fa-server"></i>', role: 'Development', color: '#cc5de8' },
  { id: 'qa', name: 'QA Engineer', icon: '<i class="fa-solid fa-bug"></i>', role: 'Quality', color: '#ff6b6b' },
  { id: 'director', name: 'Director', icon: '<i class="fa-solid fa-crown"></i>', role: 'Decision', color: '#fcc419' }
];

let genAI = null;
let model = null;
let isMeetingRunning = false;
let attachedFiles = [];

const agentsContainer = document.getElementById('agents-container');
const agendaInput = document.getElementById('agenda-input');
const chatContainer = document.getElementById('chat-container');
const summaryContent = document.getElementById('summary-content');
const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');
const btnSettings = document.getElementById('btn-settings');
const settingsModal = document.getElementById('settings-modal');
const btnSaveSettings = document.getElementById('btn-save-modal');
const apiKeyInput = document.getElementById('api-key-input');
const modelSelect = document.getElementById('model-select');
const fileInput = document.getElementById('file-input');
const btnAttach = document.getElementById('btn-attach');
const attachedFilesContainer = document.getElementById('attached-files-container');
const btnSummary = document.getElementById('btn-summary');
const resultModal = document.getElementById('result-modal');
const resultContent = document.getElementById('result-content');
const btnCloseResult = document.getElementById('btn-close-result');

function initAgents() {
  agentsContainer.innerHTML = AGENTS.map(agent => `
    <div class="agent-card" id="agent-${agent.id}" style="border-left: 4px solid ${agent.color}">
      <div class="agent-icon" style="background: ${agent.color}20; color: ${agent.color}">${agent.icon}</div>
      <div class="agent-info">
        <div class="agent-name">${agent.name}</div>
        <div class="agent-role">${agent.role}</div>
      </div>
      <div class="agent-status"><span class="status-dot"></span></div>
    </div>
  `).join('');
}

function updateAgentStatus(agentId, status) {
  const agentCard = document.getElementById(`agent-${agentId}`);
  if (agentCard) {
    const dot = agentCard.querySelector('.status-dot');
    dot.className = 'status-dot ' + status;
  }
}

btnAttach.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      attachedFiles.push({ name: file.name, content: event.target.result });
      renderAttachedFiles();
    };
    reader.readAsText(file);
  });
});

function renderAttachedFiles() {
  attachedFilesContainer.innerHTML = attachedFiles.map((file, index) => `
    <div class="file-tag">
      <i class="fa-solid fa-file-code"></i>
      <span>${file.name}</span>
      <i class="fa-solid fa-xmark remove-file" data-index="${index}"></i>
    </div>
  `).join('');
  
  document.querySelectorAll('.remove-file').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      attachedFiles.splice(index, 1);
      renderAttachedFiles();
    });
  });
}

async function runMeeting() {
  const agenda = agendaInput.value.trim();
  if (!agenda) return alert('Please enter an agenda.');
  if (!model) return alert('Please set your Gemini API key in settings.');

  isMeetingRunning = true;
  btnStart.disabled = true;
  chatContainer.innerHTML = '';
  summaryContent.innerHTML = '<div class="loading">Experts are analyzing...</div>';

  let context = `Agenda: ${agenda}\n`;
  if (attachedFiles.length > 0) {
    context += "Attached Files:\n" + attachedFiles.map(f => `File: ${f.name}\nContent: ${f.content}`).join('\n\n');
  }

  const history = [];

  for (const agent of AGENTS) {
    if (!isMeetingRunning) break;
    
    updateAgentStatus(agent.id, 'active');
    addChatMessage(agent, `Thinking about the agenda...`, true);
    
    try {
      const prompt = `Role: ${agent.name} (${agent.role})\nContext: ${context}\n\nBased on the agenda and any attached files, please provide your professional input.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      updateChatMessage(agent.id, text);
      history.push({ role: agent.id, content: text });
      context += `\n${agent.name}: ${text}`;
    } catch (error) {
      updateChatMessage(agent.id, "Error: " + error.message);
    }
    
    updateAgentStatus(agent.id, 'idle');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  isMeetingRunning = false;
  btnStart.disabled = false;
  generateSummary(history);
}

function addChatMessage(agent, text, isLoading = false) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${agent.id}`;
  msgDiv.innerHTML = `
    <div class="msg-header" style="color: ${agent.color}">
      ${agent.icon} <strong>${agent.name}</strong>
    </div>
    <div class="msg-content ${isLoading ? 'loading-text' : ''}">${text}</div>
  `;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function updateChatMessage(agentId, text) {
  const lastMsg = chatContainer.querySelector(`.chat-msg.${agentId}:last-child .msg-content`);
  if (lastMsg) {
    lastMsg.className = 'msg-content';
    lastMsg.innerText = text;
  }
}

async function generateSummary(history) {
  const prompt = "Please summarize the meeting results based on the expert opinions above.";
  try {
    const result = await model.generateContent(prompt + "\n" + JSON.stringify(history));
    const response = await result.response;
    summaryContent.innerText = response.text();
  } catch (error) {
    summaryContent.innerText = "Summary error: " + error.message;
  }
}

btnStart.addEventListener('click', runMeeting);
btnReset.addEventListener('click', () => {
  location.reload();
});

btnSettings.addEventListener('click', () => settingsModal.style.display = 'flex');
document.querySelector('.close-modal').addEventListener('click', () => settingsModal.style.display = 'none');
btnSaveSettings.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  const modelName = modelSelect.value;
  if (key) {
    genAI = new GoogleGenerativeAI(key);
    model = genAI.getGenerativeModel({ model: modelName });
    settingsModal.style.display = 'none';
    alert('Settings saved!');
  }
});

initAgents();
