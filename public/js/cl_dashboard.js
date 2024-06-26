const baseUrl = "http://127.0.0.1:5000";
const advancedUrl = baseUrl + "/dashboard/";

const user = JSON.parse(localStorage.getItem("user"));

document.addEventListener("DOMContentLoaded", function () {
  if (!user) {
    window.location.href = baseUrl;
    return;
  }

  const nameHolder = document.getElementById("yourName");
  nameHolder.innerHTML = `Welcome, ${user.first_name}`;

  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    useSearchBar(searchInput.value);
  });

  fetchUserProjects(true);

  createBarChart();
  updateBarChart("week");
  // const selectYearPeriod = document.getElementById("selectYearPeriod");
  // selectYearPeriod.addEventListener("change", function () {
  //   updateBarChart(selectYearPeriod.value);
  // });

  const clockInBtn = document.getElementById("clockInBtn");
  const breakBtn = document.getElementById("breakBtn");
  const clockOutBtn = document.getElementById("clockOutBtn");
  clockInBtn.addEventListener("click", function () {
    handleClockButton("clockIn");
  });
  breakBtn.addEventListener("click", function () {
    handleClockButton("break");
  });
  clockOutBtn.addEventListener("click", function () {
    handleClockButton("clockOut");
  });
});

function useSearchBar(value) {
  console.log(value);
}

async function fetchUserProjects(updateList, returnNames) {
  const projectNames = [];

  try {
    const projects = await sendServerReq(
      "fetch",
      "POST",
      "project_workers",
      { worker_id: user.id },
      {}
    );

    if (!projects.type) {
      const searchPromises = projects.map((item) =>
        searchForNames(item.project_id)
      );
      await Promise.all(searchPromises);
    }
  } catch (error) {
    console.error("Error fetching user projects:", error);
  }

  async function searchForNames(value) {
    try {
      const projects = await sendServerReq(
        "fetch",
        "POST",
        "projects",
        { id: value },
        {}
      );

      if (!projects.type) {
        if (updateList) {
          const select = document.getElementById("selectProject");
          select.innerHTML = "";

          projects.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.project_name;
            select.appendChild(option);
          });
        }

        if (returnNames) {
          projects.forEach((item) => {
            projectNames.push(item);
          });
        }
      }
    } catch (error) {
      console.error("Error searching for project names:", error);
    }
  }

  if (returnNames) {
    return projectNames;
  }
  // here the projects heave been loaded!
  checkButtonStatus();
  createDonutChart();
}

function createDonutChart() {
  var donutCtx = document.getElementById("donutChart").getContext("2d");
  var donutChart = new Chart(donutCtx, {
    type: "doughnut",
    data: {
      labels: ["Worked", "Break", "Remaining"],
      datasets: [
        {
          label: "Worked Hours",
          data: [0, 0, 8],
          backgroundColor: ["#007bff", "#17a2b8", "#dc3545"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false, // Hide legend
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return (
                tooltipItem.label + ": " + tooltipItem.raw.toFixed(2) + "hrs"
              );
            },
          },
        },
      },
    },
  });

  let currentTimes = JSON.parse(localStorage.getItem("currentTimes")) || {};
  let userId = user.id;
  let selectedProject = document.getElementById("selectProject").value;

  if (currentTimes[userId] && currentTimes[userId][selectedProject]) {
    let projectData = currentTimes[userId][selectedProject];
    updateDonutChart(projectData);
  } else {
    console.error("No data found in currentTimes for the selected project.");
  }
}

function getDonutChartInstance() {
  const donutCtx = document.getElementById("donutChart").getContext("2d");
  return Chart.getChart(donutCtx, "doughnut");
}

