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

const STORAGE_KEY =
  "lifeLogData";

const RESULT_STORAGE_KEY =
  "lifeLogResultData";

// --------------------------------
// 写真用 IndexedDB
// --------------------------------

const PHOTO_DB_NAME =
  "LifeLogDB";

const PHOTO_DB_VERSION =
  1;

const PHOTO_STORE_NAME =
  "dailyPhotos";

// --------------------------------
// IndexedDBを開く
// --------------------------------

function openPhotoDB() {

  return new Promise(
    (resolve, reject) => {

      const request =
        indexedDB.open(
          PHOTO_DB_NAME,
          PHOTO_DB_VERSION
        );

      request.onupgradeneeded =
        event => {

          const db =
            event.target.result;

          if (
            !db.objectStoreNames.contains(
              PHOTO_STORE_NAME
            )
          ) {

            db.createObjectStore(
              PHOTO_STORE_NAME,
              {
                keyPath:
                  "date"
              }
            );

          }

        };

      request.onsuccess =
        event => {

          resolve(
            event.target.result
          );

        };

      request.onerror =
        event => {

          reject(
            event.target.error
          );

        };

    }
  );

}

// --------------------------------
// 写真を縮小・圧縮
// --------------------------------

function compressImage(
  file
) {

  return new Promise(
    (resolve, reject) => {

      const image =
        new Image();

      const objectUrl =
        URL.createObjectURL(
          file
        );

      image.onload =
        () => {

          const MAX_SIZE =
            1600;

          let width =
            image.naturalWidth;

          let height =
            image.naturalHeight;

          if (
            width > MAX_SIZE ||
            height > MAX_SIZE
          ) {

            const scale =
              Math.min(
                MAX_SIZE / width,
                MAX_SIZE / height
              );

            width =
              Math.round(
                width * scale
              );

            height =
              Math.round(
                height * scale
              );

          }

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            width;

          canvas.height =
            height;

          const context =
            canvas.getContext(
              "2d"
            );

          if (!context) {

            URL.revokeObjectURL(
              objectUrl
            );

            reject(
              new Error(
                "画像の処理に失敗しました"
              )
            );

            return;

          }

          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          canvas.toBlob(
            blob => {

              URL.revokeObjectURL(
                objectUrl
              );

              if (!blob) {

                reject(
                  new Error(
                    "画像の圧縮に失敗しました"
                  )
                );

                return;

              }

              resolve(
                blob
              );

            },
            "image/jpeg",
            0.82
          );

        };

      image.onerror =
        () => {

          URL.revokeObjectURL(
            objectUrl
          );

          reject(
            new Error(
              "画像を読み込めませんでした"
            )
          );

        };

      image.src =
        objectUrl;

    }
  );

}

// --------------------------------
// 写真保存
// --------------------------------

async function saveDailyPhoto(
  file
) {

  const db =
    await openPhotoDB();

  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          PHOTO_STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          PHOTO_STORE_NAME
        );

      store.put({
        date:
          selectedDateKey,

        image:
          file
      });

      transaction.oncomplete =
        () => {

          db.close();

          resolve();

        };

      transaction.onerror =
        event => {

          db.close();

          reject(
            event.target.error
          );

        };

    }
  );

}

// --------------------------------
// 写真取得
// --------------------------------

async function getDailyPhoto() {

  const db =
    await openPhotoDB();

  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          PHOTO_STORE_NAME,
          "readonly"
        );

      const store =
        transaction.objectStore(
          PHOTO_STORE_NAME
        );

      const request =
        store.get(
          selectedDateKey
        );

      request.onsuccess =
        () => {

          db.close();

          resolve(
            request.result || null
          );

        };

      request.onerror =
        () => {

          db.close();

          reject(
            request.error
          );

        };

    }
  );

}

// --------------------------------
// 今日の写真を表示
// --------------------------------

let currentPhotoUrl =
  null;

async function renderDailyPhoto() {

  const container =
    document.getElementById(
      "dailyPhotoPreview"
    );

  const deleteButton =
    document.getElementById(
      "deletePhotoButton"
    );

  if (!container) {

    return;

  }

  if (
    currentPhotoUrl
  ) {

    URL.revokeObjectURL(
      currentPhotoUrl
    );

    currentPhotoUrl =
      null;

  }

  const photo =
    await getDailyPhoto();

  if (
    !photo
  ) {

    container.innerHTML = `
      <p class="photo-empty">
        まだ写真がありません
      </p>
    `;

    if (
      deleteButton
    ) {

      deleteButton.hidden =
        true;

    }

    return;

  }

  currentPhotoUrl =
    URL.createObjectURL(
      photo.image
    );

  container.innerHTML = `
    <img
      src="${currentPhotoUrl}"
      alt="今日の写真"
    >
  `;

  if (
    deleteButton
  ) {

    deleteButton.hidden =
      false;

  }

}

// --------------------------------
// 写真削除
// --------------------------------

async function deleteDailyPhoto() {

  const result =
    confirm(
      "この日の写真を削除しますか？"
    );

  if (
    !result
  ) {

    return;

  }

  const db =
    await openPhotoDB();

  await new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          PHOTO_STORE_NAME,
          "readwrite"
        );

      transaction
        .objectStore(
          PHOTO_STORE_NAME
        )
        .delete(
          selectedDateKey
        );

      transaction.oncomplete =
        () => {

          db.close();

          resolve();

        };

      transaction.onerror =
        event => {

          db.close();

          reject(
            event.target.error
          );

        };

    }
  );

  renderDailyPhoto();

}

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

// --------------------------------
// LifeLogでは05:00を1日の区切りとして扱う
// --------------------------------

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
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

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

  const [
    year,
    month,
    day
  ] =
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
      createDefaultActivityResults(),

    expenses: [],

    dailyNote: ""

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

if (
  oldSchedulesRaw
) {

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

  allData[
    selectedDateKey
  ] =
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

  if (
    !allData[
      dateKey
    ]
  ) {

    allData[
      dateKey
    ] =
      createDefaultSchedules();

    saveAllData();

  }

  return allData[
    dateKey
  ];

}

