import './style.css';

const agents =[
 { id: 'sys', name: '수석 시스템 기획자', tag: 'SYSTEM', icon: '<i class="fa-solid fa-gamepad"></i>', desc: '코어 시스템과 밸런스, 구조를 담당합니다.' },
 { id: 'con', name: '콘텐츠 & 라이브 기획자', tag: 'CONTENT', icon: '<i class="fa-solid fa-chess-knight"></i>', desc: '이벤트, 스토리, 신규 던전 등을 기획합니다.' },
 { id: 'ops', name: '운영 & UX 담당자', tag: 'OPS', icon: '<i class="fa-solid fa-chart-line"></i>', desc: '유저 경험(UX)과 서비스 지표를 관리합니다.' }
 ];

let currentStep = 0;
 let isMeeting = false;
 let attachedFiles = []; // { name: string, content: string }
 let resultCache = '';

function updateStepIndicator() {
 const stepIndicator = document.getElementById('step-indicator');
 if (!stepIndicator) return;
 stepIndicator.innerHTML = agents.map((a, i) => `
 <div class="step" id="step-${i}">
 <div class="step-dot"></div> ${a.name}
 </div>
 `).join('');
 }

function initAgents() {
 const container = document.getElementById('agents-container');
 if (!container) return;
 container.innerHTML = agents.map(a => `
 <div class="agent-card ${a.id}">
 <div class="agent-header">
 <div class="agent-avatar">${a.icon}</div>
 <div class="agent-info">
 <input type="text" class="agent-name-input" data-id="${a.id}" value="${a.name}" />
 <span class="agent-tag">${a.tag}</span>
 </div>
 </div>
 <textarea class="agent-guide" placeholder="지침 입력"></textarea>
 </div>
 `).join('');

 document.querySelectorAll('.agent-name-input').forEach(input => {
 input.addEventListener('change', (e) => {
 const agentId = e.target.dataset.id;
 const agent = agents.find(a => a.id === agentId);
 if (agent) {
 agent.name = e.target.value;
 updateStepIndicator();
 }
 });
 });

 updateStepIndicator();
 }

function updateTime() {
 return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
 }

function addChatMessage(agentId, message) {
 const container = document.getElementById('chat-container');
 if (!container) return;

 const welcome = container.querySelector('.welcome-message');
 if (welcome) welcome.remove();

 let agent = agents.find(a => a.id === agentId);
 if (agentId === 'master') {
 agent = { name: '총괄 디렉터 (MASTER)', icon: '<i class="fa-solid fa-crown"></i>' };
 }

 const msgHTML = `
 <div class="chat-msg msg-${agentId}">
 <div class="chat-avatar">${agent.icon}</div>
 <div class="chat-content">
 <div class="chat-meta">
 <span class="chat-name">${agent.name}</span>
 <span class="chat-time">${updateTime()}</span>
 </div>
 <div class="chat-text">${message}</div>
 </div>
 </div>
 `;
 container.insertAdjacentHTML('beforeend', msgHTML);
 container.scrollTop = container.scrollHeight;
 }

function addSummary(agent, text) {
 const container = document.getElementById('summary-content');
 if (!container) return;
 const empty = container.querySelector('.empty-state');
 if (empty) empty.remove();

 const summaryHTML = `
 <div class="summary-card ${agent.id}">
 <div class="sc-header">
 ${agent.icon} <span>${agent.name}</span>
 </div>
 <div>${text}</div>
 </div>
 `;
 container.insertAdjacentHTML('beforeend', summaryHTML);
 }

function delay(ms) {
 return new Promise(resolve => setTimeout(resolve, ms));
 }

async function callGemini(systemPrompt, userMessage, retryCount = 0) {
 const apiKey = localStorage.getItem('dnf_gemini_key');
 const model = localStorage.getItem('dnf_gemini_model') || 'gemini-2.5-flash';

 if(!apiKey) {
 throw new Error('API 키가 설정되지 않았습니다. 우측 상단 설정에서 입력해주세요.');
 }

 const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

 try {
 const res = await fetch(url, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 system_instruction: { parts: [{ text: systemPrompt }] },
 contents:[{ role: 'user', parts: [{ text: userMessage }] }],
 generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
 })
 });

 if(!res.ok) {
 if (res.status === 503 && retryCount < 5) {
 await delay(2000 * (retryCount + 1));
 return callGemini(systemPrompt, userMessage, retryCount + 1);
 }
 const err = await res.json().catch(() => ({}));
 throw new Error(`API 오류 (${res.status}): ${err?.error?.message || res.statusText}`);
 }

 const data = await res.json();
 return data.candidates?.[0]?.content?.parts?.[0]?.text || '응답이 없습니다.';
 } catch (error) {
 if (retryCount < 5) {
 await delay(2000 * (retryCount + 1));
 return callGemini(systemPrompt, userMessage, retryCount + 1);
 }
 throw error;
 }
 }

