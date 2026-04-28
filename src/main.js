import './style.css';

const agents =[
  { id: 'sys', name: 'System Planner', tag: 'SYSTEM', icon: '[GAME]', desc: 'Core system and balance.' },
    { id: 'con', name: 'Content Planner', tag: 'CONTENT', icon: '[CHESS]', desc: 'Events and story.' },
      { id: 'ops', name: 'Operations Manager', tag: 'OPS', icon: '[CHART]', desc: 'UX and metrics.' }
      ];

      let currentStep = 0;
      let isMeeting = false;
      let attachedFiles = [];

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
                                                                                                <textarea class="agent-guide" placeholder="Input guide"></textarea>
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
                                                                                                                                                                  
                                                                                                                                                                    const welcome = container.querySelector('.welcome-message');
                                                                                                                                                                      if (welcome) welcome.remove();

                                                                                                                                                                        let agent = agents.find(a => a.id === agentId);
                                                                                                                                                                          if (agentId === 'master') {
                                                                                                                                                                              agent = { name: 'Master Director', icon: '[CROWN]' };
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
                                                                                                                                                                                                                                                                                                              