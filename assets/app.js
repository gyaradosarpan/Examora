const DB_KEY = 'examora_db_v2';

/* =========================================================
   DATABASE
   ========================================================= */

function seedDB() {
  return {
    exams: [],
    questions: [],
    attempts: [],
    logs: [],
    user: {
      name: 'Examiner',
      email: 'examiner@example.com'
    }
  };
}

function getDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);

    if (!raw) {
      return seedDB();
    }

    const data = JSON.parse(raw);

    data.exams ||= [];
    data.questions ||= [];
    data.attempts ||= [];
    data.logs ||= [];

    data.user ||= {
      name: 'Examiner',
      email: 'examiner@example.com'
    };

    return data;

  } catch (error) {
    console.error('Database read error:', error);
    return seedDB();
  }
}

function saveDB(db) {
  localStorage.setItem(
    DB_KEY,
    JSON.stringify(db)
  );
}

function logEvent(text) {
  const db = getDB();

  db.logs.unshift({
    text,
    time: new Date().toLocaleString()
  });

  db.logs = db.logs.slice(0, 100);

  saveDB(db);
}


/* =========================================================
   SECURITY / HELPERS
   ========================================================= */

function esc(value) {
  return String(value ?? '').replace(
    /[&<>'"]/g,
    char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char])
  );
}

function uid(prefix = 'id') {
  return (
    prefix +
    '_' +
    Math.random()
      .toString(36)
      .slice(2, 9) +
    Date.now()
      .toString(36)
      .slice(-5)
  );
}

function code() {
  return Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase();
}

function password() {
  return String(
    Math.floor(
      100000 +
      Math.random() * 900000
    )
  );
}

function getElement(id) {
  return document.getElementById(id);
}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {
  document.body.classList.toggle('dark');

  localStorage.setItem(
    'examora_dark',
    document.body.classList.contains('dark')
  );
}

function restoreTheme() {
  if (
    localStorage.getItem('examora_dark') === 'true'
  ) {
    document.body.classList.add('dark');
  }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNav() {

  document
    .querySelectorAll('.nav-item')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {
          showView(button.dataset.view);
        }
      );

    });

  document
    .querySelectorAll(
      '.mobile-examiner-nav button'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {
          showView(button.dataset.view);
        }
      );

    });

  restoreTheme();
}

function showView(id) {

  if (!id) return;

  document
    .querySelectorAll('.view')
    .forEach(view => {
      view.classList.remove('active');
    });

  const element =
    document.getElementById(
      'view-' + id
    );

  if (element) {
    element.classList.add('active');
  }

  document
    .querySelectorAll('.nav-item')
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.view === id
      );

    });

  document
    .querySelectorAll(
      '.mobile-examiner-nav button'
    )
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.view === id
      );

    });

  if (
    window.location.hash !==
    '#' + id
  ) {
    history.replaceState(
      null,
      '',
      '#' + id
    );
  }

  renderCurrentView(id);
}

function renderCurrentView(id) {

  switch (id) {

    case 'dashboard':
      renderExaminerDashboard();
      break;

    case 'questions':
      renderQuestionBank();
      break;

    case 'results':
      renderResults();
      break;

    case 'audit':
      renderAudit();
      break;

    case 'student-dashboard':
      renderStudentDashboard();
      break;

    case 'history':
      renderStudentHistory();
      break;

    default:
      break;
  }
}


/* =========================================================
   EXAM STATUS
   ========================================================= */

/*
   IMPORTANT NEW SYSTEM

   An exam now has:

   status:
      waiting
      active
      completed

   startedAt:
      actual time when teacher starts exam

   scheduled date/startTime are still kept for
   displaying the planned schedule.

   TIMER IS BASED ON startedAt.
*/

function getExamStartTime(exam) {

  if (!exam) {
    return NaN;
  }

  /*
   * Once teacher starts the exam,
   * startedAt becomes the real start time.
   */
  if (exam.startedAt) {

    const realStart =
      new Date(
        exam.startedAt
      ).getTime();

    if (
      Number.isFinite(realStart)
    ) {
      return realStart;
    }
  }

  /*
   * Before teacher starts the exam,
   * do NOT treat scheduled start as live.
   */
  return NaN;
}

function getScheduledStartTime(exam) {

  if (
    !exam ||
    !exam.date ||
    !exam.startTime
  ) {
    return NaN;
  }

  return new Date(
    `${exam.date}T${exam.startTime}`
  ).getTime();
}

function getExamEndTime(exam) {

  const start =
    getExamStartTime(exam);

  if (Number.isNaN(start)) {
    return NaN;
  }

  return (
    start +
    (Number(exam.duration) || 0) *
      60000
  );
}

function isExamStarted(exam) {
  return !!(
    exam &&
    exam.startedAt
  );
}

function isExamCompleted(exam) {

  if (!exam) {
    return false;
  }

  if (!exam.startedAt) {
    return false;
  }

  const end =
    getExamEndTime(exam);

  if (Number.isNaN(end)) {
    return false;
  }

  return Date.now() >= end;
}

function formatStatus(exam) {

  if (!exam) {
    return 'upcoming';
  }

  /*
   * No startedAt means teacher has not
   * started the examination yet.
   */
  if (!exam.startedAt) {

    if (
      exam.questionIds &&
      exam.questionIds.length > 0
    ) {
      return 'ready';
    }

    return 'waiting';
  }

  if (isExamCompleted(exam)) {
    return 'completed';
  }

  return 'active';
}


/* =========================================================
   EXAM STATUS LABEL
   ========================================================= */

function statusLabel(status) {

  const labels = {
    waiting: 'Waiting for questions',
    ready: 'Ready to start',
    active: 'Live',
    completed: 'Completed',
    upcoming: 'Upcoming'
  };

  return labels[status] || status;
}


/* =========================================================
   EXAMINER INITIALIZATION
   ========================================================= */

function initExaminer() {

  setupNav();

  const db = getDB();

  const examinerName =
    getElement('examinerName');

  if (examinerName) {
    examinerName.textContent =
      db.user.name;
  }

  setupNegativeMarking();

  const examForm =
    getElement('examForm');

  if (examForm) {

    examForm.onsubmit = createExam;

  }

  renderExaminerDashboard();

  if (location.hash) {

    const hash =
      location.hash.slice(1);

    if (
      document.getElementById(
        'view-' + hash
      )
    ) {
      showView(hash);
    }

  }
}


/* =========================================================
   NEGATIVE MARKING
   ========================================================= */

function setupNegativeMarking() {

  const negative =
    getElement('negative');

  const negativeMarks =
    getElement('negativeMarks');

  if (!negative) {
    return;
  }

  function updateNegativeState() {

    if (!negativeMarks) {
      return;
    }

    negativeMarks.disabled =
      !negative.checked;

    /*
     * Keep the input visually/state-wise
     * synchronized.
     */
    if (!negative.checked) {

      negativeMarks.value =
        negativeMarks.value || '0';

    }

  }

  /*
   * Avoid duplicate listeners if this function
   * is called again.
   */
  if (
    negative.dataset.listenerAttached !==
    'true'
  ) {

    negative.addEventListener(
      'change',
      updateNegativeState
    );

    negative.dataset.listenerAttached =
      'true';
  }

  updateNegativeState();
}


/* =========================================================
   CREATE EXAM
   ========================================================= */