async function startMeeting() {
 const input = document.getElementById('agenda-input').value.trim();
 if (!input) { alert('기획 안건을 입력해주세요.'); return; }

 let fullAgenda = input;
 if (attachedFiles.length > 0) {
 fullAgenda += '\n\n[첨부 자료 참고]\n';
 attachedFiles.forEach(file => {
 fullAgenda += `\n--- 파일명: ${file.name} ---\n${file.content}\n`;
 });
 }

 if (isMeeting) return;
 isMeeting = true;

 const btnStart = document.getElementById('btn-start');
 btnStart.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 분석 중...';
 btnStart.disabled = true;

 document.getElementById('chat-container').innerHTML = '';
 document.getElementById('summary-content').innerHTML = '';

 const agentResponses = [];
 const agentSystemPrompts = [
 `당신은 DNF 파티 플레이 명예 투표 시스템 담당 수석 시스템 기획자다.\n시스템 구조, 조건 분기, 점수 계산 로직, 예외 처리 관점에서 의견을 제시한다.`,
 `당신은 DNF 파티 플레이 명예 투표 시스템 담당 콘텐츠 & 라이브 기획자다.\n유저 경험, 참여 동기, 보상 설계 관점에서 의견을 제시한다.`,
 `당신은 DNF 파티 플레이 명예 투표 시스템 담당 운영 & UX 담당자다.\n커뮤니티 반응 예측, UI 정합성, CS 이슈 관점에서 의견을 제시한다.`
 ];

 for (let i = 0; i < agents.length; i++) {
 const agent = agents[i];
 document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
 const stepEl = document.getElementById(`step-${i}`);
 if(stepEl) stepEl.classList.add('active');

 const guideEl = document.querySelector(`.agent-card.${agent.id} .agent-guide`);
 const userGuide = guideEl?.value?.trim() || "";
 const systemPrompt = userGuide ? `${agentSystemPrompts[i]}\n\n[추가 지침]\n${userGuide}` : agentSystemPrompts[i];

 let prevContext = '';
 if (agentResponses.length > 0) {
 prevContext = '\n\n[이전 에이전트 의견 참고]\n' + agentResponses.map((r, idx) => `--- ${agents[idx].name} 의견 ---\n${r}`).join('\n');
 }

 addChatMessage(agent.id, '<i class="fa-solid fa-spinner fa-spin"></i> 분석 중...');

 try {
 const response = await callGemini(systemPrompt, `안건: ${fullAgenda}\n${prevContext}`);
 agentResponses.push(response);
 const msgs = document.querySelectorAll(`.chat-msg.msg-${agent.id}`);
 const lastMsg = msgs[msgs.length - 1];
 if(lastMsg) lastMsg.querySelector('.chat-text').innerHTML = response.replace(/\n/g, '<br>');
 addSummary(agent, response.slice(0, 100) + '...');
 } catch(err) {
 addChatMessage(agent.id, `오류: ${err.message}`);
 }

 if(stepEl) { stepEl.classList.remove('active'); stepEl.classList.add('done'); }
 await delay(1000);
 }

 btnStart.innerHTML = '<i class="fa-solid fa-check"></i> 회의 완료';
 document.getElementById('btn-summary').disabled = false;
 document.getElementById('btn-summary').classList.remove('disabled');
 isMeeting = false;
 }

// Settings Modal Logic
 const modalOverlay = document.getElementById('settings-modal');
 const btnSettings = document.getElementById('btn-settings');
 const btnCloseModal = document.getElementById('btn-close-modal');
 const btnCancelModal = document.getElementById('btn-cancel-modal');
 const btnSaveModal = document.getElementById('btn-save-modal');

function openModal() {
 if (modalOverlay) {
 modalOverlay.classList.remove('hidden');
 modalOverlay.style.display = 'flex';
 const savedKey = localStorage.getItem('dnf_gemini_key') || '';
 const savedModel = localStorage.getItem('dnf_gemini_model') || 'gemini-2.5-flash';
 if (document.getElementById('api-key-input')) document.getElementById('api-key-input').value = savedKey;
 if (document.getElementById('model-select')) document.getElementById('model-select').value = savedModel;
 }
 }

function closeModal() {
 if (modalOverlay) {
 modalOverlay.classList.add('hidden');
 modalOverlay.style.display = 'none';
 }
 }

if (btnSettings) btnSettings.addEventListener('click', openModal);
 if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
 if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);
 if (btnSaveModal) {
 btnSaveModal.addEventListener('click', () => {
 localStorage.setItem('dnf_gemini_key', document.getElementById('api-key-input').value.trim());
 localStorage.setItem('dnf_gemini_model', document.getElementById('model-select').value);
 alert('설정이 저장되었습니다.');
 closeModal();
 });
 }

// Attachment Logic
 const btnAttach = document.getElementById('btn-attach');
 const fileInput = document.getElementById('file-input');
 const attachedFilesContainer = document.getElementById('attached-files-container');

if (btnAttach) btnAttach.addEventListener('click', () => fileInput.click());
 if (fileInput) fileInput.addEventListener('change', async (e) => {
 const files = Array.from(e.target.files);
 for (const file of files) {
 if (attachedFiles.some(f => f.name === file.name)) continue;
 const content = await new Promise(resolve => {
 const reader = new FileReader();
 reader.onload = (ev) => resolve(ev.target.result);
 reader.readAsText(file);
 });
 attachedFiles.push({ name: file.name, content });
 }
 renderAttachedFiles();
 fileInput.value = '';
 });

function renderAttachedFiles() {
 if (!attachedFilesContainer) return;
 attachedFilesContainer.innerHTML = attachedFiles.map((file, index) => `
 <div class="file-tag">
 <i class="fa-solid fa-file-lines"></i>
 <span>${file.name}</span>
 <i class="fa-solid fa-xmark btn-remove-file" data-index="${index}"></i>
 </div>
 `).join('');
 document.querySelectorAll('.btn-remove-file').forEach(btn => {
 btn.addEventListener('click', (e) => {
 attachedFiles.splice(parseInt(e.target.dataset.index), 1);
 renderAttachedFiles();
 });
 });
 }

document.getElementById('btn-start')?.addEventListener('click', startMeeting);
 document.getElementById('btn-reset')?.addEventListener('click', () => location.reload());

initAgents();
