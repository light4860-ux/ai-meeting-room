import { GoogleGenerativeAI } from "@google/generative-ai";

<<<<<<< HEAD
const agents =[
  { id: 'sys', name: 'System Planner', tag: 'SYSTEM', icon: '<i class="fa-solid fa-gamepad"></i>', desc: 'Core systems and balance.' },
    { id: 'con', name: 'Content Planner', tag: 'CONTENT', icon: '<i class="fa-solid fa-chess-knight"></i>', desc: 'Events and story.' },
      { id: 'ops', name: 'UX & Ops', tag: 'OPS', icon: '<i class="fa-solid fa-chart-line"></i>', desc: 'User experience and metrics.' }
      ];
=======
const AGENTS = [
  { id: 'pmo', name: 'PM (Project Manager)', icon: '<i class="fa-solid fa-user-tie"></i>', role: 'Management', color: '#4dabf7' },
  { id: 'ux', name: 'UX Designer', icon: '<i class="fa-solid fa-palette"></i>', role: 'Design', color: '#ff922b' },
  { id: 'fe', name: 'FE Developer', icon: '<i class="fa-solid fa-code"></i>', role: 'Development', color: '#51cf66' },
  { id: 'be', name: 'BE Developer', icon: '<i class="fa-solid fa-server"></i>', role: 'Development', color: '#cc5de8' },
  { id: 'qa', name: 'QA Engineer', icon: '<i class="fa-solid fa-bug"></i>', role: 'Quality', color: '#ff6b6b' },
  { id: 'director', name: 'Director', icon: '<i class="fa-solid fa-crown"></i>', role: 'Decision', color: '#fcc419' }
];
>>>>>>> 3128cdf9fb256a08e3f65fff5ac07b932300b717

<<<<<<< HEAD
      let isMeeting = false;
      let attachedFiles = [];
=======
let genAI = null;
let model = null;
let isMeetingRunning = false;
let attachedFiles = [];
>>>>>>> 3128cdf9fb256a08e3f65fff5ac07b932300b717

<<<<<<< HEAD
      function updateStepIndicator() {
        const stepIndicator = document.getElementById('step-indicator');
          stepIndicator.innerHTML = agents.map((a, i) => `
              <div class="step" id="step-${i}">
                    <div class="step-dot"></div> ${a.name}
                        </div>
                          `).join('');
                          }
=======
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
>>>>>>> 3128cdf9fb256a08e3f65fff5ac07b932300b717

<<<<<<< HEAD
                          function initAgents() {
                            const container = document.getElementById('agents-container');
                              container.innerHTML = agents.map(a => `
                                  <div class="agent-card ${a.id}">
                                        <div class="agent-header">
                                                <div class="agent-avatar">${a.icon}</div>
                                                        <div class="agent-info">
                                                                  <input type="text" class="agent-name-input" data-id="${a.id}" value="${a.name}" />
                                                                            <span class="agent-tag">${a.tag}</span>
                                                                                    </div>
                                                                                          </div>
                                                                                                <textarea class="agent-guide" placeholder="Enter guide..."></textarea>
                                                                                                    </div>
                                                                                                      `).join('');
                                                                                                        updateStepIndicator();
                                                                                                        }

                                                                                                        function addChatMessage(agentId, message) {
                                                                                                            const container = document.getElementById('chat-container');
                                                                                                              const agent = agents.find(a => a.id === agentId) || { name: 'Master', icon: '<i class="fa-solid fa-crown"></i>' };
                                                                                                                const msgHTML = `
                                                                                                                    <div class="chat-msg msg-${agentId}">
                                                                                                                          <div class="chat-avatar">${agent.icon}</div>
                                                                                                                                <div class="chat-content">
                                                                                                                                        <div class="chat-meta"><span class="chat-name">${agent.name}</span></div>
                                                                                                                                                <div class="chat-text">${message}</div>
                                                                                                                                                      </div>
                                                                                                                                                          </div>
                                                                                                                                                            `;
                                                                                                                                                              container.insertAdjacentHTML('beforeend', msgHTML);
                                                                                                                                                                container.scrollTop = container.scrollHeight;
                                                                                                                                                                }

                                                                                                                                                                async function callGemini(systemPrompt, userMessage) {
                                                                                                                                                                    const apiKey = localStorage.getItem('dnf_gemini_key');
                                                                                                                                                                      const model = localStorage.getItem('dnf_gemini_model') || 'gemini-2.5-flash';
                                                                                                                                                                        if(!apiKey) throw new Error('API Key missing. Please set it in settings.');
                                                                                                                                                                          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                                                                                                                                                                            const res = await fetch(url, {
                                                                                                                                                                                  method: 'POST',
                                                                                                                                                                                      headers: { 'Content-Type': 'application/json' },
                                                                                                                                                                                          body: JSON.stringify({
                                                                                                                                                                                                  system_instruction: { parts: [{ text: systemPrompt }] },
                                                                                                                                                                                                        contents:[{ role: 'user', parts: [{ text: userMessage }] }]
                                                                                                                                                                                                            })
                                                                                                                                                                                                          });
                                                                                                                                                                                                            const data = await res.json();
                                                                                                                                                                                                              return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
                                                                                                                                                                                                              }
