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


// --------------------------------
// localStorageキー
// --------------------------------

const STORAGE_KEY = "lifeLogData";

const RESULT_STORAGE_KEY =
  "lifeLogResultData";


// --------------------------------
// 実績の初期データ
// --------------------------------

const defaultActivityResults = [
  {
    id: 1,
    name: "勉強",
    minutes: 0
  },
  {
    id: 2,
    name: "イラスト",
    minutes: 0
  }
];


// LifeLogでは05:00を1日の区切りとして扱う
const DAY_BOUNDARY_HOUR = 5;


// --------------------------------
// 日付を YYYY-MM-DD にする
// --------------------------------

function formatDateKey(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;
}


// --------------------------------
// LifeLog上の「今日」を取得
// 00:00〜04:59は前日扱い
// --------------------------------

function getLifeLogDateKey(
  date = new Date()
) {

  const adjustedDate =
    new Date(date);


  if (
    adjustedDate.getHours() <
    DAY_BOUNDARY_HOUR
  ) {

    adjustedDate.setDate(
      adjustedDate.getDate() - 1
    );

  }


  return formatDateKey(
    adjustedDate
  );
}


// --------------------------------
// YYYY-MM-DD → Date
// --------------------------------

function dateKeyToDate(dateKey) {

  const [year, month, day] =
    dateKey
      .split("-")
      .map(Number);


  return new Date(
    year,
    month - 1,
    day
  );
}


// --------------------------------
// 初期予定をコピー
// --------------------------------

function createDefaultSchedules() {

  return defaultSchedules.map(
    schedule => ({
      ...schedule
    })
  );
}


// --------------------------------
// 初期実績をコピー
// --------------------------------

function createDefaultActivityResults() {

  return defaultActivityResults.map(
    activity => ({
      ...activity
    })
  );
}


// --------------------------------
// 1日分の実績データ
// --------------------------------

function createDefaultDailyResults() {

  return {

    wakeTime: "",

    sleepTime: "",

    activities:
      createDefaultActivityResults()

  };
}


// --------------------------------
// 予定データを全部読み込む
// --------------------------------

function loadAllData() {

  const savedData =
    localStorage.getItem(
      STORAGE_KEY
    );


  if (!savedData) {

    return {};

  }


  try {

    return JSON.parse(
      savedData
    );

  } catch (error) {

    console.error(
      "予定データの読み込みに失敗しました",
      error
    );


    return {};

  }

}


// --------------------------------
// 実績データを全部読み込む
// --------------------------------

function loadAllResultData() {

  const savedData =
    localStorage.getItem(
      RESULT_STORAGE_KEY
    );


  if (!savedData) {

    return {};

  }


  try {

    return JSON.parse(
      savedData
    );

  } catch (error) {

    console.error(
      "実績データの読み込みに失敗しました",
      error
    );


    return {};

  }

}


// --------------------------------
// 予定データを全部保存
// --------------------------------

function saveAllData() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      allData
    )
  );

}


// --------------------------------
// 実績データを全部保存
// --------------------------------

function saveAllResultData() {

  localStorage.setItem(
    RESULT_STORAGE_KEY,
    JSON.stringify(
      allResultData
    )
  );

}


// --------------------------------
// データ読み込み
// --------------------------------

let allData =
  loadAllData();


let allResultData =
  loadAllResultData();


// 現在表示している日付
let selectedDateKey =
  getLifeLogDateKey();


// --------------------------------
// 旧バージョンから予定を移行
// --------------------------------

const oldSchedulesRaw =
  localStorage.getItem(
    "schedules"
  );


let oldSchedules =
  null;


if (oldSchedulesRaw) {

  try {

    oldSchedules =
      JSON.parse(
        oldSchedulesRaw
      );

  } catch (error) {

    console.error(
      "旧予定データの読み込みに失敗しました",
      error
    );

  }

}


if (
  !allData[selectedDateKey] &&
  Array.isArray(
    oldSchedules
  )
) {

  allData[selectedDateKey] =
    oldSchedules;


  saveAllData();


  localStorage.removeItem(
    "schedules"
  );

}


// --------------------------------
// 指定日の予定を取得
// --------------------------------

function loadSchedulesForDate(
  dateKey
) {

  if (!allData[dateKey]) {

    allData[dateKey] =
      createDefaultSchedules();


    saveAllData();

  }


  return allData[
    dateKey
  ];
}


// --------------------------------
// 指定日の実績を取得
// 旧形式も自動変換
// --------------------------------