function updateDonutChart(projectData) {
  const { actual_duration, break_duration, remaining_duration } = projectData;

  const hoursActual = timeToHours(actual_duration);
  const hoursBreak = timeToHours(break_duration);
  const hoursRemaining = timeToHours(remaining_duration);

  function timeToHours(timeString) {
    const [hours, minutes, seconds] = timeString.split(":").map(parseFloat);
    let totalHours = hours + minutes / 60 + seconds / 3600;
    return totalHours.toFixed(2);
  }

  const donutChart = getDonutChartInstance();

  if (donutChart) {
    donutChart.data.datasets[0].data = [
      hoursActual,
      hoursBreak,
      hoursRemaining,
    ];

    // Optionally update labels or any other properties
    donutChart.update();
  } else {
    console.error("Donut chart instance not found");
  }
}

function getBarChartInstance() {
  const barCtx = document.getElementById("barChart").getContext("2d");
  return Chart.getChart(barCtx, "bar");
}

function updateBarChart(value) {
  const today = new Date();
  let startDate, endDate, periodLabel;
  const barChart = getBarChartInstance();
  const formatDate = (date) => date.toISOString().split("T")[0];

  if (barChart) {
    let currentArray = [];
    switch (value) {
      case "year":
        periodLabel = "Quarter";
        barChart.data.labels = [
          "Quarter 1",
          "Quarter 2",
          "Quarter 3",
          "Quarter 4",
        ];
        startDate = new Date(Date.UTC(today.getFullYear(), 0, 1));
        endDate = new Date(Date.UTC(today.getFullYear(), 11, 31));
        break;
      case "month":
        periodLabel = "Week";
        barChart.data.labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
        startDate = new Date(
          Date.UTC(today.getFullYear(), today.getMonth(), 1)
        );
        endDate = new Date(
          Date.UTC(today.getFullYear(), today.getMonth() + 1, 0)
        );
        break;
      case "week":
        periodLabel = "Day";
        barChart.data.labels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];
        const firstDayOfWeek = today.getUTCDate() - today.getUTCDay() + 1;
        startDate = new Date(
          Date.UTC(today.getFullYear(), today.getMonth(), firstDayOfWeek)
        );
        endDate = new Date(
          Date.UTC(today.getFullYear(), today.getMonth(), firstDayOfWeek + 4)
        );
        for (let i = 0; i < 5; i++) {
          let newDate = new Date(startDate);
          newDate.setUTCDate(startDate.getUTCDate() + i);
          currentArray.push(formatDate(newDate));
        }
        break;
      default:
        console.error("Invalid value for updateBarChart:", value);
        return;
    }

    const labels = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      labels.push(formatDate(currentDate));
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    barChart.data.labels = labels;

    sendServerReq(
      "time_between",
      "POST",
      "worker_times",
      {
        worker_id: user.id,
        start_date: formatDate(startDate),
        stop_date: formatDate(endDate),
      },
      {}
    ).then((data) => {
      if (data.type === "ERROR") {
        console.error("Error fetching data:", data.msg);
        return;
      } else {
        function convertTimeToHours(timeString) {
          const [hours, minutes, seconds] = timeString.split(":");
          return (
            parseFloat(hours) +
            parseFloat(minutes) / 60 +
            parseFloat(seconds) / 3600
          );
        }

        const activeData = currentArray.map(() => 0);
        const passiveData = currentArray.map(() => 0);
        const inactiveData = currentArray.map(() => 0);
        const workCountData = currentArray.map(() => 0); // Initialize work count array

        data.forEach((item) => {
          const index =
            currentArray.indexOf(formatDate(new Date(item.created_at))) + 1;
          if (index !== -1) {
            activeData[index] += convertTimeToHours(item.actual_duration);
            passiveData[index] += convertTimeToHours(item.break_duration);
            inactiveData[index] += item.remaining_duration
              ? convertTimeToHours(item.remaining_duration)
              : 0;
            workCountData[index]++; // Increment work count for this index
          }
        });

        barChart.data.datasets[0].data = activeData;
        barChart.data.datasets[1].data = passiveData;
        barChart.data.datasets[2].data = inactiveData;

        barChart.options.plugins.tooltip.callbacks.title = function (
          tooltipItems
        ) {
          const index = tooltipItems[0].dataIndex;
          const totalWorkCount = workCountData[index];
          return `${totalWorkCount} Work Entries on ${barChart.data.labels[index]}`;
        };

        barChart.update();
      }
    });
  } else {
    console.error("Bar chart instance not found");
  }
}

