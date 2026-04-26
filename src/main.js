import './style.css';

const agents = [
  { id: 'sys', name: '수석 시스템 기획자', tag: 'SYSTEM', icon: '<i class="fa-solid fa-gamepad"></i>', desc: '코어 시스템과 밸런스, 구조를 담당합니다.' },
  { id: 'con', name: '콘텐츠 & 라이브 기획자', tag: 'CONTENT', icon: '<i class="fa-solid fa-chess-knight"></i>', desc: '이벤트, 스토리, 신규 던전 등을 기획합니다.' },
  { id: 'ops', name: '운영 & UX 담당자', tag: 'OPS', icon: '<i class="fa-solid fa-chart-line"></i>', desc: '유저 경험(UX)과 서비스 지표를 관리합니다.' }
];

let currentStep = 0;
let isMeeting = false;

function initAgents() {
  const container = document.getElementById('agents-container');
  container.innerHTML = agents.map(a => `
    <div class="agent-card ${a.id}">
      <div class="agent-header">
        <div class="agent-avatar">${a.icon}</div>
        <div class="agent-info">
          <h4>${a.name}</h4>
          <span class="agent-tag">${a.tag}</span>
        </div>
      </div>
      <textarea class="agent-guide" placeholder="지침 입력"></textarea>
    </div>
  `).join('');

  const stepIndicator = document.getElementById('step-indicator');
  stepIndicator.innerHTML = agents.map((a, i) => `
    <div class="step" id="step-${i}">
      <div class="step-dot"></div> ${a.name}
    </div>
  `).join('');
}

function updateTime() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function addChatMessage(agentId, message) {
  const container = document.getElementById('chat-container');
  
  // Remove welcome message if exists
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

async function startMeeting() {
  const input = document.getElementById('agenda-input').value.trim();
  if (!input) {
    alert('기획 안건을 입력해주세요.');
    return;
  }

  if (isMeeting) return;
  isMeeting = true;

  const btnStart = document.getElementById('btn-start');
  btnStart.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 분석 중...';
  btnStart.disabled = true;

  document.getElementById('chat-container').innerHTML = '';
  document.getElementById('summary-content').innerHTML = '';

  const mockResponses = [
    "시스템 구조상 해당 기획은 서버 부하를 늘릴 수 있으나, 비동기 처리를 도입하면 충분히 가능합니다. 밸런스 조정안은 긍정적으로 검토할 수 있습니다.",
    "이벤트와 연계하여 스토리라인을 확장하기 좋은 아이디어입니다. 특히 신규 유저의 진입 장벽을 낮추는 튜토리얼 퀘스트로 활용하면 좋겠습니다.",
    "유저 피드백 데이터와 비교해봤을 때, 긍정적인 반응이 예상됩니다. 다만 UI/UX 측면에서 직관성이 떨어질 수 있어, 플로우 개선이 필요합니다."
  ];

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    
    // Set active step
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    const stepEl = document.getElementById(`step-${i}`);
    stepEl.classList.add('active');

    // Simulate thinking
    await delay(1500);
    
    addChatMessage(agent.id, mockResponses[i]);
    addSummary(agent, mockResponses[i].substring(0, 50) + "...");
    
    stepEl.classList.remove('active');
    stepEl.classList.add('done');
  }

  btnStart.innerHTML = '<i class="fa-solid fa-check"></i> 회의 완료';
  document.getElementById('btn-summary').disabled = false;
  document.getElementById('btn-summary').classList.remove('disabled');
  isMeeting = false;
}

document.getElementById('btn-start').addEventListener('click', startMeeting);

document.getElementById('btn-reset').addEventListener('click', () => {
  document.getElementById('agenda-input').value = '';
  document.getElementById('chat-container').innerHTML = `
    <div class="welcome-message">
      <i class="fa-brands fa-hubspot"></i>
      <p>기획 안건을 입력하고 회의를 시작하면, 이곳에 실시간 회의 로그가 순차적으로 기록됩니다.</p>
    </div>
  `;
  document.getElementById('summary-content').innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-hourglass-empty"></i>
      <p>회의가 진행되면 요약이 생성됩니다.</p>
    </div>
  `;
  document.getElementById('btn-start').innerHTML = '<i class="fa-solid fa-bolt"></i> 회의 시작';
  document.getElementById('btn-start').disabled = false;
  document.getElementById('btn-summary').disabled = true;
  document.getElementById('btn-summary').classList.add('disabled');
  
  document.querySelectorAll('.step').forEach(el => {
    el.classList.remove('active');
    el.classList.remove('done');
  });
  
  isMeeting = false;
});

document.getElementById('btn-summary').addEventListener('click', async () => {
  const btn = document.getElementById('btn-summary');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 요약 중...';
  btn.disabled = true;

  await delay(2000);

  addChatMessage('master', "최종 결정: 제안해주신 기획안을 바탕으로 시스템 비동기 처리 적용, 스토리라인 연계 이벤트 기획, 그리고 UX 플로우 개선을 우선순위로 두고 개발을 진행하겠습니다. 훌륭한 제안입니다.");
  
  btn.innerHTML = '<i class="fa-solid fa-crown"></i> 디렉터 최종 판단 완료';
});

// Initialize on load
initAgents();

// Sidebar Collapse Logic
const btnCollapseSidebar = document.getElementById('btn-collapse-sidebar');
const sidebar = document.getElementById('sidebar');
const dashboardLayout = document.querySelector('.dashboard-layout');

btnCollapseSidebar.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  dashboardLayout.classList.toggle('sidebar-collapsed');
});

// Settings Modal Logic
const modalOverlay = document.getElementById('settings-modal');
const btnSettings = document.getElementById('btn-settings');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnSaveModal = document.getElementById('btn-save-modal');

function openModal() {
  modalOverlay.classList.remove('hidden');
  // Load saved values if needed
  const savedKey = localStorage.getItem('dnf_gemini_key') || '';
  const savedModel = localStorage.getItem('dnf_gemini_model') || 'gemini-2.5-flash';
  document.getElementById('api-key-input').value = savedKey;
  document.getElementById('model-select').value = savedModel;
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

btnSettings.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);

// Click outside to close
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

btnSaveModal.addEventListener('click', () => {
  const apiKey = document.getElementById('api-key-input').value;
  const model = document.getElementById('model-select').value;
  
  localStorage.setItem('dnf_gemini_key', apiKey);
  localStorage.setItem('dnf_gemini_model', model);
  
  // Custom toast/alert can be used here
  alert('설정이 저장되었습니다.');
  closeModal();
});