// --------------------------------
// 指定日の実績を取得
// --------------------------------

function loadResultsForDate(
  dateKey
) {

  let data =
    allResultData[
      dateKey
    ];

  if (!data) {

    const newResults =
      createDefaultDailyResults();

    const daySchedules =
      allData[
        dateKey
      ] || [];

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

    if (
      wakeSchedule?.actualTime
    ) {

      newResults.wakeTime =
        wakeSchedule.actualTime;

    }

    if (
      sleepSchedule?.actualTime
    ) {

      newResults.sleepTime =
        sleepSchedule.actualTime;

    }

    allResultData[
      dateKey
    ] =
      newResults;

    saveAllResultData();

    return newResults;

  }

  if (
    Array.isArray(
      data
    )
  ) {

    const daySchedules =
      allData[
        dateKey
      ] || [];

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
    ] =
      data;

    saveAllResultData();

  }

  if (
    typeof data !==
      "object" ||
    data ===
      null
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

  if (
    !Array.isArray(
      data.expenses
    )
  ) {

    data.expenses =
      [];

  }

  if (
    typeof data.dailyNote !==
    "string"
  ) {

    data.dailyNote =
      "";

  }

  allResultData[
    dateKey
  ] =
    data;

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
  ] =
    schedules;

  saveAllData();

}

// --------------------------------
// 実績保存
// --------------------------------

function saveDailyResults() {

  allResultData[
    selectedDateKey
  ] =
    dailyResults;

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

    hours +=
      24;

  }

  return (
    hours * 60 +
    minutes
  );

}

function sortSchedulesByTime() {

  schedules.sort(
    (
      a,
      b
    ) =>

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

  return String(
    text
  )

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
// 予定編集・並び替え状態
// --------------------------------

let editingScheduleId =
  null;

let draggingScheduleId =
  null;

// --------------------------------
// 予定表示
// --------------------------------

function renderSchedules() {

  const list =
    document.getElementById(
      "scheduleList"
    );

  if (!list) {

    return;

  }

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

      item.dataset.id =
        String(
          schedule.id
        );

      if (
        schedule.completed
      ) {

        item.classList.add(
          "completed"
        );

      }

      const canEdit =
        isViewingToday();

      const isEditing =
        canEdit &&
        editingScheduleId ===
          schedule.id;

      if (
        isEditing
      ) {

        item.classList.add(
          "editing"
        );

      }

      item.innerHTML = `

        ${
          canEdit

            ? `
              <button
                class="drag-handle"
                data-id="${schedule.id}"
                type="button"
                aria-label="予定を並び替え"
                title="ドラッグして並び替え"
                ${isEditing ? "disabled" : ""}
              >
                ⠿
              </button>
            `

            : `
              <span
                class="drag-placeholder"
              ></span>
            `
        }

        <button
          class="check-button"
          data-id="${schedule.id}"
          type="button"
          ${
            canEdit
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
          canEdit

            ? `
              <button
                class="schedule-edit-button"
                data-id="${schedule.id}"
                type="button"
                aria-label="予定を編集"
                title="編集"
              >
                ✎
              </button>
            `

            : `
              <span
                class="schedule-action-placeholder"
              ></span>
            `
        }

        ${
          isEditing

            ? `
              <div
                class="schedule-edit-panel"
              >

                <input
                  class="schedule-edit-time"
                  type="time"
                  value="${schedule.time}"
                >

                <input
                  class="schedule-edit-name"
                  type="text"
                  value="${escapeHtml(
                    schedule.name
                  )}"
                  maxlength="50"
                >

                <div
                  class="schedule-edit-actions"
                >

                  <button
                    class="schedule-save-button"
                    data-id="${schedule.id}"
                    type="button"
                  >
                    保存
                  </button>

                  <button
                    class="schedule-cancel-button"
                    data-id="${schedule.id}"
                    type="button"
                  >
                    取消
                  </button>

                  <button
                    class="schedule-edit-delete-button"
                    data-id="${schedule.id}"
                    type="button"
                  >
                    削除
                  </button>

                </div>

              </div>
            `

            : ""
        }

      `;

      list.appendChild(
        item
      );

    }
  );

  updateResults();

  renderActivityResults();

  renderExpenseResults();

  renderDailyNote();

  renderDailyPhoto();

  updateDate();

  updateWeeklySummary();

  if (
    editingScheduleId !==
    null
  ) {

    const editingItem =
      list.querySelector(
        `.schedule-item[data-id="${editingScheduleId}"]`
      );

    const nameInput =
      editingItem?.querySelector(
        ".schedule-edit-name"
      );

    nameInput?.focus();

    nameInput?.select();

  }

}

// --------------------------------
// 予定編集
// --------------------------------

function updateScheduleDetails(
  id,
  time,
  name
) {

  if (
    !isViewingToday()
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
      "正しい時刻を入力してください"
    );

    return;

  }

  const trimmedName =
    String(
      name
    ).trim();

  if (
    trimmedName ===
    ""
  ) {

    alert(
      "予定名を入力してください"
    );

    return;

  }

  const schedule =
    schedules.find(
      schedule =>
        schedule.id ===
        id
    );

  if (!schedule) {

    return;

  }

  schedule.time =
    time;

  schedule.name =
    trimmedName;

  editingScheduleId =
    null;

  saveSchedules();

  renderSchedules();

}

// --------------------------------
// 完了切り替え
// --------------------------------

