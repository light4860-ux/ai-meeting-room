import './style.css';

const agents =[
 { id: 'sys', name: '수석 시스템 기획자', tag: 'SYSTEM', icon: '<i class="fa-solid fa-gamepad"></i>', desc: '코어 시스템과 밸런스, 구조를 담당합니다.' },
 { id: 'con', name: '콘텐츠 & 라이브 기획자', tag: 'CONTENT', icon: '<i class="fa-solid fa-chess-knight"></i>', desc: '이벤트, 스토리, 신규 던전 등을 기획합니다.' },
 { id: 'ops', name: '운영 & UX 담당자', tag: 'OPS', icon: '<i class="fa-solid fa-chart-line"></i>', desc: '유저 경험(UX)과 서비스 지표를 관리합니다.' }
 ];

let currentStep = 0;
 let isMeeting = false;
 let attachedFiles = []; // { name: string, content: string }

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
 `당신은 수석 시스템 기획자입니다...`, // 생략 가능하지만 전체 코드가 필요함
 `당신은 콘텐츠 기획자입니다...`,
 `당신은 UX 담당자입니다...`
 ];

 // ... (중략 - 로컬 파일을 복사하는 것이 가장 좋습니다)

 // 회의 로직 생략 (실제 파일에는 포함되어 있습니다)
 }

// Settings Modal Logic (핵심 수정 부분)
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

initAgents();
 // 나머지 이벤트 리스너들 생략...
