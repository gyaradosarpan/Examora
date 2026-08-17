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
      name: 'Demo Examiner',
      email: 'examiner@example.com'
    }
  };
}

function getDB() {
  try {
    const data = JSON.parse(
      localStorage.getItem(DB_KEY)
    );

    if (!data) {
      return seedDB();
    }

    data.exams ||= [];
    data.questions ||= [];
    data.attempts ||= [];
    data.logs ||= [];
    data.user ||= {
      name: 'Demo Examiner',
      email: 'examiner@example.com'
    };

    return data;

  } catch (e) {
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

function esc(s) {
  return String(s ?? '').replace(
    /[&<>'"]/g,
    m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[m])
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
      .slice(-4)
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
    localStorage.getItem(
      'examora_dark'
    ) === 'true'
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
          showView(
            button.dataset.view
          );
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
          showView(
            button.dataset.view
          );
        }
      );

    });

  restoreTheme();
}

function showView(id) {

  document
    .querySelectorAll('.view')
    .forEach(view => {

      view.classList.remove(
        'active'
      );

    });

  const element =
    document.getElementById(
      'view-' + id
    );

  if (element) {
    element.classList.add(
      'active'
    );
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

  if (id === 'dashboard') {
    renderExaminerDashboard();
  }

  if (id === 'questions') {
    renderQuestionBank();
  }

  if (id === 'results') {
    renderResults();
  }

  if (id === 'audit') {
    renderAudit();
  }

  if (id === 'student-dashboard') {
    renderStudentDashboard();
  }

  if (id === 'history') {
    renderStudentHistory();
  }
}


/* =========================================================
   EXAM STATUS
   ========================================================= */

function getExamStartTime(exam) {

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

function formatStatus(exam) {

  const now = Date.now();

  const start =
    getExamStartTime(exam);

  const end =
    getExamEndTime(exam);

  if (
    Number.isNaN(start) ||
    Number.isNaN(end)
  ) {
    return 'upcoming';
  }

  if (now < start) {
    return 'upcoming';
  }

  if (now <= end) {
    return 'active';
  }

  return 'completed';
}


/* =========================================================
   EXAMINER INITIALIZATION
   ========================================================= */

function initExaminer() {

  setupNav();

  const db = getDB();

  const examinerName =
    document.getElementById(
      'examinerName'
    );

  if (examinerName) {
    examinerName.textContent =
      db.user.name;
  }

  const negative =
    document.getElementById(
      'negative'
    );

  if (negative) {

    negative.addEventListener(
      'change',
      e => {

        const input =
          document.getElementById(
            'negativeMarks'
          );

        if (input) {
          input.disabled =
            !e.target.checked;
        }

      }
    );

  }

  const examForm =
    document.getElementById(
      'examForm'
    );

  if (examForm) {

    examForm.addEventListener(
      'submit',
      createExam
    );

  }

  renderExaminerDashboard();

  if (location.hash) {

    showView(
      location.hash.slice(1)
    );

  }
}


/* =========================================================
   CREATE EXAM
   ========================================================= */

function createExam(e) {

  e.preventDefault();

  const db = getDB();

  const negativeEnabled =
    document.getElementById(
      'negative'
    )?.checked || false;

  const ex = {

    id: uid('exam'),

    title:
      document
        .getElementById('title')
        .value
        .trim(),

    subject:
      document
        .getElementById('subject')
        .value
        .trim(),

    date:
      document
        .getElementById('date')
        .value,

    startTime:
      document
        .getElementById('startTime')
        .value,

    duration:
      Number(
        document
          .getElementById('duration')
          .value
      ),

    passing:
      Number(
        document
          .getElementById('passing')
          .value
      ),

    maxStudents:
      document
        .getElementById('maxStudents')
        .value
        ? Number(
            document
              .getElementById('maxStudents')
              .value
          )
        : null,

    department:
      document
        .getElementById('department')
        .value
        .trim(),

    instructions:
      document
        .getElementById('instructions')
        .value
        .trim(),

    negative:
      negativeEnabled,

    negativeMarks:
      negativeEnabled
        ? Number(
            document
              .getElementById(
                'negativeMarks'
              )
              .value
          ) || 0
        : 0,

    roomCode: code(),

    roomPassword: password(),

    questionIds: [],

    created:
      new Date().toISOString()

  };

  if (
    !ex.title ||
    !ex.subject ||
    !ex.date ||
    !ex.startTime ||
    !ex.duration
  ) {

    alert(
      'Please fill all required examination fields.'
    );

    return;
  }

  db.exams.unshift(ex);

  saveDB(db);

  logEvent(
    `Created examination "${ex.title}" with room ${ex.roomCode}`
  );

  const form =
    document.getElementById(
      'examForm'
    );

  if (form) {
    form.reset();
  }

  const negativeMarks =
    document.getElementById(
      'negativeMarks'
    );

  if (negativeMarks) {
    negativeMarks.disabled =
      true;
  }

  renderExaminerDashboard();

  showRoomCreated(ex);
}


/* =========================================================
   ROOM CREATED MODAL
   ========================================================= */

function showRoomCreated(ex) {

  const modal =
    document.getElementById(
      'questionModal'
    );

  if (!modal) return;

  modal.classList.remove(
    'hidden'
  );

  modal.innerHTML = `

    <div class="modal-box">

      <button
        class="modal-close"
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
        Share these credentials with students.
        The room code is copyable.
        Keep the password private.
      </div>

      <div
        class="section-card"
        style="margin:0 0 14px"
      >

        <div class="exam-meta">
          ROOM CODE
        </div>

        <div
          style="
            font:800 28px 'Plus Jakarta Sans';
            margin:7px 0
          "
        >
          ${esc(ex.roomCode)}
        </div>

        <button
          class="btn btn-primary"
          onclick="copyRoomCode('${esc(ex.roomCode)}', this)"
        >
          Copy Room Code
        </button>

      </div>

      <div
        class="section-card"
        style="margin:0"
      >

        <div class="exam-meta">
          ROOM PASSWORD
        </div>

        <div
          style="
            font:800 28px monospace;
            margin:7px 0;
            letter-spacing:.08em
          "
        >
          ${esc(ex.roomPassword)}
        </div>

        <div class="security-note">
          Password is display-only.
          Keep it private.
        </div>

      </div>

      <button
        class="btn btn-secondary full"
        style="margin-top:14px"
        onclick="
          closeQuestionModal();
          showView('dashboard')
        "
      >
        Continue to Dashboard
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

  const copy = () => {

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
      .then(copy)
      .catch(() => {
        fallbackCopy(value);
        copy();
      });

  } else {

    fallbackCopy(value);
    copy();

  }
}

function fallbackCopy(text) {

  const textarea =
    document.createElement(
      'textarea'
    );

  textarea.value = text;

  textarea.style.position =
    'fixed';

  textarea.style.opacity = '0';

  document.body.appendChild(
    textarea
  );

  textarea.select();

  try {
    document.execCommand(
      'copy'
    );
  } catch (e) {}

  textarea.remove();
}


/* =========================================================
   EXAMINER DASHBOARD
   ========================================================= */

function renderExaminerDashboard() {

  const db = getDB();

  const active =
    db.exams.filter(
      x =>
        formatStatus(x) ===
        'active'
    ).length;

  const upcoming =
    db.exams.filter(
      x =>
        formatStatus(x) ===
        'upcoming'
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
    document.getElementById(
      'activeCount'
    );

  if (activeCount) {
    activeCount.textContent =
      active;
  }

  const upcomingCount =
    document.getElementById(
      'upcomingCount'
    );

  if (upcomingCount) {
    upcomingCount.textContent =
      upcoming;
  }

  const completedCount =
    document.getElementById(
      'completedCount'
    );

  if (completedCount) {
    completedCount.textContent =
      completed;
  }

  const studentCount =
    document.getElementById(
      'studentCount'
    );

  if (studentCount) {
    studentCount.textContent =
      students;
  }

  const box =
    document.getElementById(
      'examList'
    );

  if (!box) return;

  if (!db.exams.length) {

    box.innerHTML =
      `
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

        return `

          <div class="exam-row">

            <div>

              <b>
                ${esc(ex.title)}
              </b>

              <div class="exam-meta">
                ${esc(ex.subject)}
                • ${esc(ex.date)}
                ${esc(ex.startTime)}
                • Room ${esc(ex.roomCode)}
              </div>

            </div>

            <span
              class="badge ${status}"
            >
              ${status}
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
              ${
                ex.questionIds?.length ||
                0
              }
              questions
            </span>

            <div class="room-actions">

              <button
                class="text-btn"
                onclick="
                  copyRoomCode(
                    '${esc(ex.roomCode)}',
                    this
                  )
                "
              >
                Copy code
              </button>

              <button
                class="text-btn"
                onclick="
                  viewRoom('${ex.id}')
                "
              >
                View
              </button>

            </div>

          </div>

        `;

      })
      .join('');
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
    ex.questionIds?.length ||
    0;

  const modal =
    document.getElementById(
      'questionModal'
    );

  if (!modal) return;

  modal.classList.remove(
    'hidden'
  );

  modal.innerHTML = `

    <div class="modal-box">

      <button
        class="modal-close"
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
          ROOM CODE
        </div>

        <strong
          style="font:800 26px monospace"
        >
          ${esc(ex.roomCode)}
        </strong>

        <br>

        <button
          class="btn btn-primary"
          style="margin-top:10px"
          onclick="
            copyRoomCode(
              '${esc(ex.roomCode)}',
              this
            )
          "
        >
          Copy Room Code
        </button>

      </div>

      <div class="section-card">

        <div class="exam-meta">
          ROOM PASSWORD
        </div>

        <strong
          style="font:800 26px monospace"
        >
          ${esc(ex.roomPassword)}
        </strong>

        <div class="security-note">
          Display only.
          Password copy is disabled.
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

        <br>

        Status:
        <b>
          ${formatStatus(ex)}
        </b>

      </div>

      <div
        style="
          display:flex;
          gap:10px;
          margin-top:14px
        "
      >

        <button
          class="btn btn-secondary"
          style="flex:1"
          onclick="closeQuestionModal()"
        >
          Close
        </button>

        <button
          class="btn btn-danger"
          style="flex:1"
          onclick="
            deleteExam('${ex.id}')
          "
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
    ex.questionIds?.length ||
    0;

  const message =
    `Delete the examination "${ex.title}"?\n\n` +
    `Room: ${ex.roomCode}\n` +
    `Questions: ${questionCount}\n` +
    `Student attempts: ${attempts}\n\n` +
    `This will permanently delete the exam room and its questions/submissions.`;

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
    document.getElementById(
      'questionModal'
    );

  if (!modal) return;

  modal.classList.remove(
    'hidden'
  );

  modal.innerHTML = `

    <div class="modal-box">

      <button
        class="modal-close"
        onclick="closeQuestionModal()"
      >
        ×
      </button>

      <h2>
        Add question
      </h2>

      <form id="questionForm">

        <label>

          Question type

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

          Add to examination

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

            Negative marks

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
    document.getElementById(
      'qType'
    );

  if (type) {

    type.addEventListener(
      'change',
      updateQuestionFields
    );

  }

  const form =
    document.getElementById(
      'questionForm'
    );

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
    document.getElementById(
      'questionModal'
    );

  if (!modal) return;

  modal.classList.add(
    'hidden'
  );

  modal.innerHTML = '';
}


