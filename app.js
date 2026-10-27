// ==========================================
// ⚙️ SYSTEM LOGIC & STATE MANAGEMENT
// ==========================================
let PROBLEMS_DATA = [];
let currentMode = 'practice';
let selectedProblem = null;
let timerInterval = null;

let examConfig = {
  hours: 3,
  counts: {
    "Array 1D": 3,
    "Array 2D": 2,
    "Recursion": 2,
    "Class": 1,
    "Unseen": 2
  }
};

// 📌 อ่านข้อมูลจากปัญหา problems.json
window.addEventListener('DOMContentLoaded', () => {
  loadProblemsJSON();
});

function loadProblemsJSON() {
  fetch('problems.json')
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      PROBLEMS_DATA = data;
      render();
    })
    .catch(err => {
      console.error('Error loading problems.json:', err);
      // แสดงปุ่มให้เลือกไฟล์ manual กรณีเปิดไฟล์แบบ file:// แล้วเบราว์เซอร์บล็อก
      const container = document.getElementById('content');
      container.innerHTML = `
        <div class="bg-amber-900/30 border border-amber-600/50 p-6 rounded-xl text-center space-y-4">
          <h2 class="text-lg font-bold text-amber-300">⚠️ ไม่สามารถโหลด problems.json อัตโนมัติได้</h2>
          <p class="text-xs text-slate-300">เนื่องจากคุณดับเบิลคลิกเปิดไฟล์ HTML ตรงๆ (โปรโตคอล file://) ทำให้เบราว์เซอร์บล็อกการอ่านไฟล์</p>
          <div class="space-y-2">
            <p class="text-xs text-amber-200"><b>วิธีแก้:</b> กดเลือกไฟล์ <code>problems.json</code> ด้านล่างเพื่อโหลดข้อมูลเข้ามาทำงาน:</p>
            <input type="file" id="json-file-input" accept=".json" class="text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-700 cursor-pointer">
          </div>
        </div>
      `;

      document.getElementById('json-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              PROBLEMS_DATA = JSON.parse(event.target.result);
              render();
            } catch (pErr) {
              alert('ไฟล์ JSON มีรูปแบบไม่ถูกต้อง (Syntax Error)!');
            }
          };
          reader.readAsText(file);
        }
      });
    });
}

function setMode(mode) {
  currentMode = mode;
  selectedProblem = null;
  if (timerInterval) clearInterval(timerInterval);
  document.getElementById('btn-practice').className = mode === 'practice' ? 'px-4 py-2 rounded-lg font-semibold text-sm transition bg-emerald-600 text-white' : 'px-4 py-2 rounded-lg font-semibold text-sm transition bg-slate-700 text-slate-300';
  document.getElementById('btn-exam').className = mode === 'exam' ? 'px-4 py-2 rounded-lg font-semibold text-sm transition bg-indigo-600 text-white' : 'px-4 py-2 rounded-lg font-semibold text-sm transition bg-slate-700 text-slate-300';
  render();
}

function render() {
  const container = document.getElementById('content');
  if (PROBLEMS_DATA.length === 0) return;

  if (selectedProblem) {
    container.innerHTML = renderDetail(selectedProblem);
    return;
  }
  if (currentMode === 'practice') {
    container.innerHTML = renderPracticeList();
  } else {
    container.innerHTML = renderExamSetup();
  }
}

function renderPracticeList() {
  return `
    <div class="grid gap-4">
      ${PROBLEMS_DATA.map(p => `
        <div onclick="selectProblem('${p.id}')" class="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-emerald-500 cursor-pointer transition flex justify-between items-center">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-lg text-slate-100">${p.title}</span>
              <span class="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">${'⭐'.repeat(p.difficulty)}</span>
            </div>
            <div class="flex gap-2 mt-2">
              ${(p.tags || []).map(t => `<span class="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">${t}</span>`).join('')}
            </div>
          </div>
          <span class="text-sm text-emerald-400 font-semibold">ทำโจทย์ &rarr;</span>
        </div>
      `).join('')}
    </div>
  `;
}

function selectProblem(id) {
  selectedProblem = PROBLEMS_DATA.find(p => p.id === id);
  render();
}