function toggleSchedule(
  id
) {

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
// その週の月曜日を取得
// --------------------------------

function getMondayOfWeek(
  dateKey
) {

  const date =
    dateKeyToDate(
      dateKey
    );

  const day =
    date.getDay();

  const diff =
    day === 0
      ? -6
      : 1 - day;

  date.setDate(
    date.getDate() +
    diff
  );

  return date;

}

// --------------------------------
// 分 → 見やすい時間
// --------------------------------

function formatDuration(
  minutes
) {

  if (
    minutes < 60
  ) {

    return `${minutes}分`;

  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remainingMinutes =
    minutes %
    60;

  if (
    remainingMinutes ===
    0
  ) {

    return `${hours}時間`;

  }

  return (
    `${hours}時間${remainingMinutes}分`
  );

}

// --------------------------------
// 週間の実績を名前ごとに集計
// --------------------------------

function calculateWeeklyActivityTotals(
  dateKey
) {

  const monday =
    getMondayOfWeek(
      dateKey
    );

  const totals =
    {};

  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const date =
      new Date(
        monday
      );

    date.setDate(
      monday.getDate() +
      i
    );

    const key =
      formatDateKey(
        date
      );

    const result =
      allResultData[
        key
      ];

    if (
      !result ||
      !Array.isArray(
        result.activities
      )
    ) {

      continue;

    }

    result.activities.forEach(
      activity => {

        const name =
          String(
            activity.name ||
            ""
          ).trim();

        const minutes =
          Number(
            activity.minutes
          ) || 0;

        if (
          name === ""
        ) {

          return;

        }

        if (
          name === "起床" ||
          name === "就寝"
        ) {

          return;

        }

        if (
          minutes <= 0
        ) {

          return;

        }

        if (
          !totals[name]
        ) {

          totals[name] =
            0;

        }

        totals[name] +=
          minutes;

      }
    );

  }

  return totals;

}

// --------------------------------
// 週間支出を集計
// --------------------------------

function calculateWeeklyExpenseSummary(
  dateKey
) {

  const monday =
    getMondayOfWeek(
      dateKey
    );

  let total =
    0;

  const breakdown =
    {};

  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const date =
      new Date(
        monday
      );

    date.setDate(
      monday.getDate() +
      i
    );

    const key =
      formatDateKey(
        date
      );

    const result =
      allResultData[
        key
      ];

    if (
      !result ||
      !Array.isArray(
        result.expenses
      )
    ) {

      continue;

    }

    result.expenses.forEach(
      expense => {

        const name =
          String(
            expense.name ||
            ""
          ).trim();

        const amount =
          Number(
            expense.amount
          ) || 0;

        if (
          name === "" ||
          amount <= 0
        ) {

          return;

        }

        total +=
          amount;

        if (
          !breakdown[
            name
          ]
        ) {

          breakdown[
            name
          ] =
            0;

        }

        breakdown[
          name
        ] +=
          amount;

      }
    );

  }

  return {

    total:
      total,

    breakdown:
      breakdown

  };

}

// --------------------------------
// 週間支出表示
// --------------------------------

function updateWeeklyExpenseSummary() {

  const totalElement =
    document.getElementById(
      "weeklyExpenseTotal"
    );

  const container =
    document.getElementById(
      "weeklyExpenseSummary"
    );

  if (
    !totalElement ||
    !container
  ) {

    return;

  }

  const summary =
    calculateWeeklyExpenseSummary(
      selectedDateKey
    );

  totalElement.textContent =
    `${summary.total.toLocaleString()}円`;

  container.innerHTML =
    "";

  const expenses =
    Object.entries(
      summary.breakdown
    );

  expenses.sort(
    (a, b) =>
      b[1] - a[1]
  );

  if (
    expenses.length === 0
  ) {

    container.innerHTML = `
      <p class="weekly-expense-empty">
        まだ支出がありません
      </p>
    `;

    updateMonthlySummary();

    return;

  }

  expenses.forEach(
    (
      [
        name,
        amount
      ]
    ) => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "weekly-expense-row";

      row.innerHTML = `

        <span
          class="weekly-expense-name"
        >
          ${escapeHtml(name)}
        </span>

        <strong
          class="weekly-expense-amount"
        >
          ${amount.toLocaleString()}円
        </strong>

      `;

      container.appendChild(
        row
      );

    }
  );

  updateMonthlySummary();

}

// --------------------------------
// 週間まとめ表示
// --------------------------------

function updateWeeklySummary() {

  const container =
    document.getElementById(
      "weeklyActivitySummary"
    );

  const rangeElement =
    document.getElementById(
      "weeklyDateRange"
    );

  if (
    !container ||
    !rangeElement
  ) {

    return;

  }

  const monday =
    getMondayOfWeek(
      selectedDateKey
    );

  const sunday =
    new Date(
      monday
    );

  sunday.setDate(
    monday.getDate() +
    6
  );

  rangeElement.textContent =
    `${
      monday.getMonth() + 1
    }/${monday.getDate()} - ${
      sunday.getMonth() + 1
    }/${sunday.getDate()}`;

  const totals =
    calculateWeeklyActivityTotals(
      selectedDateKey
    );

  container.innerHTML =
    "";

  const activities =
    Object.entries(
      totals
    );

  updateMonthlySummary();

  if (
    activities.length === 0
  ) {

    container.innerHTML = `
      <p class="weekly-empty">
        まだ実績がありません
      </p>
    `;

    return;

  }

  activities.sort(
    (a, b) =>
      b[1] - a[1]
  );

  activities.forEach(
    ([name, minutes]) => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "weekly-activity-row";

      row.innerHTML = `

        <span
          class="weekly-activity-name"
        >
          ${escapeHtml(name)}
        </span>

        <strong
          class="weekly-activity-time"
        >
          ${formatDuration(minutes)}
        </strong>

      `;

      container.appendChild(
        row
      );

    }
  );

}

// --------------------------------
// 月間の実績を集計
// --------------------------------

function calculateMonthlyActivityTotals(
  dateKey
) {

  const date =
    dateKeyToDate(
      dateKey
    );

  const year =
    date.getFullYear();

  const month =
    date.getMonth();

  const lastDay =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const totals =
    {};

  for (
    let day = 1;
    day <= lastDay;
    day++
  ) {

    const currentDate =
      new Date(
        year,
        month,
        day
      );

    const key =
      formatDateKey(
        currentDate
      );

    const result =
      allResultData[
        key
      ];

    if (
      !result ||
      !Array.isArray(
        result.activities
      )
    ) {

      continue;

    }

    result.activities.forEach(
      activity => {

        const name =
          String(
            activity.name ||
            ""
          ).trim();

        const minutes =
          Number(
            activity.minutes
          ) || 0;

        if (
          name === "" ||
          name === "起床" ||
          name === "就寝" ||
          minutes <= 0
        ) {

          return;

        }

        if (
          !totals[name]
        ) {

          totals[name] =
            0;

        }

        totals[name] +=
          minutes;

      }
    );

  }

  return totals;

}