function createExam(e) {

  e.preventDefault();

  const db = getDB();

  const title =
    getElement('title')?.value.trim();

  const subject =
    getElement('subject')?.value.trim();

  const date =
    getElement('date')?.value;

  const startTime =
    getElement('startTime')?.value;

  const duration =
    Number(
      getElement('duration')?.value
    );

  const passing =
    Number(
      getElement('passing')?.value
    );

  const maxStudentsValue =
    getElement('maxStudents')?.value;

  const department =
    getElement('department')?.value.trim();

  const instructions =
    getElement('instructions')?.value.trim();

  const negativeEnabled =
    getElement('negative')?.checked === true;

  const negativeMarksInput =
    Number(
      getElement('negativeMarks')?.value
    );

  if (
    !title ||
    !subject ||
    !date ||
    !startTime ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {

    showExamoraToast(
      'Please fill all required examination fields.',
      'warning',
      'Missing Information'
    );

    return;
  }

  const ex = {

    id: uid('exam'),

    title,

    subject,

    date,

    startTime,

    duration,

    passing:
      Number.isFinite(passing)
        ? passing
        : 0,

    maxStudents:
      maxStudentsValue
        ? Number(maxStudentsValue)
        : null,

    department,

    instructions,

    negative:
      negativeEnabled,

    negativeMarks:
      negativeEnabled &&
      Number.isFinite(
        negativeMarksInput
      )
        ? Math.max(
            0,
            negativeMarksInput
          )
        : 0,

    roomCode:
      code(),

    roomPassword:
      password(),

    questionIds: [],

    /*
     * NEW:
     * Exam is NOT started when created.
     */
    startedAt: null,

    /*
     * Helps make the state explicit.
     */
    status: 'waiting',

    created:
      new Date().toISOString()

  };

  db.exams.unshift(ex);

  saveDB(db);

  logEvent(
    `Created examination "${ex.title}" with room ${ex.roomCode}`
  );

  const form =
    getElement('examForm');

  if (form) {
    form.reset();
  }

  /*
   * Reset negative marking safely.
   */
  const negative =
    getElement('negative');

  const negativeMarks =
    getElement('negativeMarks');

  if (negative) {
    negative.checked = false;
  }

  if (negativeMarks) {
    negativeMarks.disabled = true;
    negativeMarks.value = '0';
  }

  renderExaminerDashboard();

  showRoomCreated(ex);
}


/* =========================================================
   ROOM CREATED MODAL
   ========================================================= */

function showRoomCreated(ex) {

  const modal =
    getElement('questionModal');

  if (!modal) return;

  modal.classList.remove('hidden');

  modal.innerHTML = `

    <div class="modal-box">

      <button
        class="modal-close"
        type="button"
        onclick="closeQuestionModal()"
      >
        ×
      </button>

      <div class="eyebrow">
        ROOM CREATED
      </div>

      <h2>
        ${esc(ex.title)}
      </h2>

      <div class="notice">

        Room created successfully.

        <br><br>

        <b>
          The examination timer has NOT started.
        </b>

        Add all questions first, then use
        <b>Start Exam</b> from the dashboard.

      </div>

      <div class="section-card">

        <div class="exam-meta">
          ROOM CODE
        </div>

        <div class="room-credential-value">
          ${esc(ex.roomCode)}
        </div>

        <button
          type="button"
          class="btn btn-primary"
          onclick="copyRoomCode('${esc(ex.roomCode)}', this)"
        >
          Copy Room Code
        </button>

      </div>

      <div class="section-card">

        <div class="exam-meta">
          ROOM PASSWORD
        </div>

        <div class="room-credential-value password-display">
          ${esc(ex.roomPassword)}
        </div>

        <div class="security-note">
          Keep this password private.
        </div>

      </div>

      <div class="section-card">

        <div class="exam-meta">
          QUESTIONS
        </div>

        <div class="room-credential-value">
          0
        </div>

        <div class="security-note">
          Add questions before starting the exam.
        </div>

      </div>

      <button
        type="button"
        class="btn btn-secondary full"
        style="margin-top:14px"
        onclick="
          closeQuestionModal();
          showView('questions');
        "
      >
        Add Questions
      </button>

    </div>

  `;
}


/* =========================================================
   COPY ROOM CODE
   ========================================================= */

function copyRoomCode(
  value,
  button = null
) {

  const copySuccess = () => {

    logEvent(
      `Copied room code ${value}`
    );

    if (button) {

      const oldText =
        button.textContent;

      button.textContent =
        'Copied ✓';

      setTimeout(() => {

        button.textContent =
          oldText;

      }, 1200);

    }

  };

  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {

    navigator.clipboard
      .writeText(value)
      .then(copySuccess)
      .catch(() => {

        fallbackCopy(value);
        copySuccess();

      });

  } else {

    fallbackCopy(value);
    copySuccess();

  }
}

function fallbackCopy(text) {

  const textarea =
    document.createElement('textarea');

  textarea.value = text;

  textarea.style.position =
    'fixed';

  textarea.style.opacity =
    '0';

  document.body.appendChild(
    textarea
  );

  textarea.select();

  try {
    document.execCommand('copy');
  } catch (error) {
    console.error(
      'Copy failed:',
      error
    );
  }

  textarea.remove();
}


/* =========================================================
   START EXAM
   ========================================================= */

/*
   THIS IS THE MOST IMPORTANT NEW FUNCTION.

   Teacher creates room
          ↓
   Adds questions
          ↓
   Clicks Start Exam
          ↓
   startedAt is saved
          ↓
   Timer starts
*/

/* =========================================================
   EXAMINER DASHBOARD
   ========================================================= */

function renderExaminerDashboard() {

  const db = getDB();

  /*
   * Automatically mark exams completed
   * when their real timer has expired.
   */
  db.exams.forEach(exam => {

    if (
      exam.startedAt &&
      isExamCompleted(exam) &&
      exam.status !== 'completed'
    ) {

      exam.status =
        'completed';

    }

  });

  saveDB(db);

  const active =
    db.exams.filter(
      x =>
        formatStatus(x) ===
        'active'
    ).length;

  const upcoming =
    db.exams.filter(
      x => {

        const status =
          formatStatus(x);

        return (
          status === 'waiting' ||
          status === 'ready'
        );

      }
    ).length;

  const completed =
    db.exams.filter(
      x =>
        formatStatus(x) ===
        'completed'
    ).length;

  const students =
    new Set(
      db.attempts.map(
        a => a.studentEmail
      )
    ).size;

  const activeCount =
    getElement('activeCount');

  if (activeCount) {
    activeCount.textContent =
      active;
  }

  const upcomingCount =
    getElement('upcomingCount');

  if (upcomingCount) {
    upcomingCount.textContent =
      upcoming;
  }

  const completedCount =
    getElement('completedCount');

  if (completedCount) {
    completedCount.textContent =
      completed;
  }

  const studentCount =
    getElement('studentCount');

  if (studentCount) {
    studentCount.textContent =
      students;
  }

  const box =
    getElement('examList');

  if (!box) return;

  if (!db.exams.length) {

    box.innerHTML = `
      <div class="empty">
        No examinations yet.
        Create your first exam room.
      </div>
    `;

    return;
  }

  box.innerHTML =
    db.exams
      .map(ex => {

        const status =
          formatStatus(ex);

        const qCount =
          ex.questionIds?.length || 0;

        let action = '';

        if (
          status === 'waiting' ||
          status === 'ready'
        ) {

          action = `

            <button
              type="button"
              class="text-btn"
              onclick="showView('questions')"
            >
              Add Questions
            </button>

            ${
              qCount > 0
                ? `
                  <button
                    type="button"
                    class="btn btn-primary"
                    onclick="startExam('${ex.id}')"
                  >
                    Start Exam
                  </button>
                `
                : ''
            }

          `;

        }

        else if (
          status === 'active'
        ) {

          const end =
            getExamEndTime(ex);

          const remaining =
            Math.max(
              0,
              end - Date.now()
            );

          action = `

            <span class="exam-meta">
              Time remaining:
              ${formatRemainingTime(remaining)}
            </span>

          `;

        }

        else {

          action = `
            <span class="exam-meta">
              Exam ended
            </span>
          `;

        }

        return `

          <div class="exam-row">

            <div>

              <b>
                ${esc(ex.title)}
              </b>

              <div class="exam-meta">

                ${esc(ex.subject)}
                •
                ${esc(ex.date)}
                •
                ${esc(ex.startTime)}

                <br>

                Room:
                <b>
                  ${esc(ex.roomCode)}
                </b>

              </div>

            </div>

            <span
              class="badge ${status}"
            >
              ${statusLabel(status)}
            </span>

            <div class="room-secret">

              <span class="exam-meta">
                Password
              </span>

              <span class="secret-value">
                ${esc(ex.roomPassword)}
              </span>

            </div>

            <span>
              ${qCount}
              question${qCount === 1 ? '' : 's'}
            </span>

            <div class="room-actions">

              <button
                type="button"
                class="text-btn"
                onclick="copyRoomCode('${esc(ex.roomCode)}', this)"
              >
                Copy code
              </button>

              <button
                type="button"
                class="text-btn"
                onclick="viewRoom('${ex.id}')"
              >
                View
              </button>

              ${action}

            </div>

          </div>

        `;

      })
      .join('');
}


/* =========================================================
   FORMAT REMAINING TIME
   ========================================================= */

function formatRemainingTime(milliseconds) {

  const totalSeconds =
    Math.max(
      0,
      Math.floor(
        milliseconds / 1000
      )
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const seconds =
    totalSeconds % 60;

  if (hours > 0) {

    return (
      `${String(hours).padStart(2, '0')}:` +
      `${String(minutes).padStart(2, '0')}:` +
      `${String(seconds).padStart(2, '0')}`
    );

  }

  return (
    `${String(minutes).padStart(2, '0')}:` +
    `${String(seconds).padStart(2, '0')}`
  );
}


/* =========================================================
   VIEW ROOM
   ========================================================= */

function viewRoom(id) {

  const db = getDB();

  const ex =
    db.exams.find(
      x => x.id === id
    );

  if (!ex) return;

  const attempts =
    db.attempts.filter(
      a => a.examId === id
    );

  const qCount =
    ex.questionIds?.length || 0;

  const status =
    formatStatus(ex);

  const modal =
    getElement('questionModal');

  if (!modal) return;

  modal.classList.remove('hidden');

  modal.innerHTML = `

    <div class="modal-box">

      <button
        class="modal-close"
        type="button"
        onclick="closeQuestionModal()"
      >
        ×
      </button>

      <div class="eyebrow">
        EXAMINATION ROOM
      </div>

      <h2>
        ${esc(ex.title)}
      </h2>

      <div class="section-card">

        <div class="exam-meta">
          STATUS
        </div>

        <span class="badge ${status}">
          ${statusLabel(status)}
        </span>

      </div>

      <div class="section-card">

        <div class="exam-meta">
          ROOM CODE
        </div>

        <strong class="room-credential-value">
          ${esc(ex.roomCode)}
        </strong>

        <br>

        <button
          type="button"
          class="btn btn-primary"
          style="margin-top:10px"
          onclick="copyRoomCode('${esc(ex.roomCode)}', this)"
        >
          Copy Room Code
        </button>

      </div>

      <div class="section-card">

        <div class="exam-meta">
          ROOM PASSWORD
        </div>

        <strong class="room-credential-value password-display">
          ${esc(ex.roomPassword)}
        </strong>

        <div class="security-note">
          Keep this password private.
        </div>

      </div>

      <div class="notice">

        <b>${attempts.length}</b>
        student attempt(s)

        •

        <b>${qCount}</b>
        question(s)

        •

        ${esc(ex.duration)}
        minutes

        <br><br>

        Exam status:
        <b>
          ${statusLabel(status)}
        </b>

        ${
          ex.startedAt
            ? `
              <br>
              Started:
              ${new Date(
                ex.startedAt
              ).toLocaleString()}
            `
            : ''
        }

      </div>

      ${
        status === 'ready'
          ? `
            <button
              type="button"
              class="btn btn-primary full"
              style="margin-top:14px"
              onclick="startExam('${ex.id}')"
            >
              Start Exam
            </button>
          `
          : ''
      }

      ${
        status === 'waiting'
          ? `
            <button
              type="button"
              class="btn btn-secondary full"
              style="margin-top:14px"
              onclick="
                closeQuestionModal();
                showView('questions');
              "
            >
              Add Questions
            </button>
          `
          : ''
      }

      <div
        style="
          display:flex;
          gap:10px;
          margin-top:14px
        "
      >

        <button
          type="button"
          class="btn btn-secondary"
          style="flex:1"
          onclick="closeQuestionModal()"
        >
          Close
        </button>

        <button
          type="button"
          class="btn btn-danger"
          style="flex:1"
          onclick="deleteExam('${ex.id}')"
        >
          Delete Exam
        </button>

      </div>

    </div>

  `;
}


/* =========================================================
   DELETE EXAM
   ========================================================= */

function deleteExam(id) {

  const db = getDB();

  const ex =
    db.exams.find(
      x => x.id === id
    );

  if (!ex) return;

  const attempts =
    db.attempts.filter(
      a => a.examId === id
    ).length;

  const questionCount =
    ex.questionIds?.length || 0;

  const message =
    `Delete the examination "${ex.title}"?\n\n` +
    `Room: ${ex.roomCode}\n` +
    `Questions: ${questionCount}\n` +
    `Student attempts: ${attempts}\n\n` +
    `This will permanently delete the exam room, its questions and submissions.`;

  if (!confirm(message)) {
    return;
  }

  const deletedQuestionIds =
    new Set(
      ex.questionIds || []
    );

  db.exams =
    db.exams.filter(
      e => e.id !== id
    );

  db.questions =
    db.questions.filter(
      q =>
        !deletedQuestionIds.has(
          q.id
        )
    );

  db.attempts =
    db.attempts.filter(
      a =>
        a.examId !== id
    );

  saveDB(db);

  logEvent(
    `Deleted examination "${ex.title}" and closed room ${ex.roomCode}`
  );

  closeQuestionModal();

  renderExaminerDashboard();

  alert(
    `Exam "${ex.title}" has been deleted successfully.`
  );
}


/* =========================================================
   QUESTION MODAL
   ========================================================= */

function openQuestionModal() {

  const db = getDB();

  const modal =
    getElement('questionModal');

  if (!modal) return;

  modal.classList.remove('hidden');

  modal.innerHTML = `

    <div class="modal-box">

      <button
        class="modal-close"
        type="button"
        onclick="closeQuestionModal()"
      >
        ×
      </button>

      <h2>
        Add Question
      </h2>

      <form id="questionForm">

        <label>

          Question Type

          <select id="qType">

            <option value="mcq">
              MCQ
            </option>

            <option value="truefalse">
              True / False
            </option>

            <option value="short">
              Short Answer
            </option>

            <option value="long">
              Long Answer
            </option>

            <option value="numerical">
              Numerical
            </option>

          </select>

        </label>

        <label>

          Add to Examination

          <select id="qExam">

            ${
              db.exams.length
                ? db.exams
                    .map(
                      ex => `

                        <option
                          value="${esc(ex.id)}"
                        >
                          ${esc(ex.title)}
                          —
                          Room
                          ${esc(ex.roomCode)}
                          ${
                            ex.startedAt
                              ? ' — LIVE'
                              : ''
                          }
                        </option>

                      `
                    )
                    .join('')

                : `
                  <option value="">
                    Create an examination first
                  </option>
                `
            }

          </select>

        </label>

        <label>

          Question

          <textarea
            id="qText"
            rows="3"
            required
            placeholder="Enter the question..."
          ></textarea>

        </label>

        <div
          id="qOptions"
          class="form-grid"
        ></div>

        <label id="correctWrap">

          <span class="field-title">
            Correct answer
          </span>

          <input id="correct">

        </label>

        <div class="form-grid">

          <label>

            Marks

            <input
              id="qMarks"
              type="number"
              min="0"
              step="0.01"
              value="1"
              required
            >

          </label>

          <label>

            Negative Marks

            <input
              id="qNegative"
              type="number"
              min="0"
              step="0.01"
              value="0"
            >

          </label>

        </div>

        <button
          type="submit"
          class="btn btn-primary full"
          ${
            db.exams.length
              ? ''
              : 'disabled'
          }
        >
          Save Question
        </button>

      </form>

    </div>

  `;

  const type =
    getElement('qType');

  if (type) {

    type.addEventListener(
      'change',
      updateQuestionFields
    );

  }

  const form =
    getElement('questionForm');

  if (form) {

    form.addEventListener(
      'submit',
      saveQuestion
    );

  }

  updateQuestionFields();
}

function closeQuestionModal() {

  const modal =
    getElement('questionModal');

  if (!modal) return;

  modal.classList.add('hidden');

  modal.innerHTML = '';
}


/* =========================================================
   QUESTION TYPE FIELDS
   ========================================================= */

function updateQuestionFields() {

  const type =
    getElement('qType')?.value;

  if (!type) return;

  const options =
    getElement('qOptions');

  const correctWrap =
    getElement('correctWrap');

  if (!options || !correctWrap) {
    return;
  }

  if (type === 'mcq') {

    options.innerHTML =
      ['A', 'B', 'C', 'D']
        .map(
          letter => `

            <label>

              Option ${letter}

              <input
                id="${letter.toLowerCase()}"
                required
              >

            </label>

          `
        )
        .join('');

    correctWrap.innerHTML = `

      <span class="field-title">
        Correct Answer
      </span>

      <select
        id="correct"
        required
      >

        <option value="">
          Select correct option
        </option>

        <option value="A">
          A
        </option>

        <option value="B">
          B
        </option>

        <option value="C">
          C
        </option>

        <option value="D">
          D
        </option>

      </select>

    `;

  }

  else if (
    type === 'truefalse'
  ) {

    options.innerHTML = `

      <div
        class="notice type-help"
        style="grid-column:1/-1"
      >

        <b>
          True / False Question
        </b>

        <br>

        Students will see only
        True and False.

      </div>

    `;

    correctWrap.innerHTML = `

      <span class="field-title">
        Correct Answer
      </span>

      <select
        id="correct"
        required
      >

        <option value="True">
          True
        </option>

        <option value="False">
          False
        </option>

      </select>

    `;

  }

  else if (
    type === 'numerical'
  ) {

    options.innerHTML = `

      <div
        class="notice type-help"
        style="grid-column:1/-1"
      >

        <b>
          Numerical Question
        </b>

        <br>

        Students will enter a number.
        The system compares it with
        the expected value.

      </div>

    `;

    correctWrap.innerHTML = `

      <span class="field-title">
        Expected Numerical Answer
      </span>

      <input
        id="correct"
        type="number"
        step="any"
        required
        placeholder="Example: 9.81"
      >

    `;

  }

  else {

    options.innerHTML = `

      <div
        class="notice type-help"
        style="grid-column:1/-1"
      >

        <b>
          ${
            type === 'short'
              ? 'Short Answer'
              : 'Long Answer'
          }
        </b>

        <br>

        The student writes their own
        response.

        The teacher will check the
        answer manually.

      </div>

    `;

    correctWrap.innerHTML = `

      <span class="field-title">

        ${
          type === 'short'
            ? 'Reference answer / marking guidance'
            : 'Reference answer / marking rubric'
        }

      </span>

      <textarea
        id="correct"
        rows="3"
        placeholder="${
          type === 'short'
            ? 'Optional reference answer or key points'
            : 'Optional marking rubric or key points'
        }"
      ></textarea>

    `;

  }
}


/* =========================================================
   SAVE QUESTION
   ========================================================= */

function saveQuestion(e) {

  e.preventDefault();

  const db = getDB();

  const type =
    getElement('qType')?.value;

  const examId =
    getElement('qExam')?.value;

  if (!examId) {

    alert(
      'Create an examination room first.'
    );

    return;
  }

  const questionText =
    getElement('qText')
      ?.value
      .trim();

  if (!questionText) {

    alert(
      'Please enter the question.'
    );

    return;
  }

  const marks =
    Number(
      getElement('qMarks')?.value
    );

  const negativeMarks =
    Number(
      getElement('qNegative')?.value
    ) || 0;

  if (
    !Number.isFinite(marks) ||
    marks <= 0
  ) {

    alert(
      'Marks must be greater than 0.'
    );

    return;
  }

  if (
    !Number.isFinite(
      negativeMarks
    ) ||
    negativeMarks < 0
  ) {

    alert(
      'Negative marks cannot be negative.'
    );

    return;
  }

  const ex =
    db.exams.find(
      x => x.id === examId
    );

  if (!ex) {

    alert(
      'Selected examination was not found.'
    );

    return;
  }

  /*
   * IMPORTANT:
   * Do not allow changing questions after
   * the teacher has started the exam.
   */
  if (ex.startedAt) {

    alert(
      'This examination has already started. You cannot add more questions now.'
    );

    return;
  }

  const correctElement =
    getElement('correct');

  const correct =
    correctElement?.value
      ?.trim() || '';

  if (
    type === 'mcq' &&
    !correct
  ) {

    alert(
      'Please select the correct MCQ option.'
    );

    return;
  }

  if (
    type === 'truefalse' &&
    !correct
  ) {

    alert(
      'Please select True or False.'
    );

    return;
  }

  if (
    type === 'numerical' &&
    !correct
  ) {

    alert(
      'Please enter the expected numerical answer.'
    );

    return;
  }

  const q = {

    id: uid('q'),

    type,

    text: questionText,

    marks,

    negativeMarks,

    correct,

    options:
      type === 'mcq'
        ? {
            A:
              getElement('a')
                ?.value
                .trim() || '',

            B:
              getElement('b')
                ?.value
                .trim() || '',

            C:
              getElement('c')
                ?.value
                .trim() || '',

            D:
              getElement('d')
                ?.value
                .trim() || ''
          }
        : null,

    manual:
      ['short', 'long']
        .includes(type)

  };

  if (
    type === 'mcq' &&
    (
      !q.options.A ||
      !q.options.B ||
      !q.options.C ||
      !q.options.D
    )
  ) {

    alert(
      'Please fill all four MCQ options.'
    );

    return;
  }

  db.questions.unshift(q);

  ex.questionIds ||= [];

  ex.questionIds.push(
    q.id
  );

  /*
   * If questions now exist,
   * exam becomes READY.
   */
  ex.status =
    'ready';

  saveDB(db);

  logEvent(
    `Added ${type.toUpperCase()} question to "${ex.title}"`
  );

  closeQuestionModal();

  renderQuestionBank();

  renderExaminerDashboard();
}


/* =========================================================
   QUESTION BANK
   ========================================================= */

function renderQuestionBank() {

  const db = getDB();

  const box =
    getElement('questionBank');

  if (!box) return;

  if (!db.questions.length) {

    box.innerHTML = `
      <div class="empty">
        No questions yet.
        Add MCQ, True/False, Short Answer,
        Long Answer or Numerical questions.
      </div>
    `;

    return;
  }

  box.innerHTML = `

    <div class="question-list">

      ${db.questions
        .map(q => {

          const exam =
            db.exams.find(
              e =>
                e.questionIds?.includes(
                  q.id
                )
            );

          return `

            <div class="question-item">

              <div>

                <div class="q-title">
                  ${esc(q.text)}
                </div>

                <div class="q-meta">

                  ${esc(
                    q.type.toUpperCase()
                  )}

                  •

                  ${q.marks}
                  mark(s)

                  •

                  ${
                    q.negativeMarks > 0
                      ? `-${q.negativeMarks} negative`
                      : 'No negative marking'
                  }

                  •

                  ${
                    q.manual
                      ? 'Manual teacher checking'
                      : 'Automatic marking'
                  }

                  ${
                    exam
                      ? ` • ${esc(exam.title)}`
                      : ''
                  }

                </div>

              </div>

              <span
                class="badge ${
                  q.manual
                    ? 'review'
                    : 'published'
                }"
              >
                ${
                  q.manual
                    ? 'Manual'
                    : 'Auto'
                }
              </span>

            </div>

          `;

        })
        .join('')}

    </div>

  `;
}


/* =========================================================
   RESULTS
   ========================================================= */

function renderResults() {

  const db = getDB();

  const box =
    getElement('resultsTable');

  if (!box) return;

  if (!db.attempts.length) {

    box.innerHTML = `
      <div class="empty">
        No student submissions yet.
        Submitted answer copies will appear
        here for teacher checking.
      </div>
    `;

    return;
  }

  box.innerHTML = `

    <div
      class="result-row"
      style="
        font-weight:800;
        color:#667085
      "
    >

      <span>
        Student
      </span>

      <span>
        Exam
      </span>

      <span>
        Score
      </span>

      <span>
        Status
      </span>

      <span>
        Action
      </span>

    </div>

    ${db.attempts
      .map(a => {

        const ex =
          db.exams.find(
            e =>
              e.id ===
              a.examId
          );

        const pending =
          a.gradingStatus ===
          'pending';

        return `

          <div class="result-row">

            <div>

              <b>
                ${esc(a.studentName)}
              </b>

              <div class="exam-meta">
                ${esc(a.studentEmail)}
              </div>

            </div>

            <span>
              ${esc(
                ex?.title || '—'
              )}
            </span>

            <span>

              <b>
                ${
                  Number.isFinite(
                    Number(a.score)
                  )
                    ? a.score
                    : '—'
                }
              </b>

              /
              ${a.total}

            </span>

            <span
              class="badge ${
                pending
                  ? 'review'
                  : 'published'
              }"
            >

              ${
                pending
                  ? 'Needs checking'
                  : 'Checked'
              }

            </span>

            <button
              type="button"
              class="text-btn"
              onclick="openGrading('${a.id}')"
            >

              ${
                pending
                  ? 'Check answers'
                  : 'Review'
              }

            </button>

          </div>

        `;

      })
      .join('')}

  `;
}