function renderExamSetup() {
  const totalQuestions = Object.values(examConfig.counts).reduce((a, b) => a + b, 0);
  return `
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6">
      <div>
        <h2 class="text-lg font-bold text-indigo-400">🎯 จำลองสอบแบบสุ่มหัวข้อ (Exam Generator)</h2>
        <p class="text-xs text-slate-400 mt-1">กำหนดจำนวนข้อและเวลาสอบได้ตามต้องการ</p>
      </div>

      <div class="bg-slate-900/60 p-4 rounded-lg border border-slate-700/60 flex items-center justify-between">
        <label class="text-sm font-semibold text-slate-200">⏱️ เวลาในการทำข้อสอบ (ชั่วโมง):</label>
        <input type="number" id="input-hours" min="0.5" max="12" step="0.5" value="${examConfig.hours}" 
          onchange="examConfig.hours = parseFloat(this.value) || 3" 
          class="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-center text-yellow-400 font-mono font-bold text-sm w-24">
      </div>

      <div class="space-y-3">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">📚 จำนวนข้อแบ่งตามหัวข้อ</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${Object.keys(examConfig.counts).map(topic => `
            <div class="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 flex justify-between items-center">
              <span class="text-sm font-semibold text-slate-300">${topic}</span>
              <div class="flex items-center gap-2">
                <input type="number" min="0" max="10" value="${examConfig.counts[topic]}" 
                  onchange="updateTopicCount('${topic}', this.value)"
                  class="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-emerald-400 text-sm w-16">
                <span class="text-xs text-slate-400">ข้อ</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-700">
        <button onclick="resetExamConfig()" class="text-xs text-slate-400 hover:text-slate-200 underline">รีเซ็ตเป็นค่าเริ่มต้น</button>
        <button onclick="startCustomExam()" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/30">
          เริ่มสอบทันที (รวม ${totalQuestions} ข้อ / ${examConfig.hours} ชม.)
        </button>
      </div>
    </div>
  `;
}

function updateTopicCount(topic, val) {
  examConfig.counts[topic] = parseInt(val) || 0;
  render();
}

function resetExamConfig() {
  examConfig = {
    hours: 3,
    counts: { "Array 1D": 3, "Array 2D": 2, "Recursion": 2, "Class": 1, "Unseen": 2 }
  };
  render();
}

function startCustomExam() {
  let selectedSet = [];
  Object.keys(examConfig.counts).forEach(topic => {
    const countNeeded = examConfig.counts[topic];
    if (countNeeded > 0) {
      const matching = PROBLEMS_DATA.filter(p => (p.tags || []).includes(topic));
      const shuffled = [...matching].sort(() => 0.5 - Math.random());
      selectedSet.push(...shuffled.slice(0, countNeeded));
    }
  });

  if (selectedSet.length === 0) {
    alert('กรุณาเลือกจำนวนข้ออย่างน้อย 1 ข้อ!');
    return;
  }

  const container = document.getElementById('content');
  let timeLeft = Math.floor(examConfig.hours * 3600);

  container.innerHTML = `
    <div class="bg-indigo-950/80 p-4 rounded-xl border border-indigo-500/40 flex justify-between items-center sticky top-2 backdrop-blur-md z-10 shadow-lg">
      <div>
        <span class="font-bold text-indigo-200">⏳ เวลาสอบคงเหลือ: </span>
        <span id="timer-display" class="font-mono text-xl text-yellow-400 font-bold ml-1">--:--:--</span>
      </div>
      <button onclick="setMode('practice')" class="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition">ออกจากโหมดสอบ</button>
    </div>

    <div class="space-y-6 mt-4">
      ${selectedSet.map((p, i) => `
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
          <div class="flex justify-between items-start">
            <h3 class="font-bold text-lg text-emerald-400">ข้อที่ ${i + 1}: ${p.title} (${p.className}.java)</h3>
            <span class="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">${'⭐'.repeat(p.difficulty)}</span>
          </div>
          <p class="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 whitespace-pre-line">${p.description}</p>
          <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">💻 Starter Code</span>
            <div class="flex gap-2">
              <button onclick="triggerCopy('${p.id}')" class="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded transition">📋 Copy Code</button>
              <button onclick="triggerDownload('${p.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition">📥 Download ${p.className}.java</button>
            </div>
          </div>
          <pre class="bg-slate-950 p-4 rounded-lg text-xs text-slate-300 overflow-x-auto border border-slate-800 font-mono">${p.starterCode}</pre>
        </div>
      `).join('')}
    </div>
  `;

  timerInterval = setInterval(() => {
    let hrs = Math.floor(timeLeft / 3600);
    let mins = Math.floor((timeLeft % 3600) / 60);
    let secs = timeLeft % 60;

    const timerEl = document.getElementById('timer-display');
    if (timerEl) {
      timerEl.innerText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      alert('หมดเวลาสอบแล้ว!');
    }
    timeLeft--;
  }, 1000);
}

function renderDetail(p) {
  return `
    <button onclick="selectedProblem=null; render();" class="text-xs text-slate-400 hover:text-slate-200 mb-2 font-semibold">&larr; ย้อนกลับไปหน้าคลังโจทย์</button>
    <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6 shadow-xl">
      
      <div class="flex justify-between items-start border-b border-slate-700/80 pb-4">
        <div>
          <h2 class="text-xl font-bold text-emerald-400">${p.title}</h2>
          <p class="text-xs text-slate-400 mt-1">ไฟล์หลัก: <code class="bg-slate-900 px-2 py-0.5 rounded text-amber-300 font-mono">${p.className}.java</code></p>
        </div>
        <span class="text-sm bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded font-semibold">${'⭐'.repeat(p.difficulty)}</span>
      </div>

      <div class="space-y-1">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">📋 รายละเอียดโจทย์</h3>
        <p class="text-slate-200 leading-relaxed text-sm bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 whitespace-pre-line">${p.description}</p>
      </div>

      ${p.testCases && p.testCases.length > 0 ? `
        <div class="space-y-3">
          <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">🧪 ตัวอย่าง Test Cases & Expected Outputs</h3>
          <div class="grid gap-3">
            ${p.testCases.map((tc, idx) => `
              <div class="bg-slate-900/90 p-3.5 rounded-lg border border-slate-700/70 space-y-2 text-xs">
                <div class="flex justify-between items-center text-slate-400 font-semibold">
                  <span>Test Case #${idx + 1} ${tc.id ? `(${tc.id})` : ''}</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono">
                  <div class="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span class="text-slate-500 block mb-1 font-sans font-semibold">Input:</span>
                    <pre class="text-sky-300 whitespace-pre-wrap">${tc.input}</pre>
                  </div>
                  <div class="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span class="text-slate-500 block mb-1 font-sans font-semibold">Expected Output:</span>
                    <pre class="text-emerald-400 whitespace-pre-wrap">${tc.expected}</pre>
                  </div>
                </div>
                ${tc.note ? `<p class="text-slate-400 text-xs italic bg-slate-800/50 p-2 rounded font-sans">💡 <b>คำอธิบายเพิ่มเติม:</b> ${tc.note}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">💻 Starter Code</span>
          <div class="flex gap-2">
            <button onclick="triggerCopy('${p.id}')" class="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded transition">
              📋 Copy Code
            </button>
            <button onclick="triggerDownload('${p.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition flex items-center gap-1 shadow-md shadow-emerald-900/30">
              📥 Download ${p.className}.java
            </button>
          </div>
        </div>
        <pre class="bg-slate-950 p-4 rounded-lg text-xs text-slate-300 overflow-x-auto border border-slate-800 font-mono">${p.starterCode}</pre>
      </div>

      <details class="group bg-slate-900/80 rounded-lg border border-slate-700/80 overflow-hidden">
        <summary class="p-3.5 text-xs font-semibold text-indigo-400 cursor-pointer select-none hover:bg-slate-800/80 transition flex justify-between items-center">
          <span>💡 ดูเฉลยและแนวคิด (Solution)</span>
          <span class="text-xs text-slate-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-4 space-y-3 border-t border-slate-800">
          <pre class="bg-slate-950 p-3.5 rounded-lg text-xs text-emerald-300 overflow-x-auto font-mono border border-slate-800/80">${p.solutionCode || 'ยังไม่มีเฉลย'}</pre>
          ${p.solutionExplanation ? `<p class="text-xs text-slate-300 leading-relaxed bg-slate-800/70 p-3 rounded-lg border border-slate-700/50 whitespace-pre-line">📌 <b>คำอธิบายแนวคิด:</b>\n${p.solutionExplanation}</p>` : ''}
        </div>
      </details>

    </div>
  `;
}

// ==========================================
// 📥 DOWNLOAD & COPY FUNCTIONS
// ==========================================
function triggerDownload(problemId) {
  const target = PROBLEMS_DATA.find(item => item.id === problemId);
  if (!target) return;

  const blob = new Blob([target.starterCode], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${target.className}.java`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function triggerCopy(problemId) {
  const target = PROBLEMS_DATA.find(item => item.id === problemId);
  if (!target) return;

  navigator.clipboard.writeText(target.starterCode);
  alert(`คัดลอก ${target.className}.java เรียบร้อย! นำไปวางใน VS Code ได้เลย`);
}