/* =========================================================
   QUESTION TYPE FIELDS
   ========================================================= */

function updateQuestionFields() {

  const type =
    document.getElementById(
      'qType'
    )?.value;

  if (!type) return;

  const options =
    document.getElementById(
      'qOptions'
    );

  const correctWrap =
    document.getElementById(
      'correctWrap'
    );

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
        Correct answer
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
          True / False question
        </b>

        <br>

        Students will see only
        True and False.

      </div>

    `;

    correctWrap.innerHTML = `

      <span class="field-title">
        Correct answer
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
          Numerical question
        </b>

        <br>

        Students will enter a number.
        The system compares it with
        the expected value.

      </div>

    `;

    correctWrap.innerHTML = `

      <span class="field-title">
        Expected numerical answer
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
    document.getElementById(
      'qType'
    ).value;

  const examId =
    document.getElementById(
      'qExam'
    )?.value;

  if (!examId) {

    alert(
      'Create an examination room first.'
    );

    return;
  }

  const questionText =
    document
      .getElementById('qText')
      .value
      .trim();

  if (!questionText) {

    alert(
      'Please enter the question.'
    );

    return;
  }

  const marks =
    Number(
      document.getElementById(
        'qMarks'
      ).value
    );

  const negativeMarks =
    Number(
      document.getElementById(
        'qNegative'
      ).value
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

  const correctElement =
    document.getElementById(
      'correct'
    );

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
              document.getElementById(
                'a'
              ).value.trim(),

            B:
              document.getElementById(
                'b'
              ).value.trim(),

            C:
              document.getElementById(
                'c'
              ).value.trim(),

            D:
              document.getElementById(
                'd'
              ).value.trim()
          }
        : null,

    manual:
      ['short', 'long']
        .includes(type)

  };

  db.questions.unshift(q);

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

  ex.questionIds ||= [];

  ex.questionIds.push(
    q.id
  );

  saveDB(db);

  logEvent(
    `Added ${type.toUpperCase()} question to "${ex.title}"`
  );

  closeQuestionModal();

  renderQuestionBank();
}