function createBarChart() {
  var barCtx = document.getElementById("barChart").getContext("2d");
  var barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"],
      datasets: [
        {
          label: "Worked",
          data: [0, 0, 0, 0, 0],
          backgroundColor: ["#007bff"],
          borderWidth: 1,
        },
        {
          label: "Break",
          data: [0, 0, 0, 0, 0],
          backgroundColor: ["#17a2b8"],
          borderWidth: 1,
        },
        {
          label: "Remaining",
          data: [0, 0, 0, 0, 0],
          backgroundColor: ["#dc3545"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              const datasetLabel = tooltipItem.dataset.label || "";
              const value = tooltipItem.formattedValue || "";

              return `${datasetLabel}: ${value} hours`;
            },
          },
        },
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

function checkButtonStatus() {
  let currentTimes = JSON.parse(localStorage.getItem("currentTimes")) || {};
  let userId = user.id;

  let clockInBtn = document.getElementById("clockInBtn");
  let breakBtn = document.getElementById("breakBtn");
  let clockOutBtn = document.getElementById("clockOutBtn");

  clockInBtn.disabled = false;
  breakBtn.disabled = true;
  clockOutBtn.disabled = true;

  if (currentTimes[userId]) {
    let selectedProject = document.getElementById("selectProject").value;
    let userTimes = currentTimes[userId][selectedProject];

    if (!userTimes) {
      return;
    }

    if (userTimes.clock_out) {
      clockInBtn.disabled = false;
    } else {
      clockInBtn.disabled = true;
      if (
        userTimes.breaks.length === 0 ||
        userTimes.breaks[userTimes.breaks.length - 1].stop_break !== ""
      ) {
        breakBtn.disabled = false;
        clockOutBtn.disabled = false;
      } else {
        breakBtn.disabled = false;
        clockOutBtn.disabled = true;
      }
    }
  }
}

function handleClockButton(action) {
  let currentTimes = JSON.parse(localStorage.getItem("currentTimes")) || {};
  let userId = user.id;
  let selectedProject = document.getElementById("selectProject").value;

  function calculateTotalBreakDuration(breaks) {
    let totalDuration = 0;
    for (let i = 0; i < breaks.length; i++) {
      if (breaks[i].start_break && breaks[i].stop_break) {
        totalDuration +=
          new Date(breaks[i].stop_break).getTime() -
          new Date(breaks[i].start_break).getTime();
      }
    }
    return totalDuration;
  }

  function msToMySQLTimeFormat(ms) {
    let seconds = Math.floor(ms / 1000);
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    seconds = seconds % 60;

    function pad(number) {
      if (number < 10) {
        return "0" + number;
      }
      return number;
    }

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  function msToTimeFormat(ms) {
    let seconds = Math.floor(ms / 1000);
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    seconds = seconds % 60;

    function pad(number) {
      if (number < 10) {
        return "0" + number;
      }
      return number;
    }

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  function timeFormatToMs(timeString) {
    let [hours, minutes, seconds] = timeString.split(":").map(Number);
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  switch (action) {
    case "clockIn":
      if (!currentTimes[userId]) {
        currentTimes[userId] = {};
      }
      currentTimes[userId][selectedProject] = {
        clock_in: new Date(
          new Date().getTime() - new Date().getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        clock_out: "",
        clock_duration: 0,
        break_duration: "00:00:00",
        actual_duration: "00:00:00",
        remaining_duration: "08:00:00",
        breaks: [],
      };

      console.log(
        `clock_in : ${currentTimes[userId][selectedProject].clock_in}`
      );
      clockInBtn.disabled = true;
      breakBtn.disabled = false;
      clockOutBtn.disabled = false;
      break;

    case "break":
      let breaksArray = currentTimes[userId][selectedProject].breaks;
      let lastBreakIndex = breaksArray.length - 1;

      if (
        lastBreakIndex === -1 ||
        breaksArray[lastBreakIndex].stop_break !== ""
      ) {
        console.log(`start_break : ${new Date()}`);
        let now = new Date();
        breaksArray.push({
          start_break: now,
          stop_break: "",
        });

        // Update actual_duration
        let clockInTime = new Date(
          currentTimes[userId][selectedProject].clock_in
        ).getTime();
        let breakDuration = calculateTotalBreakDuration(breaksArray);
        let actualDuration = now.getTime() - clockInTime - breakDuration;
        currentTimes[userId][selectedProject].actual_duration =
          msToTimeFormat(actualDuration);

        clockInBtn.disabled = true;
        breakBtn.disabled = false;
        clockOutBtn.disabled = true;
      } else {
        console.log(`stop_break : ${new Date()}`);
        breaksArray[lastBreakIndex].stop_break = new Date();
        currentTimes[userId][selectedProject].break_duration = msToTimeFormat(
          calculateTotalBreakDuration(breaksArray)
        );
        clockInBtn.disabled = true;
        breakBtn.disabled = false;
        clockOutBtn.disabled = false;
      }
      break;

    case "clockOut":
      currentTimes[userId][selectedProject].clock_out = new Date(
        new Date().getTime() - new Date().getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      console.log(
        `clock_out : ${currentTimes[userId][selectedProject].clock_out}`
      );

      // begin
      let clockInTime = new Date(
        currentTimes[userId][selectedProject].clock_in
      ).getTime();

      // end
      let clockOutTime = new Date(
        currentTimes[userId][selectedProject].clock_out
      ).getTime();

      // total duration
      currentTimes[userId][selectedProject].clock_duration =
        msToMySQLTimeFormat(clockOutTime - clockInTime);
      let clockDurationString =
        currentTimes[userId][selectedProject].clock_duration;
      let clockDurationMs = timeFormatToMs(clockDurationString);

      // breaks duration
      let breakDuration = calculateTotalBreakDuration(
        currentTimes[userId][selectedProject].breaks
      );
      currentTimes[userId][selectedProject].break_duration =
        msToTimeFormat(breakDuration);

      // total work time
      let actualDuration = clockDurationMs - breakDuration;
      currentTimes[userId][selectedProject].actual_duration =
        msToMySQLTimeFormat(actualDuration);

      // remaining time
      var remainingTime =
        currentTimes[userId][selectedProject].remaining_duration;
      let remainingTimeMs = timeFormatToMs(remainingTime);
      currentTimes[userId][selectedProject].remaining_duration = msToTimeFormat(
        remainingTimeMs - clockDurationMs
      );

      // database setup
      let { remaining_duration, breaks, ...payload } =
        currentTimes[userId][selectedProject];
      payload.created_at = new Date().toISOString().slice(0, 10);
      payload.worker_id = userId;
      payload.project_id = selectedProject;
      sendServerReq("insert", "POST", "worker_times", payload, {}).then(
        (data) => {
          if (data.type === "ERROR") {
            console.error("Error fetching data:", data.msg);
            return;
          }
        }
      );

      clockInBtn.disabled = false;
      breakBtn.disabled = true;
      clockOutBtn.disabled = true;
      break;

    default:
      console.error("Invalid action:", action);
      return;
  }

  updateDonutChart(currentTimes[userId][selectedProject]);
  updateBarChart("week");
  localStorage.setItem("currentTimes", JSON.stringify(currentTimes));
}

function sendServerReq(server, method, table, data, change) {
  return fetch(advancedUrl + server, {
    method: method,
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      table: table,
      data: data,
      change: change,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(({ data }) => {
      return data;
    })
    .catch((error) => {
      console.error(`Error during ${server} operation:`, error);
      throw error;
    });
}