/* =========================================================
   OPEN GRADING
   ========================================================= */

function openGrading(attemptId) {

  const db = getDB();

  const attempt =
    db.attempts.find(
      x => x.id === attemptId
    );

  if (!attempt) return;

  const exam =
    db.exams.find(
      x =>
        x.id ===
        attempt.examId
    );

  if (!exam) return;

  showView('results');

  const box =
    getElement('resultsTable');

  if (!box) return;

  const manualCount =
    attempt.answers.filter(
      answer => {

        const q =
          db.questions.find(
            question =>
              question.id ===
              answer.questionId
          );

        return q?.manual;

      }
    ).length;

  box.innerHTML = `

    <div class="grading-shell">

      <div class="student-attempts">

        <div class="section-title">
          <h2>
            Student submissions
          </h2>
        </div>

        ${db.attempts
          .map(x => {

            const xExam =
              db.exams.find(
                e =>
                  e.id ===
                  x.examId
              );

            return `

              <div
                class="
                  attempt-card
                  ${
                    x.id === attemptId
                      ? 'selected'
                      : ''
                  }
                "
                onclick="openGrading('${x.id}')"
              >

                <b>
                  ${esc(
                    x.studentName
                  )}
                </b>

                <span>
                  ${esc(
                    xExam?.title || ''
                  )}
                </span>

                <span>
                  ${
                    x.gradingStatus ===
                    'pending'
                      ? 'Needs checking'
                      : 'Checked'
                  }
                </span>

              </div>

            `;

          })
          .join('')}

      </div>

      <div class="grading-card">

        <div class="grading-head">

          <div>

            <div class="eyebrow">
              ANSWER COPY
            </div>

            <h2>
              ${esc(
                attempt.studentName
              )}
              —
              ${esc(exam.title)}
            </h2>

            <div class="exam-meta">

              Submitted
              ${esc(
                attempt.submittedAt
              )}

              •

              ${manualCount}
              subjective question(s)

            </div>

          </div>

          <span
            class="badge ${
              attempt.gradingStatus ===
              'pending'
                ? 'review'
                : 'published'
            }"
          >

            ${
              attempt.gradingStatus ===
              'pending'
                ? 'Manual review required'
                : 'Checked'
            }

          </span>

        </div>

        <div id="gradingQuestions">

          ${attempt.answers
            .map(
              (answer, index) =>
                renderAnswerReview(
                  answer,
                  index,
                  attempt,
                  db
                )
            )
            .join('')}

        </div>

        <div
          style="
            display:flex;
            justify-content:flex-end;
            gap:10px;
            margin-top:20px
          "
        >

          <button
            type="button"
            class="btn btn-secondary"
            onclick="renderResults()"
          >
            Back to results
          </button>

          <button
            type="button"
            class="btn btn-primary"
            onclick="saveGrading('${attempt.id}')"
          >
            Save Checked Result
          </button>

        </div>

      </div>

    </div>

  `;
}