/* =========================================================
   QUESTION BANK
   ========================================================= */

function renderQuestionBank() {

  const db = getDB();

  const box =
    document.getElementById(
      'questionBank'
    );

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
    document.getElementById(
      'resultsTable'
    );

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
              class="text-btn"
              onclick="
                openGrading('${a.id}')
              "
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

function openGrading(
  attemptId
) {

  const db = getDB();

  const attempt =
    db.attempts.find(
      x =>
        x.id === attemptId
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
    document.getElementById(
      'resultsTable'
    );

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
                    x.id ===
                    attemptId
                      ? 'selected'
                      : ''
                  }
                "
                onclick="
                  openGrading('${x.id}')
                "
              >

                <b>
                  ${esc(
                    x.studentName
                  )}
                </b>

                <span>
                  ${esc(
                    xExam?.title ||
                    ''
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
            class="btn btn-secondary"
            onclick="
              renderResults()
            "
          >
            Back to results
          </button>

          <button
            class="btn btn-primary"
            onclick="
              saveGrading('${attempt.id}')
            "
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

function saveGrading(
  attemptId
) {

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
    document.getElementById(
      'auditList'
    );

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
    document.getElementById(
      'joinForm'
    );

  if (joinForm) {

    joinForm.addEventListener(
      'submit',
      joinExam
    );

  }

  renderStudentDashboard();

  if (location.hash) {

    showView(
      location.hash.slice(1)
    );

  }
}


/* =========================================================
   STUDENT DASHBOARD
   ========================================================= */

function renderStudentDashboard() {

  const db = getDB();

  const box =
    document.getElementById(
      'studentExamList'
    );

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

                      ${esc(
                        exam.startTime
                      )}

                    </div>

                  </div>

                  <span
                    class="badge ${status}"
                  >
                    ${status}
                  </span>

                  <span>
                    ${exam.duration}
                    min
                  </span>

                  <span>
                    ${
                      exam.questionIds
                        ?.length || 0
                    }
                    questions
                  </span>

                  <button
                    class="text-btn"
                    onclick="
                      document.getElementById(
                        'roomCode'
                      ).value =
                        '${esc(exam.roomCode)}';

                      showView('join');
                    "
                  >
                    Join
                  </button>

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
    document.getElementById(
      'studentResults'
    );

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

function joinExam(e) {

  e.preventDefault();

  const db = getDB();

  const roomCode =
    document
      .getElementById(
        'roomCode'
      )
      .value
      .trim()
      .toUpperCase();

  const roomPassword =
    document
      .getElementById(
        'roomPassword'
      )
      .value
      .trim();

  const message =
    document.getElementById(
      'joinMessage'
    );

  const exam =
    db.exams.find(
      x =>
        String(
          x.roomCode
        ).toUpperCase() ===
        roomCode
    );

  if (
    !exam ||
    exam.roomPassword !==
      roomPassword
  ) {

    if (message) {

      message.innerHTML = `
        <div
          class="notice"
          style="
            background:#fff0f1;
            color:#a73542
          "
        >
          Room code or password is incorrect.
        </div>
      `;

    }

    return;
  }

  const status =
    formatStatus(exam);

  if (status === 'completed') {

    if (message) {

      message.innerHTML = `
        <div class="notice">
          This examination has already ended.
        </div>
      `;

    }

    return;
  }

  if (
    !exam.questionIds ||
    !exam.questionIds.length
  ) {

    if (message) {

      message.innerHTML = `
        <div class="notice">
          This room has no questions yet.
          Ask your examiner to add questions.
        </div>
      `;

    }

    return;
  }

  sessionStorage.setItem(
    'examora_current_exam',
    exam.id
  );

  sessionStorage.setItem(
    'examora_student',
    'Demo Student'
  );

  sessionStorage.removeItem(
    'examora_answers'
  );

  sessionStorage.removeItem(
    'examora_reviews'
  );

  location.href =
    'exam.html';
}


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

    location.href =
      'student.html';

    return;
  }

  const scheduledStart =
    getExamStartTime(exam);

  const scheduledEnd =
    getExamEndTime(exam);

  const now =
    Date.now();

  if (
    Number.isNaN(
      scheduledStart
    ) ||
    Number.isNaN(
      scheduledEnd
    )
  ) {

    alert(
      'This examination has an invalid schedule.'
    );

    location.href =
      'student.html';

    return;
  }

  if (now < scheduledStart) {

    alert(
      `This examination has not started yet.\n\nStart time: ${exam.date} ${exam.startTime}`
    );

    location.href =
      'student.html';

    return;
  }

  if (now >= scheduledEnd) {

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
    document.getElementById(
      'liveExamTitle'
    );

  if (title) {
    title.textContent =
      exam.title;
  }

  function saveProgress() {

    sessionStorage.setItem(
      'examora_answers',
      JSON.stringify(
        answers
      )
    );

    const state =
      document.getElementById(
        'saveState'
      );

    if (state) {
      state.textContent =
        'Saved ✓';
    }
  }

  function render() {

    const question =
      questions[index];

    if (!question) return;

    const number =
      document.getElementById(
        'questionNumber'
      );

    if (number) {

      number.textContent =
        `Question ${
          index + 1
        }`;

    }

    const marks =
      document.getElementById(
        'questionMarks'
      );

    if (marks) {

      marks.textContent =
        `${question.marks} mark${
          question.marks == 1
            ? ''
            : 's'
        }`;

    }

    const text =
      document.getElementById(
        'questionText'
      );

    if (text) {

      text.textContent =
        question.text;

    }

    const progress =
      document.getElementById(
        'progressText'
      );

    if (progress) {

      progress.textContent =
        `${index + 1} / ${
          questions.length
        }`;

    }

    const value =
      answers[
        question.id
      ] ?? '';

    let html = '';

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
                    value ===
                    letter
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
                    value ===
                    letter
                      ? 'checked'
                      : ''
                  }
                >

                <b>
                  ${letter}.
                </b>

                ${esc(
                  question
                    .options?.[
                      letter
                    ] || ''
                )}

              </label>

            `)
            .join('')}

        </div>

      `;

    }

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
                    value ===
                    answerValue
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
                    value ===
                    answerValue
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

    else if (
      question.type ===
      'numerical'
    ) {

      html = `

        <input
          id="textAnswer"
          type="number"
          step="any"
          placeholder="
            Enter your numerical answer...
          "
          value="${esc(value)}"
        >

      `;

    }

    else {

      html = `

        <textarea
          id="textAnswer"
          rows="8"
          placeholder="
            Write your answer here...
          "
        >${esc(value)}</textarea>

      `;

    }

    const answerArea =
      document.getElementById(
        'answerArea'
      );

    if (answerArea) {

      answerArea.innerHTML =
        html;

    }

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

    document
      .getElementById(
        'textAnswer'
      )
      ?.addEventListener(
        'input',
        event => {

          answers[
            question.id
          ] =
            event.target.value;

          saveProgress();

        }
      );

    const answeredCount =
      document.getElementById(
        'answeredCount'
      );

    if (answeredCount) {

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

    const reviewButton =
      document.getElementById(
        'reviewButton'
      );

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

    const navGrid =
      document.getElementById(
        'questionNavGrid'
      );

    if (navGrid) {

      navGrid.innerHTML =
        questions
          .map(
            (q, i) => `

              <button
                class="
                  ${
                    String(
                      answers[
                        q.id
                      ] ?? ''
                    ).trim()
                      ? 'answered'
                      : ''
                  }

                  ${
                    reviews[
                      q.id
                    ]
                      ? 'review'
                      : ''
                  }
                "
                onclick="
                  window.examGo(${i})
                "
              >
                ${i + 1}
              </button>

            `
          )
          .join('');

    }

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
        'Demo Student',

      studentEmail:
        'student@example.com',

      submittedAt:
        new Date()
          .toLocaleString(),

      total:
        questions.reduce(
          (sum, q) =>
            sum +
            Number(
              q.marks
            ),
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

          if (
            !question.manual
          ) {

            if (correct) {

              awarded =
                Number(
                  question.marks
                );

            }

            else if (
              cleanValue !== '' &&
              question.negativeMarks >
                0
            ) {

              awarded =
                -Number(
                  question
                    .negativeMarks
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
     * Optional: prevent negative
     * total score.
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

    const remaining =
      Math.max(
        0,
        scheduledEnd -
          Date.now()
      );

    const minutes =
      Math.floor(
        remaining /
          60000
      );

    const seconds =
      Math.floor(
        remaining /
          1000
      ) % 60;

    const timer =
      document.getElementById(
        'timer'
      );

    if (timer) {

      timer.textContent =
        `${String(
          minutes
        ).padStart(
          2,
          '0'
        )}:${String(
          seconds
        ).padStart(
          2,
          '0'
        )}`;

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
    document.getElementById(
      'resultTitle'
    );

  if (title) {

    title.textContent =
      exam?.title ||
      'Result';

  }

  const score =
    document.getElementById(
      'resultScore'
    );

  if (score) {
    score.textContent =
      attempt.score;
  }

  const total =
    document.getElementById(
      'resultTotal'
    );

  if (total) {
    total.textContent =
      attempt.total;
  }

  const percent =
    document.getElementById(
      'resultPercent'
    );

  if (percent) {

    percent.textContent =
      (
        attempt.total
          ? (
              attempt.score /
              attempt.total
            ) *
            100
          : 0
      ).toFixed(1) +
      '%';

  }

  const correct =
    document.getElementById(
      'resultCorrect'
    );

  if (correct) {

    correct.textContent =
      attempt.answers.filter(
        answer =>
          answer.isCorrect
      ).length;

  }

  const status =
    document.getElementById(
      'resultStatus'
    );

  if (status) {

    status.textContent =
      attempt.gradingStatus ===
      'checked'
        ? 'Checked'
        : 'Under review';

  }

  const note =
    document.getElementById(
      'resultNote'
    );

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
    document.getElementById(
      'historyList'
    );

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
   GLOBAL INITIALIZATION SUPPORT
   ========================================================= */

window.addEventListener(
  'DOMContentLoaded',
  () => {

    restoreTheme();

  }
);
