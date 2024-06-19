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

  createDonutChart();

  createBarChart();
  const selectYearPeriod = document.getElementById("selectYearPeriod");
  selectYearPeriod.addEventListener("change", function () {
    updateBarChart(selectYearPeriod.value);
  });

  fetchUserProjects(true);
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
  const barChart = getBarChartInstance();
  if (barChart) {
    switch (value) {
      case "year":
        barChart.data.labels = [
          "Quarter 1",
          "Quarter 2",
          "Quarter 3",
          "Quarter 4",
        ];
        break;
      case "month":
        barChart.data.labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
        break;
      case "week":
        barChart.data.labels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];
        break;
      default:
        console.error("Invalid value for updateBarChart:", value);
        return;
    }
    barChart.update();
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
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
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