// --------------------------------
// 月間支出を集計
// --------------------------------

function calculateMonthlyExpenseSummary(
  dateKey
) {

  const date =
    dateKeyToDate(
      dateKey
    );

  const year =
    date.getFullYear();

  const month =
    date.getMonth();

  const lastDay =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  let total =
    0;

  const breakdown =
    {};

  for (
    let day = 1;
    day <= lastDay;
    day++
  ) {

    const currentDate =
      new Date(
        year,
        month,
        day
      );

    const key =
      formatDateKey(
        currentDate
      );

    const result =
      allResultData[
        key
      ];

    if (
      !result ||
      !Array.isArray(
        result.expenses
      )
    ) {

      continue;

    }

    result.expenses.forEach(
      expense => {

        const name =
          String(
            expense.name ||
            ""
          ).trim();

        const amount =
          Number(
            expense.amount
          ) || 0;

        if (
          name === "" ||
          amount <= 0
        ) {

          return;

        }

        total +=
          amount;

        if (
          !breakdown[name]
        ) {

          breakdown[name] =
            0;

        }

        breakdown[name] +=
          amount;

      }
    );

  }

  return {
    total,
    breakdown
  };

}

// --------------------------------
// 月間まとめ表示
// --------------------------------

function updateMonthlySummary() {

  const activityContainer =
    document.getElementById(
      "monthlyActivitySummary"
    );

  const expenseContainer =
    document.getElementById(
      "monthlyExpenseSummary"
    );

  const expenseTotal =
    document.getElementById(
      "monthlyExpenseTotal"
    );

  const rangeElement =
    document.getElementById(
      "monthlyDateRange"
    );

  if (
    !activityContainer ||
    !expenseContainer ||
    !expenseTotal ||
    !rangeElement
  ) {

    return;

  }

  const date =
    dateKeyToDate(
      selectedDateKey
    );

  rangeElement.textContent =
    `${date.getFullYear()}年${date.getMonth() + 1}月`;

  const totals =
    calculateMonthlyActivityTotals(
      selectedDateKey
    );

  const activities =
    Object.entries(
      totals
    );

  activities.sort(
    (a, b) =>
      b[1] - a[1]
  );

  activityContainer.innerHTML =
    "";

  if (
    activities.length === 0
  ) {

    activityContainer.innerHTML = `
      <p class="weekly-empty">
        まだ実績がありません
      </p>
    `;

  } else {

    activities.forEach(
      ([name, minutes]) => {

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "weekly-activity-row";

        row.innerHTML = `
          <span class="weekly-activity-name">
            ${escapeHtml(name)}
          </span>

          <strong class="weekly-activity-time">
            ${formatDuration(minutes)}
          </strong>
        `;

        activityContainer.appendChild(
          row
        );

      }
    );

  }

  const expenseSummary =
    calculateMonthlyExpenseSummary(
      selectedDateKey
    );

  expenseTotal.textContent =
    `${expenseSummary.total.toLocaleString()}円`;

  const expenses =
    Object.entries(
      expenseSummary.breakdown
    );

  expenses.sort(
    (a, b) =>
      b[1] - a[1]
  );

  expenseContainer.innerHTML =
    "";

  if (
    expenses.length === 0
  ) {

    expenseContainer.innerHTML = `
      <p class="weekly-expense-empty">
        まだ支出がありません
      </p>
    `;

    return;

  }

  expenses.forEach(
    ([name, amount]) => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "weekly-expense-row";

      row.innerHTML = `
        <span class="weekly-expense-name">
          ${escapeHtml(name)}
        </span>

        <strong class="weekly-expense-amount">
          ${amount.toLocaleString()}円
        </strong>
      `;

      expenseContainer.appendChild(
        row
      );

    }
  );

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

    achievementResult.textContent =
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

  if (
    wakeInput
  ) {

    wakeInput.value =
      dailyResults.wakeTime ||
      "";

  }

  if (
    sleepInput
  ) {

    sleepInput.value =
      dailyResults.sleepTime ||
      "";

  }

}

// --------------------------------
// 今日の一言を表示
// --------------------------------

function renderDailyNote() {

  const input =
    document.getElementById(
      "dailyNoteInput"
    );

  if (!input) {

    return;

  }

  input.value =
    dailyResults.dailyNote || "";

}

// --------------------------------
// 実績一覧表示
// --------------------------------

