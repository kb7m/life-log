const defaultSchedules = [
  {
    id: 1,
    time: "08:30",
    name: "起床",
    completed: false,
    actualTime: null
  },

  {
    id: 2,
    time: "09:00",
    name: "朝の準備",
    completed: false,
    actualTime: null
  },

  {
    id: 3,
    time: "11:00",
    name: "自由時間",
    completed: false,
    actualTime: null
  },

  {
    id: 4,
    time: "13:00",
    name: "イラスト",
    completed: false,
    actualTime: null
  },

  {
    id: 5,
    time: "14:00",
    name: "基本情報",
    completed: false,
    actualTime: null
  },

  {
    id: 6,
    time: "00:00",
    name: "スマホ・PC終了",
    completed: false,
    actualTime: null
  },

  {
    id: 7,
    time: "00:30",
    name: "就寝",
    completed: false,
    actualTime: null
  }
];

let schedules =
  JSON.parse(localStorage.getItem("schedules"))
  || defaultSchedules;


function saveSchedules() {

  localStorage.setItem(
    "schedules",
    JSON.stringify(schedules)
  );

}


function getCurrentTime() {

  const now = new Date();

  const hours =
    String(now.getHours()).padStart(2, "0");

  const minutes =
    String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}


function renderSchedules() {

  const list =
    document.getElementById("scheduleList");

  list.innerHTML = "";


  schedules.forEach(schedule => {

    const item =
      document.createElement("div");

    item.className = "schedule-item";


    if (schedule.completed) {

      item.classList.add("completed");

    }


    item.innerHTML = `

      <button
        class="check-button"
        data-id="${schedule.id}"
      >

        ${schedule.completed ? "✓" : ""}

      </button>


      <span class="plan-time">

        ${schedule.time}

      </span>


      <span class="task-name">

        ${schedule.name}

      </span>


      <span class="actual-time">

        ${schedule.actualTime || "--:--"}

      </span>

    `;


    list.appendChild(item);

  });


  updateResults();

}


function toggleSchedule(id) {

  const schedule =
    schedules.find(item => item.id === id);


  if (!schedule) return;


  schedule.completed =
    !schedule.completed;


  if (schedule.completed) {

    schedule.actualTime =
      getCurrentTime();

  } else {

    schedule.actualTime =
      null;

  }


  saveSchedules();

  renderSchedules();

}


function updateResults() {

  const completed =
    schedules.filter(
      schedule => schedule.completed
    ).length;


  document.getElementById(
    "achievementResult"
  ).textContent =
    `${completed} / ${schedules.length}`;


  const wake =
    schedules.find(
      schedule => schedule.name === "起床"
    );


  const sleep =
    schedules.find(
      schedule => schedule.name === "就寝"
    );


  document.getElementById(
    "wakeResult"
  ).textContent =
    wake?.actualTime || "—";


  document.getElementById(
    "sleepResult"
  ).textContent =
    sleep?.actualTime || "—";

}


document
  .getElementById("scheduleList")
  .addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          ".check-button"
        );


      if (!button) return;


      const id =
        Number(button.dataset.id);


      toggleSchedule(id);

    }
  );


const today =
  new Date();


document.getElementById(
  "todayDate"
).textContent =
  `${today.getMonth() + 1}/${today.getDate()}`;


renderSchedules();