/* =========================================================
   ANSWER REVIEW
   ========================================================= */

function renderAnswerReview(
  answer,
  index,
  attempt,
  db
) {

  const q =
    db.questions.find(
      x =>
        x.id ===
        answer.questionId
    );

  if (!q) return '';

  const automatic =
    !q.manual;

  let status;

  if (automatic) {

    status =
      answer.isCorrect
        ? 'Correct'
        : 'Incorrect';

  } else {

    status =
      answer.reviewed
        ? 'Checked'
        : 'Teacher checking required';

  }

  return `

    <div
      class="
        answer-review
        ${
          automatic
            ? 'auto'
            : 'manual'
        }
      "
      data-qid="${esc(q.id)}"
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:10px
        "
      >

        <div>

          <span class="review-label">

            Question
            ${index + 1}

            •

            ${esc(
              q.type.toUpperCase()
            )}

            •

            ${q.marks}
            mark${q.marks == 1 ? '' : 's'}

          </span>

          <h3 style="margin:6px 0">
            ${esc(q.text)}
          </h3>

        </div>

        <span
          class="badge ${
            automatic
              ? 'published'
              : 'review'
          }"
        >
          ${status}
        </span>

      </div>

      <div class="student-answer">

        <b>
          Student answer:
        </b>

        <br>

        ${esc(
          answer.value ||
          'No answer'
        )}

      </div>

      ${
        automatic

          ? `

            <div class="grading-summary">

              <span>
                Given marks:
                <b>
                  ${q.marks}
                </b>
              </span>

              <span>
                Expected answer:
                <b>
                  ${esc(q.correct)}
                </b>
              </span>

              <span>
                Auto score:
                <b>
                  ${answer.awarded}
                </b>
                /
                ${q.marks}
              </span>

            </div>

          `

          : `

            <div class="grading-summary">

              <span>
                Given marks:
                <b>
                  ${q.marks}
                </b>
              </span>

              <span>
                Reference answer / rubric:
                <b>
                  ${esc(
                    q.correct ||
                    'Teacher judgement'
                  )}
                </b>
              </span>

            </div>

            <div
              class="grading-fields"
              style="margin-top:12px"
            >

              <label>

                Marks awarded

                <input
                  class="manual-mark"
                  data-qid="${esc(q.id)}"
                  type="number"
                  min="0"
                  max="${q.marks}"
                  step="0.01"
                  value="${
                    answer.awarded ??
                    0
                  }"
                >

              </label>

              <label>

                Teacher feedback

                <textarea
                  class="manual-feedback"
                  data-qid="${esc(q.id)}"
                  rows="2"
                  placeholder="Optional feedback"
                >${esc(
                  answer.feedback ||
                  ''
                )}</textarea>

              </label>

            </div>

          `
      }

    </div>

  `;
}


/* =========================================================
   SAVE GRADING
   ========================================================= */

function saveGrading(attemptId) {

  const db = getDB();

  const attempt =
    db.attempts.find(
      x =>
        x.id === attemptId
    );

  if (!attempt) return;

  document
    .querySelectorAll(
      '.manual-mark'
    )
    .forEach(input => {

      const answer =
        attempt.answers.find(
          x =>
            x.questionId ===
            input.dataset.qid
        );

      if (!answer) return;

      const max =
        Number(input.max);

      let value =
        Number(input.value);

      if (
        !Number.isFinite(value)
      ) {
        value = 0;
      }

      value =
        Math.max(
          0,
          Math.min(
            max,
            value
          )
        );

      answer.awarded =
        value;

      answer.reviewed =
        true;

      const feedback =
        document.querySelector(
          `.manual-feedback[data-qid="${input.dataset.qid}"]`
        );

      answer.feedback =
        feedback?.value ||
        '';

    });

  attempt.score =
    attempt.answers.reduce(
      (sum, answer) =>
        sum +
        (
          Number(
            answer.awarded
          ) || 0
        ),
      0
    );

  attempt.score =
    Math.max(
      0,
      attempt.score
    );

  attempt.gradingStatus =
    'checked';

  attempt.checkedAt =
    new Date().toLocaleString();

  saveDB(db);

  logEvent(
    `Checked result for ${attempt.studentName}`
  );

  renderResults();
}


/* =========================================================
   AUDIT
   ========================================================= */

function renderAudit() {

  const db = getDB();

  const box =
    getElement('auditList');

  if (!box) return;

  box.innerHTML =
    db.logs.length

      ? db.logs
          .map(
            item => `

              <div class="audit-row">

                <b>
                  ${esc(item.text)}
                </b>

                <span class="exam-meta">
                  ${esc(item.time)}
                </span>

              </div>

            `
          )
          .join('')

      : `
          <div class="empty">
            No activity recorded.
          </div>
        `;
}


/* =========================================================
   STUDENT INITIALIZATION
   ========================================================= */

function initStudent() {

  setupNav();

  const joinForm =
    getElement('joinForm');

  if (joinForm) {

    joinForm.addEventListener(
      'submit',
      joinExam
    );

  }

  renderStudentDashboard();

  if (location.hash) {

    const hash =
      location.hash.slice(1);

    if (
      document.getElementById(
        'view-' + hash
      )
    ) {
      showView(hash);
    }

  }
}


/* =========================================================
   STUDENT DASHBOARD
   ========================================================= */

function renderStudentDashboard() {

  const db = getDB();

  const box =
    getElement('studentExamList');

  if (box) {

    const available =
      db.exams.filter(
        exam =>
          formatStatus(exam) !==
          'completed'
      );

    box.innerHTML =
      available.length

        ? available
            .map(exam => {

              const status =
                formatStatus(exam);

              const qCount =
                exam.questionIds?.length ||
                0;

              /*
               * Students should not see a
               * waiting room as an active exam.
               */
              const joinDisabled =
                status === 'waiting' ||
                status === 'ready';

              return `

                <div class="exam-row">

                  <div>

                    <b>
                      ${esc(
                        exam.title
                      )}
                    </b>

                    <div class="exam-meta">

                      ${esc(
                        exam.subject
                      )}

                      •
                      ${esc(exam.date)}

                      •
                      ${esc(
                        exam.startTime
                      )}

                    </div>

                  </div>

                  <span
                    class="badge ${status}"
                  >
                    ${statusLabel(status)}
                  </span>

                  <span>
                    ${exam.duration}
                    min
                  </span>

                  <span>
                    ${qCount}
                    question${qCount === 1 ? '' : 's'}
                  </span>

                  ${
                    joinDisabled
                      ? `
                        <span class="exam-meta">
                          Waiting for examiner
                        </span>
                      `
                      : `
                        <button
                          type="button"
                          class="text-btn"
                          onclick="
                            document.getElementById('roomCode').value='${esc(exam.roomCode)}';
                            showView('join');
                          "
                        >
                          Join
                        </button>
                      `
                  }

                </div>

              `;

            })
            .join('')

        : `

          <div class="empty">
            No available examinations.
            Ask your examiner for the room
            code and password.
          </div>

        `;

  }

  const results =
    getElement('studentResults');

  if (!results) return;

  const attempts =
    db.attempts.filter(
      a =>
        a.studentEmail ===
        'student@example.com'
    );

  results.innerHTML =
    attempts.length

      ? attempts
          .map(attempt => {

            const exam =
              db.exams.find(
                e =>
                  e.id ===
                  attempt.examId
              );

            const checked =
              attempt.gradingStatus ===
              'checked';

            return `

              <div class="exam-row">

                <div>

                  <b>
                    ${esc(
                      exam?.title ||
                      'Exam'
                    )}
                  </b>

                  <div class="exam-meta">
                    ${esc(
                      attempt.submittedAt
                    )}
                  </div>

                </div>

                <span>
                  ${
                    checked
                      ? `${attempt.score}/${attempt.total}`
                      : 'Under review'
                  }
                </span>

                <span
                  class="badge ${
                    checked
                      ? 'published'
                      : 'review'
                  }"
                >
                  ${
                    checked
                      ? 'Checked'
                      : 'Under review'
                  }
                </span>

              </div>

            `;

          })
          .join('')

      : `

          <div class="empty">
            No results yet.
          </div>

        `;
}


/* =========================================================
   JOIN EXAM
   ========================================================= */

/* =========================================================
   LIVE EXAM
   ========================================================= */

