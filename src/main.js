import './style.css';

const agents =[
  { id: 'sys', name: '수석 시스템 기획자', tag: 'SYSTEM', icon: '<i class="fa-solid fa-gamepad"></i>', desc: '코어 시스템과 밸런스, 구조를 담당합니다.' },
  { id: 'con', name: '콘텐츠 & 라이브 기획자', tag: 'CONTENT', icon: '<i class="fa-solid fa-chess-knight"></i>', desc: '이벤트, 스토리, 신규 던전 등을 기획합니다.' },
  { id: 'ops', name: '운영 & UX 담당자', tag: 'OPS', icon: '<i class="fa-solid fa-chart-line"></i>', desc: '유저 경험(UX)과 서비스 지표를 관리합니다.' }
];

let currentStep = 0;
let isMeeting = false;

function updateStepIndicator() {
  const stepIndicator = document.getElementById('step-indicator');
  stepIndicator.innerHTML = agents.map((a, i) => `
    <div class="step" id="step-${i}">
      <div class="step-dot"></div> ${a.name}
    </div>
  `).join('');
}

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

async function callGemini(systemPrompt, userMessage, retryCount = 0) {
  const apiKey = localStorage.getItem('dnf_gemini_key');
  const model = localStorage.getItem('dnf_gemini_model')
    || 'gemini-2.5-flash';

  if(!apiKey) {
    throw new Error(
      'API 키가 설정되지 않았습니다. 우측 상단 설정에서 입력해주세요.'
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents:[{
          role: 'user',
          parts: [{ text: userMessage }]
        }],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7
        }
      })
    });

    if(!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || res.statusText;
      
      // 503 오류 발생 시 최대 5번 재시도 (지수 백오프: 2초, 4초, 6초...)
      if (res.status === 503 && retryCount < 5) {
        const waitTime = 2000 * (retryCount + 1);
        console.warn(`API 503 에러 발생. ${waitTime/1000}초 후 ${retryCount + 1}회차 재시도 중...`);
        await delay(waitTime);
        return callGemini(systemPrompt, userMessage, retryCount + 1);
      }
      
      throw new Error(`API 오류 (${res.status}): ${msg}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text
      || '응답이 없습니다.';
  } catch (error) {
    if (retryCount < 5 && (error.message.includes('503') || error.message.includes('fetch'))) {
      const waitTime = 2000 * (retryCount + 1);
      await delay(waitTime);
      return callGemini(systemPrompt, userMessage, retryCount + 1);
    }
    throw error;
  }
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

  // 각 에이전트 응답을 수집하여 다음 에이전트가 참고할 수 있도록 저장
  const agentResponses = [];

  // 에이전트별 전문 시스템 프롬프트
  const agentSystemPrompts = [
    // 수석 시스템 기획자
    `당신은 수석 시스템 기획자입니다. 게임 시스템 설계 및 밸런스, 데이터 구조, 어뷰징 방지 로직을 담당합니다.
당신은 반드시 아래 형식의 구조화된 리포트를 한국어로 작성해야 합니다.

① 이 기획이 필요한 이유 (구조적 관점)
② 핵심 방향 및 A/B안 비교 (각 안에 대한 구체적 판단 근거 포함)
③ 기획 시 반드시 짚어야 할 조건 분기 및 예외 처리
④ 시스템 구조 관점의 리스크 지적 (최소 1개 이상 반드시 포함)
⑤ 기획서 핵심 포인트

[견제 의무]
- 아젠다에서 구조적 결함이나 예외 처리 누락 부분을 반드시 지적할 것
- 근거 없이 아이디어에 동의만 하는 것 금지
- 모든 항목에 판단 근거를 명시할 것`,

    // 콘텐츠 & 라이브 기획자
    `당신은 콘텐츠 & 라이브 기획자입니다. 유저 경험, 콘텐츠 참여율, UI/UX 흐름, 보상 설계를 담당합니다.
당신은 반드시 아래 형식의 구조화된 리포트를 한국어로 작성해야 합니다.

① 필요성 (유저 경험 관점)
② 유저 경험 방향 (A/B안 비교 포함 시 판단 근거 명시)
③ 리스크 (운영 및 콘텐츠 관점)
④ 수석 시스템 기획자 의견 중 콘텐츠/UX 관점에서의 동의 또는 반론
⑤ 기획서 핵심 포인트

[견제 의무]
- 수석 시스템 기획자의 의견 중 유저 경험을 해칠 수 있는 부분을 반드시 지적할 것
- 근거 없이 동의만 하는 것 금지
- 미결 사항이 있다면 반드시 명시할 것`,

    // 운영 & UX 담당자
    `당신은 운영 & UX 담당자입니다. 유저 행동 패턴, 운영 지표, 시스템 남용 방지, 현장 피드백을 담당합니다.
당신은 반드시 아래 형식의 구조화된 리포트를 한국어로 작성해야 합니다.

① 필요성 (운영 관점)
② 운영·UX 방향 (구체적 판단 근거 포함)
③ 리스크 (운영 현장 관점)
④ SYSTEM / CONTENT 의견 중 유저/운영 관점의 문제 지적
⑤ 감수 가능한 리스크 여부 판단
⑥ 기획서 핵심 포인트

[견제 의무]
- 앞선 두 에이전트가 놓친 운영 현장 리스크를 반드시 1개 이상 추가로 지적할 것
- 근거 없는 동의 금지
- 솔로 플레이 유저, 벌교(버퍼교환) 유저 등 특수 케이스를 반드시 고려할 것`
  ];

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];

    document.querySelectorAll('.step')
      .forEach(el => el.classList.remove('active'));
    const stepEl = document.getElementById(`step-${i}`);
    if(stepEl) stepEl.classList.add('active');

    const guideEl = document.querySelector(
      `.agent-card.${agent.id} .agent-guide`
    );
    const userGuide = guideEl?.value?.trim() || "";
    
    // 구조화 형식이 반드시 우선 적용됨. 사용자 지침은 페르소나/관점만 보완.
    const basePrompt = agentSystemPrompts[i];
    const systemPrompt = userGuide
      ? `[필수 보고 형식 - 절대 준수]\n${basePrompt}\n\n[추가 페르소나 및 관점 보완]\n아래 지침의 관점과 성격을 반영하되, 위의 구조화 리포트 형식과 견제 의무는 반드시 이행하라:\n${userGuide}`
      : basePrompt;

    // 이전 에이전트 의견 컨텍스트 구성
    let prevContext = '';
    if (agentResponses.length > 0) {
      prevContext = '\n\n[이전 에이전트 의견 참고]\n';
      agentResponses.forEach((r, idx) => {
        prevContext += `\n--- ${agents[idx].name} 의견 ---\n${r}\n`;
      });
      prevContext += '\n위 내용을 참고하여, 동의하거나 반론할 부분을 명확히 구분하여 리포트를 작성하시오.';
    }

    addChatMessage(agent.id, '<i class="fa-solid fa-spinner fa-spin"></i> 분석 중...');

    try {
      const userMsg = `다음 기획 아이디어에 대해 당신의 전문 관점에서 구조화된 리포트를 작성하시오:\n\n[안건]\n${input}${prevContext}`;
      const response = await callGemini(systemPrompt, userMsg);

      agentResponses.push(response);

      const msgs = document.querySelectorAll(`.chat-msg.msg-${agent.id}`);
      const lastMsg = msgs[msgs.length - 1];
      if(lastMsg) {
        lastMsg.querySelector('.chat-text').innerHTML =
          response.replace(/\n/g, '<br>');
        const chatContainer = document.getElementById('chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      addSummary(agent, response.slice(0, 100) + '...');

    } catch(err) {
      agentResponses.push(`[오류로 인한 응답 없음]`);
      const msgs = document.querySelectorAll(`.chat-msg.msg-${agent.id}`);
      const lastMsg = msgs[msgs.length - 1];
      if(lastMsg) {
        lastMsg.querySelector('.chat-text').innerHTML =
          `<span style="color:#f87171;">오류: ${err.message}</span>`;
      }
    }

    if(stepEl) {
      stepEl.classList.remove('active');
      stepEl.classList.add('done');
    }

    // 에이전트 간 간격 (API 부하 방지)
    if (i < agents.length - 1) {
      await delay(1000);
    }
  }

  btnStart.innerHTML = '<i class="fa-solid fa-check"></i> 회의 완료';
  document.getElementById('btn-summary').disabled = false;
  document.getElementById('btn-summary').classList.remove('disabled');
  document.getElementById('btn-show-result').style.display = 'flex';
  resultCache = '';
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
  document.getElementById('btn-show-result').style.display = 'none';
  resultCache = '';
  
  document.querySelectorAll('.step').forEach(el => {
    el.classList.remove('active');
    el.classList.remove('done');
  });
  
  isMeeting = false;
});

document.getElementById('btn-summary').addEventListener('click', async () => {
  const btn = document.getElementById('btn-summary');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 종합 중...';
  btn.disabled = true;

  const chatMsgs = document.querySelectorAll('.chat-msg:not(.msg-master)');
  let agentLogs = '';
  chatMsgs.forEach(msg => {
    const name = msg.querySelector('.chat-name')?.textContent || '';
    const text = msg.querySelector('.chat-text')?.innerText || '';
    if (text && !text.includes('분석 중') && !text.includes('오류')) {
      agentLogs += `[${name}]:\n${text}\n\n${'─'.repeat(40)}\n\n`;
    }
  });

  const masterGuide = `당신은 총괄 기획 디렉터입니다.
3명의 전문 에이전트(수석 시스템 기획자, 콘텐츠 & 라이브 기획자, 운영 & UX 담당자)가 작성한 리포트를 종합하여
아래 형식의 최종 회의록을 마크다운으로 작성하세요.

# 📋 기획 회의 최종 결과
## 🎯 회의 배경 및 목적
## ✅ 에이전트별 핵심 의견 요약
### 🔧 수석 시스템 기획자
### 🏰 콘텐츠 & 라이브 기획자
### 📊 운영 & UX 담당자
## ⚡ 3인 공통 합의 사항
## 🔥 3인 간 이견 및 논쟁점
## 🏁 최종 확정 방향
## 📅 개발 로드맵
- v1.0 MVP:
- v2.0 확장:
## ⚠️ 미결 사항
## 💡 디렉터 최종 판단

규칙:
- JSON 형식 절대 사용 금지
- 한국어로 작성
- 각 에이전트의 핵심 주장과 견제 의견을 정확히 반영할 것
- 단순 나열이 아닌 논의 흐름이 보이도록 서술할 것`;

  try {
    const masterResponse = await callGemini(
      masterGuide,
      `기획 안건: ${document.getElementById('agenda-input').value}\n\n${agentLogs}\n\n위 내용을 종합하여 최종 회의록을 작성해주세요.`
    );

    addChatMessage('master',
      masterResponse.replace(/\n/g, '<br>')
    );

    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;

    btn.innerHTML = '<i class="fa-solid fa-crown"></i> 디렉터 최종 판단 완료';
  } catch(err) {
    addChatMessage('master',
      `<span style="color:#f87171;">오류: ${err.message}</span>`
    );
    btn.innerHTML = '<i class="fa-solid fa-crown"></i> 오류 발생';
    btn.disabled = false;
  }
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
// ── 회의 로그 다운로드 ──
function downloadChatLog() {
  const msgs = document.querySelectorAll('.chat-msg');
  if(!msgs.length) { alert('다운로드할 회의 로그가 없습니다.'); return; }
  let log = `DNF 기획 회의 로그\n일시: ${new Date().toLocaleString('ko-KR')}\n${'='.repeat(50)}\n\n`;
  msgs.forEach(msg => {
    const name = msg.querySelector('.chat-name')?.textContent || '';
    const time = msg.querySelector('.chat-time')?.textContent || '';
    const text = msg.querySelector('.chat-text')?.innerText || '';
    log += `[${name}] ${time}\n${text}\n\n${'─'.repeat(40)}\n\n`;
  });
  const blob = new Blob([log], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `회의로그_${new Date().toLocaleDateString('ko-KR').replace(/\. /g,'').replace('.','')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
document.getElementById('btn-download-log')?.addEventListener('click', downloadChatLog);

// ── 로그 확장 ──
let isExpanded = false;
document.getElementById('btn-expand-log')?.addEventListener('click', () => {
  const meetingLog = document.querySelector('.meeting-log');
  const btn = document.getElementById('btn-expand-log');
  isExpanded = !isExpanded;
  if(isExpanded) {
    meetingLog.style.cssText = 'position:fixed;inset:16px;z-index:900;margin:0;border-radius:12px;';
    btn.innerHTML = '<i class="fa-solid fa-compress"></i>';
  } else {
    meetingLog.style.cssText = '';
    btn.innerHTML = '<i class="fa-solid fa-expand"></i>';
  }
});

// ── 회의 결과 팝업 ──
let resultCache = '';

function markdownToHtml(md) {
  return md
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>');
}

async function showResult() {
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-content');
  modal.classList.remove('hidden');
  if(resultCache) { content.innerHTML = resultCache; return; }

  content.innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>회의 결과 생성 중...</p></div>';

  const msgs = document.querySelectorAll('.chat-msg');
  if(!msgs.length) {
    content.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>회의 로그가 없습니다.</p></div>';
    return;
  }

  let agentLogs = '';
  msgs.forEach(msg => {
    const name = msg.querySelector('.chat-name')?.textContent || '';
    const text = msg.querySelector('.chat-text')?.innerText || '';
    agentLogs += `[${name}]:\n${text}\n\n`;
  });

  const agenda = document.getElementById('agenda-input')?.value || '';
  try {
    const summary = await callGemini(
      `당신은 수석 기획 디렉터입니다. 에이전트 회의 내용을 종합하여 아래 마크다운 형식으로 회의 결과를 작성하세요. JSON 절대 금지. 한국어. 결론만 나열하지 말고 논의 흐름이 보이도록 작성.

# 📋 기획 회의 결과
## 1. 회의 배경 및 목적
## 2. 주요 논의 흐름
### 아젠다 A: (논점)
- **제기:**
- **반론/보완:**
- **결론:**
## 3. 최종 확정 방향
## 4. 기획서 핵심 포인트
## 5. 개발 로드맵
- **v1.0 MVP:**
- **v2.0 확장:**
## 6. 미결 사항`,
      `기획 안건: ${agenda}\n\n${agentLogs}`
    );
    resultCache = markdownToHtml(summary);
    content.innerHTML = resultCache;
  } catch(err) {
    content.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>오류: ${err.message}</p></div>`;
  }
}

document.getElementById('btn-show-result')?.addEventListener('click', showResult);
document.getElementById('btn-close-result')?.addEventListener('click', () => {
  document.getElementById('result-modal').classList.add('hidden');
});
document.getElementById('result-modal')?.addEventListener('click', (e) => {
  if(e.target.id === 'result-modal') e.target.classList.add('hidden');
});
