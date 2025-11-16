// Calendar script (index <-> style separated)
// Features: month navigation, add/edit/delete events, time + title only, localStorage persistence.

const calendarEl = document.getElementById('calendar');
const monthLabel = document.getElementById('monthLabel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const modal = document.getElementById('modal');
const modalBg = document.getElementById('modalBg');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const eventForm = document.getElementById('eventForm');
const eventTitleInput = document.getElementById('eventTitle');
const eventTimeInput = document.getElementById('eventTime');
const cancelBtn = document.getElementById('cancelBtn');
const deleteContainer = document.getElementById('deleteContainer');
const deleteEventBtn = document.getElementById('deleteEventBtn');

let view = new Date();
let selectedCellEl = null;
const STORAGE_KEY = 'internship_calendar_events_v1';

let editing = false;
let editDayKey = null;
let editIndex = null;

// Utilities
function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) {
    console.error('Failed to parse events:', e);
    return {};
  }
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function dayKeyFromDate(d) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function renderCalendar() {
  calendarEl.innerHTML = '';
  const start = monthStart(view);
  const year = start.getFullYear();
  const month = start.getMonth();
  const firstWeekday = start.getDay(); // 0 Sun - 6 Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // weekday headers
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let w of weekdays) {
    const h = document.createElement('div');
    h.className = 'text-sm font-medium text-center py-2';
    h.textContent = w;
    calendarEl.appendChild(h);
  }

  // blank before first day
  for (let i = 0; i < firstWeekday; i++) {
    calendarEl.appendChild(document.createElement('div'));
  }

  const events = loadEvents();

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const key = dayKeyFromDate(dt);

    const cell = document.createElement('div');
    cell.className = 'day-cell border rounded p-2 flex flex-col justify-start gap-2 bg-white cursor-pointer';
    cell.dataset.date = key;

    const top = document.createElement('div');
    top.className = 'flex justify-between items-start';
    top.innerHTML = `<div class="text-sm font-semibold">${d}</div>`;

    const list = document.createElement('div');
    list.className = 'events-list';

    if (events[key]) {
      // sort by time (empty times go last)
      events[key]
        .slice()
        .sort((a, b) => {
          if (!a.time && !b.time) return 0;
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time > b.time ? 1 : -1;
        })
        .forEach((ev, idx) => {
          const evEl = document.createElement('div');
          evEl.className = 'event-pill border text-xs bg-slate-50 hover:bg-slate-100 cursor-pointer select-none';
          evEl.title = (ev.time ? ev.time + ' - ' : '') + ev.title;
          evEl.innerHTML = `
            <div class="font-medium title-clamp">${ev.title}</div>
            <div class="text-[10px] text-gray-500">${ev.time || ''}</div>
          `;
          // click to edit
          evEl.addEventListener('click', (e) => {
            e.stopPropagation();
            openModalForEdit(key, idx);
          });
          list.appendChild(evEl);
        });
    }

    cell.appendChild(top);
    cell.appendChild(list);

    // click cell to add new event
    cell.addEventListener('click', () => {
      // highlight selection
      if (selectedCellEl) selectedCellEl.classList.remove('day-selected');
      cell.classList.add('day-selected');
      selectedCellEl = cell;
      openModalForAdd(key);
    });

    calendarEl.appendChild(cell);
  }

  // update month label
  const opt = { month: 'long', year: 'numeric' };
  monthLabel.textContent = view.toLocaleDateString(undefined, opt);
}

/* Modal behaviour */
function openModalForAdd(dayKey) {
  editing = false;
  editDayKey = dayKey;
  editIndex = null;
  modalTitle.textContent = 'Add event';
  deleteContainer.classList.add('hidden');
  eventTitleInput.value = '';
  eventTimeInput.value = '';
  showModal();
}

function openModalForEdit(dayKey, idx) {
  const events = loadEvents();
  const list = events[dayKey] || [];
  if (!list[idx]) return;
  editing = true;
  editDayKey = dayKey;
  editIndex = idx;
  modalTitle.textContent = 'Edit event';
  deleteContainer.classList.remove('hidden');
  eventTitleInput.value = list[idx].title || '';
  eventTimeInput.value = list[idx].time || '';
  showModal();
}

function showModal() {
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeModalFunc() {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  if (selectedCellEl) {
    selectedCellEl.classList.remove('day-selected');
    selectedCellEl = null;
  }
  // refresh view to pick up changes
  renderCalendar();
}

// form submit (save)
eventForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const title = eventTitleInput.value.trim();
  const time = eventTimeInput.value || '';
  if (!title) {
    alert('Please enter an event title');
    return;
  }
  const events = loadEvents();
  if (!events[editDayKey]) events[editDayKey] = [];
  if (editing && editIndex !== null) {
    // update
    events[editDayKey][editIndex] = { title, time };
  } else {
    // add
    events[editDayKey].push({ title, time });
  }
  saveEvents(events);
  closeModalFunc();
});

// delete event
deleteEventBtn.addEventListener('click', function () {
  if (!editing || editIndex === null) return;
  if (!confirm('Delete this event?')) return;
  const events = loadEvents();
  if (!events[editDayKey]) return closeModalFunc();
  events[editDayKey].splice(editIndex, 1);
  if (events[editDayKey].length === 0) delete events[editDayKey];
  saveEvents(events);
  closeModalFunc();
});

// cancel and overlay close
cancelBtn.addEventListener('click', closeModalFunc);
closeModal.addEventListener('click', closeModalFunc);
modalBg.addEventListener('click', closeModalFunc);

// month navigation
prevBtn.addEventListener('click', () => {
  view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
  renderCalendar();
});
nextBtn.addEventListener('click', () => {
  view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
  renderCalendar();
});

// initial render
renderCalendar();
