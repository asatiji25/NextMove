const STORAGE_KEY = "nextmove-tasks-v1";

const $ = (selector) => document.querySelector(selector);
const taskList = $("#taskList");
const emptyState = $("#emptyState");
const modal = $("#taskModal");
const form = $("#taskForm");
const formError = $("#formError");
let tasks = loadTasks();
let toastTimer;

function localDateString(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
function dateAtMidnight(value) {
  return new Date(`${value}T00:00:00`);
}
function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved);
  } catch (error) {
    console.warn("Could not read saved tasks.", error);
  }
  const today = new Date();
  const addDays = (n) => {
    const date = new Date(today);
    date.setDate(date.getDate() + n);
    return localDateString(date);
  };
  return [
    { id: makeId(), title: "Revise OS process scheduling", subject: "Operating Systems", date: addDays(1), priority: 3, effort: 60, notes: "Review the Gantt chart examples.", done: false, created: Date.now() - 3000 },
    { id: makeId(), title: "Finish DBMS assignment", subject: "DBMS", date: addDays(2), priority: 3, effort: 90, notes: "Complete queries and check output.", done: false, created: Date.now() - 2000 },
    { id: makeId(), title: "Prepare project review slides", subject: "Project", date: addDays(4), priority: 2, effort: 120, notes: "Keep the methodology diagram clear.", done: false, created: Date.now() - 1000 },
    { id: makeId(), title: "Organise DSA notes", subject: "DSA", date: addDays(6), priority: 1, effort: 30, notes: "", done: true, created: Date.now() }
  ];
}
function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function saveTasks() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
  catch (error) { showToast("Couldn't save in this browser. You can still use the planner."); }
}
function daysUntil(dateString) {
  const today = dateAtMidnight(localDateString());
  const due = dateAtMidnight(dateString);
  return Math.round((due - today) / 86400000);
}
function isUrgent(task) {
  return !task.done && daysUntil(task.date) <= 1;
}
function isOverdue(task) {
  return !task.done && daysUntil(task.date) < 0;
}
function urgencyScore(task) {
  if (task.done) return -999;
  const days = daysUntil(task.date);
  const urgency = days < 0 ? 100 + Math.abs(days) * 12 : days === 0 ? 90 : days === 1 ? 72 : days <= 3 ? 55 - days * 5 : Math.max(5, 30 - days);
  const priorityBoost = Number(task.priority || 2) * 8;
  const effortBoost = Math.min(Number(task.effort || 60) / 30, 6);
  return urgency + priorityBoost + effortBoost;
}
function getSortedTasks() {
  const sort = $("#sortTasks").value;
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (sort === "date") return a.date.localeCompare(b.date) || b.priority - a.priority;
    if (sort === "priority") return b.priority - a.priority || a.date.localeCompare(b.date);
    return urgencyScore(b) - urgencyScore(a);
  });
}
function dueLabel(task) {
  const days = daysUntil(task.date);
  if (task.done) return "Completed";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}