function loadResultsForDate(
  dateKey
) {

  let data =
    allResultData[
      dateKey
    ];


  // ------------------------------
  // 実績データがまだない
  // ------------------------------

  if (!data) {

    const newResults =
      createDefaultDailyResults();


    const daySchedules =
      allData[dateKey] ||
      [];


    const wakeSchedule =
      daySchedules.find(
        schedule =>
          schedule.name ===
          "起床"
      );


    const sleepSchedule =
      daySchedules.find(
        schedule =>
          schedule.name ===
          "就寝"
      );


    // 以前チェックしていた起床時間があれば引き継ぐ
    if (
      wakeSchedule?.actualTime
    ) {

      newResults.wakeTime =
        wakeSchedule.actualTime;

    }


    // 以前チェックしていた就寝時間があれば引き継ぐ
    if (
      sleepSchedule?.actualTime
    ) {

      newResults.sleepTime =
        sleepSchedule.actualTime;

    }


    allResultData[
      dateKey
    ] = newResults;


    saveAllResultData();


    return newResults;

  }


  // ------------------------------
  // 旧バージョンの実績データ
  //
  // [
  //   {
  //     name: "勉強",
  //     minutes: 30
  //   }
  // ]
  //
  // を新形式に変換
  // ------------------------------

  if (
    Array.isArray(
      data
    )
  ) {

    const daySchedules =
      allData[dateKey] ||
      [];


    const wakeSchedule =
      daySchedules.find(
        schedule =>
          schedule.name ===
          "起床"
      );


    const sleepSchedule =
      daySchedules.find(
        schedule =>
          schedule.name ===
          "就寝"
      );


    data = {

      wakeTime:
        wakeSchedule?.actualTime ||
        "",

      sleepTime:
        sleepSchedule?.actualTime ||
        "",

      activities:
        data

    };


    allResultData[
      dateKey
    ] = data;


    saveAllResultData();

  }


  // ------------------------------
  // データ破損・旧データ対策
  // ------------------------------

  if (
    typeof data !==
      "object" ||
    data === null
  ) {

    data =
      createDefaultDailyResults();

  }


  if (
    typeof data.wakeTime !==
    "string"
  ) {

    data.wakeTime =
      "";

  }


  if (
    typeof data.sleepTime !==
    "string"
  ) {

    data.sleepTime =
      "";

  }


  if (
    !Array.isArray(
      data.activities
    )
  ) {

    data.activities =
      createDefaultActivityResults();

  }


  allResultData[
    dateKey
  ] = data;


  saveAllResultData();


  return data;

}


// --------------------------------
// 現在の日付データを読み込む
// --------------------------------

let schedules =
  loadSchedulesForDate(
    selectedDateKey
  );


let dailyResults =
  loadResultsForDate(
    selectedDateKey
  );


// --------------------------------
// 予定保存
// --------------------------------

function saveSchedules() {

  allData[
    selectedDateKey
  ] = schedules;


  saveAllData();

}


// --------------------------------
// 実績保存
// --------------------------------

function saveDailyResults() {

  allResultData[
    selectedDateKey
  ] = dailyResults;


  saveAllResultData();

}


// --------------------------------
// 現在時刻
// --------------------------------

function getCurrentTime() {

  const now =
    new Date();


  const hours =
    String(
      now.getHours()
    ).padStart(
      2,
      "0"
    );


  const minutes =
    String(
      now.getMinutes()
    ).padStart(
      2,
      "0"
    );


  return `${hours}:${minutes}`;

}


// --------------------------------
// 予定を1日の流れ順に並べる
// --------------------------------

function getSortMinutes(
  time
) {

  let [
    hours,
    minutes
  ] =
    time
      .split(":")
      .map(Number);


  if (
    hours <
    DAY_BOUNDARY_HOUR
  ) {

    hours += 24;

  }


  return (
    hours * 60 +
    minutes
  );

}


function sortSchedulesByTime() {

  schedules.sort(
    (a, b) =>

      getSortMinutes(
        a.time
      ) -

      getSortMinutes(
        b.time
      )
  );

}


// --------------------------------
// 今日を表示しているか
// --------------------------------

function isViewingToday() {

  return (
    selectedDateKey ===
    getLifeLogDateKey()
  );

}


// --------------------------------
// HTMLとして危険な文字を無害化
// --------------------------------

