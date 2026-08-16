# Examora — Online Examination Platform

A free-first, modern online examination platform based on the supplied portal plan.

## Portals

### 1. Examiner / Teacher Portal
- Dashboard
- Create examination
- Automatic Room ID / Room Code / Password
- Question Bank
- MCQ, True/False, Short Answer, Long Answer and Numerical UI
- Negative marking
- Live-style examination management foundation
- Results / marksheet
- Activity log

### 2. Student Portal
- Dashboard
- Join Room
- Exam instructions
- Timed examination
- Question navigation
- Save / auto-save
- Mark for review
- Submission
- Results
- Exam history
- Profile

### 3. Admin Portal — optional but included
I decided to include a small Admin Portal because the platform becomes much easier to manage once multiple examiners/classes use it. It is intentionally lightweight rather than turning the project into an unnecessarily complicated ERP.

Admin responsibilities:
- Platform overview
- Teacher/student management foundation
- Global room monitoring
- Security/activity monitoring

## UI design

- Examiner portal: blue visual identity
- Student portal: teal/green visual identity
- Admin portal: violet visual identity
- Responsive desktop/tablet/mobile layouts
- Accessible controls
- Confirmation for destructive actions
- Clean cards, status badges and dashboards
- No paid API dependency

## Recommended architecture

### Phase 1 — Free GitHub demo
This repository can be hosted directly on GitHub Pages.

Frontend:
HTML + CSS + JavaScript

Storage:
Browser localStorage for demonstration only.

This lets you show the project through an HTTPS `github.io` website without paying for hosting.

### Phase 2 — Real multi-user system
Keep the same frontend and connect it to a backend/database.

Recommended free-first option:
Supabase

Use it for:
- Authentication
- PostgreSQL database
- Row Level Security
- Exam rooms
- Students/examiners
- Answers
- Results
- Audit logs
- Real-time events where appropriate

`supabase-schema.sql` is included as a starting database schema.

### Phase 3 — Production examination engine
The backend must control:
- Exam start/end time
- Server-side timer
- Student sessions
- Room membership
- Answer persistence
- Automatic submission
- Marks
- Permissions
- Examiner actions
- Audit logs

Never trust these values from JavaScript/localStorage in a real exam.

## GitHub Pages

1. Create a GitHub repository.
2. Upload the contents of this folder.
3. Go to Settings → Pages.
4. Select Deploy from a branch.
5. Choose your main branch and root folder.
6. Save.
7. GitHub provides an HTTPS `github.io` URL.

The static demo is suitable for:
- College project demonstration
- UI/UX presentation
- Portfolio
- Initial testing
- Frontend development

It is NOT sufficient by itself for a secure real examination with multiple students.

## Project files

- `index.html` — landing page / portal selector
- `examiner.html` — examiner portal
- `student.html` — student portal
- `exam.html` — live exam interface
- `result.html` — result page
- `admin.html` — optional admin portal
- `assets/styles.css` — complete UI system
- `assets/app.js` — demo application logic
- `supabase-schema.sql` — production backend starting schema
- `README.md` — project documentation

## Best next development order

1. GitHub Pages deployment
2. Supabase authentication
3. Role-based access
4. Database-backed exams and questions
5. Server-side timer/session
6. Real-time room monitoring
7. Manual subjective marking
8. PDF/CSV/Excel exports
9. Rechecking and detailed audit logs
10. Optional advanced features

Advanced features such as webcam verification, AI proctoring, plagiarism detection and code execution should remain optional and should not be added until the core examination engine is reliable.

## Latest grading behavior
- MCQ: automatic marking.
- True/False: students see only True/False; automatic marking.
- Numerical: numeric entry; automatic marking with a small exactness tolerance in the demo.
- Short Answer: student answer is stored and sent to the examiner; manual checking required.
- Long Answer: student answer is stored and sent to the examiner; manual checking required.
- Examiner Results is an in-page marksheet, not a popup.
- Each student submission has an Answer Copy review screen where the teacher can award marks and feedback for subjective questions.
- Created room cards show both room code and password. Only the room code has a Copy button; the password is display-only.

## UI update — dark mode and grading

The latest UI revision includes:
- Persistent dark mode across Home, Examiner, Student, Live Exam, Result and Admin pages.
- Dark-mode styling for cards, forms, question-type controls, banners, answer areas, grading panels and admin cards.
- A dark-mode control on the Home page and Result page.
- A highlighted blue/teal state for “Mark for review”.
- Question creation fields now change by type instead of showing MCQ-style answer controls for every type.
- Teacher grading shows the question number, question type and maximum/given marks directly beside each question.
- Manual SAQ/LAQ grading continues to use teacher-awarded marks and feedback.
