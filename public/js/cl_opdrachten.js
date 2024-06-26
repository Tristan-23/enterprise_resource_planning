const baseUrl = "http://127.0.0.1:5000";
const advancedUrl = baseUrl + "/opdrachten/";

const user = JSON.parse(localStorage.getItem("user"));

document.addEventListener("DOMContentLoaded", function () {
  refreshCardContainer();
});

function showHidden(card) {
  const ulElement = card.querySelector("ul#card-data");
  const closeButton = card.querySelector(".close-button");

  if (ulElement.style.display === "none") {
    ulElement.style.display = "block";
    closeButton.style.display = "block";
  }

  closeButton.addEventListener("click", function (event) {
    event.stopPropagation();
    ulElement.style.display = "none";
    closeButton.style.display = "none";
  });
}

function addCard(id, title, text, date, customer) {
  const cardContainer = document.getElementById("cardContainer");
  const cardCol = document.createElement("div");
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  cardCol.className = "col-md-4 mb-4";
  cardCol.innerHTML = `
    <div id='${id}' class="card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="card-title">${title}</h5>
        <button class="close-button btn btn-outline-dark btn-sm" style="display: none;">Close</button>
        </div>
        <p>${text}</p>
        <ul id='card-data' style='display: none;'>
          <li>${formattedDate}</li>
          <li>${customer}</li>
        </ul>
        <button class="remove-button btn btn-danger btn-sm">Remove</button>
      </div>
    </div>
  `;

  cardCol
    .querySelector(".remove-button")
    .addEventListener("click", function () {
      removeProject(id);
    });

  cardContainer.appendChild(cardCol);

  cardCol.querySelector(".card-body").addEventListener("click", function () {
    showHidden(cardCol);
  });

  sortCardContainer();
}

function sortCardContainer() {
  const sortSelect = document.getElementById("sortSelect");
  const sortValue = sortSelect.value;

  // Retrieve card elements
  const cardContainer = document.getElementById("cardContainer");
  const cards = Array.from(cardContainer.getElementsByClassName("col-md-4"));

  // Sorting logic based on selected value
  if (sortValue === "alphabet") {
    cards.sort((a, b) => {
      const titleA = a.querySelector(".card-title").textContent.toLowerCase();
      const titleB = b.querySelector(".card-title").textContent.toLowerCase();
      return titleA.localeCompare(titleB);
    });
  } else if (sortValue === "dates") {
    cards.sort((a, b) => {
      const dateA = new Date(
        a.querySelector("ul#card-data li:first-child").textContent
      );
      const dateB = new Date(
        b.querySelector("ul#card-data li:first-child").textContent
      );
      return dateA - dateB;
    });
  }

  cardContainer.innerHTML = "";
  cards.forEach((card) => {
    cardContainer.appendChild(card);
  });
}

document
  .getElementById("conditionalButton")
  .addEventListener("click", function () {
    $("#addModal").modal("show");
  });

document
  .getElementById("addItemForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const itemName = document.getElementById("itemName").value;
    const itemDescription = document.getElementById("itemDescription").value;
    const selectedCustomerId = document.getElementById("customerSelect").value;

    sendServerReq(
      "insert",
      "POST",
      "projects",
      {
        project_name: itemName,
        description: itemDescription,
        customer_id: selectedCustomerId,
        start_date: new Date().toISOString().slice(0, 10),
      },
      {}
    )
      .then((data) => {
        if (data.type === "ERROR") {
          console.error("Error fetching data:", data.msg);
          return;
        } else {
          $("#addModal").modal("hide");
          refreshCardContainer();
          // idk fix smth for duplicates, but db don't care atm
        }
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });
  });

function removeProject(projectId) {
  sendServerReq("delete", "DELETE", "projects", { id: projectId }, {})
    .then((data) => {
      if (data.type === "ERROR") {
        console.error("Error fetching data:", data.msg);
        return;
      } else {
        const cardToRemove = document.getElementById(projectId);
        if (cardToRemove) {
          cardToRemove.parentNode.removeChild(cardToRemove);
          refreshCardContainer();
        }
        console.log("Project removed successfully");
      }
    })
    .catch((error) => {
      console.error("Error fetching customers:", error);
    });
}

function refreshCardContainer() {
  const cardContainer = document.getElementById("cardContainer");
  cardContainer.innerHTML = "";

  const customerSelect = document.getElementById("customerSelect");
  customerSelect.innerHTML = "";

  if (user.role_id > 25) {
    sendServerReq("fetch", "POST", "projects", {}, {}).then((data) => {
      if (data.type === "ERROR") {
        console.error("Error fetching data:", data.msg);
        return;
      } else {
        document.getElementById("conditionalButton").style.display = "block";
        data.forEach((item) => {
          searchForCustomers(
            item.customer_id,
            item.id,
            item.project_name,
            item.description,
            item.start_date
          );
        });
      }
    });
  } else {
    sendServerReq(
      "fetch",
      "POST",
      "project_workers",
      { worker_id: user.id },
      {}
    ).then((data) => {
      if (data.type === "ERROR") {
        console.error("Error fetching data:", data.msg);
        return;
      } else {
        data.forEach((item) => {
          searchForNames(item.id);
        });
      }
    });

    function searchForNames(value) {
      sendServerReq("fetch", "POST", "projects", { id: value }, {}).then(
        (data) => {
          if (data.type === "ERROR") {
            console.error("Error fetching data:", data.msg);
            return;
          } else {
            data.forEach((item) => {
              searchForCustomers(
                item.customer_id,
                item.id,
                item.project_name,
                item.description,
                item.start_date
              );
            });
          }
        }
      );
    }
  }

  function searchForCustomers(
    customerId,
    projectId,
    projectName,
    description,
    startDate
  ) {
    sendServerReq("fetch", "POST", "customers", { id: customerId }, {})
      .then((data) => {
        if (data.type === "ERROR") {
          console.error("Error fetching data:", data.msg);
          return;
        } else {
          data.forEach((customer) => {
            addCard(
              projectId,
              projectName,
              description,
              startDate,
              customer.customer_name
            );
            console.log("here");
            addToCustomerSelect(customer);
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });

    function addToCustomerSelect(customer) {
      const customerSelect = document.getElementById("customerSelect");

      const option = document.createElement("option");
      option.value = customer.id;
      option.textContent = customer.customer_name;

      customerSelect.appendChild(option);
    }
  }
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
