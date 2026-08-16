const DB_KEY='examora_db_v2';
function seedDB(){return {exams:[],questions:[],attempts:[],logs:[],user:{name:'Demo Examiner',email:'examiner@example.com'}}}
function getDB(){try{return JSON.parse(localStorage.getItem(DB_KEY))||seedDB()}catch(e){return seedDB()}}
function saveDB(db){localStorage.setItem(DB_KEY,JSON.stringify(db))}
function logEvent(text){const db=getDB();db.logs.unshift({text,time:new Date().toLocaleString()});db.logs=db.logs.slice(0,100);saveDB(db)}
function esc(s){return String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
function toggleTheme(){document.body.classList.toggle('dark');localStorage.setItem('examora_dark',document.body.classList.contains('dark'))}
function restoreTheme(){if(localStorage.getItem('examora_dark')==='true')document.body.classList.add('dark')}
function setupNav(){document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));restoreTheme()}
function showView(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));const el=document.getElementById('view-'+id);if(el)el.classList.add('active');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===id));document.querySelectorAll('.mobile-examiner-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));if(window.location.hash!==id)history.replaceState(null,'','#'+id);renderCurrentView(id)}
function renderCurrentView(id){if(id==='dashboard')renderExaminerDashboard();if(id==='questions')renderQuestionBank();if(id==='results')renderResults();if(id==='audit')renderAudit();if(id==='student-dashboard')renderStudentDashboard();if(id==='history')renderStudentHistory()}
function uid(prefix='id'){return prefix+'_'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4)}
function code(){return Math.random().toString(36).slice(2,7).toUpperCase()}
function password(){return String(Math.floor(100000+Math.random()*900000))}
function formatStatus(ex){const now=Date.now(),start=new Date(`${ex.date}T${ex.startTime}`).getTime(),end=start+(Number(ex.duration)||0)*60000;return now<start?'upcoming':now<=end?'active':'completed'}
function initExaminer(){setupNav();const db=getDB();document.getElementById('examinerName').textContent=db.user.name;document.getElementById('negative').addEventListener('change',e=>document.getElementById('negativeMarks').disabled=!e.target.checked);document.getElementById('examForm').addEventListener('submit',createExam);renderExaminerDashboard();if(location.hash)showView(location.hash.slice(1))}
function createExam(e){e.preventDefault();const db=getDB();const ex={id:uid('exam'),title:document.getElementById('title').value.trim(),subject:document.getElementById('subject').value.trim(),date:document.getElementById('date').value,startTime:document.getElementById('startTime').value,duration:+document.getElementById('duration').value,passing:+document.getElementById('passing').value,maxStudents:document.getElementById('maxStudents').value?+document.getElementById('maxStudents').value:null,department:document.getElementById('department').value.trim(),instructions:document.getElementById('instructions').value.trim(),negative:document.getElementById('negative').checked,negativeMarks:+document.getElementById('negativeMarks').value,roomCode:code(),roomPassword:password(),questionIds:[],created:new Date().toISOString()};db.exams.unshift(ex);saveDB(db);logEvent(`Created examination “${ex.title}” with room ${ex.roomCode}`);document.getElementById('examForm').reset();document.getElementById('negativeMarks').disabled=true;renderExaminerDashboard();showRoomCreated(ex)}
function showRoomCreated(ex){const m=document.getElementById('questionModal');m.classList.remove('hidden');m.innerHTML=`<div class="modal-box"><button class="modal-close" onclick="closeQuestionModal()">×</button><div class="eyebrow">ROOM CREATED</div><h2>${esc(ex.title)}</h2><div class="notice">Share these credentials with students. The room code is copyable; the password is intentionally display-only for the examiner.</div><div class="section-card" style="margin:0 0 14px"><div class="exam-meta">ROOM CODE</div><div style="font:800 28px 'Plus Jakarta Sans';margin:7px 0">${esc(ex.roomCode)}</div><button class="btn btn-primary" onclick="copyRoomCode('${ex.roomCode}')">Copy Room Code</button><div class="security-note">Password cannot be copied from this screen.</div></div><div class="section-card" style="margin:0"><div class="exam-meta">ROOM PASSWORD</div><div style="font:800 28px monospace;margin:7px 0;letter-spacing:.08em">${esc(ex.roomPassword)}</div><div class="security-note">Keep this password private. You can view it again from the room card.</div></div><button class="btn btn-secondary full" style="margin-top:14px" onclick="closeQuestionModal();showView('dashboard')">Continue to Dashboard</button></div>`}
function copyRoomCode(v){navigator.clipboard?.writeText(v);logEvent(`Copied room code ${v}`);const btn=event?.currentTarget;if(btn){btn.textContent='Copied ✓';setTimeout(()=>btn.textContent='Copy Room Code',1200)}}
function renderExaminerDashboard(){const db=getDB();db.exams.forEach(x=>x.status=formatStatus(x));saveDB(db);document.getElementById('activeCount').textContent=db.exams.filter(x=>x.status==='active').length;document.getElementById('upcomingCount').textContent=db.exams.filter(x=>x.status==='upcoming').length;document.getElementById('completedCount').textContent=db.exams.filter(x=>x.status==='completed').length;document.getElementById('studentCount').textContent=new Set(db.attempts.map(a=>a.studentEmail)).size;const box=document.getElementById('examList');if(!db.exams.length){box.innerHTML='<div class="empty">No examinations yet. Create your first exam room.</div>';return}box.innerHTML=db.exams.map(ex=>`<div class="exam-row"><div><b>${esc(ex.title)}</b><div class="exam-meta">${esc(ex.subject)} • ${esc(ex.date)} ${esc(ex.startTime)} • Room ${esc(ex.roomCode)}</div></div><span class="badge ${ex.status}">${ex.status}</span><div class="room-secret"><span class="exam-meta">Password</span><span class="secret-value">${esc(ex.roomPassword)}</span></div><span>${ex.questionIds.length} questions</span><div class="room-actions"><button class="text-btn" onclick="copyRoomCode('${ex.roomCode}')">Copy code</button><button class="text-btn" onclick="viewRoom('${ex.id}')">View</button></div></div>`).join('')}
function viewRoom(id){const db=getDB(),ex=db.exams.find(x=>x.id===id);if(!ex)return;const attempts=db.attempts.filter(a=>a.examId===id);const qCount=ex.questionIds.length;const m=document.getElementById('questionModal');m.classList.remove('hidden');m.innerHTML=`<div class="modal-box"><button class="modal-close" onclick="closeQuestionModal()">×</button><div class="eyebrow">EXAMINATION ROOM</div><h2>${esc(ex.title)}</h2><div class="section-card"><div class="exam-meta">ROOM CODE</div><strong style="font:800 26px monospace">${esc(ex.roomCode)}</strong><br><button class="btn btn-primary" style="margin-top:10px" onclick="copyRoomCode('${ex.roomCode}')">Copy Room Code</button></div><div class="section-card"><div class="exam-meta">ROOM PASSWORD</div><strong style="font:800 26px monospace">${esc(ex.roomPassword)}</strong><div class="security-note">Display only — password copy is disabled.</div></div><div class="notice"><b>${attempts.length}</b> student attempt(s) • <b>${qCount}</b> question(s) • ${esc(ex.duration)} minutes</div><button class="btn btn-secondary full" onclick="closeQuestionModal()">Close</button></div>`}
function openQuestionModal(){const db=getDB();document.getElementById('questionModal').classList.remove('hidden');document.getElementById('questionModal').innerHTML=`<div class="modal-box"><button class="modal-close" onclick="closeQuestionModal()">×</button><h2>Add question</h2><form id="questionForm"><label>Question type<select id="qType"><option value="mcq">MCQ</option><option value="truefalse">True / False</option><option value="short">Short Answer</option><option value="long">Long Answer</option><option value="numerical">Numerical</option></select></label><label>Add to examination<select id="qExam">${db.exams.length?db.exams.map(e=>`<option value="${e.id}">${esc(e.title)} — Room ${esc(e.roomCode)}</option>`).join(''):'<option value="">Create an examination first</option>'}</select></label><label>Question<textarea id="qText" rows="3" required placeholder="Enter the question..."></textarea></label><div id="qOptions" class="form-grid"></div><label id="correctWrap"><span class="field-title">Correct answer</span><input id="correct"></label><div class="form-grid"><label>Marks<input id="qMarks" type="number" min="0" value="1"></label><label>Negative marks<input id="qNegative" type="number" min="0" step="0.01" value="0"></label></div><button class="btn btn-primary full" ${db.exams.length?'':'disabled'}>Save Question</button></form></div>`;document.getElementById('qType').addEventListener('change',updateQuestionFields);document.getElementById('questionForm').addEventListener('submit',saveQuestion);updateQuestionFields()}
function closeQuestionModal(){document.getElementById('questionModal').classList.add('hidden');document.getElementById('questionModal').innerHTML=''}
function updateQuestionFields(){
  const type=document.getElementById('qType')?.value;
  if(!type)return;
  const opt=document.getElementById('qOptions'),wrap=document.getElementById('correctWrap');
  if(!opt||!wrap)return;
  if(type==='mcq'){
    opt.innerHTML=['A','B','C','D'].map(x=>`<label>Option ${x}<input id="${x.toLowerCase()}" required></label>`).join('');
    wrap.innerHTML='<span class="field-title">Correct answer</span><input id="correct" required placeholder="For MCQ use A, B, C or D">';
  }else if(type==='truefalse'){
    opt.innerHTML='<div class="notice type-help" style="grid-column:1/-1"><b>True / False question</b><br>Students will see only True and False. No A/B/C/D options are needed.</div>';
    wrap.innerHTML='<span class="field-title">Correct answer</span><select id="correct" required><option value="True">True</option><option value="False">False</option></select>';
  }else if(type==='numerical'){
    opt.innerHTML='<div class="notice type-help" style="grid-column:1/-1"><b>Numerical question</b><br>Students will enter a number. The system compares the answer with the expected value.</div>';
    wrap.innerHTML='<span class="field-title">Expected numerical answer</span><input id="correct" type="number" step="any" required placeholder="Example: 9.81">';
  }else{
    opt.innerHTML=`<div class="notice type-help" style="grid-column:1/-1"><b>${type==='short'?'Short Answer':'Long Answer'}</b><br>The student writes their own response. The teacher will check the answer manually and award marks.</div>`;
    wrap.innerHTML=`<span class="field-title">${type==='short'?'Reference answer / marking guidance':'Reference answer / marking rubric'}</span><textarea id="correct" rows="3" placeholder="${type==='short'?'Optional reference answer or key points':'Optional marking rubric or key points'}"></textarea>`;
  }
}