function initLiveExam() {

  restoreTheme();

  const examId =
    sessionStorage.getItem(
      'examora_current_exam'
    );

  const db = getDB();

  const exam =
    db.exams.find(
      e =>
        e.id === examId
    );

  if (!exam) {

    location.href =
      'student.html';

    return;
  }

  /*
   * IMPORTANT:
   * If teacher has not started exam,
   * student cannot enter.
   */
  if (!exam.startedAt) {

    alert(
      'The examiner has not started this examination yet.'
    );

    location.href =
      'student.html';

    return;
  }

  const questions =
    (exam.questionIds || [])
      .map(
        questionId =>
          db.questions.find(
            q =>
              q.id === questionId
          )
      )
      .filter(Boolean);

  if (!questions.length) {

    alert(
      'This examination does not contain any questions.'
    );

    location.href =
      'student.html';

    return;
  }

  /*
   * REAL START TIME
   */
  const actualStart =
    getExamStartTime(exam);

  /*
   * REAL END TIME
   */
  const actualEnd =
    getExamEndTime(exam);

  const now =
    Date.now();

  if (
    Number.isNaN(actualStart) ||
    Number.isNaN(actualEnd)
  ) {

    alert(
      'This examination has an invalid start time.'
    );

    location.href =
      'student.html';

    return;
  }

  /*
   * Late joining is allowed.
   *
   * Example:
   * Teacher starts at 10:00
   * Duration = 60 minutes
   *
   * Student joins at 10:25
   * Remaining time = 35 minutes.
   */
  if (now >= actualEnd) {

    alert(
      'This examination has already ended.'
    );

    location.href =
      'student.html';

    return;
  }

  let index = 0;

  let submitted = false;

  let answers =
    JSON.parse(
      sessionStorage.getItem(
        'examora_answers'
      ) || '{}'
    );

  let reviews =
    JSON.parse(
      sessionStorage.getItem(
        'examora_reviews'
      ) || '{}'
    );

  const title =
    getElement('liveExamTitle');

  if (title) {
    title.textContent =
      exam.title;
  }


  /* =======================================================
     SAVE PROGRESS
     ======================================================= */

  function saveProgress() {

    sessionStorage.setItem(
      'examora_answers',
      JSON.stringify(answers)
    );

    const state =
      getElement('saveState');

    if (state) {
      state.textContent =
        'Saved ✓';
    }

  }


  /* =======================================================
     RENDER QUESTION
     ======================================================= */

  function render() {

    const question =
      questions[index];

    if (!question) return;

    const number =
      getElement('questionNumber');

    if (number) {

      number.textContent =
        `Question ${index + 1}`;

    }

    const marks =
      getElement('questionMarks');

    if (marks) {

      marks.textContent =
        `${question.marks} mark${
          question.marks == 1
            ? ''
            : 's'
        }`;

    }

    const text =
      getElement('questionText');

    if (text) {

      text.textContent =
        question.text;

    }

    const progress =
      getElement('progressText');

    if (progress) {

      progress.textContent =
        `${index + 1} / ${questions.length}`;

    }

    const value =
      answers[
        question.id
      ] ?? '';

    let html = '';


    /* MCQ */

    if (
      question.type ===
      'mcq'
    ) {

      html = `

        <div class="answer-options">

          ${['A', 'B', 'C', 'D']
            .map(letter => `

              <label
                class="
                  answer-option
                  ${
                    value === letter
                      ? 'selected'
                      : ''
                  }
                "
              >

                <input
                  type="radio"
                  name="ans"
                  value="${letter}"
                  ${
                    value === letter
                      ? 'checked'
                      : ''
                  }
                >

                <b>
                  ${letter}.
                </b>

                ${esc(
                  question
                    .options?.[letter] ||
                  ''
                )}

              </label>

            `)
            .join('')}

        </div>

      `;

    }


    /* TRUE / FALSE */

    else if (
      question.type ===
      'truefalse'
    ) {

      html = `

        <div class="answer-options">

          ${[
            'True',
            'False'
          ]
            .map(answerValue => `

              <label
                class="
                  answer-option
                  ${
                    value === answerValue
                      ? 'selected'
                      : ''
                  }
                "
              >

                <input
                  type="radio"
                  name="ans"
                  value="${answerValue}"
                  ${
                    value === answerValue
                      ? 'checked'
                      : ''
                  }
                >

                ${answerValue}

              </label>

            `)
            .join('')}

        </div>

      `;

    }


    /* NUMERICAL */

    else if (
      question.type ===
      'numerical'
    ) {

      html = `

        <input
          id="textAnswer"
          type="number"
          step="any"
          placeholder="Enter your numerical answer..."
          value="${esc(value)}"
        >

      `;

    }


    /* SHORT / LONG */

    else {

      html = `

        <textarea
          id="textAnswer"
          rows="8"
          placeholder="Write your answer here..."
        >${esc(value)}</textarea>

      `;

    }

    const answerArea =
      getElement('answerArea');

    if (answerArea) {

      answerArea.innerHTML =
        html;

    }


    /*
     * Radio events
     */
    document
      .querySelectorAll(
        'input[name="ans"]'
      )
      .forEach(radio => {

        radio.addEventListener(
          'change',
          () => {

            answers[
              question.id
            ] =
              radio.value;

            saveProgress();

            render();

          }
        );

      });


    /*
     * Text/numerical events
     */
    getElement('textAnswer')
      ?.addEventListener(
        'input',
        event => {

          answers[
            question.id
          ] =
            event.target.value;

          saveProgress();

          updateAnsweredCount();

        }
      );


    updateAnsweredCount();


    /* Review button */

    const reviewButton =
      getElement('reviewButton');

    if (reviewButton) {

      const marked =
        !!reviews[
          question.id
        ];

      reviewButton.classList.toggle(
        'active',
        marked
      );

      reviewButton.textContent =
        marked
          ? '★ Marked for review'
          : '☆ Mark for review';

    }


    /* Question navigation */

    const navGrid =
      getElement(
        'questionNavGrid'
      );

    if (navGrid) {

      navGrid.innerHTML =
        questions
          .map(
            (q, i) => `

              <button
                type="button"
                class="
                  ${
                    String(
                      answers[q.id] ?? ''
                    ).trim()
                      ? 'answered'
                      : ''
                  }

                  ${
                    reviews[q.id]
                      ? 'review'
                      : ''
                  }
                "
                onclick="window.examGo(${i})"
              >
                ${i + 1}
              </button>

            `
          )
          .join('');

    }

  }


  /* =======================================================
     ANSWER COUNT
     ======================================================= */

  function updateAnsweredCount() {

    const answeredCount =
      getElement(
        'answeredCount'
      );

    if (!answeredCount) {
      return;
    }

    answeredCount.textContent =
      Object.values(
        answers
      ).filter(
        value =>
          String(
            value
          ).trim() !== ''
      ).length;

  }


  /* =======================================================
     EXAM NAVIGATION
     ======================================================= */

  window.examGo =
    questionIndex => {

      saveProgress();

      if (
        questionIndex < 0 ||
        questionIndex >=
          questions.length
      ) {
        return;
      }

      index =
        questionIndex;

      render();
    };

  window.previousQuestion =
    () => {

      saveProgress();

      if (index > 0) {

        index--;

        render();

      }

    };

  window.nextQuestion =
    () => {

      saveProgress();

      if (
        index <
        questions.length - 1
      ) {

        index++;

        render();

      }

    };

  window.toggleReview =
    () => {

      const id =
        questions[index].id;

      reviews[id] =
        !reviews[id];

      sessionStorage.setItem(
        'examora_reviews',
        JSON.stringify(
          reviews
        )
      );

      render();

    };


  /* =======================================================
     SUBMIT EXAM
     ======================================================= */

  function submitExamInternal(
    automatic = false
  ) {

    if (submitted) {
      return;
    }

    submitted = true;

    saveProgress();

    const attempt = {

      id:
        uid('attempt'),

      examId:
        exam.id,

      studentName:
        sessionStorage.getItem(
          'examora_student'
        ) ||
        'Unknown Student',

      studentId:
        sessionStorage.getItem(
          'examora_student_id'
        ) ||
        examoraGetStudentId(),

      studentEmail:
        sessionStorage.getItem(
          'examora_student_email'
        ) ||
        'student@example.com',

      submittedAt:
        new Date().toLocaleString(),

      total:
        questions.reduce(
          (sum, q) =>
            sum +
            Number(q.marks),
          0
        ),

      score: 0,

      gradingStatus:
        'checked',

      answers: []

    };


    attempt.answers =
      questions.map(
        question => {

          const value =
            answers[
              question.id
            ] ?? '';

          const cleanValue =
            String(
              value
            ).trim();

          let correct =
            false;

          let awarded =
            0;


          /* MCQ */

          if (
            question.type ===
            'mcq'
          ) {

            correct =
              cleanValue
                .toUpperCase() ===
              String(
                question.correct
              )
                .trim()
                .toUpperCase();

          }


          /* TRUE / FALSE */

          else if (
            question.type ===
            'truefalse'
          ) {

            correct =
              cleanValue
                .toLowerCase() ===
              String(
                question.correct
              )
                .trim()
                .toLowerCase();

          }


          /* NUMERICAL */

          else if (
            question.type ===
            'numerical'
          ) {

            const studentNumber =
              Number(
                cleanValue
              );

            const expectedNumber =
              Number(
                question.correct
              );

            correct =
              cleanValue !== '' &&
              Number.isFinite(
                studentNumber
              ) &&
              Number.isFinite(
                expectedNumber
              ) &&
              Math.abs(
                studentNumber -
                expectedNumber
              ) < 0.01;

          }


          /* AUTOMATIC MARKING */

          if (!question.manual) {

            if (correct) {

              awarded =
                Number(
                  question.marks
                );

            }

            else if (
              cleanValue !== '' &&
              Number(
                question.negativeMarks
              ) > 0
            ) {

              awarded =
                -Number(
                  question.negativeMarks
                );

            }

          }


          return {

            questionId:
              question.id,

            value:
              cleanValue,

            isCorrect:
              correct,

            awarded,

            reviewed:
              !question.manual,

            feedback:
              ''

          };

        }
      );


    const hasManual =
      attempt.answers.some(
        answer => {

          const question =
            db.questions.find(
              q =>
                q.id ===
                answer.questionId
            );

          return !!question?.manual;

        }
      );


    if (hasManual) {

      attempt.gradingStatus =
        'pending';

    }


    attempt.score =
      attempt.answers.reduce(
        (sum, answer) =>
          sum +
          Number(
            answer.awarded || 0
          ),
        0
      );

    /*
     * Score cannot go below zero.
     */
    attempt.score =
      Math.max(
        0,
        attempt.score
      );


    db.attempts.push(
      attempt
    );

    saveDB(db);

    logEvent(
      `Student submitted "${exam.title}"${
        automatic
          ? ' automatically after time expired'
          : ''
      }`
    );

    sessionStorage.removeItem(
      'examora_answers'
    );

    sessionStorage.removeItem(
      'examora_reviews'
    );

    sessionStorage.setItem(
      'examora_last_attempt',
      attempt.id
    );

    location.href =
      'result.html';
  }


  window.submitExam =
    () => {

      if (submitted) {
        return;
      }

      if (
        !confirm(
          'Submit your examination? You will not be able to change answers after submission.'
        )
      ) {
        return;
      }

      submitExamInternal(
        false
      );

    };


  /* =======================================================
     TIMER
     ======================================================= */

  let timerFinished =
    false;

  function tick() {

    if (submitted) {
      return;
    }

    /*
     * IMPORTANT:
     * Timer uses actual teacher start time.
     *
     * Therefore late students get less time.
     */
    const remaining =
      Math.max(
        0,
        actualEnd -
          Date.now()
      );

    const timer =
      getElement('timer');

    if (timer) {

      timer.textContent =
        formatRemainingTime(
          remaining
        );

    }

    /*
     * Optional warning state.
     */
    if (timer) {

      timer.classList.toggle(
        'warning',
        remaining <= 5 * 60000
      );

      timer.classList.toggle(
        'danger',
        remaining <= 60000
      );

    }

    if (
      remaining <= 0
    ) {

      if (!timerFinished) {

        timerFinished =
          true;

        alert(
          'Time is over. Your examination will be submitted automatically.'
        );

        submitExamInternal(
          true
        );

      }

      return;
    }

    setTimeout(
      tick,
      1000
    );
  }


  /*
   * Initial render + timer.
   */
  render();

  tick();
}