function renderActivityResults() {

  const container =
    document.getElementById(
      "activityResults"
    );

  if (
    !container
  ) {

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

  updateWeeklySummary();

}

// --------------------------------
// 実績削除
// --------------------------------

function deleteActivity(
  id
) {

  const activity =
    dailyResults.activities.find(
      activity =>
        activity.id === id
    );

  if (
    !activity
  ) {

    return;

  }

  const result =
    confirm(
      `「${activity.name}」を削除しますか？`
    );

  if (
    !result
  ) {

    return;

  }

  dailyResults.activities =
    dailyResults.activities.filter(
      activity =>
        activity.id !== id
    );

  saveDailyResults();

  renderActivityResults();

  updateWeeklySummary();

}

// --------------------------------
// 実績名・分数変更
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

  if (
    !activity
  ) {

    return;

  }

  if (
    type ===
    "name"
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

  updateWeeklySummary();

}

// --------------------------------
// 日付表示
// --------------------------------

function updateDate() {

  const date =
    dateKeyToDate(
      selectedDateKey
    );

  const monthProgress =
    document.getElementById(
      "monthProgress"
    );

  if (
    monthProgress
  ) {

    const year =
      date.getFullYear();

    const month =
      date.getMonth();

    const currentDay =
      date.getDate();

    const lastDay =
      new Date(
        year,
        month + 1,
        0
      ).getDate();

    const remainingDays =
      lastDay -
      currentDay;

    if (
      remainingDays === 0
    ) {

      monthProgress.textContent =
        `${month + 1}月${lastDay}日まで ・ 今日で終了`;

    } else {

      monthProgress.textContent =
        `${month + 1}月${lastDay}日まで ・ あと${remainingDays}日`;

    }

  }

  const todayDate =
    document.getElementById(
      "todayDate"
    );

  if (
    todayDate
  ) {

    todayDate.textContent =
      `${
        date.getMonth() + 1
      }/${date.getDate()}`;

  }

  const datePickerInput =
    document.getElementById(
      "datePickerInput"
    );

  if (
    datePickerInput
  ) {

    datePickerInput.value =
      selectedDateKey;

    datePickerInput.max =
      getLifeLogDateKey();

  }

  const nextDateButton =
    document.getElementById(
      "nextDateButton"
    );

  if (
    nextDateButton
  ) {

    nextDateButton.disabled =
      isViewingToday();

  }

  const addButton =
    document.getElementById(
      "addButton"
    );

  if (
    addButton
  ) {

    addButton.disabled =
      !isViewingToday();

  }

}

// --------------------------------
// 日付移動モード
// --------------------------------

let dateMoveMode =
  "day";

// --------------------------------
// 指定した日へ移動
// --------------------------------

function goToDate(
  dateKey
) {

  const todayKey =
    getLifeLogDateKey();

  if (
    !dateKey ||
    dateKey > todayKey
  ) {

    return;

  }

  editingScheduleId =
    null;

  draggingScheduleId =
    null;

  document.body
    .classList.remove(
      "schedule-reordering"
    );

  selectedDateKey =
    dateKey;

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
// 日 / 月 単位で移動
// --------------------------------

function changeDate(
  direction
) {

  const currentDate =
    dateKeyToDate(
      selectedDateKey
    );

  let targetDate;

  if (
    dateMoveMode ===
    "month"
  ) {

    const originalDay =
      currentDate.getDate();

    targetDate =
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() +
          direction,
        1
      );

    const targetLastDay =
      new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0
      ).getDate();

    targetDate.setDate(
      Math.min(
        originalDay,
        targetLastDay
      )
    );

  } else {

    targetDate =
      new Date(
        currentDate
      );

    targetDate.setDate(
      targetDate.getDate() +
        direction
    );

  }

  let newDateKey =
    formatDateKey(
      targetDate
    );

  const todayKey =
    getLifeLogDateKey();

  if (
    newDateKey >
    todayKey
  ) {

    if (
      direction > 0
    ) {

      newDateKey =
        todayKey;

    } else {

      return;

    }

  }

  goToDate(
    newDateKey
  );

}
// --------------------------------
// 予定クリック
// --------------------------------

const scheduleListElement =
  document.getElementById(
    "scheduleList"
  );

// --------------------------------
// DOMの順番を予定データへ保存
// --------------------------------

function saveScheduleOrderFromDom() {

  if (
    !scheduleListElement
  ) {

    return;

  }

  const ids =
    [
      ...scheduleListElement
        .querySelectorAll(
          ".schedule-item"
        )
    ].map(
      item =>
        Number(
          item.dataset.id
        )
    );

  const scheduleMap =
    new Map(
      schedules.map(
        schedule => [
          schedule.id,
          schedule
        ]
      )
    );

  schedules =
    ids
      .map(
        id =>
          scheduleMap.get(
            id
          )
      )
      .filter(Boolean);

  saveSchedules();

}

// --------------------------------
// キーボード並び替え
// --------------------------------

function moveScheduleByKeyboard(
  id,
  direction
) {

  if (
    !isViewingToday()
  ) {

    return;

  }

  const currentIndex =
    schedules.findIndex(
      schedule =>
        schedule.id ===
        id
    );

  if (
    currentIndex ===
    -1
  ) {

    return;

  }

  const newIndex =
    currentIndex +
    direction;

  if (
    newIndex < 0 ||
    newIndex >=
      schedules.length
  ) {

    return;

  }

  const [
    movedSchedule
  ] =
    schedules.splice(
      currentIndex,
      1
    );

  schedules.splice(
    newIndex,
    0,
    movedSchedule
  );

  saveSchedules();

  renderSchedules();

  requestAnimationFrame(
    () => {

      scheduleListElement
        ?.querySelector(
          `.drag-handle[data-id="${id}"]`
        )
        ?.focus();

    }
  );

}

// --------------------------------
// ドラッグ終了
// --------------------------------

function finishScheduleDrag() {

  if (
    draggingScheduleId ===
    null
  ) {

    return;

  }

  saveScheduleOrderFromDom();

  draggingScheduleId =
    null;

  document.body
    .classList.remove(
      "schedule-reordering"
    );

  renderSchedules();

}

