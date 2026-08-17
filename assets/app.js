/* =========================================================
   EXAMORA - MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   EXAMORA NOTIFICATIONS
   Replaces browser alert() messages with Examora toasts.
   ========================================================= */

function showExamoraToast(message, type = 'info', title = '') {
  const allowedTypes = [
    'success',
    'error',
    'warning',
    'info'
  ];

  const safeType =
    allowedTypes.includes(type)
      ? type
      : 'info';

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

  toast.className =
    `examora-toast ${safeType}`;

  const icon =
    document.createElement('div');

  icon.className =
    'examora-toast-icon';

  icon.textContent =
    icons[safeType];

  const content =
    document.createElement('div');

  content.className =
    'examora-toast-content';

  const titleElement =
    document.createElement('span');

  titleElement.className =
    'examora-toast-title';

  titleElement.textContent =
    title || titles[safeType];

  const messageElement =
    document.createElement('span');

  messageElement.className =
    'examora-toast-message';

  messageElement.textContent =
    String(message ?? '');

  content.appendChild(
    titleElement
  );

  content.appendChild(
    messageElement
  );

  const closeBtn =
    document.createElement('button');

  closeBtn.className =
    'examora-toast-close';

  closeBtn.type =
    'button';

  closeBtn.setAttribute(
    'aria-label',
    'Close notification'
  );

  closeBtn.textContent =
    '×';

  toast.appendChild(icon);

  toast.appendChild(content);

  toast.appendChild(closeBtn);

  container.appendChild(toast);

  let removed = false;

  const removeToast = () => {
    if (
      removed ||
      !toast.isConnected
    ) {
      return;
    }

    removed = true;

    toast.classList.add(
      'hide'
    );

    window.setTimeout(() => {
      if (toast.isConnected) {
        toast.remove();
      }
    }, 220);
  };

  closeBtn.addEventListener(
    'click',
    removeToast
  );

  window.setTimeout(
    removeToast,
    3500
  );
}


/* =========================================================
   EXAMORA NOTIFICATION HELPERS
   ========================================================= */

function examoraSuccess(
  message,
  title = 'Success'
) {
  showExamoraToast(
    message,
    'success',
    title
  );
}


function examoraError(
  message,
  title = 'Error'
) {
  showExamoraToast(
    message,
    'error',
    title
  );
}


function examoraWarning(
  message,
  title = 'Warning'
) {
  showExamoraToast(
    message,
    'warning',
    title
  );
}


function examoraInfo(
  message,
  title = 'Notice'
) {
  showExamoraToast(
    message,
    'info',
    title
  );
}


/* =========================================================
   DATABASE
   ========================================================= */

const DB_KEY =
  'examora_db_v2';


const DEFAULT_DB = {
  users: [],
  exams: [],
  questions: [],
  attempts: [],
  events: []
};


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function getElement(id) {
  return document.getElementById(id);
}


function uid(prefix = 'id') {
  return (
    prefix +
    '_' +
    Date.now() +
    '_' +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );
}


function saveDB(db) {
  localStorage.setItem(
    DB_KEY,
    JSON.stringify(db)
  );
}


function getDB() {
  const raw =
    localStorage.getItem(DB_KEY);

  if (!raw) {
    const fresh = {
      ...DEFAULT_DB
    };

    saveDB(fresh);

    return fresh;
  }

  try {
    const parsed =
      JSON.parse(raw);

    return {
      ...DEFAULT_DB,
      ...parsed
    };
  } catch (error) {
    console.error(
      'Unable to read Examora database:',
      error
    );

    const fresh = {
      ...DEFAULT_DB
    };

    saveDB(fresh);

    return fresh;
  }
}


function logEvent(message) {
  const db = getDB();

  if (!Array.isArray(db.events)) {
    db.events = [];
  }

  db.events.unshift({
    id: uid('event'),
    message,
    created:
      new Date().toISOString()
  });

  saveDB(db);
}


function escapeHTML(value) {
  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );
}


function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  );
}


function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}


function code(length = 6) {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let result = '';

  for (
    let i = 0;
    i < length;
    i++
  ) {
    result +=
      chars[
        Math.floor(
          Math.random() *
            chars.length
        )
      ];
  }

  return result;
}


function password(length = 8) {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

  let result = '';

  for (
    let i = 0;
    i < length;
    i++
  ) {
    result +=
      chars[
        Math.floor(
          Math.random() *
            chars.length
        )
      ];
  }

  return result;
}


/* =========================================================
   USER HELPERS
   ========================================================= */

function getCurrentUser() {
  const db = getDB();

  return db.user || null;
}


function setCurrentUser(user) {
  const db = getDB();

  db.user = user;

  saveDB(db);
}


function clearCurrentUser() {
  const db = getDB();

  delete db.user;

  saveDB(db);
}


function isLoggedIn() {
  return !!getCurrentUser();
}


/* =========================================================
   ROLE HELPERS
   ========================================================= */

function isTeacher() {
  const user =
    getCurrentUser();

  return (
    user &&
    (
      user.role === 'teacher' ||
      user.role === 'examiner'
    )
  );
}


