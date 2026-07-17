# 📝 Task Manager

A full-stack task management application that uses the **Google Gemini API** to automatically break down tasks into actionable subtasks.  
This app allows users to add tasks, categorize them, set due dates, and track performance through statistics.

---

## 🚀 Features

- **Add Tasks** with title, due date, alarm option, and category.  
- **Categories Available**:  
  - 📂 Work  
  - ⚽ Sport  
  - 📖 Study  
  - 🧘 Self-care  
- **Task Statistics** – View number of tasks in each category.  
- **Performance Tracking** – Check progress for **Day, Week, Month, and Year**.  
- **User-friendly UI** – Clean design with pastel gradients and responsive layout.  

---

## 🛠️ Technologies Used

- **HTML** – Structure of the web application.  
- **CSS** – Styling, layout, and responsive design.  
- **JavaScript** – Functionality for adding tasks, categorizing, and updating stats.
- **Node.js** - Backend runtime environment.
- **Express.js** - Backend web framework for building the API.
- **Google Gemini API** - AI integration for generating actionable subtasks.
- **Chart.js** - Rendering the performance and statistics graphs.  

---

## ▶️ How to Run

1. Clone the repository
    ```bash
    git clone https://github.com/A-Roy2004/Task.git
2. Open your terminal and change the current directory to **Task** folder.
3. Install the dependencies
    ```bash
    npm install
4.  Create a .env file in the root directory and add your Gemini API key:
    ```bash
    GEMINI_API_KEY=your_api_key_here
    PORT=3000
5. Start the backend server
    ```bash
    node server.js
6. Open any modern web browser and navigate to **http://localhost:3000** or directly open **index.html** file in any modern web browser.
   
---

## 🌐 Live Demo

Check out the live application here: [Task Manager App](https://task-siqj.vercel.app)

---

## 📁 Project Structure

```plaintext
Task-folder/
├── index.html          # Main frontend UI structure
├── style.css           # Styling, layout, and responsive design
├── to_do.js            # Frontend JavaScript (UI logic and API calls)
├── server.js           # Node.js/Express backend server & Gemini AI integration
├── vercel.json         # Configuration for Vercel deployment
├── package.json        # Node.js project metadata and dependencies
├── package-lock.json   # Exact dependency tree for consistent installs
└── README.md           # Project documentation