/* =========================================================
   RESULT PAGE
   ========================================================= */

function initResult() {

  const attemptId =
    sessionStorage.getItem(
      'examora_last_attempt'
    );

  const db = getDB();

  const attempt =
    db.attempts.find(
      x =>
        x.id === attemptId
    );

  const exam =
    attempt &&
    db.exams.find(
      e =>
        e.id ===
        attempt.examId
    );

  if (!attempt) {

    location.href =
      'student.html';

    return;
  }

  const title =
    getElement('resultTitle');

  if (title) {

    title.textContent =
      exam?.title ||
      'Result';

  }

  const score =
    getElement('resultScore');

  if (score) {
    score.textContent =
      attempt.score;
  }

  const total =
    getElement('resultTotal');

  if (total) {
    total.textContent =
      attempt.total;
  }

  const percent =
    getElement('resultPercent');

  if (percent) {

    percent.textContent =
      (
        attempt.total
          ? (
              attempt.score /
              attempt.total
            ) * 100
          : 0
      ).toFixed(1) +
      '%';

  }

  const correct =
    getElement('resultCorrect');

  if (correct) {

    correct.textContent =
      attempt.answers.filter(
        answer =>
          answer.isCorrect
      ).length;

  }

  const status =
    getElement('resultStatus');

  if (status) {

    status.textContent =
      attempt.gradingStatus ===
      'checked'
        ? 'Checked'
        : 'Under review';

  }

  const note =
    getElement('resultNote');

  if (note) {

    note.textContent =
      attempt.gradingStatus ===
      'pending'

        ? 'Your subjective answers have been sent to the examiner for manual checking. Your final result will update after checking.'

        : 'Your objective answers were evaluated automatically.';

  }
}


/* =========================================================
   STUDENT HISTORY
   ========================================================= */

function renderStudentHistory() {

  const db = getDB();

  const attempts =
    db.attempts.filter(
      a =>
        a.studentEmail ===
        'student@example.com'
    );

  const box =
    getElement('historyList');

  if (!box) return;

  box.innerHTML =
    attempts.length

      ? attempts
          .map(attempt => {

            const exam =
              db.exams.find(
                e =>
                  e.id ===
                  attempt.examId
              );

            const checked =
              attempt.gradingStatus ===
              'checked';

            return `

              <div class="exam-row">

                <div>

                  <b>
                    ${esc(
                      exam?.title ||
                      'Exam'
                    )}
                  </b>

                  <div class="exam-meta">
                    ${esc(
                      attempt.submittedAt
                    )}
                  </div>

                </div>

                <span>
                  ${
                    checked
                      ? `${attempt.score}/${attempt.total}`
                      : '—'
                  }
                </span>

                <span
                  class="badge ${
                    checked
                      ? 'published'
                      : 'review'
                  }"
                >

                  ${
                    checked
                      ? 'Checked'
                      : 'Under review'
                  }

                </span>

              </div>

            `;

          })
          .join('')

      : `

          <div class="empty">
            No examination history.
          </div>

        `;
}


/* =========================================================
   ADMIN / USER MANAGEMENT
   ========================================================= */

/*
   IMPORTANT:
   This is only a frontend helper.
   Anyone who can modify the JavaScript/localStorage
   can bypass client-side admin restrictions.

   Real admin protection must be implemented
   on a backend.
*/

const ADMIN_EMAILS = [
  'examiner@example.com'
];

function isAdminUser() {

  const db = getDB();

  const email =
    String(
      db.user?.email || ''
    )
      .trim()
      .toLowerCase();

  return ADMIN_EMAILS.includes(
    email
  );
}

function requireAdmin() {

  if (!isAdminUser()) {

    alert(
      'Access denied. Only the administrator can access this section.'
    );

    return false;
  }

  return true;
}


/*
   Generic Manage button handler.
   This prevents the "Manage" button from doing
   absolutely nothing.
 */
function manageUser(userId = null) {

  /*
   * If your admin page is intended only for you,
   * check admin permission first.
   */
  if (!requireAdmin()) {
    return;
  }

  const db = getDB();

  /*
   * If your HTML later passes a real user ID,
   * this section can be expanded for editing.
   */
  if (!userId) {

    alert(
      'User management is available to the administrator.'
    );

    return;
  }

  const user =
    db.users?.find(
      u => u.id === userId
    );

  if (!user) {

    alert(
      'User was not found.'
    );

    return;
  }

  /*
   * Basic management dialog for now.
   */
  const action =
    prompt(
      `Manage user:\n\n` +
      `Name: ${user.name || '—'}\n` +
      `Email: ${user.email || '—'}\n\n` +
      `Enter:\n` +
      `1 = View\n` +
      `2 = Delete`
    );

  if (action === '1') {

    alert(
      `User\n\n` +
      `Name: ${user.name || '—'}\n` +
      `Email: ${user.email || '—'}`
    );

    return;
  }

  if (action === '2') {

    if (
      !confirm(
        `Delete user ${user.email || user.name}?`
      )
    ) {
      return;
    }

    db.users =
      db.users.filter(
        u =>
          u.id !== userId
      );

    saveDB(db);

    logEvent(
      `Deleted user ${user.email || user.name}`
    );

    alert(
      'User deleted successfully.'
    );

    /*
     * If an admin user table exists,
     * refresh it.
     */
    if (
      typeof renderUsers ===
      'function'
    ) {
      renderUsers();
    }

  }

}


/* =========================================================
   ADMIN ACCESS HELPER
   ========================================================= */

function openAdminPortal() {

  if (!requireAdmin()) {
    return;
  }

  /*
   * If your project has an admin.html page,
   * this will open it.
   */
  if (
    location.pathname.includes(
      'admin.html'
    )
  ) {
    return;
  }

  location.href =
    'admin.html';
}


/* =========================================================
   GLOBAL INITIALIZATION SUPPORT
   ========================================================= */

window.addEventListener(
  'DOMContentLoaded',
  () => {

    restoreTheme();

  }
);


/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

window.toggleTheme =
  toggleTheme;

window.createExam =
  createExam;

window.showView =
  showView;

window.closeQuestionModal =
  closeQuestionModal;

window.openQuestionModal =
  openQuestionModal;

window.copyRoomCode =
  copyRoomCode;

window.startExam =
  startExam;

window.viewRoom =
  viewRoom;

window.deleteExam =
  deleteExam;

window.openGrading =
  openGrading;

window.saveGrading =
  saveGrading;

window.joinExam =
  joinExam;

window.initExaminer =
  initExaminer;

window.initStudent =
  initStudent;

window.initLiveExam =
  initLiveExam;

window.initResult =
  initResult;

window.manageUser =
  manageUser;

window.openAdminPortal =
  openAdminPortal;

window.isAdminUser =
  isAdminUser;
/* =========================================================
   EXAMORA TOAST NOTIFICATION SYSTEM
   ========================================================= */

function showExamoraToast(
  message,
  type = 'info',
  title = ''
) {

  let container =
    document.querySelector(
      '.examora-toast-container'
    );

  if (!container) {

    container =
      document.createElement('div');

    container.className =
      'examora-toast-container';

    document.body.appendChild(
      container
    );
  }

  const toast =
    document.createElement('div');

  const validTypes = [
    'success',
    'error',
    'warning',
    'info'
  ];

  if (!validTypes.includes(type)) {
    type = 'info';
  }

  toast.className =
    `examora-toast ${type}`;

  const icons = {
    success: '✓',
    error: '!',
    warning: '!',
    info: 'i'
  };

  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Notice'
  };

  toast.innerHTML = `
    <div class="examora-toast-icon">
      ${icons[type]}
    </div>

    <div class="examora-toast-content">

      <span class="examora-toast-title">
        ${esc(
          title ||
          titles[type]
        )}
      </span>

      <span class="examora-toast-message">
        ${esc(message)}
      </span>

    </div>

    <button
      class="examora-toast-close"
      type="button"
      aria-label="Close notification"
    >
      ×
    </button>
  `;

  container.appendChild(toast);

  const closeBtn =
    toast.querySelector(
      '.examora-toast-close'
    );

  function removeToast() {

    if (!toast.isConnected) {
      return;
    }

    toast.classList.add('hide');

    setTimeout(() => {

      if (toast.isConnected) {
        toast.remove();
      }

    }, 220);
  }

  closeBtn.addEventListener(
    'click',
    removeToast
  );

  setTimeout(
    removeToast,
    3500
  );
}


/* =========================================================
   REPLACE BROWSER ALERT WITH EXAMORA TOAST
   ========================================================= */

window.examoraAlert =
  function (
    message,
    type = 'info',
    title = ''
  ) {

    showExamoraToast(
      message,
      type,
      title
    );
  };


/* =========================================================
   UPDATED START EXAM
   ========================================================= */

function startExam(examId) {

  const db = getDB();

  const exam =
    db.exams.find(
      exam => exam.id === examId
    );

  if (!exam) {

    showExamoraToast(
      'The examination could not be found.',
      'error',
      'Exam Not Found'
    );

    return;
  }

  if (exam.startedAt) {

    showExamoraToast(
      'This examination has already started.',
      'warning',
      'Already Started'
    );

    return;
  }

  const questionIds =
    Array.isArray(
      exam.questionIds
    )
      ? exam.questionIds
      : [];

  if (questionIds.length === 0) {

    showExamoraToast(
      'Please add at least one question before starting the examination.',
      'warning',
      'Questions Required'
    );

    return;
  }

  const duration =
    Number(exam.duration);

  if (
    !Number.isFinite(duration) ||
    duration <= 0
  ) {

    showExamoraToast(
      'The examination duration is invalid.',
      'error',
      'Invalid Duration'
    );

    return;
  }

  const validQuestions =
    questionIds
      .map(
        id =>
          db.questions.find(
            q => q.id === id
          )
      )
      .filter(Boolean);

  if (
    validQuestions.length !==
    questionIds.length
  ) {

    showExamoraToast(
      'Some examination questions could not be found.',
      'error',
      'Question Error'
    );

    return;
  }

  const confirmed =
    window.confirm(
      `Start "${exam.title}" now?\n\n` +
      `${questionIds.length} question(s)\n` +
      `Duration: ${duration} minute(s)\n\n` +
      `The examination timer will start immediately.`
    );

  if (!confirmed) {
    return;
  }

  const startTime =
    new Date().toISOString();

  exam.startedAt =
    startTime;

  exam.status =
    'active';

  exam.startedBy =
    db.user?.email ||
    'examiner@example.com';

  exam.startedQuestionCount =
    questionIds.length;

  saveDB(db);

  logEvent(
    `Started examination "${exam.title}" with room ${exam.roomCode}`
  );

  showExamoraToast(
    `Exam "${exam.title}" has started successfully.`,
    'success',
    'Exam Started'
  );

  if (
    typeof renderExaminerDashboard ===
    'function'
  ) {
    renderExaminerDashboard();
  }

  if (
    typeof closeQuestionModal ===
    'function'
  ) {
    closeQuestionModal();
  }
}