function escapeHtml(
  text
) {

  return String(text)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// --------------------------------
// 予定表示
// --------------------------------

function renderSchedules() {

  sortSchedulesByTime();


  const list =
    document.getElementById(
      "scheduleList"
    );


  list.innerHTML =
    "";


  schedules.forEach(
    schedule => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "schedule-item";


      if (
        schedule.completed
      ) {

        item.classList.add(
          "completed"
        );

      }


      item.innerHTML = `

        <button
          class="check-button"
          data-id="${schedule.id}"

          ${
            isViewingToday()
              ? ""
              : "disabled"
          }
        >

          ${
            schedule.completed
              ? "✓"
              : ""
          }

        </button>


        <span
          class="plan-time"
        >

          ${schedule.time}

        </span>


        <span
          class="task-name"
        >

          ${
            escapeHtml(
              schedule.name
            )
          }

        </span>


        <span
          class="actual-time"
        >

          ${
            schedule.actualTime ||
            "--:--"
          }

        </span>


        ${
          isViewingToday()

            ? `

              <button
                class="delete-button"
                data-id="${schedule.id}"
                title="削除"
              >

                ×

              </button>

            `

            : `

              <span
                class="delete-placeholder"
              ></span>

            `
        }

      `;


      list.appendChild(
        item
      );

    }
  );


  updateResults();

  renderActivityResults();

  updateDate();

}


// --------------------------------
// 完了切り替え
// --------------------------------

function toggleSchedule(
  id
) {

  // 過去の予定は変更不可
  if (
    !isViewingToday()
  ) {

    return;

  }


  const schedule =
    schedules.find(
      item =>
        item.id === id
    );


  if (!schedule) {

    return;

  }


  schedule.completed =
    !schedule.completed;


  if (
    schedule.completed
  ) {

    schedule.actualTime =
      getCurrentTime();


    // ----------------------------
    // 起床をチェック
    // 実績側が空なら自動入力
    // ----------------------------

    if (
      schedule.name ===
        "起床" &&
      dailyResults.wakeTime ===
        ""
    ) {

      dailyResults.wakeTime =
        schedule.actualTime;


      saveDailyResults();

    }


    // ----------------------------
    // 就寝をチェック
    // 実績側が空なら自動入力
    // ----------------------------

    if (
      schedule.name ===
        "就寝" &&
      dailyResults.sleepTime ===
        ""
    ) {

      dailyResults.sleepTime =
        schedule.actualTime;


      saveDailyResults();

    }

  } else {

    /*
      チェックを解除しても
      実績側の起床・就寝時間は
      消さない
    */

    schedule.actualTime =
      null;

  }


  saveSchedules();

  renderSchedules();

}


// --------------------------------
// 予定追加
// --------------------------------

function addSchedule() {

  if (
    !isViewingToday()
  ) {

    return;

  }


  const time =
    prompt(
      "予定の時刻を入力してください",
      "12:00"
    );


  if (
    time === null
  ) {

    return;

  }


  const timePattern =
    /^([01]\d|2[0-3]):[0-5]\d$/;


  if (
    !timePattern.test(
      time
    )
  ) {

    alert(
      "時刻は 13:30 のように入力してください"
    );


    return;

  }


  const name =
    prompt(
      "予定の名前を入力してください"
    );


  if (
    name === null
  ) {

    return;

  }


  const trimmedName =
    name.trim();


  if (
    trimmedName ===
    ""
  ) {

    alert(
      "予定名を入力してください"
    );


    return;

  }


  const maxId =

    schedules.length > 0

      ? Math.max(

          ...schedules.map(
            schedule =>
              Number(
                schedule.id
              ) || 0
          )

        )

      : 0;


  const newSchedule = {

    id:
      maxId + 1,

    time:
      time,

    name:
      trimmedName,

    completed:
      false,

    actualTime:
      null

  };


  schedules.push(
    newSchedule
  );


  sortSchedulesByTime();

  saveSchedules();

  renderSchedules();

}


// --------------------------------
// 予定削除
// --------------------------------

function deleteSchedule(
  id
) {

  if (
    !isViewingToday()
  ) {

    return;

  }


  const schedule =
    schedules.find(
      schedule =>
        schedule.id === id
    );


  if (!schedule) {

    return;

  }


  const result =
    confirm(
      `「${schedule.name}」を削除しますか？`
    );


  if (!result) {

    return;

  }


  schedules =
    schedules.filter(
      schedule =>
        schedule.id !== id
    );


  saveSchedules();

  renderSchedules();

}


// --------------------------------
// 起床・就寝・達成数を表示
// --------------------------------