function isStudent() {
  const user =
    getCurrentUser();

  return (
    user &&
    user.role === 'student'
  );
}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function loginUser(
  email,
  passwordValue
) {
  const db = getDB();

  const normalizedEmail =
    String(email || '')
      .trim()
      .toLowerCase();

  const user =
    db.users.find(
      u =>
        String(
          u.email || ''
        )
          .trim()
          .toLowerCase() ===
          normalizedEmail &&
        u.password ===
          passwordValue
    );

  if (!user) {
    return null;
  }

  setCurrentUser(user);

  logEvent(
    `User logged in: ${user.email}`
  );

  return user;
}


function registerUser(
  name,
  email,
  passwordValue,
  role
) {
  const db = getDB();

  const normalizedEmail =
    String(email || '')
      .trim()
      .toLowerCase();

  const existing =
    db.users.find(
      u =>
        String(
          u.email || ''
        )
          .trim()
          .toLowerCase() ===
        normalizedEmail
    );

  if (existing) {
    return {
      success: false,
      message:
        'An account with this email already exists.'
    };
  }

  const user = {
    id: uid('user'),
    name:
      String(name || '')
        .trim(),
    email:
      normalizedEmail,
    password:
      passwordValue,
    role:
      role || 'student',
    created:
      new Date().toISOString()
  };

  db.users.push(user);

  saveDB(db);

  logEvent(
    `Registered user ${user.email}`
  );

  return {
    success: true,
    user
  };
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutUser() {
  const user =
    getCurrentUser();

  if (user) {
    logEvent(
      `User logged out: ${user.email}`
    );
  }

  clearCurrentUser();

  location.href =
    'index.html';
}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {
    initializeExamora();
  }
);


function initializeExamora() {

  /*
   * Page-specific initialization
   * is handled below.
   */

  const page =
    document.body?.dataset?.page;

  if (page === 'login') {
    initializeLoginPage();
  }

  if (page === 'register') {
    initializeRegisterPage();
  }

  if (page === 'examiner') {
    initializeExaminerPage();
  }

  if (page === 'student') {
    initializeStudentPage();
  }

  if (page === 'exam') {
    initializeExamPage();
  }

  if (page === 'result') {
    initializeResultPage();
  }

  if (page === 'admin') {
    initializeAdminPage();
  }
}


/* =========================================================
   LOGIN PAGE
   ========================================================= */

function initializeLoginPage() {

  const form =
    getElement('loginForm');

  if (!form) {
    return;
  }

  form.addEventListener(
    'submit',
    event => {
      event.preventDefault();

      const email =
        getElement('loginEmail')
          ?.value
          ?.trim();

      const passwordValue =
        getElement('loginPassword')
          ?.value;

      if (
        !email ||
        !passwordValue
      ) {
        showExamoraToast(
          'Please enter your email and password.',
          'warning'
        );

        return;
      }

      const user =
        loginUser(
          email,
          passwordValue
        );

      if (!user) {
        showExamoraToast(
          'Invalid email or password.',
          'error'
        );

        return;
      }

      showExamoraToast(
        'Login successful.',
        'success'
      );

      setTimeout(() => {
        if (
          user.role ===
          'student'
        ) {
          location.href =
            'student.html';
        } else {
          location.href =
            'examiner.html';
        }
      }, 500);
    }
  );
}


/* =========================================================
   REGISTER PAGE
   ========================================================= */