function saveQuestion(e){e.preventDefault();const db=getDB(),type=document.getElementById('qType').value,examId=document.getElementById('qExam')?.value;if(!examId){alert('Create an examination room first.');return}const q={id:uid('q'),type,text:document.getElementById('qText').value.trim(),marks:+document.getElementById('qMarks').value,negativeMarks:+document.getElementById('qNegative').value,correct:document.getElementById('correct').value.trim(),options:type==='mcq'?{A:document.getElementById('a').value,B:document.getElementById('b').value,C:document.getElementById('c').value,D:document.getElementById('d').value}:null,manual:['short','long'].includes(type)};db.questions.unshift(q);const ex=db.exams.find(x=>x.id===examId);if(ex&&!ex.questionIds.includes(q.id))ex.questionIds.push(q.id);saveDB(db);logEvent(`Added ${type.toUpperCase()} question to “${ex?.title||'exam'}”`);closeQuestionModal();renderQuestionBank()}
function renderQuestionBank(){const db=getDB(),box=document.getElementById('questionBank');if(!db.questions.length){box.innerHTML='<div class="empty">No questions yet. Add MCQ, True/False, Short Answer, Long Answer or Numerical questions.</div>';return}box.innerHTML=`<div class="question-list">${db.questions.map(q=>`<div class="question-item"><div><div class="q-title">${esc(q.text)}</div><div class="q-meta">${q.type.toUpperCase()} • ${q.marks} mark(s) • ${q.manual?'Manual teacher checking':'Automatic marking'}</div></div><span class="badge ${q.manual?'review':'published'}">${q.manual?'Manual':'Auto'}</span></div>`).join('')}</div>`}
function renderResults(){const db=getDB(),box=document.getElementById('resultsTable');if(!db.attempts.length){box.innerHTML='<div class="empty">No student submissions yet. Submitted answer copies will appear here for teacher checking.</div>';return}box.innerHTML=`<div class="result-row" style="font-weight:800;color:#667085"><span>Student</span><span>Exam</span><span>Score</span><span>Status</span><span>Action</span></div>${db.attempts.map(a=>{const ex=db.exams.find(e=>e.id===a.examId);const pending=a.gradingStatus==='pending';return `<div class="result-row"><div><b>${esc(a.studentName)}</b><div class="exam-meta">${esc(a.studentEmail)}</div></div><span>${esc(ex?.title||'—')}</span><span><b>${a.score ?? '—'}</b> / ${a.total}</span><span class="badge ${pending?'review':'published'}">${pending?'Needs checking':'Checked'}</span><button class="text-btn" onclick="openGrading('${a.id}')">${pending?'Check answers':'Review'}</button></div>`}).join('')}`}
function openGrading(attemptId){const db=getDB(),a=db.attempts.find(x=>x.id===attemptId),ex=db.exams.find(x=>x.id===a.examId);if(!a||!ex)return;showView('results');const box=document.getElementById('resultsTable');const manualCount=a.answers.filter(x=>{const q=db.questions.find(q=>q.id===x.questionId);return q?.manual}).length;box.innerHTML=`<div class="grading-shell"><div class="student-attempts"><div class="section-title"><h2>Student submissions</h2></div>${db.attempts.map(x=>`<div class="attempt-card ${x.id===attemptId?'selected':''}" onclick="openGrading('${x.id}')"><b>${esc(x.studentName)}</b><span>${esc(db.exams.find(e=>e.id===x.examId)?.title||'')}</span><span>${x.gradingStatus==='pending'?'Needs checking':'Checked'}</span></div>`).join('')}</div><div class="grading-card"><div class="grading-head"><div><div class="eyebrow">ANSWER COPY</div><h2>${esc(a.studentName)} — ${esc(ex.title)}</h2><div class="exam-meta">Submitted ${esc(a.submittedAt)} • ${manualCount} subjective question(s)</div></div><span class="badge ${a.gradingStatus==='pending'?'review':'published'}">${a.gradingStatus==='pending'?'Manual review required':'Checked'}</span></div><div id="gradingQuestions">${a.answers.map((ans,i)=>renderAnswerReview(ans,i,a,db)).join('')}</div><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px"><button class="btn btn-secondary" onclick="renderResults()">Back to results</button><button class="btn btn-primary" onclick="saveGrading('${a.id}')">Save Checked Result</button></div></div></div>`}
function renderAnswerReview(ans,i,a,db){const q=db.questions.find(x=>x.id===ans.questionId);if(!q)return '';const auto=!q.manual;const status=auto?(ans.isCorrect?'Correct':'Incorrect'):(ans.reviewed?'Checked':'Teacher checking required');return `<div class="answer-review ${auto?'auto':'manual'}" data-qid="${q.id}"><div style="display:flex;justify-content:space-between;gap:10px"><div><span class="review-label">Question ${i+1} • ${q.type.toUpperCase()} • ${q.marks} mark${q.marks==1?'':'s'}</span><h3 style="margin:6px 0">${esc(q.text)}</h3></div><span class="badge ${auto?'published':'review'}">${status}</span></div><div class="student-answer"><b>Student answer:</b><br>${esc(ans.value||'No answer')}</div>${auto?`<div class="grading-summary"><span>Given marks: <b>${q.marks}</b></span><span>Expected answer: <b>${esc(q.correct)}</b></span><span>Auto score: <b>${ans.awarded}</b> / ${q.marks}</span></div>`:`<div class="grading-summary"><span>Given marks: <b>${q.marks}</b></span><span>Reference answer / rubric: <b>${esc(q.correct||'Teacher judgement')}</b></span></div><div class="grading-fields" style="margin-top:12px"><label>Marks awarded<input class="manual-mark" data-qid="${q.id}" type="number" min="0" max="${q.marks}" step="0.01" value="${ans.awarded??0}"></label><label>Teacher feedback<textarea class="manual-feedback" data-qid="${q.id}" rows="2" placeholder="Optional feedback">${esc(ans.feedback||'')}</textarea></label></div>`}</div>`}
function saveGrading(attemptId){const db=getDB(),a=db.attempts.find(x=>x.id===attemptId);if(!a)return;document.querySelectorAll('.manual-mark').forEach(input=>{const ans=a.answers.find(x=>x.questionId===input.dataset.qid);if(ans){ans.awarded=Math.max(0,Math.min(Number(input.max),Number(input.value)||0));ans.reviewed=true;const fb=document.querySelector(`.manual-feedback[data-qid="${input.dataset.qid}"]`);ans.feedback=fb?.value||''}});a.score=a.answers.reduce((s,x)=>s+(Number(x.awarded)||0),0);a.gradingStatus='checked';a.checkedAt=new Date().toLocaleString();saveDB(db);logEvent(`Checked result for ${a.studentName}`);renderResults()}
function renderAudit(){const db=getDB(),box=document.getElementById('auditList');box.innerHTML=db.logs.length?db.logs.map(x=>`<div class="audit-row"><b>${esc(x.text)}</b><span class="exam-meta">${esc(x.time)}</span></div>`).join(''):'<div class="empty">No activity recorded.</div>'}
function initStudent(){setupNav();document.getElementById('joinForm').addEventListener('submit',joinExam);renderStudentDashboard();if(location.hash)showView(location.hash.slice(1))}
function renderStudentDashboard(){const db=getDB(),box=document.getElementById('studentExamList'),up=db.exams.filter(e=>formatStatus(e)!=='completed');box.innerHTML=up.length?up.map(e=>`<div class="exam-row"><div><b>${esc(e.title)}</b><div class="exam-meta">${esc(e.subject)} • ${esc(e.date)} ${esc(e.startTime)}</div></div><span class="badge ${formatStatus(e)}">${formatStatus(e)}</span><span>${e.duration} min</span><span>${e.questionIds.length} questions</span><button class="text-btn" onclick="document.getElementById('roomCode').value='${e.roomCode}';showView('join')">Join</button></div>`).join(''):'<div class="empty">No available examinations. Ask your examiner for the room code and password.</div>';const r=document.getElementById('studentResults');const attempts=db.attempts.filter(a=>a.studentEmail==='student@example.com');r.innerHTML=attempts.length?attempts.map(a=>`<div class="exam-row"><div><b>${esc(db.exams.find(e=>e.id===a.examId)?.title||'Exam')}</b><div class="exam-meta">${esc(a.submittedAt)}</div></div><span>${a.score}/${a.total}</span><span class="badge ${a.gradingStatus==='checked'?'published':'review'}">${a.gradingStatus==='checked'?'Checked':'Under review'}</span></div>`).join(''):'<div class="empty">No results yet.</div>'}
function joinExam(e){e.preventDefault();const db=getDB(),ex=db.exams.find(x=>x.roomCode.toUpperCase()===document.getElementById('roomCode').value.trim().toUpperCase());const msg=document.getElementById('joinMessage');if(!ex||ex.roomPassword!==document.getElementById('roomPassword').value.trim()){msg.innerHTML='<div class="notice" style="background:#fff0f1;color:#a73542">Room code or password is incorrect.</div>';return}if(!ex.questionIds.length){msg.innerHTML='<div class="notice">This room has no questions yet. Ask your examiner to add questions.</div>';return}sessionStorage.setItem('examora_current_exam',ex.id);sessionStorage.setItem('examora_student','Demo Student');location.href='exam.html'}
function initLiveExam(){
  restoreTheme();
  const id=sessionStorage.getItem('examora_current_exam');
  const db=getDB();
  const ex=db.exams.find(e=>e.id===id);
  if(!ex){location.href='student.html';return}
  const questions=ex.questionIds.map(qid=>db.questions.find(q=>q.id===qid)).filter(Boolean);
  if(!questions.length){location.href='student.html';return}
  let idx=0;
  let answers=JSON.parse(sessionStorage.getItem('examora_answers')||'{}');
  let reviews=JSON.parse(sessionStorage.getItem('examora_reviews')||'{}');
  document.getElementById('liveExamTitle').textContent=ex.title;
  const start=Date.now();
  const end=start+ex.duration*60000;
  function saveProgress(){
    sessionStorage.setItem('examora_answers',JSON.stringify(answers));
    document.getElementById('saveState').textContent='Saved ✓';
  }
  function render(){
    const q=questions[idx];
    document.getElementById('questionNumber').textContent=`Question ${idx+1}`;
    document.getElementById('questionMarks').textContent=`${q.marks} mark${q.marks==1?'':'s'}`;
    document.getElementById('questionText').textContent=q.text;
    document.getElementById('progressText').textContent=`${idx+1} / ${questions.length}`;
    const val=answers[q.id]??'';
    let html='';
    if(q.type==='mcq'){
      html=`<div class="answer-options">${['A','B','C','D'].map(k=>`<label class="answer-option ${val===k?'selected':''}"><input type="radio" name="ans" value="${k}" ${val===k?'checked':''}> <b>${k}.</b> ${esc(q.options[k])}</label>`).join('')}</div>`;
    }else if(q.type==='truefalse'){
      html=`<div class="answer-options">${['True','False'].map(v=>`<label class="answer-option ${val===v?'selected':''}"><input type="radio" name="ans" value="${v}" ${val===v?'checked':''}> ${v}</label>`).join('')}</div>`;
    }else if(q.type==='numerical'){
      html=`<input id="textAnswer" type="number" step="any" placeholder="Enter your numerical answer..." value="${esc(val)}">`;
    }else{
      html=`<textarea id="textAnswer" rows="8" placeholder="Write your answer here...">${esc(val)}</textarea>`;
    }
    document.getElementById('answerArea').innerHTML=html;
    document.querySelectorAll('input[name=ans]').forEach(r=>r.addEventListener('change',()=>{answers[q.id]=r.value;saveProgress();render();}));
    document.getElementById('textAnswer')?.addEventListener('input',e=>{answers[q.id]=e.target.value;saveProgress()});
    document.getElementById('answeredCount').textContent=Object.values(answers).filter(v=>String(v).trim()).length;const rb=document.getElementById('reviewButton');if(rb){const marked=!!reviews[q.id];rb.classList.toggle('active',marked);rb.textContent=marked?'★ Marked for review':'☆ Mark for review';}
    document.getElementById('questionNavGrid').innerHTML=questions.map((qq,i)=>`<button class="${answers[qq.id]?'answered':''} ${reviews[qq.id]?'review':''}" onclick="window.examGo(${i})">${i+1}</button>`).join('');
  }
  window.examGo=i=>{saveProgress();idx=i;render()};
  window.previousQuestion=()=>{saveProgress();if(idx>0){idx--;render()}};
  window.nextQuestion=()=>{saveProgress();if(idx<questions.length-1){idx++;render()}};
  window.toggleReview=()=>{reviews[questions[idx].id]=!reviews[questions[idx].id];sessionStorage.setItem('examora_reviews',JSON.stringify(reviews));render()};
  window.submitExam=()=>{
    if(!confirm('Submit your examination? You will not be able to change answers after submission.'))return;
    saveProgress();
    const attempt={
      id:uid('attempt'),examId:ex.id,studentName:'Demo Student',studentEmail:'student@example.com',
      submittedAt:new Date().toLocaleString(),total:questions.reduce((s,q)=>s+q.marks,0),score:0,gradingStatus:'checked',answers:[]
    };
    attempt.answers=questions.map(q=>{
      const v=answers[q.id]??'';
      let correct=false;
      let awarded=0;
      if(q.type==='mcq') correct=v.toUpperCase()===q.correct.toUpperCase();
      else if(q.type==='truefalse') correct=v.toLowerCase()===q.correct.toLowerCase();
      else if(q.type==='numerical') correct=v!=='' && Number.isFinite(Number(v)) && Math.abs(Number(v)-Number(q.correct))<0.01;
      if(correct) awarded=q.marks;
      else if(v && !q.manual && q.negativeMarks) awarded=-q.negativeMarks;
      return {questionId:q.id,value:v,isCorrect:correct,awarded,reviewed:!q.manual,feedback:''};
    });
    if(attempt.answers.some(x=>db.questions.find(q=>q.id===x.questionId)?.manual)) attempt.gradingStatus='pending';
    attempt.score=attempt.answers.reduce((s,x)=>s+Number(x.awarded||0),0);
    db.attempts.push(attempt);
    saveDB(db);
    logEvent(`Student submitted “${ex.title}”`);
    sessionStorage.removeItem('examora_answers');
    sessionStorage.removeItem('examora_reviews');
    sessionStorage.setItem('examora_last_attempt',attempt.id);
    location.href='result.html';
  };
  function tick(){
    const left=Math.max(0,end-Date.now());
    const mins=Math.floor(left/60000),secs=Math.floor(left/1000)%60;
    document.getElementById('timer').textContent=`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    if(left<=0){window.submitExam()}else setTimeout(tick,1000);
  }
  render();
  tick();
}
function initResult(){const id=sessionStorage.getItem('examora_last_attempt'),db=getDB(),a=db.attempts.find(x=>x.id===id),ex=a&&db.exams.find(e=>e.id===a.examId);if(!a){location.href='student.html';return}document.getElementById('resultTitle').textContent=ex?.title||'Result';document.getElementById('resultScore').textContent=a.score;document.getElementById('resultTotal').textContent=a.total;document.getElementById('resultPercent').textContent=(a.total?(a.score/a.total*100).toFixed(1):0)+'%';document.getElementById('resultCorrect').textContent=a.answers.filter(x=>x.isCorrect).length;document.getElementById('resultStatus').textContent=a.gradingStatus==='checked'?'Checked':'Under review';document.getElementById('resultNote').textContent=a.gradingStatus==='pending'?'Your subjective answers have been sent to the examiner for manual checking. Your final result will update after checking.':'Your objective answers were evaluated automatically.'}
function renderStudentHistory(){const db=getDB(),attempts=db.attempts.filter(a=>a.studentEmail==='student@example.com'),box=document.getElementById('historyList');box.innerHTML=attempts.length?attempts.map(a=>`<div class="exam-row"><div><b>${esc(db.exams.find(e=>e.id===a.examId)?.title||'Exam')}</b><div class="exam-meta">${esc(a.submittedAt)}</div></div><span>${a.score}/${a.total}</span><span class="badge ${a.gradingStatus==='checked'?'published':'review'}">${a.gradingStatus==='checked'?'Checked':'Under review'}</span></div>`).join(''):'<div class="empty">No examination history.</div>'}