/* =========================================================
   UPDATED JOIN EXAM
   ========================================================= */

function joinExam(e) {

  if (e) {
    e.preventDefault();
  }

  const db = getDB();

  const roomCodeElement =
    getElement('roomCode');

  const roomPasswordElement =
    getElement('roomPassword');

  const message =
    getElement('joinMessage');

  const roomCode =
    String(
      roomCodeElement?.value || ''
    )
      .trim()
      .toUpperCase();

  const roomPassword =
    String(
      roomPasswordElement?.value || ''
    )
      .trim();

  if (!roomCode || !roomPassword) {

    if (message) {

      message.innerHTML = `
        <div class="notice"
          style="
            background:#fff5df;
            color:#9a6507;
          "
        >
          Please enter both the
          room code and room password.
        </div>
      `;
    }

    showExamoraToast(
      'Please enter both the room code and room password.',
      'warning',
      'Missing Details'
    );

    return false;
  }

  const exam =
    db.exams.find(
      item =>
        String(
          item.roomCode || ''
        )
          .trim()
          .toUpperCase() ===
        roomCode
    );

  if (!exam) {

    if (message) {

      message.innerHTML = `
        <div class="notice"
          style="
            background:#fff0f1;
            color:#a73542;
          "
        >
          No examination with this
          room code was found on
          this browser.
          <br><br>
          If the examiner and student
          are using different devices,
          localStorage cannot share
          the examination data.
        </div>
      `;
    }

    showExamoraToast(
      'No examination with this room code was found on this device.',
      'error',
      'Room Not Found'
    );

    return false;
  }

  if (
    String(
      exam.roomPassword || ''
    ).trim() !== roomPassword
  ) {

    if (message) {

      message.innerHTML = `
        <div class="notice"
          style="
            background:#fff0f1;
            color:#a73542;
          "
        >
          The room password is
          incorrect.
        </div>
      `;
    }

    showExamoraToast(
      'The room password is incorrect.',
      'error',
      'Incorrect Password'
    );

    return false;
  }

  const status =
    formatStatus(exam);

  if (
    status === 'waiting' ||
    status === 'ready'
  ) {

    if (message) {

      message.innerHTML = `
        <div class="notice">
          The examiner has not
          started this examination yet.
          <br><br>
          Please wait until the
          examiner clicks
          <b>Start Exam</b>.
        </div>
      `;
    }

    showExamoraToast(
      'The examiner has not started the examination yet.',
      'warning',
      'Exam Not Started'
    );

    return false;
  }

  if (status === 'completed') {

    if (message) {

      message.innerHTML = `
        <div class="notice"
          style="
            background:#fff0f1;
            color:#a73542;
          "
        >
          This examination has
          already ended.
        </div>
      `;
    }

    showExamoraToast(
      'This examination has already ended.',
      'error',
      'Exam Ended'
    );

    return false;
  }

  const questionIds =
    Array.isArray(
      exam.questionIds
    )
      ? exam.questionIds
      : [];

  if (questionIds.length === 0) {

    if (message) {

      message.innerHTML = `
        <div class="notice"
          style="
            background:#fff5df;
            color:#9a6507;
          "
        >
          This examination does not
          contain any questions.
        </div>
      `;
    }

    showExamoraToast(
      'This examination does not contain any questions.',
      'warning',
      'No Questions'
    );

    return false;
  }

  const validQuestions =
    questionIds
      .map(
        id =>
          db.questions.find(
            q => q.id === id
          )
      )
      .filter(Boolean);

  if (!validQuestions.length) {

    if (message) {

      message.innerHTML = `
        <div class="notice"
          style="
            background:#fff0f1;
            color:#a73542;
          "
        >
          Examination questions
          could not be found.
        </div>
      `;
    }

    showExamoraToast(
      'The examination questions could not be found.',
      'error',
      'Question Error'
    );

    return false;
  }

  /*
   * Save the examination
   * for the live exam page.
   */

  sessionStorage.setItem(
    'examora_current_exam',
    exam.id
  );

  sessionStorage.setItem(
    'examora_student',
    'Student'
  );

  sessionStorage.setItem(
    'examora_student_email',
    'student@example.com'
  );

  sessionStorage.setItem(
    'examora_join_time',
    String(Date.now())
  );

  sessionStorage.removeItem(
    'examora_answers'
  );

  sessionStorage.removeItem(
    'examora_reviews'
  );

  sessionStorage.removeItem(
    'examora_question_index'
  );

  showExamoraToast(
    'Entering the examination...',
    'success',
    'Exam Ready'
  );

  setTimeout(() => {

    location.href =
      'exam.html';

  }, 350);

  return true;
}


/* =========================================================
   UPDATED GLOBAL EXPORTS
   ========================================================= */

window.showExamoraToast =
  showExamoraToast;

window.examoraAlert =
  window.examoraAlert;

window.startExam =
  startExam;

window.joinExam =
  joinExam;

/* =========================================================
   EXAMORA FINAL STUDENT IDENTITY UPDATE
   Keeps all existing exam functionality and adds:
   - Student name required before joining
   - Persistent unique Student ID per browser/student
   - Student ID saved with every attempt
   - Examiner results show Student ID
   - Student history follows the current Student ID
   - Removes "Demo" wording from examiner identity
   - Keeps existing animations and mobile menu
   ========================================================= */

function examoraCreateStudentId() {
  const KEY = 'examora_student_id';
  let existing = localStorage.getItem(KEY);

  if (existing && /^STU-[A-Z0-9]{8}$/i.test(existing)) {
    return existing.toUpperCase();
  }

  let id = '';
  try {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      id = window.crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    }
  } catch (_) {}

  if (!id) {
    id = Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  existing = `STU-${id}`;
  localStorage.setItem(KEY, existing);
  return existing;
}

function examoraGetStudentId() {
  const id = examoraCreateStudentId();
  sessionStorage.setItem('examora_student_id', id);
  return id;
}

function examoraGetStudentName() {
  return String(
    sessionStorage.getItem('examora_student') ||
    localStorage.getItem('examora_student_name') ||
    ''
  ).trim();
}

function examoraSetStudentIdentity(name) {
  const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
  const id = examoraGetStudentId();

  sessionStorage.setItem('examora_student', cleanName);
  sessionStorage.setItem('examora_student_id', id);
  localStorage.setItem('examora_student_name', cleanName);

  return { name: cleanName, id };
}

function examoraEnsureStudentNameField() {
  const form = getElement('joinForm');
  if (!form) return;

  if (getElement('studentName')) {
    return;
  }

  const roomCode = getElement('roomCode');
  const label = document.createElement('label');
  label.id = 'examoraStudentNameField';
  label.setAttribute('class', 'examora-student-name-field');
  label.innerHTML = `
    Student Name
    <input
      id="studentName"
      name="studentName"
      type="text"
      autocomplete="name"
      maxlength="80"
      required
      placeholder="Enter your full name"
    >
    <small class="exam-meta">Your name will be shown to the examiner with your unique Student ID.</small>
  `;

  if (roomCode && roomCode.parentElement) {
    roomCode.parentElement.before(label);
  } else {
    form.prepend(label);
  }

  const savedName = examoraGetStudentName();
  const input = getElement('studentName');
  if (input && savedName) input.value = savedName;

  if (input) {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\s{2,}/g, ' ');
    });
  }
}

function examoraShowStudentIdentityNotice() {
  const form = getElement('joinForm');
  if (!form) return;

  if (getElement('examoraStudentIdPreview')) return;

  const id = examoraGetStudentId();
  const box = document.createElement('div');
  box.id = 'examoraStudentIdPreview';
  box.className = 'notice';
  box.innerHTML = `
    <b>Your Student ID</b>
    <span style="font-family:monospace;margin-left:8px">${esc(id)}</span>
    <br>
    <small>Keep this ID for your examination records.</small>
  `;

  const nameField = getElement('examoraStudentNameField');
  if (nameField) nameField.after(box);
}

/* Replace student initialization without removing existing functionality. */
function initStudent() {
  setupNav();
  examoraEnsureStudentNameField();
  examoraShowStudentIdentityNotice();

  const joinForm = getElement('joinForm');
  if (joinForm && joinForm.dataset.examoraIdentityBound !== 'true') {
    joinForm.addEventListener('submit', joinExam);
    joinForm.dataset.examoraIdentityBound = 'true';
  }

  renderStudentDashboard();

  if (location.hash) {
    const hash = location.hash.slice(1);
    if (document.getElementById('view-' + hash)) {
      showView(hash);
    }
  }
}

/* Student dashboard now uses the current Student ID instead of one hard-coded demo email. */
function renderStudentDashboard() {
  const db = getDB();
  const currentStudentId = examoraGetStudentId();
  const currentStudentEmail =
    sessionStorage.getItem('examora_student_email') || 'student@example.com';

  const box = getElement('studentExamList');

  if (box) {
    const available = db.exams.filter(exam => formatStatus(exam) !== 'completed');

    box.innerHTML = available.length
      ? available.map(exam => {
          const status = formatStatus(exam);
          const qCount = exam.questionIds?.length || 0;
          const joinDisabled = status === 'waiting' || status === 'ready';

          return `
            <div class="exam-row">
              <div>
                <b>${esc(exam.title)}</b>
                <div class="exam-meta">
                  ${esc(exam.subject)} • ${esc(exam.date)} • ${esc(exam.startTime)}
                </div>
              </div>
              <span class="badge ${status}">${statusLabel(status)}</span>
              <span>${exam.duration} min</span>
              <span>${qCount} question${qCount === 1 ? '' : 's'}</span>
              ${
                joinDisabled
                  ? `<span class="exam-meta">Waiting for examiner</span>`
                  : `<button type="button" class="text-btn" onclick="document.getElementById('roomCode').value='${esc(exam.roomCode)}'; showView('join'); examoraEnsureStudentNameField();">Join</button>`
              }
            </div>
          `;
        }).join('')
      : `
        <div class="empty">
          No available examinations.<br>
          Ask your examiner for the room code and password.
        </div>
      `;
  }

  const results = getElement('studentResults');
  if (!results) return;

  const attempts = db.attempts.filter(a =>
    a.studentId
      ? a.studentId === currentStudentId
      : a.studentEmail === currentStudentEmail
  );

  results.innerHTML = attempts.length
    ? attempts.map(attempt => {
        const exam = db.exams.find(e => e.id === attempt.examId);
        const checked = attempt.gradingStatus === 'checked';
        return `
          <div class="exam-row">
            <div>
              <b>${esc(exam?.title || 'Exam')}</b>
              <div class="exam-meta">
                ${esc(attempt.submittedAt)} • Student ID: ${esc(attempt.studentId || '—')}
              </div>
            </div>
            <span>${checked ? `${attempt.score}/${attempt.total}` : 'Under review'}</span>
            <span class="badge ${checked ? 'published' : 'review'}">
              ${checked ? 'Checked' : 'Under review'}
            </span>
          </div>
        `;
      }).join('')
    : `<div class="empty">No results yet.</div>`;
}

