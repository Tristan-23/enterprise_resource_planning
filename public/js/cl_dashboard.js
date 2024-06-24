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
  createDonutChart();

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
  checkButtonStatus();
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
          data: [0, 0, 100],
          backgroundColor: ["#007bff", "#17a2b8", "#dc3545"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          onClick: function (event, legendItem) {}, // Function does nothing on legend click
        },
      },
    },
  });
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
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      case "month":
        periodLabel = "Week";
        barChart.data.labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "week":
        periodLabel = "Day";
        barChart.data.labels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];
        const firstDayOfWeek = today.getDate() - today.getDay();
        startDate = new Date(today.setDate(firstDayOfWeek));
        endDate = new Date(today.setDate(firstDayOfWeek + 4));
        for (let i = 0; i < 5; i++) {
          let newDate = new Date(today);
          newDate.setDate(firstDayOfWeek + i);
          currentArray.push(formatDate(newDate));
        }
        break;
      default:
        console.error("Invalid value for updateBarChart:", value);
        return;
    }

    // Generate labels based on startDate and endDate
    const labels = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      labels.push(formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Set barChart data labels
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
        // Handle error if needed
      } else {
        console.log(data);

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
        const workCountData = currentArray.map(() => 0);

        // Aggregate data entries with the same date
        data.forEach((item) => {
          const index = currentArray.indexOf(
            formatDate(new Date(item.created_at))
          );
          if (index !== -1) {
            workCountData[index]++;
            activeData[index] += convertTimeToHours(item.actual_duration);
            passiveData[index] += convertTimeToHours(item.break_duration);
            inactiveData[index] += item.remaining_duration
              ? convertTimeToHours(item.remaining_duration)
              : 0;
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
          data: [1, 2, 3, 4, 5],
          backgroundColor: ["#007bff"],
          borderWidth: 1,
        },
        {
          label: "Break",
          data: [1, 2, 3, 4, 5],
          backgroundColor: ["#17a2b8"],
          borderWidth: 1,
        },
        {
          label: "Remaining",
          data: [1, 2, 3, 4, 5],
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
          new Date(breaks[i].stop_break) - new Date(breaks[i].start_break);
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

  switch (action) {
    case "clockIn":
      if (!currentTimes[userId]) {
        currentTimes[userId] = {};
      }
      currentTimes[userId][selectedProject] = {
        clock_in: new Date().toISOString(),
        clock_out: "",
        clock_duration: 0,
        break_duration: 0,
        actual_duration: 0,
        remaining_duration: 0,
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
      let breaks = currentTimes[userId][selectedProject].breaks;
      let lastBreakIndex = breaks.length - 1;

      if (lastBreakIndex === -1 || breaks[lastBreakIndex].stop_break !== "") {
        console.log(`start_break : ${new Date().toISOString()}`);
        breaks.push({
          start_break: new Date().toISOString(),
          stop_break: "",
        });
        clockInBtn.disabled = true;
        breakBtn.disabled = false;
        clockOutBtn.disabled = true;
      } else {
        console.log(`stop_break : ${new Date().toISOString()}`);
        breaks[lastBreakIndex].stop_break = new Date().toISOString();
        // Update break_duration in seconds
        currentTimes[userId][selectedProject].break_duration =
          calculateTotalBreakDuration(breaks) / 1000;
        clockInBtn.disabled = true;
        breakBtn.disabled = false;
        clockOutBtn.disabled = false;
      }
      break;

    case "clockOut":
      console.log(`clock_out : ${new Date().toISOString()}`);
      currentTimes[userId][selectedProject].clock_out =
        new Date().toISOString();

      let clockInTime = new Date(
        currentTimes[userId][selectedProject].clock_in
      ).getTime();
      let clockOutTime = new Date(
        currentTimes[userId][selectedProject].clock_out
      ).getTime();
      currentTimes[userId][selectedProject].clock_duration =
        msToMySQLTimeFormat(clockOutTime - clockInTime);

      let actualDuration =
        clockOutTime -
        clockInTime -
        currentTimes[userId][selectedProject].break_duration * 1000;
      currentTimes[userId][selectedProject].actual_duration =
        msToMySQLTimeFormat(actualDuration);

      currentTimes[userId][selectedProject].remaining_duration =
        8 * 60 * 60 * 1000 - (clockOutTime - clockInTime);

      console.log(currentTimes);

      clockInBtn.disabled = false;
      breakBtn.disabled = true;
      clockOutBtn.disabled = true;
      break;

    default:
      console.error("Invalid action:", action);
      return;
  }

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