if (
  scheduleListElement
) {

  scheduleListElement
    .addEventListener(
      "click",
      event => {

        const checkButton =
          event.target.closest(
            ".check-button"
          );

        if (
          checkButton
        ) {

          toggleSchedule(
            Number(
              checkButton.dataset.id
            )
          );

          return;

        }

        const editButton =
          event.target.closest(
            ".schedule-edit-button"
          );

        if (
          editButton
        ) {

          editingScheduleId =
            Number(
              editButton.dataset.id
            );

          renderSchedules();

          return;

        }

        const saveButton =
          event.target.closest(
            ".schedule-save-button"
          );

        if (
          saveButton
        ) {

          const id =
            Number(
              saveButton.dataset.id
            );

          const item =
            saveButton.closest(
              ".schedule-item"
            );

          if (
            !item
          ) {

            return;

          }

          const timeInput =
            item.querySelector(
              ".schedule-edit-time"
            );

          const nameInput =
            item.querySelector(
              ".schedule-edit-name"
            );

          if (
            !timeInput ||
            !nameInput
          ) {

            return;

          }

          updateScheduleDetails(
            id,
            timeInput.value,
            nameInput.value
          );

          return;

        }

        const cancelButton =
          event.target.closest(
            ".schedule-cancel-button"
          );

        if (
          cancelButton
        ) {

          editingScheduleId =
            null;

          renderSchedules();

          return;

        }

        const deleteButton =
          event.target.closest(
            ".schedule-edit-delete-button"
          );

        if (
          deleteButton
        ) {

          const id =
            Number(
              deleteButton.dataset.id
            );

          editingScheduleId =
            null;

          deleteSchedule(
            id
          );

          return;

        }

      }
    );

  scheduleListElement
    .addEventListener(
      "keydown",
      event => {

        const item =
          event.target.closest(
            ".schedule-item"
          );

        if (
          !item
        ) {

          return;

        }

        if (
          event.target
            .classList
            .contains(
              "drag-handle"
            )
        ) {

          if (
            event.key ===
              "ArrowUp" ||
            event.key ===
              "ArrowDown"
          ) {

            event.preventDefault();

            const id =
              Number(
                item.dataset.id
              );

            moveScheduleByKeyboard(
              id,
              event.key ===
                "ArrowUp"
                ? -1
                : 1
            );

          }

          return;

        }

        const isEditInput =
          event.target
            .classList
            .contains(
              "schedule-edit-time"
            ) ||
          event.target
            .classList
            .contains(
              "schedule-edit-name"
            );

        if (
          !isEditInput
        ) {

          return;

        }

        if (
          event.key ===
          "Escape"
        ) {

          editingScheduleId =
            null;

          renderSchedules();

          return;

        }

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          const id =
            Number(
              item.dataset.id
            );

          const timeInput =
            item.querySelector(
              ".schedule-edit-time"
            );

          const nameInput =
            item.querySelector(
              ".schedule-edit-name"
            );

          if (
            !timeInput ||
            !nameInput
          ) {

            return;

          }

          updateScheduleDetails(
            id,
            timeInput.value,
            nameInput.value
          );

        }

      }
    );

  // --------------------------------
  // ドラッグ開始
  // --------------------------------

  scheduleListElement
    .addEventListener(
      "pointerdown",
      event => {

        const handle =
          event.target.closest(
            ".drag-handle"
          );

        if (
          !handle ||
          !isViewingToday() ||
          editingScheduleId !==
            null
        ) {

          return;

        }

        const item =
          handle.closest(
            ".schedule-item"
          );

        if (
          !item
        ) {

          return;

        }

        draggingScheduleId =
          Number(
            item.dataset.id
          );

        item.classList.add(
          "dragging"
        );

        document.body
          .classList.add(
            "schedule-reordering"
          );

        handle.setPointerCapture?.(
          event.pointerId
        );

        event.preventDefault();

      }
    );

  // --------------------------------
  // ドラッグ中
  // --------------------------------

  scheduleListElement
    .addEventListener(
      "pointermove",
      event => {

        if (
          draggingScheduleId ===
          null
        ) {

          return;

        }

        const draggedItem =
          scheduleListElement
            .querySelector(
              `.schedule-item[data-id="${draggingScheduleId}"]`
            );

        if (
          !draggedItem
        ) {

          return;

        }

        const element =
          document.elementFromPoint(
            event.clientX,
            event.clientY
          );

        const targetItem =
          element?.closest(
            ".schedule-item"
          );

        if (
          !targetItem ||
          targetItem ===
            draggedItem ||
          targetItem.parentElement !==
            scheduleListElement
        ) {

          return;

        }

        const rect =
          targetItem
            .getBoundingClientRect();

        const before =
          event.clientY <
          rect.top +
            rect.height / 2;

        if (
          before
        ) {

          scheduleListElement
            .insertBefore(
              draggedItem,
              targetItem
            );

        } else {

          scheduleListElement
            .insertBefore(
              draggedItem,
              targetItem.nextSibling
            );

        }

        event.preventDefault();

      }
    );

  scheduleListElement
    .addEventListener(
      "pointerup",
      finishScheduleDrag
    );

  scheduleListElement
    .addEventListener(
      "pointercancel",
      finishScheduleDrag
    );

}

// --------------------------------
// 起床時間を直接変更
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

        if (
          !id
        ) {

          return;

        }

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

  activityResultsElement
    .addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            ".activity-delete-button"
          );

        if (
          !button
        ) {

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

if (
  addButton
) {

  addButton
    .addEventListener(
      "click",
      () => {

        addSchedule();

      }
    );

}

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
// 日 / 月 モード
// --------------------------------

const dayModeButton =
  document.getElementById(
    "dayModeButton"
  );

const monthModeButton =
  document.getElementById(
    "monthModeButton"
  );

function setDateMoveMode(
  mode
) {

  dateMoveMode =
    mode;

  if (
    dayModeButton
  ) {

    dayModeButton.classList.toggle(
      "active",
      mode === "day"
    );

  }

  if (
    monthModeButton
  ) {

    monthModeButton.classList.toggle(
      "active",
      mode === "month"
    );

  }

}

dayModeButton?.addEventListener(
  "click",
  () => {

    setDateMoveMode(
      "day"
    );

  }
);

monthModeButton?.addEventListener(
  "click",
  () => {

    setDateMoveMode(
      "month"
    );

  }
);

// --------------------------------
// 日付を直接選択
// --------------------------------

const datePickerInput =
  document.getElementById(
    "datePickerInput"
  );

datePickerInput?.addEventListener(
  "change",
  event => {

    goToDate(
      event.target.value
    );

  }
);

// --------------------------------
// 前の日
// --------------------------------

const prevDateButton =
  document.getElementById(
    "prevDateButton"
  );

if (
  prevDateButton
) {

  prevDateButton
    .addEventListener(
      "click",
      () => {

        changeDate(
          -1
        );

      }
    );

}

// --------------------------------
// 次の日
// --------------------------------

const nextDateButton =
  document.getElementById(
    "nextDateButton"
  );

if (
  nextDateButton
) {

  nextDateButton
    .addEventListener(
      "click",
      () => {

        changeDate(
          1
        );

      }
    );

}

// --------------------------------
// 今日に戻る
// --------------------------------

const todayButton =
  document.getElementById(
    "todayButton"
  );

if (
  todayButton
) {

  todayButton
    .addEventListener(
      "click",
      () => {

        goToDate(
          getLifeLogDateKey()
        );

      }
    );

}
// --------------------------------
// Blob → DataURL
// --------------------------------

function blobToDataUrl(
  blob
) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => {

          resolve(
            reader.result
          );

        };

      reader.onerror =
        () => {

          reject(
            reader.error
          );

        };

      reader.readAsDataURL(
        blob
      );

    }
  );

}