function updateResults() {

  const completed =
    schedules.filter(
      schedule =>
        schedule.completed
    ).length;


  const achievementResult =
    document.getElementById(
      "achievementResult"
    );


  if (
    achievementResult
  ) {

    achievementResult
      .textContent =

      `${completed} / ${schedules.length}`;

  }


  const wakeInput =
    document.getElementById(
      "wakeTimeInput"
    );


  const sleepInput =
    document.getElementById(
      "sleepTimeInput"
    );


  if (wakeInput) {

    wakeInput.value =
      dailyResults.wakeTime ||
      "";

  }


  if (sleepInput) {

    sleepInput.value =
      dailyResults.sleepTime ||
      "";

  }

}


// --------------------------------
// 実績一覧表示
// --------------------------------

function renderActivityResults() {

  const container =
    document.getElementById(
      "activityResults"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  dailyResults.activities.forEach(
    activity => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "activity-row";


      row.innerHTML = `

        <input

          type="text"

          class="activity-name-input"

          data-id="${activity.id}"

          value="${
            escapeHtml(
              activity.name
            )
          }"

        >


        <input

          type="number"

          class="activity-minutes-input"

          data-id="${activity.id}"

          value="${activity.minutes}"

          min="0"

          max="1440"

        >


        <span
          class="activity-minute-label"
        >

          分

        </span>


        <button

          class="activity-delete-button"

          data-id="${activity.id}"

          title="実績を削除"

        >

          ×

        </button>

      `;


      container.appendChild(
        row
      );

    }
  );

}


// --------------------------------
// 実績追加
// 過去の日付にも追加可能
// --------------------------------

function addActivity() {

  const name =
    prompt(
      "実績の名前を入力してください"
    );


  if (
    name === null
  ) {

    return;

  }


  const trimmedName =
    name.trim();


  if (
    trimmedName ===
    ""
  ) {

    alert(
      "実績名を入力してください"
    );


    return;

  }


  const ids =
    dailyResults.activities.map(
      activity =>
        Number(
          activity.id
        ) || 0
    );


  const maxId =

    ids.length > 0

      ? Math.max(
          ...ids
        )

      : 0;


  const newActivity = {

    id:
      maxId + 1,

    name:
      trimmedName,

    minutes:
      0

  };


  dailyResults.activities.push(
    newActivity
  );


  saveDailyResults();

  renderActivityResults();

}


// --------------------------------
// 実績削除
// 過去の日付でも削除可能
// --------------------------------

function deleteActivity(
  id
) {

  const activity =
    dailyResults.activities.find(
      activity =>
        activity.id === id
    );


  if (!activity) {

    return;

  }


  const result =
    confirm(
      `「${activity.name}」を削除しますか？`
    );


  if (!result) {

    return;

  }


  dailyResults.activities =

    dailyResults.activities.filter(
      activity =>
        activity.id !== id
    );


  saveDailyResults();

  renderActivityResults();

}


// --------------------------------
// 実績名・分数変更
// 過去の日付も変更可能
// --------------------------------

function updateActivity(
  id,
  type,
  value
) {

  const activity =
    dailyResults.activities.find(
      activity =>
        activity.id === id
    );


  if (!activity) {

    return;

  }


  // ----------------------------
  // 実績名変更
  // ----------------------------

  if (
    type === "name"
  ) {

    const newName =
      value.trim();


    if (
      newName ===
      ""
    ) {

      alert(
        "実績名を入力してください"
      );


      renderActivityResults();


      return;

    }


    activity.name =
      newName;

  }


  // ----------------------------
  // 分数変更
  // ----------------------------

  if (
    type ===
    "minutes"
  ) {

    let minutes =
      Number(
        value
      );


    if (
      Number.isNaN(
        minutes
      ) ||
      minutes < 0
    ) {

      minutes =
        0;

    }


    minutes =
      Math.min(

        Math.round(
          minutes
        ),

        1440

      );


    activity.minutes =
      minutes;

  }


  saveDailyResults();

}


// --------------------------------
// 日付表示
// --------------------------------

function updateDate() {

  const date =
    dateKeyToDate(
      selectedDateKey
    );


  document
    .getElementById(
      "todayDate"
    )
    .textContent =

    `${
      date.getMonth() + 1
    }/${date.getDate()}`;


  // 今日より未来には行けない
  document
    .getElementById(
      "nextDateButton"
    )
    .disabled =
    isViewingToday();


  // 予定追加は今日だけ
  document
    .getElementById(
      "addButton"
    )
    .disabled =
    !isViewingToday();

}


// --------------------------------
// 表示日変更
// --------------------------------