function initializeRegisterPage() {

  const form =
    getElement('registerForm');

  if (!form) {
    return;
  }

  form.addEventListener(
    'submit',
    event => {
      event.preventDefault();

      const name =
        getElement('registerName')
          ?.value
          ?.trim();

      const email =
        getElement('registerEmail')
          ?.value
          ?.trim();

      const passwordValue =
        getElement('registerPassword')
          ?.value;

      const role =
        getElement('registerRole')
          ?.value ||
        'student';

      if (
        !name ||
        !email ||
        !passwordValue
      ) {
        showExamoraToast(
          'Please fill all required fields.',
          'warning'
        );

        return;
      }

      const result =
        registerUser(
          name,
          email,
          passwordValue,
          role
        );

      if (!result.success) {
        showExamoraToast(
          result.message,
          'error'
        );

        return;
      }

      showExamoraToast(
        'Account created successfully.',
        'success'
      );

      setTimeout(() => {
        location.href =
          'login.html';
      }, 700);
    }
  );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function goToPage(page) {
  location.href = page;
}


function goBack() {
  window.history.back();
}


/* =========================================================
   EXAMINATION CREATION
   ========================================================= */

function createExamination() {

  const title =
    getElement('examTitle')
      ?.value
      ?.trim();

  const subject =
    getElement('examSubject')
      ?.value
      ?.trim();

  const date =
    getElement('examDate')
      ?.value;

  const startTime =
    getElement('examStartTime')
      ?.value;

  const duration =
    Number(
      getElement('examDuration')
        ?.value
    );

  const passing =
    Number(
      getElement('examPassing')
        ?.value
    );

  const maxStudentsValue =
    getElement('examMaxStudents')
      ?.value;

  const department =
    getElement('examDepartment')
      ?.value
      ?.trim();

  const instructions =
    getElement('examInstructions')
      ?.value
      ?.trim();

  const negativeEnabled =
    !!getElement(
      'negativeMarking'
    )?.checked;

  const negativeMarksInput =
    Number(
      getElement('negativeMarks')
        ?.value
    );

  if (
    !title ||
    !subject ||
    !date ||
    !startTime ||
    !Number.isFinite(
      duration
    ) ||
    duration <= 0
  ) {

    showExamoraToast(
      'Please fill all required examination fields.',
      'warning'
    );

    return;
  }

  const db = getDB();

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
        ? Number(
            maxStudentsValue
          )
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
    status:
      'waiting',

    created:
      new Date().toISOString()
  };

  db.exams.unshift(ex);

  saveDB(db);

  logEvent(
    `Created examination "${ex.title}" with room ${ex.roomCode}`
  );

  showExamoraToast(
    `Examination "${ex.title}" created successfully.`,
    'success'
  );

  renderExaminerDashboard();
   /* =========================================================
   EXAMINER DASHBOARD
   ========================================================= */

function startExam(examId) {

  const db = getDB();

  const exam =
    db.exams.find(
      x => x.id === examId
    );

  if (!exam) {

    showExamoraToast(
      'Examination not found.',
      'error'
    );

    return;
  }

  if (exam.startedAt) {

    showExamoraToast(
      'This examination has already started.',
      'warning'
    );

    return;
  }

  const questionCount =
    exam.questionIds?.length || 0;

  if (questionCount === 0) {

    showExamoraToast(
      'You cannot start the examination yet. Please add all questions first.',
      'warning'
    );

    return;
  }

  const confirmation =
    confirm(
      `Start "${exam.title}" now?\n\n` +
      `${questionCount} question(s) are ready.\n` +
      `The ${exam.duration}-minute timer will start immediately.\n\n` +
      `Students joining later will receive only the remaining time.`
    );

  if (!confirmation) {
    return;
  }

  /*
   * ACTUAL START TIME
   */
  exam.startedAt =
    new Date().toISOString();

  exam.status =
    'active';

  saveDB(db);

  logEvent(
    `Started examination "${exam.title}" with room ${exam.roomCode}`
  );

  renderExaminerDashboard();

  showExamoraToast(
    `Exam "${exam.title}" has started. The ${exam.duration}-minute timer is now running.`,
    'success'
  );
}


/* =========================================================
   EXAMINER DASHBOARD
   ========================================================= */

function renderExaminerDashboard() {

  const db = getDB();

  /*
   * Automatically mark exams completed
   * when their timer has expired.
   */

  const now =
    Date.now();

  db.exams.forEach(
    exam => {

      if (
        !exam.startedAt ||
        exam.status === 'completed'
      ) {
        return;
      }

      const start =
        new Date(
          exam.startedAt
        ).getTime();

      const end =
        start +
        (
          Number(
            exam.duration
          ) || 0
        ) *
        60 *
        1000;

      if (
        Number.isFinite(end) &&
        now >= end
      ) {
        exam.status =
          'completed';

        if (
          !exam.completedAt
        ) {
          exam.completedAt =
            new Date().toISOString();
        }
      }
    }
  );

  saveDB(db);

  const container =
    getElement(
      'examinerExamList'
    );

  if (!container) {
    return;
  }

  const exams =
    Array.isArray(db.exams)
      ? db.exams
      : [];

  if (!exams.length) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>No examinations yet</h3>
        <p>Create an examination room to get started.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    exams
      .map(
        exam => {

          const questionCount =
            exam.questionIds?.length ||
            0;

          const status =
            exam.status ||
            (
              exam.startedAt
                ? 'active'
                : 'waiting'
            );

          const statusLabel =
            status
              .charAt(0)
              .toUpperCase() +
            status.slice(1);

          return `
            <div class="exam-card">

              <div class="exam-card-header">

                <div>
                  <h3>
                    ${escapeHTML(
                      exam.title
                    )}
                  </h3>

                  <p>
                    ${escapeHTML(
                      exam.subject
                    )}
                  </p>
                </div>

                <span
                  class="exam-status ${escapeHTML(
                    status
                  )}"
                >
                  ${escapeHTML(
                    statusLabel
                  )}
                </span>

              </div>

              <div class="exam-card-details">

                <div>
                  <strong>Date</strong>
                  <span>
                    ${escapeHTML(
                      formatDate(
                        exam.date
                      )
                    )}
                  </span>
                </div>

                <div>
                  <strong>Start</strong>
                  <span>
                    ${escapeHTML(
                      exam.startTime
                    )}
                  </span>
                </div>

                <div>
                  <strong>Duration</strong>
                  <span>
                    ${escapeHTML(
                      exam.duration
                    )} min
                  </span>
                </div>

                <div>
                  <strong>Questions</strong>
                  <span>
                    ${questionCount}
                  </span>
                </div>

                <div>
                  <strong>Room</strong>
                  <span>
                    ${escapeHTML(
                      exam.roomCode
                    )}
                  </span>
                </div>

              </div>

              <div class="exam-card-actions">

                ${
                  !exam.startedAt
                    ? `
                      <button
                        type="button"
                        onclick="startExam('${exam.id}')"
                      >
                        Start Exam
                      </button>
                    `
                    : ''
                }

                <button
                  type="button"
                  onclick="openQuestionManager('${exam.id}')"
                >
                  Questions
                </button>

                <button
                  type="button"
                  onclick="viewExamResults('${exam.id}')"
                >
                  Results
                </button>

                <button
                  type="button"
                  onclick="deleteExam('${exam.id}')"
                >
                  Delete
                </button>

              </div>

            </div>
          `;
        }
      )
      .join('');
}


/* =========================================================
   EXAM DELETE
   ========================================================= */

function deleteExam(examId) {

  const db = getDB();

  const ex =
    db.exams.find(
      x => x.id === examId
    );

  if (!ex) {

    showExamoraToast(
      'Examination not found.',
      'error'
    );

    return;
  }

  const questionCount =
    ex.questionIds?.length ||
    0;

  const attempts =
    db.attempts.filter(
      attempt =>
        attempt.examId ===
        examId
    ).length;

  const message =
    `Delete examination?\n\n` +
    `Exam: ${ex.title}\n` +
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

  db.questions =
    db.questions.filter(
      question =>
        !deletedQuestionIds.has(
          question.id
        )
    );

  db.exams =
    db.exams.filter(
      exam =>
        exam.id !== examId
    );

  db.attempts =
    db.attempts.filter(
      attempt =>
        attempt.examId !==
        examId
    );

  saveDB(db);

  logEvent(
    `Deleted examination "${ex.title}"`
  );

  closeQuestionModal();

  renderExaminerDashboard();

  showExamoraToast(
    `Exam "${ex.title}" has been deleted successfully.`,
    'success'
  );
}


/* =========================================================
   QUESTION MODAL
   ========================================================= */

function openQuestionManager(
  examId
) {

  const modal =
    getElement(
      'questionModal'
    );

  const examSelect =
    getElement('qExam');

  if (examSelect) {
    examSelect.value =
      examId;
  }

  if (modal) {
    modal.classList.add(
      'open'
    );
  }

  renderQuestionList();
}


function closeQuestionModal() {

  const modal =
    getElement(
      'questionModal'
    );

  if (!modal) {
    return;
  }

  modal.classList.remove(
    'open'
  );
}


/* =========================================================
   QUESTION FORM
   ========================================================= */

function addQuestion() {

  const db = getDB();

  const examId =
    getElement('qExam')?.value;

  if (!examId) {

    showExamoraToast(
      'Create an examination room first.',
      'warning'
    );

    return;
  }

  const questionText =
    getElement('qText')
      ?.value
      ?.trim();

  if (!questionText) {

    showExamoraToast(
      'Please enter the question.',
      'warning'
    );

    return;
  }

  const type =
    getElement('qType')
      ?.value ||
    'mcq';

  const marks =
    Number(
      getElement('qMarks')
        ?.value
    );

  if (
    !Number.isFinite(marks) ||
    marks <= 0
  ) {

    showExamoraToast(
      'Marks must be greater than 0.',
      'warning'
    );

    return;
  }

  const negativeMarks =
    Number(
      getElement(
        'qNegativeMarks'
      )?.value
    );

  if (
    !Number.isFinite(
      negativeMarks
    ) ||
    negativeMarks < 0
  ) {

    showExamoraToast(
      'Negative marks cannot be negative.',
      'warning'
    );

    return;
  }

  const ex =
    db.exams.find(
      x => x.id === examId
    );

  if (!ex) {

    showExamoraToast(
      'Selected examination was not found.',
      'error'
    );

    return;
  }

  /*
   * Do not allow changing questions after
   * the teacher has started the exam.
   */

  if (ex.startedAt) {

    showExamoraToast(
      'This examination has already started. You cannot add more questions now.',
      'warning'
    );

    return;
  }

  const correct =
    getElement(
      'qCorrect'
    )?.value
      ?.trim();

  if (
    type === 'mcq' &&
    !correct
  ) {

    showExamoraToast(
      'Please select the correct MCQ option.',
      'warning'
    );

    return;
  }

  if (
    type === 'truefalse' &&
    !correct
  ) {

    showExamoraToast(
      'Please select True or False.',
      'warning'
    );

    return;
  }

  if (
    type === 'numerical' &&
    !correct
  ) {

    showExamoraToast(
      'Please enter the expected numerical answer.',
      'warning'
    );

    return;
  }

  const question = {
    id: uid('question'),

    examId,

    type,

    text:
      questionText,

    marks,

    negativeMarks:

      Number.isFinite(
        negativeMarks
      )
        ? negativeMarks
        : 0,

    correct,

    created:
      new Date().toISOString()
  };


  /*
   * MCQ options
   */

  if (type === 'mcq') {

    const options = {
      A:
        getElement('qOptionA')
          ?.value
          ?.trim(),

      B:
        getElement('qOptionB')
          ?.value
          ?.trim(),

      C:
        getElement('qOptionC')
          ?.value
          ?.trim(),

      D:
        getElement('qOptionD')
          ?.value
          ?.trim()
    };

    if (
      !options.A ||
      !options.B ||
      !options.C ||
      !options.D
    ) {

      showExamoraToast(
        'Please fill all four MCQ options.',
        'warning'
      );

      return;
    }

    question.options =
      options;
  }


  db.questions.push(
    question
  );

  if (
    !Array.isArray(
      ex.questionIds
    )
  ) {
    ex.questionIds = [];
  }

  ex.questionIds.push(
    question.id
  );

  saveDB(db);

  logEvent(
    `Added question to examination "${ex.title}"`
  );

  showExamoraToast(
    'Question added successfully.',
    'success'
  );

  renderQuestionList();

  clearQuestionForm();
}


/* =========================================================
   QUESTION LIST
   ========================================================= */

function renderQuestionList() {

  const container =
    getElement(
      'questionList'
    );

  if (!container) {
    return;
  }

  const examId =
    getElement('qExam')
      ?.value;

  if (!examId) {

    container.innerHTML = '';

    return;
  }

  const db = getDB();

  const exam =
    db.exams.find(
      x => x.id === examId
    );

  if (!exam) {

    container.innerHTML =
      '<p>Examination not found.</p>';

    return;
  }

  const ids =
    exam.questionIds || [];

  const questions =
    ids
      .map(
        id =>
          db.questions.find(
            q => q.id === id
          )
      )
      .filter(Boolean);

  if (!questions.length) {

    container.innerHTML = `
      <div class="empty-state">
        <p>No questions added yet.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    questions
      .map(
        (q, index) => `

          <div
            class="question-list-item"
          >

            <div
              class="question-number"
            >
              ${index + 1}
            </div>

            <div
              class="question-list-content"
            >

              <strong>
                ${escapeHTML(
                  q.text
                )}
              </strong>

              <span>
                ${escapeHTML(
                  q.type
                )}
                ·
                ${escapeHTML(
                  q.marks
                )} marks
              </span>

            </div>

          </div>

        `
      )
      .join('');
}


/* =========================================================
   CLEAR QUESTION FORM
   ========================================================= */

function clearQuestionForm() {

  const fields = [
    'qText',
    'qMarks',
    'qNegativeMarks',
    'qCorrect',
    'qOptionA',
    'qOptionB',
    'qOptionC',
    'qOptionD'
  ];

  fields.forEach(
    id => {

      const element =
        getElement(id);

      if (element) {
        element.value = '';
      }
    }
  );
}


/* =========================================================
   QUESTION TYPE CHANGE
   ========================================================= */

function updateQuestionType() {

  const type =
    getElement('qType')
      ?.value;

  const mcqOptions =
    getElement(
      'mcqOptions'
    );

  if (mcqOptions) {

    mcqOptions.style.display =
      type === 'mcq'
        ? ''
        : 'none';
  }
}


/* =========================================================
   EXAM RESULTS
   ========================================================= */

function viewExamResults(
  examId
) {

  const db = getDB();

  const exam =
    db.exams.find(
      x => x.id === examId
    );

  if (!exam) {

    showExamoraToast(
      'Examination not found.',
      'error'
    );

    return;
  }

  const attempts =
    db.attempts.filter(
      attempt =>
        attempt.examId ===
        examId
    );

  /*
   * If a results container exists,
   * render the results there.
   */

  const container =
    getElement(
      'examResults'
    );

  if (!container) {

    showExamoraToast(
      `${attempts.length} student attempt(s) found for "${exam.title}".`,
      'info'
    );

    return;
  }

  if (!attempts.length) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>No submissions yet</h3>
        <p>No student has submitted this examination.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    attempts
      .map(
        attempt => `

          <div class="result-card">

            <div>
              <strong>
                ${escapeHTML(
                  attempt.studentName ||
                  attempt.email ||
                  'Student'
                )}
              </strong>

              <span>
                ${escapeHTML(
                  attempt.email ||
                  ''
                )}
              </span>
            </div>

            <div>
              <strong>
                ${escapeHTML(
                  attempt.score ??
                  0
                )}
              </strong>

              <span>
                Score
              </span>
            </div>

            <div>
              <strong>
                ${escapeHTML(
                  formatDateTime(
                    attempt.submittedAt
                  )
                )}
              </strong>

              <span>
                Submitted
              </span>
            </div>

          </div>

        `
      )
      .join('');
}


/* =========================================================
   STUDENT ACCESS
   ========================================================= */

function joinExam() {

  const roomCode =
    getElement('roomCode')
      ?.value
      ?.trim()
      .toUpperCase();

  const roomPassword =
    getElement('roomPassword')
      ?.value
      ?.trim();

  if (
    !roomCode ||
    !roomPassword
  ) {

    showExamoraToast(
      'Please enter the room code and password.',
      'warning'
    );

    return;
  }

  const db = getDB();

  const exam =
    db.exams.find(
      x =>
        String(
          x.roomCode || ''
        )
          .toUpperCase() ===
          roomCode
    );

  if (!exam) {

    showExamoraToast(
      'Examination room not found.',
      'error'
    );

    return;
  }

  if (
    exam.roomPassword !==
    roomPassword
  ) {

    showExamoraToast(
      'Incorrect room password.',
      'error'
    );

    return;
  }

  if (!exam.startedAt) {

    showExamoraToast(
      'The examiner has not started this examination yet.',
      'warning'
    );

    return;
  }

  sessionStorage.setItem(
    'examora_current_exam',
    exam.id
  );

  location.href =
    'exam.html';
}
   /* =========================================================
   STUDENT EXAM INITIALIZATION
   ========================================================= */

function initializeStudentPage() {

  const user =
    getCurrentUser();

  if (!user) {
    return;
  }

  const joinForm =
    getElement('joinExamForm');

  if (joinForm) {

    joinForm.addEventListener(
      'submit',
      event => {
        event.preventDefault();

        joinExam();
      }
    );
  }

  renderStudentDashboard();
}


/* =========================================================
   STUDENT DASHBOARD
   ========================================================= */

function renderStudentDashboard() {

  const container =
    getElement(
      'studentExamList'
    );

  if (!container) {
    return;
  }

  const user =
    getCurrentUser();

  if (!user) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>Please login first</h3>
      </div>
    `;

    return;
  }

  const db = getDB();

  const attempts =
    db.attempts.filter(
      attempt =>
        attempt.studentId ===
        user.id ||
        String(
          attempt.email || ''
        )
          .toLowerCase() ===
          String(
            user.email || ''
          )
            .toLowerCase()
    );

  if (!attempts.length) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>No examination history</h3>
        <p>Your completed examinations will appear here.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    attempts
      .map(
        attempt => {

          const exam =
            db.exams.find(
              x =>
                x.id ===
                attempt.examId
            );

          return `
            <div class="student-exam-card">

              <div>
                <h3>
                  ${escapeHTML(
                    exam?.title ||
                    'Examination'
                  )}
                </h3>

                <p>
                  ${escapeHTML(
                    exam?.subject ||
                    ''
                  )}
                </p>
              </div>

              <div>
                <strong>
                  ${escapeHTML(
                    attempt.score ??
                    0
                  )}
                </strong>

                <span>
                  Score
                </span>
              </div>

              <div>
                <span>
                  ${escapeHTML(
                    formatDateTime(
                      attempt.submittedAt
                    )
                  )}
                </span>
              </div>

            </div>
          `;
        }
      )
      .join('');
}


/* =========================================================
   COPY ROOM CREDENTIALS
   ========================================================= */

async function copyRoomCredentials(
  examId
) {

  const db = getDB();

  const exam =
    db.exams.find(
      x => x.id === examId
    );

  if (!exam) {

    showExamoraToast(
      'Examination not found.',
      'error'
    );

    return;
  }

  const text =
    `Examora Examination\n` +
    `Exam: ${exam.title}\n` +
    `Room: ${exam.roomCode}\n` +
    `Password: ${exam.roomPassword}`;

  try {

    await navigator.clipboard.writeText(
      text
    );

    showExamoraToast(
      'Room credentials copied.',
      'info'
    );

  } catch (error) {

    showExamoraToast(
      'Unable to copy room credentials.',
      'error'
    );
  }
}


/* =========================================================
   EXAM PAGE
   ========================================================= */

function initializeExamPage() {

  const examId =
    sessionStorage.getItem(
      'examora_current_exam'
    );

  if (!examId) {

    showExamoraToast(
      'No examination has been selected.',
      'warning'
    );

    return;
  }

  initializeExamSession(
    examId
  );
}


/* =========================================================
   EXAM SESSION
   ========================================================= */

function initializeExamSession(
  examId
) {

  const db = getDB();

  const exam =
    db.exams.find(
      x => x.id === examId
    );

  if (!exam) {

    showExamoraToast(
      'Examination not found.',
      'error'
    );

    return;
  }

  if (!exam.startedAt) {

    showExamoraToast(
      'This examination has not started yet.',
      'warning'
    );

    return;
  }

  const questionIds =
    Array.isArray(
      exam.questionIds
    )
      ? exam.questionIds
      : [];

  if (!questionIds.length) {

    showExamoraToast(
      'This examination has no questions.',
      'error'
    );

    return;
  }

  const questions =
    questionIds
      .map(
        id =>
          db.questions.find(
            q => q.id === id
          )
      )
      .filter(Boolean);

  if (!questions.length) {

    showExamoraToast(
      'Unable to load examination questions.',
      'error'
    );

    return;
  }

  const user =
    getCurrentUser();

  const state = {
    exam,
    questions,
    currentIndex: 0,
    answers: {},
    submitted: false,
    startedAt:
      new Date().toISOString()
  };

  window.examoraExamState =
    state;

  renderExamHeader(
    exam
  );

  renderExamQuestion();

  startExamTimer(
    exam
  );
}


/* =========================================================
   EXAM HEADER
   ========================================================= */

function renderExamHeader(
  exam
) {

  const title =
    getElement(
      'examTitleDisplay'
    );

  if (title) {
    title.textContent =
      exam.title || 'Examination';
  }

  const subject =
    getElement(
      'examSubjectDisplay'
    );

  if (subject) {
    subject.textContent =
      exam.subject || '';
  }

  const room =
    getElement(
      'examRoomDisplay'
    );

  if (room) {
    room.textContent =
      exam.roomCode || '';
  }

  const duration =
    getElement(
      'examDurationDisplay'
    );

  if (duration) {
    duration.textContent =
      `${exam.duration} minutes`;
  }
}


/* =========================================================
   RENDER CURRENT QUESTION
   ========================================================= */

function renderExamQuestion() {

  const state =
    window.examoraExamState;

  if (!state) {
    return;
  }

  const question =
    state.questions[
      state.currentIndex
    ];

  if (!question) {
    return;
  }

  const questionNumber =
    getElement(
      'questionNumber'
    );

  if (questionNumber) {

    questionNumber.textContent =
      `Question ${
        state.currentIndex + 1
      } of ${
        state.questions.length
      }`;
  }

  const questionText =
    getElement(
      'questionText'
    );

  if (questionText) {

    questionText.textContent =
      question.text || '';
  }

  const marks =
    getElement(
      'questionMarks'
    );

  if (marks) {

    marks.textContent =
      `${question.marks || 0} marks`;
  }

  const optionsContainer =
    getElement(
      'questionOptions'
    );

  if (!optionsContainer) {
    return;
  }

  const savedAnswer =
    state.answers[
      question.id
    ];

  if (
    question.type ===
    'mcq'
  ) {

    const options =
      question.options ||
      {};

    optionsContainer.innerHTML =
      Object.entries(
        options
      )
        .map(
          ([key, value]) => `

            <label
              class="exam-option"
            >

              <input
                type="radio"
                name="answer"
                value="${escapeHTML(
                  key
                )}"
                ${
                  savedAnswer ===
                  key
                    ? 'checked'
                    : ''
                }
              >

              <span>
                <strong>
                  ${escapeHTML(
                    key
                  )}.
                </strong>

                ${escapeHTML(
                  value
                )}
              </span>

            </label>

          `
        )
        .join('');

  } else if (
    question.type ===
    'truefalse'
  ) {

    optionsContainer.innerHTML = `
      <label class="exam-option">

        <input
          type="radio"
          name="answer"
          value="True"
          ${
            savedAnswer ===
            'True'
              ? 'checked'
              : ''
          }
        >

        <span>True</span>

      </label>

      <label class="exam-option">

        <input
          type="radio"
          name="answer"
          value="False"
          ${
            savedAnswer ===
            'False'
              ? 'checked'
              : ''
          }
        >

        <span>False</span>

      </label>
    `;

  } else {

    optionsContainer.innerHTML = `
      <input
        id="answerInput"
        class="exam-answer-input"
        type="${
          question.type ===
          'numerical'
            ? 'number'
            : 'text'
        }"
        value="${escapeHTML(
          savedAnswer || ''
        )}"
        placeholder="Enter your answer"
      >
    `;
  }
}


/* =========================================================
   SAVE CURRENT ANSWER
   ========================================================= */

function saveCurrentAnswer() {

  const state =
    window.examoraExamState;

  if (!state) {
    return;
  }

  const question =
    state.questions[
      state.currentIndex
    ];

  if (!question) {
    return;
  }

  let answer = '';

  const selected =
    document.querySelector(
      'input[name="answer"]:checked'
    );

  if (selected) {

    answer =
      selected.value;

  } else {

    const input =
      getElement(
        'answerInput'
      );

    if (input) {
      answer =
        input.value;
    }
  }

  state.answers[
    question.id
  ] = answer;
}


/* =========================================================
   NEXT QUESTION
   ========================================================= */

function nextQuestion() {

  const state =
    window.examoraExamState;

  if (!state) {
    return;
  }

  saveCurrentAnswer();

  if (
    state.currentIndex >=
    state.questions.length - 1
  ) {

    showExamoraToast(
      'This is the last question. Please submit the examination when you are ready.',
      'info'
    );

    return;
  }

  state.currentIndex++;

  renderExamQuestion();
}


/* =========================================================
   PREVIOUS QUESTION
   ========================================================= */

function previousQuestion() {

  const state =
    window.examoraExamState;

  if (!state) {
    return;
  }

  saveCurrentAnswer();

  if (
    state.currentIndex <=
    0
  ) {

    showExamoraToast(
      'You are already on the first question.',
      'info'
    );

    return;
  }

  state.currentIndex--;

  renderExamQuestion();
}


/* =========================================================
   QUESTION NAVIGATION
   ========================================================= */

function goToQuestion(
  index
) {

  const state =
    window.examoraExamState;

  if (!state) {
    return;
  }

  if (
    index < 0 ||
    index >=
      state.questions.length
  ) {
    return;
  }

  saveCurrentAnswer();

  state.currentIndex =
    index;

  renderExamQuestion();
}


/* =========================================================
   EXAM TIMER
   ========================================================= */

function startExamTimer(
  exam
) {

  const timerElement =
    getElement(
      'examTimer'
    );

  if (!timerElement) {
    return;
  }

  const startedAt =
    new Date(
      exam.startedAt
    ).getTime();

  const duration =
    Number(
      exam.duration
    ) || 0;

  const endTime =
    startedAt +
    duration *
      60 *
      1000;

  let timerFinished =
    false;

  function tick() {

    const remaining =
      Math.max(
        0,
        endTime -
          Date.now()
      );

    const totalSeconds =
      Math.floor(
        remaining / 1000
      );

    const minutes =
      Math.floor(
        totalSeconds / 60
      );

    const seconds =
      totalSeconds % 60;

    timerElement.textContent =
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

    if (
      remaining <= 0 &&
      !timerFinished
    ) {

      timerFinished =
        true;

      clearInterval(
        interval
      );

      showExamoraToast(
        'Time is up. Your examination will be submitted automatically.',
        'warning',
        'Time Up'
      );

      setTimeout(
        () => {
          submitExamInternal(
            true
          );
        },
        700
      );
    }
  }

  tick();

  const interval =
    setInterval(
      tick,
      1000
    );
}


/* =========================================================
   SUBMIT EXAM
   ========================================================= */

function submitExam() {

  const state =
    window.examoraExamState;

  if (!state) {
    return;
  }

  if (state.submitted) {
    return;
  }

  saveCurrentAnswer();

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
}


/* =========================================================
   SUBMIT EXAM INTERNAL
   ========================================================= */

function submitExamInternal(
  automatic = false
) {

  const state =
    window.examoraExamState;

  if (!state) {
    return;
  }

  if (state.submitted) {
    return;
  }

  state.submitted =
    true;

  saveCurrentAnswer();

  const db = getDB();

  const user =
    getCurrentUser();

  const exam =
    state.exam;

  let score = 0;

  let totalMarks = 0;

  let correctCount = 0;

  let incorrectCount = 0;

  let unansweredCount = 0;

  const answerDetails = [];

  state.questions.forEach(
    question => {

      const answer =
        state.answers[
          question.id
        ];

      const hasAnswer =
        answer !== undefined &&
        answer !== null &&
        String(answer)
          .trim() !== '';

      totalMarks +=
        Number(
          question.marks
        ) || 0;

      if (!hasAnswer) {

        unansweredCount++;

        answerDetails.push({
          questionId:
            question.id,

          answer:
            '',

          correct:
            false,

          unanswered:
            true,

          marks:
            0
        });

        return;
      }

      const correctAnswer =
        String(
          question.correct ??
          ''
        )
          .trim()
          .toLowerCase();

      const studentAnswer =
        String(answer)
          .trim()
          .toLowerCase();

      const isCorrect =
        studentAnswer ===
        correctAnswer;

      if (isCorrect) {

        score +=
          Number(
            question.marks
          ) || 0;

        correctCount++;

      } else {

        incorrectCount++;

        if (
          exam.negative
        ) {

          score -=
            Number(
              question.negativeMarks ||
              exam.negativeMarks ||
              0
            );
        }
      }

      answerDetails.push({

        questionId:
          question.id,

        answer,

        correct:
          isCorrect,

        unanswered:
          false,

        marks:
          isCorrect
            ? Number(
                question.marks
              ) || 0
            : 0

      });
    }
  );

  /*
   * Prevent score from becoming negative.
   */

  score =
    Math.max(
      0,
      score
    );

  const attempt = {

    id:
      uid('attempt'),

    examId:
      exam.id,

    studentId:
      user?.id ||
      null,

    studentName:
      user?.name ||
      '',

    email:
      user?.email ||
      '',

    score,

    totalMarks,

    correctCount,

    incorrectCount,

    unansweredCount,

    answers:
      answerDetails,

    submittedAt:
      new Date().toISOString(),

    automatic

  };

  db.attempts.push(
    attempt
  );

  saveDB(db);

  logEvent(
    `Submitted examination "${exam.title}" by ${user?.email || 'student'}`
  );

  sessionStorage.setItem(
    'examora_last_attempt',
    attempt.id
  );

  sessionStorage.setItem(
    'examora_answers',
    JSON.stringify(
      answerDetails
    )
  );

  sessionStorage.removeItem(
    'examora_current_exam'
  );

  sessionStorage.removeItem(
    'examora_reviews'
  );

  if (!automatic) {

    showExamoraToast(
      'Examination submitted successfully.',
      'success'
    );
  }

  setTimeout(
    () => {
      location.href =
        'result.html';
    },
    automatic
      ? 300
      : 700
  );
}


/* =========================================================
   RESULT PAGE
   ========================================================= */

function initializeResultPage() {

  const attemptId =
    sessionStorage.getItem(
      'examora_last_attempt'
    );

  if (!attemptId) {

    showExamoraToast(
      'No examination result found.',
      'warning'
    );

    return;
  }

  renderResult(
    attemptId
  );
}


/* =========================================================
   RENDER RESULT
   ========================================================= */

function renderResult(
  attemptId
) {

  const db = getDB();

  const attempt =
    db.attempts.find(
      x =>
        x.id ===
        attemptId
    );

  if (!attempt) {

    showExamoraToast(
      'Examination result not found.',
      'error'
    );

    return;
  }

  const exam =
    db.exams.find(
      x =>
        x.id ===
        attempt.examId
    );

  const scoreElement =
    getElement(
      'resultScore'
    );

  if (scoreElement) {

    scoreElement.textContent =
      attempt.score ??
      0;
  }

  const totalElement =
    getElement(
      'resultTotal'
    );

  if (totalElement) {

    totalElement.textContent =
      attempt.totalMarks ??
      0;
  }

  const correctElement =
    getElement(
      'resultCorrect'
    );

  if (correctElement) {

    correctElement.textContent =
      attempt.correctCount ??
      0;
  }

  const incorrectElement =
    getElement(
      'resultIncorrect'
    );

  if (incorrectElement) {

    incorrectElement.textContent =
      attempt.incorrectCount ??
      0;
  }

  const unansweredElement =
    getElement(
      'resultUnanswered'
    );

  if (unansweredElement) {

    unansweredElement.textContent =
      attempt.unansweredCount ??
      0;
  }

  const titleElement =
    getElement(
      'resultExamTitle'
    );

  if (titleElement) {

    titleElement.textContent =
      exam?.title ||
      'Examination Result';
  }

  const percentageElement =
    getElement(
      'resultPercentage'
    );

  if (
    percentageElement
  ) {

    const percentage =
      attempt.totalMarks > 0
        ? (
            attempt.score /
            attempt.totalMarks
          ) *
          100
        : 0;

    percentageElement.textContent =
      `${percentage.toFixed(
        2
      )}%`;
  }
}
}