// --------------------------------
// DataURL → Blob
// --------------------------------

function dataUrlToBlob(
  dataUrl
) {

  const parts =
    dataUrl.split(",");

  const header =
    parts[0];

  const base64 =
    parts[1];

  const mimeMatch =
    header.match(
      /data:(.*?);base64/
    );

  const mime =
    mimeMatch
      ? mimeMatch[1]
      : "image/jpeg";

  const binary =
    atob(
      base64
    );

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(
        i
      );

  }

  return new Blob(
    [
      bytes
    ],
    {
      type:
        mime
    }
  );

}

// --------------------------------
// IndexedDBの写真を全部取得
// --------------------------------

async function getAllDailyPhotos() {

  const db =
    await openPhotoDB();

  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          PHOTO_STORE_NAME,
          "readonly"
        );

      const store =
        transaction.objectStore(
          PHOTO_STORE_NAME
        );

      const request =
        store.getAll();

      let photos =
        [];

      request.onsuccess =
        () => {

          photos =
            request.result || [];

        };

      request.onerror =
        () => {

          reject(
            request.error
          );

        };

      transaction.oncomplete =
        () => {

          db.close();

          resolve(
            photos
          );

        };

      transaction.onerror =
        event => {

          db.close();

          reject(
            event.target.error
          );

        };

    }
  );

}

// --------------------------------
// IndexedDBの写真を置き換える
// --------------------------------

async function replaceAllDailyPhotos(
  photoBackups
) {

  const preparedPhotos =
    photoBackups
      .filter(
        photo =>
          typeof photo.date ===
            "string" &&
          typeof photo.imageData ===
            "string"
      )
      .map(
        photo => ({

          date:
            photo.date,

          image:
            dataUrlToBlob(
              photo.imageData
            )

        })
      );

  const db =
    await openPhotoDB();

  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          PHOTO_STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          PHOTO_STORE_NAME
        );

      store.clear();

      preparedPhotos.forEach(
        photo => {

          store.put(
            photo
          );

        }
      );

      transaction.oncomplete =
        () => {

          db.close();

          resolve();

        };

      transaction.onerror =
        event => {

          db.close();

          reject(
            event.target.error
          );

        };

    }
  );

}

// --------------------------------
// バックアップ作成
// --------------------------------

async function exportBackup() {

  try {

    const photos =
      await getAllDailyPhotos();

    const lifeLogPhotos =
      await Promise.all(
        photos.map(
          async photo => ({

            date:
              photo.date,

            imageData:
              await blobToDataUrl(
                photo.image
              )

          })
        )
      );

    const backupData = {

      app:
        "LifeLog",

      version:
        "1.2.0",

      exportedAt:
        new Date().toISOString(),

      lifeLogData:
        allData,

      lifeLogResultData:
        allResultData,

      lifeLogPhotos:
        lifeLogPhotos

    };

    const json =
      JSON.stringify(
        backupData,
        null,
        2
      );

    const blob =
      new Blob(
        [
          json
        ],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      );

    link.href =
      url;

    link.download =
      `LifeLog-backup-${year}-${month}-${day}.json`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );

  } catch (error) {

    console.error(
      error
    );

    alert(
      "バックアップの作成に失敗しました。"
    );

  }

}

// --------------------------------
// バックアップ復元
// --------------------------------

async function importBackup(
  file
) {

  try {

    const text =
      await file.text();

    const backup =
      JSON.parse(
        text
      );

    if (
      backup.app !==
      "LifeLog"
    ) {

      alert(
        "LifeLogのバックアップファイルではありません。"
      );

      return;

    }

    if (
      !backup.lifeLogData ||
      !backup.lifeLogResultData
    ) {

      alert(
        "バックアップデータが正しくありません。"
      );

      return;

    }

    const result =
      confirm(
        "現在のLifeLogデータをバックアップの内容で置き換えます。\n\n復元しますか？"
      );

    if (
      !result
    ) {

      return;

    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        backup.lifeLogData
      )
    );

    localStorage.setItem(
      RESULT_STORAGE_KEY,
      JSON.stringify(
        backup.lifeLogResultData
      )
    );

    if (
      Array.isArray(
        backup.lifeLogPhotos
      )
    ) {

      await replaceAllDailyPhotos(
        backup.lifeLogPhotos
      );

    }

    alert(
      "バックアップを復元しました。"
    );

    location.reload();

  } catch (error) {

    console.error(
      error
    );

    alert(
      "バックアップの復元に失敗しました。"
    );

  }

}

// --------------------------------
// バックアップボタン
// --------------------------------

const exportBackupButton =
  document.getElementById(
    "exportBackupButton"
  );

if (
  exportBackupButton
) {

  exportBackupButton
    .addEventListener(
      "click",
      () => {

        exportBackup();

      }
    );

}

// --------------------------------
// 復元ボタン
// --------------------------------

const importBackupButton =
  document.getElementById(
    "importBackupButton"
  );

const backupFileInput =
  document.getElementById(
    "backupFileInput"
  );

if (
  importBackupButton &&
  backupFileInput
) {

  importBackupButton
    .addEventListener(
      "click",
      () => {

        backupFileInput.click();

      }
    );

  backupFileInput
    .addEventListener(
      "change",
      event => {

        const file =
          event.target.files[
            0
          ];

        if (
          !file
        ) {

          return;

        }

        importBackup(
          file
        );

        event.target.value =
          "";

      }
    );

}

// --------------------------------
// 1日の支出合計
// --------------------------------

function updateDailyExpenseTotal() {

  const totalElement =
    document.getElementById(
      "dailyExpenseTotal"
    );

  if (!totalElement) {

    return;

  }

  const total =
    dailyResults.expenses.reduce(
      (
        sum,
        expense
      ) => {

        return (
          sum +
          (
            Number(
              expense.amount
            ) || 0
          )
        );

      },
      0
    );

  totalElement.textContent =
    `${total.toLocaleString()}円`;

}