function changeDate(
  days
) {

  const date =
    dateKeyToDate(
      selectedDateKey
    );


  date.setDate(

    date.getDate() +
    days

  );


  const newDateKey =
    formatDateKey(
      date
    );


  if (
    newDateKey >
    getLifeLogDateKey()
  ) {

    return;

  }


  selectedDateKey =
    newDateKey;


  schedules =
    loadSchedulesForDate(
      selectedDateKey
    );


  dailyResults =
    loadResultsForDate(
      selectedDateKey
    );


  renderSchedules();

}


// --------------------------------
// 予定クリック
// --------------------------------

const scheduleListElement =
  document.getElementById(
    "scheduleList"
  );


scheduleListElement
  .addEventListener(

    "click",

    event => {


      // 完了ボタン
      const checkButton =
        event.target.closest(
          ".check-button"
        );


      if (
        checkButton
      ) {

        const id =
          Number(
            checkButton.dataset.id
          );


        toggleSchedule(
          id
        );


        return;

      }


      // 予定削除ボタン
      const deleteButton =
        event.target.closest(
          ".delete-button"
        );


      if (
        deleteButton
      ) {

        const id =
          Number(
            deleteButton.dataset.id
          );


        deleteSchedule(
          id
        );

      }

    }

  );


// --------------------------------
// 起床時間を直接変更
// 過去の日も変更可能
// --------------------------------

const wakeTimeInput =
  document.getElementById(
    "wakeTimeInput"
  );


if (
  wakeTimeInput
) {

  wakeTimeInput
    .addEventListener(

      "change",

      event => {

        dailyResults.wakeTime =
          event.target.value;


        saveDailyResults();

      }

    );

}


// --------------------------------
// 就寝時間を直接変更
// 過去の日も変更可能
// --------------------------------

const sleepTimeInput =
  document.getElementById(
    "sleepTimeInput"
  );


if (
  sleepTimeInput
) {

  sleepTimeInput
    .addEventListener(

      "change",

      event => {

        dailyResults.sleepTime =
          event.target.value;


        saveDailyResults();

      }

    );

}


// --------------------------------
// 実績名・時間変更
// --------------------------------

const activityResultsElement =
  document.getElementById(
    "activityResults"
  );


if (
  activityResultsElement
) {

  activityResultsElement
    .addEventListener(

      "change",

      event => {

        const id =
          Number(
            event.target.dataset.id
          );


        if (!id) {

          return;

        }


        // --------------------------
        // 実績名変更
        // --------------------------

        if (

          event.target
            .classList
            .contains(
              "activity-name-input"
            )

        ) {

          updateActivity(

            id,

            "name",

            event.target.value

          );

        }


        // --------------------------
        // 分数変更
        // --------------------------

        if (

          event.target
            .classList
            .contains(
              "activity-minutes-input"
            )

        ) {

          updateActivity(

            id,

            "minutes",

            event.target.value

          );


          renderActivityResults();

        }

      }

    );


  // ------------------------------
  // 実績削除
  // ------------------------------

  activityResultsElement
    .addEventListener(

      "click",

      event => {

        const button =
          event.target.closest(
            ".activity-delete-button"
          );


        if (!button) {

          return;

        }


        const id =
          Number(
            button.dataset.id
          );


        deleteActivity(
          id
        );

      }

    );

}


// --------------------------------
// ＋予定を追加
// --------------------------------

const addButton =
  document.getElementById(
    "addButton"
  );


addButton
  .addEventListener(

    "click",

    () => {

      addSchedule();

    }

  );


// --------------------------------
// ＋実績を追加
// --------------------------------

const addActivityButton =
  document.getElementById(
    "addActivityButton"
  );


if (
  addActivityButton
) {

  addActivityButton
    .addEventListener(

      "click",

      () => {

        addActivity();

      }

    );

}


// --------------------------------
// 前の日
// --------------------------------

document
  .getElementById(
    "prevDateButton"
  )
  .addEventListener(

    "click",

    () => {

      changeDate(
        -1
      );

    }

  );


// --------------------------------
// 次の日
// --------------------------------

document
  .getElementById(
    "nextDateButton"
  )
  .addEventListener(

    "click",

    () => {

      changeDate(
        1
      );

    }

  );


// --------------------------------
// 今日に戻る
// --------------------------------

document
  .getElementById(
    "todayButton"
  )
  .addEventListener(

    "click",

    () => {

      selectedDateKey =
        getLifeLogDateKey();


      schedules =
        loadSchedulesForDate(
          selectedDateKey
        );


      dailyResults =
        loadResultsForDate(
          selectedDateKey
        );


      renderSchedules();

    }

  );


// --------------------------------
// 最初の表示
// --------------------------------

renderSchedules();