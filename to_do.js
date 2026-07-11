const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') 
  ? 'http://localhost:3000/api' 
  : '/api';
  
let tasks = [];
let alarmAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Default digital alarm sound

const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDate");
const alarmSelect = document.getElementById("alarmSelect");
const categorySelect = document.getElementById("categorySelect");
const selectedCategoryInput = document.getElementById("selectedCategory");
const taskList = document.getElementById("taskList");
const chartCanvas = document.getElementById("performanceChart");

categorySelect.addEventListener("click", (e) => {
  if (e.target.dataset.category) {
    selectedCategoryInput.value = e.target.dataset.category;
    highlightSelectedCategory(e.target.dataset.category);
  }
});

function highlightSelectedCategory(category) {
  const categoryButtons = categorySelect.querySelectorAll("div");
  categoryButtons.forEach(btn => {
    if (btn.dataset.category === category) {
      btn.classList.add("active-category");
    } else {
      btn.classList.remove("active-category");
    }
  });
}

async function fetchTasks() {
  try {
    const res = await fetch(`${API_URL}/tasks`);
    tasks = await res.json();
    tasks.forEach(t => t.dueDate = new Date(t.dueDate)); 
    renderTasks();
    updateStats();
    updateGraph(currentView);
  } catch (err) {
    console.error("Failed to fetch tasks.");
  }
}

// Function to change alarm sound dynamically if needed
function setAlarmSound(soundType) {
  switch (soundType) {
    case 'chime':
      alarmAudio.src = 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3';
      break;
    case 'beep':
      alarmAudio.src = 'https://www.soundjay.com/buttons/beep-07.wav';
      break;
    case 'digital':
    default:
      alarmAudio.src = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
      break;
  }
}

document.getElementById("addTaskBtn").addEventListener("click", async () => {
  const taskName = taskInput.value.trim();
  const dueDate = dueDateInput.value;
  const alarm = alarmSelect.value;
  const category = selectedCategoryInput.value;

  if (!taskName || !category || !dueDate) {
    alert("Please enter task, select category, and set due date.");
    return;
  }

  let subtasks = "Loading AI subtasks...";
  try {
    const aiRes = await fetch(`${API_URL}/generate-subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskName })
    });
    const aiData = await aiRes.json();
    
    if (!aiRes.ok || aiData.error) {
      subtasks = `AI generation failed: ${aiData.error || 'Server error'}`;
    } else {
      subtasks = aiData.subtasks;
    }
  } catch(err) {
    subtasks = "AI generation failed: Network error.";
  }

  const task = {
    id: Date.now(),
    name: taskName,
    subtasks: subtasks,
    dueDate: new Date(dueDate),
    alarm: alarm === "yes",
    category,
    completed: false,
    alarmTriggered: false,
    completedAt: null
  };

  try {
    await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
  } catch(err) {
    console.error("Failed to save task.");
  }

  taskInput.value = "";
  dueDateInput.value = "";
  alarmSelect.value = "no";
  selectedCategoryInput.value = "";
  highlightSelectedCategory(null);
  
  fetchTasks();
});

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    if (task.completed) return;

    const now = new Date();
    const diff = task.dueDate - now;

    let timeRemaining = "";
    if (diff > 0) {
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      timeRemaining = `${hours}h ${minutes}m remaining`;
    } else {
      timeRemaining = `⏰ Due date passed!`;
    }

    const taskEl = document.createElement("div");
    taskEl.className = "task-item";
    
    taskEl.innerHTML = `
      <div class="info">
        <strong>${task.name}</strong><br>
        <small>${timeRemaining}</small>
        <br><em>${task.category}</em>
        <div class="ai-subtasks"><strong>AI Subtasks:</strong>\n${task.subtasks}</div>
      </div>
      <button onclick="completeTask(${task.id})">Done</button>
    `;

    taskList.appendChild(taskEl);
  });
}

async function completeTask(id) {
  const task = tasks.find(t => t.id === id);
  if(task) {
    task.completed = true;
    task.completedAt = new Date();
    
    try {
      await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
    } catch(err) {
      console.error("Failed to update task status.");
    }
    
    fetchTasks();
  }
}

function updateStats() {
  const categories = ["Work", "Sport", "Study", "Self-care"];
  categories.forEach((cat) => {
    const count = tasks.filter((t) => t.category === cat && !t.completed).length;
    const statId = "stat" + cat.replace(/[^a-zA-Z]/g, "");
    const statEl = document.getElementById(statId);
    if (statEl) {
      statEl.innerHTML = `${getIcon(cat)} ${cat}<br>${count} Tasks`;
    }
  });
}

function getIcon(category) {
  switch (category) {
    case "Work": return "💼";
    case "Sport": return "⚽";
    case "Study": return "📚";
    case "Self-care": return "💆";
    default: return "📝";
  }
}

function updateTimers() {
  renderTasks();
  checkAlarms();
}

function checkAlarms() {
  const now = new Date();
  tasks.forEach(task => {
    if (task.alarm && !task.completed && !task.alarmTriggered && Math.abs(task.dueDate - now) < 1000) {
      alarmAudio.play().catch(e => console.log("Audio play blocked by browser interaction policy"));
      task.alarmTriggered = true;
    }
  });
}

setInterval(updateTimers, 1000);

let chartInstance = null;
let currentView = "day";

function updateGraph(view) {
  const now = new Date();
  let labels = [];
  let data = [];

  if (view === "day") {
    labels = [...Array(24).keys()].map(h => `${h}:00`);
    data = new Array(24).fill(0);
    tasks.forEach(task => {
      if (task.completed && task.completedAt) data[new Date(task.completedAt).getHours()]++;
    });
  } else if (view === "week") {
    labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    data = new Array(7).fill(0);
    tasks.forEach(task => {
      if (task.completed && task.completedAt) data[new Date(task.completedAt).getDay()]++;
    });
  } else if (view === "month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    labels = [...Array(daysInMonth).keys()].map(d => `${d + 1}`);
    data = new Array(daysInMonth).fill(0);
    tasks.forEach(task => {
      if (task.completed && task.completedAt) {
        const date = new Date(task.completedAt);
        if (date.getMonth() === now.getMonth()) data[date.getDate() - 1]++;
      }
    });
  } else if (view === "year") {
    labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    data = new Array(12).fill(0);
    tasks.forEach(task => {
      if (task.completed && task.completedAt) data[new Date(task.completedAt).getMonth()]++;
    });
  }

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [{ label: `Tasks Completed (${view})`, data, fill: false, borderColor: "#4bc0c0", tension: 0.3 }]
    },
    options: { responsive: true, plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

const chartButtons = document.querySelectorAll(".chart-tabs button");
chartButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    chartButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentView = btn.textContent.toLowerCase();
    updateGraph(currentView);
  });
});

window.addEventListener("load", fetchTasks);