/* Final join handler: requires name first, then creates/stores Student ID. */
function joinExam(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  examoraEnsureStudentNameField();

  const db = getDB();
  const message = getElement('joinMessage');
  const studentNameElement = getElement('studentName');
  const roomCodeElement = getElement('roomCode');
  const roomPasswordElement = getElement('roomPassword');

  const studentName = String(studentNameElement?.value || '').trim().replace(/\s+/g, ' ');
  const roomCode = String(roomCodeElement?.value || '').trim().toUpperCase();
  const roomPassword = String(roomPasswordElement?.value || '').trim();

  if (!studentName) {
    showExamoraToast('Please enter your name before joining the examination.', 'warning', 'Name Required');
    studentNameElement?.focus();
    return false;
  }

  if (studentName.length < 2) {
    showExamoraToast('Please enter your full name.', 'warning', 'Invalid Name');
    studentNameElement?.focus();
    return false;
  }

  if (!roomCode || !roomPassword) {
    if (message) {
      message.innerHTML = `<div class="notice" style="background:#fff5df;color:#9a6507">Please enter both the room code and room password.</div>`;
    }
    showExamoraToast('Please enter both the room code and room password.', 'warning', 'Missing Details');
    return false;
  }

  const exam = db.exams.find(item =>
    String(item.roomCode || '').trim().toUpperCase() === roomCode
  );

  if (!exam) {
    if (message) {
      message.innerHTML = `<div class="notice" style="background:#fff0f1;color:#a73542">No examination with this room code was found on this browser.</div>`;
    }
    showExamoraToast('No examination with this room code was found on this device.', 'error', 'Room Not Found');
    return false;
  }

  if (String(exam.roomPassword || '').trim() !== roomPassword) {
    if (message) {
      message.innerHTML = `<div class="notice" style="background:#fff0f1;color:#a73542">The room password is incorrect.</div>`;
    }
    showExamoraToast('The room password is incorrect.', 'error', 'Incorrect Password');
    return false;
  }

  const status = formatStatus(exam);

  if (status === 'waiting' || status === 'ready') {
    if (message) {
      message.innerHTML = `<div class="notice">The examiner has not started this examination yet.<br><br>Please wait until the examiner clicks <b>Start Exam</b>.</div>`;
    }
    showExamoraToast('The examiner has not started the examination yet.', 'warning', 'Exam Not Started');
    return false;
  }

  if (status === 'completed') {
    if (message) {
      message.innerHTML = `<div class="notice" style="background:#fff0f1;color:#a73542">This examination has already ended.</div>`;
    }
    showExamoraToast('This examination has already ended.', 'error', 'Exam Ended');
    return false;
  }

  const questionIds = Array.isArray(exam.questionIds) ? exam.questionIds : [];
  if (!questionIds.length) {
    showExamoraToast('This examination does not contain any questions.', 'warning', 'No Questions');
    return false;
  }

  const validQuestions = questionIds.map(id => db.questions.find(q => q.id === id)).filter(Boolean);
  if (!validQuestions.length) {
    showExamoraToast('The examination questions could not be found.', 'error', 'Question Error');
    return false;
  }

  const identity = examoraSetStudentIdentity(studentName);

  sessionStorage.setItem('examora_current_exam', exam.id);
  sessionStorage.setItem('examora_student', identity.name);
  sessionStorage.setItem('examora_student_id', identity.id);
  sessionStorage.setItem('examora_student_email', 'student@example.com');
  sessionStorage.setItem('examora_join_time', String(Date.now()));
  sessionStorage.removeItem('examora_answers');
  sessionStorage.removeItem('examora_reviews');
  sessionStorage.removeItem('examora_question_index');

  showExamoraToast(
    `Welcome ${identity.name}. Student ID: ${identity.id}`,
    'success',
    'Exam Ready'
  );

  setTimeout(() => {
    location.href = 'exam.html';
  }, 350);

  return false;
}

/* Examiner result table: show name + unique Student ID. */
function renderResults() {
  const db = getDB();
  const box = getElement('resultsTable');
  if (!box) return;

  if (!db.attempts.length) {
    box.innerHTML = `<div class="empty">No student submissions yet. Submitted answer copies will appear here for teacher checking.</div>`;
    return;
  }

  box.innerHTML = `
    <div class="result-row" style="font-weight:800;color:#667085">
      <span>Student</span>
      <span>Exam</span>
      <span>Score</span>
      <span>Status</span>
      <span>Action</span>
    </div>
    ${db.attempts.map(a => {
      const ex = db.exams.find(e => e.id === a.examId);
      const pending = a.gradingStatus === 'pending';
      return `
        <div class="result-row">
          <div>
            <b>${esc(a.studentName || 'Unknown Student')}</b>
            <div class="exam-meta">
              Student ID: <strong>${esc(a.studentId || '—')}</strong><br>
              ${esc(a.studentEmail || '')}
            </div>
          </div>
          <span>${esc(ex?.title || '—')}</span>
          <span><b>${Number.isFinite(Number(a.score)) ? a.score : '—'}</b> / ${a.total}</span>
          <span class="badge ${pending ? 'review' : 'published'}">${pending ? 'Needs checking' : 'Checked'}</span>
          <button type="button" class="text-btn" onclick="openGrading('${a.id}')">${pending ? 'Check answers' : 'Review'}</button>
        </div>
      `;
    }).join('')}
  `;
}

/* Examiner dashboard student count: count unique Student IDs. */
function renderExaminerDashboard() {
  const db = getDB();

  db.exams.forEach(exam => {
    if (exam.startedAt && isExamCompleted(exam) && exam.status !== 'completed') {
      exam.status = 'completed';
    }
  });
  saveDB(db);

  const active = db.exams.filter(x => formatStatus(x) === 'active').length;
  const upcoming = db.exams.filter(x => ['waiting', 'ready'].includes(formatStatus(x))).length;
  const completed = db.exams.filter(x => formatStatus(x) === 'completed').length;
  const uniqueStudents = new Set(
    db.attempts.map(a => a.studentId || a.studentEmail || a.studentName).filter(Boolean)
  ).size;

  const activeCount = getElement('activeCount');
  const upcomingCount = getElement('upcomingCount');
  const completedCount = getElement('completedCount');
  const studentCount = getElement('studentCount');
  if (activeCount) activeCount.textContent = active;
  if (upcomingCount) upcomingCount.textContent = upcoming;
  if (completedCount) completedCount.textContent = completed;
  if (studentCount) studentCount.textContent = uniqueStudents;

  /* Reuse the existing dashboard renderer safely, but restore the correct count afterward. */
  const box = getElement('examList');
  if (!box) return;

  if (!db.exams.length) {
    box.innerHTML = `<div class="empty">No examinations yet. Create your first exam room.</div>`;
    return;
  }

  box.innerHTML = db.exams.map(ex => {
    const status = formatStatus(ex);
    const qCount = ex.questionIds?.length || 0;
    let action = '';

    if (status === 'waiting' || status === 'ready') {
      action = `
        <button type="button" class="text-btn" onclick="showView('questions')">Add Questions</button>
        ${qCount > 0 ? `<button type="button" class="btn btn-primary" onclick="startExam('${ex.id}')">Start Exam</button>` : ''}
      `;
    } else if (status === 'active') {
      const end = getExamEndTime(ex);
      action = `<span class="exam-meta">Time remaining: ${formatRemainingTime(Math.max(0, end - Date.now()))}</span>`;
    } else {
      action = `<span class="exam-meta">Exam ended</span>`;
    }

    return `
      <div class="exam-row">
        <div>
          <b>${esc(ex.title)}</b>
          <div class="exam-meta">
            ${esc(ex.subject)} • ${esc(ex.date)} • ${esc(ex.startTime)}<br>
            Room: <b>${esc(ex.roomCode)}</b>
          </div>
        </div>
        <span class="badge ${status}">${statusLabel(status)}</span>
        <div class="room-secret"><span class="exam-meta">Password</span><span class="secret-value">${esc(ex.roomPassword)}</span></div>
        <span>${qCount} question${qCount === 1 ? '' : 's'}</span>
        <div class="room-actions">
          <button type="button" class="text-btn" onclick="copyRoomCode('${esc(ex.roomCode)}', this)">Copy code</button>
          <button type="button" class="text-btn" onclick="viewRoom('${ex.id}')">View</button>
          ${action}
        </div>
      </div>
    `;
  }).join('');
}

/* Student history now follows the Student ID created on this browser. */
function renderStudentHistory() {
  const db = getDB();
  const studentId = examoraGetStudentId();
  const email = sessionStorage.getItem('examora_student_email') || 'student@example.com';
  const attempts = db.attempts.filter(a => a.studentId ? a.studentId === studentId : a.studentEmail === email);
  const box = getElement('historyList');
  if (!box) return;

  box.innerHTML = attempts.length
    ? attempts.map(attempt => {
        const exam = db.exams.find(e => e.id === attempt.examId);
        const checked = attempt.gradingStatus === 'checked';
        return `
          <div class="exam-row">
            <div>
              <b>${esc(exam?.title || 'Exam')}</b>
              <div class="exam-meta">${esc(attempt.submittedAt)} • Student ID: ${esc(attempt.studentId || '—')}</div>
            </div>
            <span>${checked ? `${attempt.score}/${attempt.total}` : '—'}</span>
            <span class="badge ${checked ? 'published' : 'review'}">${checked ? 'Checked' : 'Under review'}</span>
          </div>
        `;
      }).join('')
    : `<div class="empty">No examination history.</div>`;
}

/* Remove "Demo" from the examiner identity without changing the stored email. */
function examoraCleanExaminerIdentity() {
  const name = getElement('examinerName');
  if (name) name.textContent = 'Examiner';
}

/* Keep admin access hidden from normal users on the mobile drawer. */
function examoraProtectMobileAdminLink() {
  const drawer = document.getElementById('examoraMobileDrawer');
  if (!drawer) return;
  const adminLink = Array.from(drawer.querySelectorAll('a')).find(a =>
    String(a.getAttribute('href') || '').toLowerCase().includes('admin.html')
  );
  if (adminLink) adminLink.style.display = isAdminUser() ? '' : 'none';
}

/* Strengthen the existing frontend-only admin gate with an explicit administrator check. */
function isAdminUser() {
  const db = getDB();
  const email = String(db.user?.email || '').trim().toLowerCase();
  return email === 'examiner@example.com';
}

function requireAdmin() {
  if (!isAdminUser()) {
    showExamoraToast('Access denied. Only the administrator can access this section.', 'error', 'Admin Access');
    return false;
  }
  return true;
}

/* Re-export the updated functions so existing HTML onclick handlers keep working. */
window.initStudent = initStudent;
window.joinExam = joinExam;
window.renderStudentDashboard = renderStudentDashboard;
window.renderStudentHistory = renderStudentHistory;
window.renderResults = renderResults;
window.renderExaminerDashboard = renderExaminerDashboard;
window.isAdminUser = isAdminUser;
window.requireAdmin = requireAdmin;

/* Patch the live-exam submit function by ensuring every newly-created attempt gets Student ID. */
(function examoraPatchExistingAttempts() {
  try {
    const db = getDB();
    let changed = false;
    db.attempts.forEach(attempt => {
      if (!attempt.studentId && attempt.studentName) {
        attempt.studentId = 'LEGACY-' + String(attempt.id || uid('attempt')).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
        changed = true;
      }
    });
    if (changed) saveDB(db);
  } catch (error) {
    console.warn('Examora student ID migration skipped:', error);
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  examoraCleanExaminerIdentity();
  examoraEnsureStudentNameField();
  examoraShowStudentIdentityNotice();
  examoraProtectMobileAdminLink();
});