function formatDate(value) {
  return dateAtMidnight(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
function priorityLabel(priority) {
  return ({ "1": "Low priority", "2": "Normal priority", "3": "High priority" })[String(priority)] || "Normal priority";
}
function effortLabel(minutes) {
  return minutes >= 180 ? "3+ hours" : minutes >= 60 ? `${minutes / 60} hr${minutes > 60 ? "s" : ""}` : `${minutes} min`;
}
function render() {
  renderStats();
  renderRecommendation();
  renderTasks();
}
function renderStats() {
  const total = tasks.length;
  const done = tasks.filter(task => task.done).length;
  const urgent = tasks.filter(isUrgent).length;
  const percent = total ? Math.round(done / total * 100) : 0;
  $("#totalCount").textContent = total;
  $("#doneCount").textContent = done;
  $("#urgentCount").textContent = urgent;
  $("#progressPercent").textContent = percent;
  $("#miniProgress").style.width = `${percent}%`;
  $("#mainProgress").style.width = `${percent}%`;
}
function renderRecommendation() {
  const next = tasks.filter(task => !task.done).sort((a, b) => urgencyScore(b) - urgencyScore(a))[0];
  const title = $("#recommendationTitle");
  const reason = $("#recommendationReason");
  const why = $("#recommendationWhy");
  const badge = $("#recommendationBadge");
  const countdown = $("#recommendationCountdown");
  const start = $("#startRecommended");
  if (!next) {
    title.textContent = tasks.length ? "You cleared the line." : "Make your first move.";
    reason.textContent = tasks.length ? "Every task is complete. Take a breath — you've earned it." : "Add a task and NextMove will help you decide where to start.";
    why.textContent = tasks.length ? "There are no unfinished tasks on your list right now." : "Add your deadlines, priority and estimated effort to get a recommendation.";
    badge.textContent = tasks.length ? "ALL CLEAR ✓" : "WAITING FOR YOUR TASKS";
    countdown.textContent = tasks.length ? "NO OPEN DEADLINES" : "ADD A TASK TO BEGIN";
    countdown.classList.remove("is-urgent");
    start.disabled = true;
    start.style.opacity = ".5";
    start.style.cursor = "not-allowed";
    start.onclick = null;
    return;
  }
  start.disabled = false;
  start.style.opacity = "1";
  start.style.cursor = "pointer";
  title.textContent = next.title;
  const days = daysUntil(next.date);
  reason.textContent = `${dueLabel(next)} · ${effortLabel(Number(next.effort))} estimated`;
  countdown.classList.toggle("is-urgent", days <= 1);
  countdown.textContent = days < 0 ? `OVERDUE BY ${Math.abs(days)} DAY${Math.abs(days) === 1 ? "" : "S"}` :
    days === 0 ? "DEADLINE: TODAY" :
    days === 1 ? "DEADLINE: TOMORROW" :
    `TIME LEFT: ${days} DAYS`;
  let explanation = days < 0 ? "This deadline has passed, so dealing with it first can prevent more work from slipping." :
    days === 0 ? "It's due today. A focused session now can stop it from becoming a last-minute scramble." :
    days === 1 ? "It's due tomorrow, so starting now gives you a little breathing room." :
    Number(next.priority) === 3 ? "You've marked this as high priority, and its deadline is approaching." :
    "This task has the strongest mix of deadline urgency and priority on your list.";
  why.textContent = explanation;
  badge.textContent = isOverdue(next) ? "OVERDUE · RESET THE PLAN" : isUrgent(next) ? "PRESSURE POINT · ACT SOON" : "SUGGESTED NEXT MOVE";
  start.onclick = () => {
    if (next.done) return;
    showToast(`Your next move: ${next.title}`);
    const row = document.querySelector(`[data-task-id="${CSS.escape(next.id)}"]`);
    if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
    else $("#my-tasks").scrollIntoView({ behavior: "smooth" });
  };
}
function renderTasks() {
  const filter = $("#filterStatus").value;
  let visible = getSortedTasks();
  if (filter === "pending") visible = visible.filter(task => !task.done);
  if (filter === "done") visible = visible.filter(task => task.done);
  if (filter === "urgent") visible = visible.filter(isUrgent);
  taskList.innerHTML = "";
  visible.forEach((task, index) => {
    const row = document.createElement("article");
    row.className = `task-row${task.done ? " is-done" : ""}${isUrgent(task) ? " is-urgent" : ""}`;
    row.dataset.taskId = task.id;
    const label = task.done ? "DONE" : isOverdue(task) ? "LATE" : "MOVE";
    const pillClass = task.done ? "done" : isOverdue(task) ? "overdue" : Number(task.priority) === 3 ? "high" : "";
    row.innerHTML = `
      <div class="task-index"><span>${String(index + 1).padStart(2, "0")}</span><span>↘</span></div>
      <div class="task-main">
        <div class="task-title"></div>
        <div class="task-subline"><span class="task-subject"></span><span class="separator">/</span><span class="task-date"></span><span class="separator">/</span><span class="task-effort"></span></div>
        ${task.notes ? '<div class="task-note"></div>' : ""}
      </div>
      <div class="task-status"><span class="priority-pill ${pillClass}">${task.done ? "Completed" : isOverdue(task) ? "Overdue" : priorityLabel(task.priority)}</span><div class="due-text">${dueLabel(task)}</div></div>
      <div class="task-actions">
        <button class="icon-button complete" type="button" title="${task.done ? "Mark as not completed" : "Mark as complete"}" aria-label="${task.done ? "Mark as not completed" : "Mark as complete"}">${task.done ? "↶" : "✓"}</button>
        <button class="icon-button delete" type="button" title="Delete task" aria-label="Delete task">×</button>
      </div>`;
    row.querySelector(".task-title").textContent = task.title;
    row.querySelector(".task-subject").textContent = task.subject || "Personal";
    row.querySelector(".task-date").textContent = formatDate(task.date);
    row.querySelector(".task-effort").textContent = effortLabel(Number(task.effort));
    const note = row.querySelector(".task-note");
    if (note) note.textContent = task.notes;
    row.querySelector(".complete").addEventListener("click", () => toggleTask(task.id));
    row.querySelector(".delete").addEventListener("click", () => deleteTask(task.id));
    taskList.appendChild(row);
  });
  emptyState.hidden = visible.length > 0;
  taskList.hidden = visible.length === 0;
  $("#listCount").textContent = `${visible.length} TASK${visible.length === 1 ? "" : "S"}`;
}
function toggleTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  task.done = !task.done;
  const completedNow = task.done;
  saveTasks();
  render();
  if (completedNow) {
    const row = document.querySelector(`[data-task-id="${CSS.escape(id)}"]`);
    if (row) row.classList.add("just-completed");
  }
  showToast(completedNow ? "A domino down. Nice move." : "Task moved back to your list.");
}
function deleteTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  tasks = tasks.filter(item => item.id !== id);
  saveTasks();
  render();
  showToast("Task removed from your domino line.");
}
function openModal() {
  modal.hidden = false;
  formError.textContent = "";
  $("#taskDate").min = localDateString();
  if (!$("#taskDate").value || $("#taskDate").value < localDateString()) $("#taskDate").value = localDateString();
  setTimeout(() => $("#taskTitle").focus(), 50);
}
function closeModal() {
  modal.hidden = true;
  form.reset();
  formError.textContent = "";
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

$("#openTaskForm").addEventListener("click", openModal);
$("#emptyAddButton").addEventListener("click", openModal);
$("#closeTaskForm").addEventListener("click", closeModal);
$("#cancelTask").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
$("#filterStatus").addEventListener("change", renderTasks);
$("#sortTasks").addEventListener("change", renderTasks);
form.addEventListener("submit", event => {
  event.preventDefault();
  const title = $("#taskTitle").value.trim();
  const date = $("#taskDate").value;
  if (!title) { formError.textContent = "Give your task a name first."; return; }
  if (!date) { formError.textContent = "Choose a due date for this task."; return; }
  if (date < localDateString()) { formError.textContent = "Choose today or a future date. You can still track overdue tasks later."; return; }
  tasks.push({
    id: makeId(), title, subject: $("#taskSubject").value.trim(),
    date, priority: Number($("#taskPriority").value), effort: Number($("#taskEffort").value),
    notes: $("#taskNotes").value.trim(), done: false, created: Date.now()
  });
  saveTasks();
  closeModal();
  render();
  showToast("Added! Your next move is taking shape.");
  $("#my-tasks").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#todayLabel").textContent = `YOUR DAY / ${new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short" }).toUpperCase()}`;
$("#year").textContent = new Date().getFullYear();
render();