// --------------------------------
// 支出一覧表示
// --------------------------------

function renderExpenseResults() {

  const container =
    document.getElementById(
      "expenseResults"
    );

  if (!container) {

    return;

  }

  container.innerHTML =
    "";

  dailyResults.expenses.forEach(
    expense => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "expense-row";

      row.innerHTML = `

        <input
          type="text"
          class="expense-name-input"
          data-id="${expense.id}"
          value="${escapeHtml(expense.name)}"
        >

        <input
          type="number"
          class="expense-amount-input"
          data-id="${expense.id}"
          value="${expense.amount}"
          min="0"
        >

        <span class="expense-yen-label">
          円
        </span>

        <button
          class="expense-delete-button"
          data-id="${expense.id}"
        >
          ×
        </button>

      `;

      container.appendChild(
        row
      );

    }
  );

  updateDailyExpenseTotal();

  updateWeeklyExpenseSummary();

}

// --------------------------------
// 支出追加
// --------------------------------

function addExpense() {

  const name =
    prompt(
      "何に使いましたか？"
    );

  if (
    name === null
  ) {

    return;

  }

  const trimmedName =
    name.trim();

  if (
    trimmedName === ""
  ) {

    alert(
      "支出名を入力してください"
    );

    return;

  }

  const amountInput =
    prompt(
      "何円使いましたか？",
      "0"
    );

  if (
    amountInput === null
  ) {

    return;

  }

  let amount =
    Number(
      amountInput
    );

  if (
    Number.isNaN(amount) ||
    amount < 0
  ) {

    alert(
      "正しい金額を入力してください"
    );

    return;

  }

  amount =
    Math.round(
      amount
    );

  const ids =
    dailyResults.expenses.map(
      expense =>
        Number(
          expense.id
        ) || 0
    );

  const maxId =
    ids.length > 0
      ? Math.max(...ids)
      : 0;

  dailyResults.expenses.push({

    id:
      maxId + 1,

    name:
      trimmedName,

    amount:
      amount

  });

  saveDailyResults();

  renderExpenseResults();

}

// --------------------------------
// 支出削除
// --------------------------------

function deleteExpense(
  id
) {

  dailyResults.expenses =
    dailyResults.expenses.filter(
      expense =>
        expense.id !== id
    );

  saveDailyResults();

  renderExpenseResults();

}

// --------------------------------
// 支出変更
// --------------------------------

function updateExpense(
  id,
  type,
  value
) {

  const expense =
    dailyResults.expenses.find(
      expense =>
        expense.id === id
    );

  if (!expense) {

    return;

  }

  if (
    type === "name"
  ) {

    const newName =
      value.trim();

    if (
      newName === ""
    ) {

      renderExpenseResults();

      return;

    }

    expense.name =
      newName;

  }

  if (
    type === "amount"
  ) {

    let amount =
      Number(
        value
      );

    if (
      Number.isNaN(amount) ||
      amount < 0
    ) {

      amount =
        0;

    }

    expense.amount =
      Math.round(
        amount
      );

  }

  saveDailyResults();

}

// --------------------------------
// 支出操作
// --------------------------------

const expenseResultsElement =
  document.getElementById(
    "expenseResults"
  );

if (
  expenseResultsElement
) {

  expenseResultsElement
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

        if (
          event.target.classList.contains(
            "expense-name-input"
          )
        ) {

          updateExpense(
            id,
            "name",
            event.target.value
          );

          renderExpenseResults();

        }

        if (
          event.target.classList.contains(
            "expense-amount-input"
          )
        ) {

          updateExpense(
            id,
            "amount",
            event.target.value
          );

          renderExpenseResults();

        }

      }
    );

  expenseResultsElement
    .addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            ".expense-delete-button"
          );

        if (!button) {

          return;

        }

        const id =
          Number(
            button.dataset.id
          );

        deleteExpense(
          id
        );

      }
    );

}

// --------------------------------
// ＋支出を追加
// --------------------------------

const addExpenseButton =
  document.getElementById(
    "addExpenseButton"
  );

if (
  addExpenseButton
) {

  addExpenseButton
    .addEventListener(
      "click",
      () => {

        addExpense();

      }
    );

}

// --------------------------------
// 今日の一言
// --------------------------------

const dailyNoteInput =
  document.getElementById(
    "dailyNoteInput"
  );

if (
  dailyNoteInput
) {

  dailyNoteInput
    .addEventListener(
      "input",
      event => {

        dailyResults.dailyNote =
          event.target.value;

        saveDailyResults();

      }
    );

}

// --------------------------------
// 今日の写真
// --------------------------------

const dailyPhotoInput =
  document.getElementById(
    "dailyPhotoInput"
  );

const selectPhotoButton =
  document.getElementById(
    "selectPhotoButton"
  );

const deletePhotoButton =
  document.getElementById(
    "deletePhotoButton"
  );

if (
  selectPhotoButton &&
  dailyPhotoInput
) {

  selectPhotoButton
    .addEventListener(
      "click",
      () => {

        dailyPhotoInput.click();

      }
    );

  dailyPhotoInput
    .addEventListener(
      "change",
      async event => {

        const file =
          event.target.files[
            0
          ];

        if (
          !file
        ) {

          return;

        }

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {

          alert(
            "画像ファイルを選んでください"
          );

          return;

        }

        try {

          console.log(
            "圧縮前:",
            Math.round(
              file.size / 1024
            ),
            "KB"
          );

          const compressedImage =
            await compressImage(
              file
            );

          await saveDailyPhoto(
            compressedImage
          );

          await renderDailyPhoto();

        } catch (error) {

          console.error(
            error
          );

          alert(
            "写真の保存に失敗しました"
          );

        }

        event.target.value =
          "";

      }
    );

}

if (
  deletePhotoButton
) {

  deletePhotoButton
    .addEventListener(
      "click",
      () => {

        deleteDailyPhoto();

      }
    );

}

// --------------------------------
// 最初の表示
// --------------------------------

renderSchedules();