=======
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
>>>>>>> 3128cdf9fb256a08e3f65fff5ac07b932300b717

                                                                                                                                                                                                              async function startMeeting() {
                                                                                                                                                                                                                  const input = document.getElementById('agenda-input').ariaValueMax.trim();
                                                                                                                                                                                                                    if (!input || isMeeting) return;
                                                                                                                                                                                                                      isMeeting = true;
                                                                                                                                                                                                                        document.getElementById('chat-container').innerHTML = '';
                                                                                                                                                                                                                          for (let i = 0; i < agents.length; i++) {
                                                                                                                                                                                                                                const agent = agents[i];
                                                                                                                                                                                                                                    addChatMessage(agent.id, 'Analyzing...');
                                                                                                                                                                                                                                        const response = await callGemini(`You are ${agent.name}.`, input);
                                                                                                                                                                                                                                            const msgs = document.querySelectorAll(`.chat-msg.msg-${agent.id}`);
                                                                                                                                                                                                                                                msgs[msgs.length - 1].querySelector('.chat-text').innerText = response;
                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                    isMeeting = false;
                                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                                    document.getElementById('btn-start').addEventListener('click', startMeeting);
                                                                                                                                                                                                                                                    document.getElementById('btn-settings').addEventListener('click', () => {
                                                                                                                                                                                                                                                        const key = prompt('Enter Gemini API Key:');
                                                                                                                                                                                                                                                          if(key) localStorage.setItem('dnf_gemini_key', key);
                                                                                                                                                                                                                                                          });

                                                                                                                                                                                                                                                          initAgents();
                                                                                                                                                                                                                                                            --bg-base: #101014;
                                                                                                                                                                                                                                                              --bg-surface: #1a1a20;
                                                                                                                                                                                                                                                                --bg-input: #15151a;
                                                                                                                                                                                                                                                                  --accent-primary: #ff5420;
                                                                                                                                                                                                                                                                    --text-main: #ffffff;
                                                                                                                                                                                                                                                                      --text-secondary: #a1a1aa;
                                                                                                                                                                                                                                                                        --font-sans: 'Inter', sans-serif;
                                                                                                                                                                                                                                                                          --radius-md: 12px;
                                                                                                                                                                                                                                                                          }

                                                                                                                                                                                                                                                                          body {
                                                                                                                                                                                                                                                                            background-color: var(--bg-base);
                                                                                                                                                                                                                                                                              color: var(--text-main);
                                                                                                                                                                                                                                                                                font-family: var(--font-sans);
                                                                                                                                                                                                                                                                                  margin: 0;
                                                                                                                                                                                                                                                                                    overflow: hidden;
                                                                                                                                                                                                                                                                                    }

<<<<<<< HEAD
                                                                                                                                                                                                                                                                                    #app {
                                                                                                                                                                                                                                                                                        display: flex;
                                                                                                                                                                                                                                                                                          flex-direction: column;
                                                                                                                                                                                                                                                                                            height: 100vh;
                                                                                                                                                                                                                                                                                              padding: 20px;
                                                                                                                                                                                                                                                                                                gap: 20px;
                                                                                                                                                                                                                                                                                                }
=======
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
>>>>>>> 3128cdf9fb256a08e3f65fff5ac07b932300b717

<<<<<<< HEAD
                                                                                                                                                                                                                                                                                                .soft-header {
                                                                                                                                                                                                                                                                                                    display: flex;
                                                                                                                                                                                                                                                                                                      justify-content: space-between;
                                                                                                                                                                                                                                                                                                        align-items: center;
                                                                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                                                                .dashboard-layout {
                                                                                                                                                                                                                                                                                                    display: grid;
                                                                                                                                                                                                                                                                                                      grid-template-columns: 260px 1fr 300px;
                                                                                                                                                                                                                                                                                                        gap: 20px;
                                                                                                                                                                                                                                                                                                          flex: 1;
                                                                                                                                                                                                                                                                                                            overflow: hidden;
                                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                                            .soft-panel {
                                                                                                                                                                                                                                                                                                                background: var(--bg-surface);
                                                                                                                                                                                                                                                                                                                  border-radius: var(--radius-md);
                                                                                                                                                                                                                                                                                                                    border: 1px solid rgba(255,255,255,0.1);
                                                                                                                                                                                                                                                                                                                      padding: 15px;
                                                                                                                                                                                                                                                                                                                        display: flex;
                                                                                                                                                                                                                                                                                                                          flex-direction: column;
                                                                                                                                                                                                                                                                                                                            overflow: hidden;
                                                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                                                            .agent-card { margin-bottom: 15px; }
                                                                                                                                                                                                                                                                                                                            .agent-guide { width: 100%; height: 100px; background: var(--bg-input); color: #fff; border: 1px solid #333; }
                                                                                                                                                                                                                                                                                                                            .chat-container { flex: 1; overflow-y: auto; background: var(--bg-input); padding: 10px; border-radius: 8px; }
                                                                                                                                                                                                                                                                                                                            .agenda-textarea { width: 100%; height: 80px; background: var(--bg-input); color: #fff; border: none; padding: 10px; }
                                                                                                                                                                                                                                                                                                                            .action-btn { padding: 10px; background: var(--accent-primary); border: none; color: #fff; cursor: pointer; border-radius: 5px; }
                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                    })
                                                                                                                                                                                                                          }
                                                                                                                                                                                                              }
                                                                                                                                                                                          })
                                                                                                                                                                            })
                                                                                                                                                                }
                                                                                                        }
=======
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

>>>>>>> 3128cdf9fb256a08e3f65fff5ac07b932300b717