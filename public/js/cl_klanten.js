const baseUrl = "http://127.0.0.1:5000";
const advancedUrl = baseUrl + "/klanten/";

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

function addCard(
  id,
  title,
  email,
  phone,
  name,
  address,
  city,
  country,
  postal
) {
  const cardContainer = document.getElementById("cardContainer");
  const cardCol = document.createElement("div");

  cardCol.className = "col-md-4 mb-4";
  cardCol.innerHTML = `
    <div id='${id}' class="card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="card-title">${title}</h5>
        <button class="close-button btn btn-outline-dark btn-sm" style="display: none;">Close</button>
        </div>
        <p>${email} - ${phone}</p>
        <ul id='card-data' style='display: none;'>
          <li>${name}</li>
          <li>${country} - ${address}, ${postal}, ${city}</li>

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

    const customer_name = document.getElementById("itemName").value;
    const email = document.getElementById("item_email").value;
    const phone = document.getElementById("item_phone").value;
    const customSelect = document.getElementById("customerSelect").value;

    sendServerReq(
      "insert",
      "POST",
      "customers",
      {
        customer_name: customer_name,
        email: email,
        phone: phone,
        location_id: customSelect,
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

function removeProject(locationID) {
  sendServerReq("delete", "DELETE", "locations", { id: locationID }, {})
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
      }
    })
    .catch((error) => {
      console.error("Error fetching customers:", error);
    });
}

function refreshCardContainer() {
  const cardContainer = document.getElementById("cardContainer");
  cardContainer.innerHTML = "";

  const customSelect = document.getElementById("customSelect");
  customSelect.innerHTML = "";

  sendServerReq("fetch", "POST", "customers", {}, {}).then((data) => {
    if (data.type === "ERROR") {
      console.error("Error fetching data:", data.msg);
      return;
    } else {
      document.getElementById("conditionalButton").style.display = "block";
      data.forEach((item) => {
        searchForLocation(item.id, item.customer_name, item.email, item.phone);
      });
    }
  });

  function searchForLocation(id, name, email, phone) {
    sendServerReq("fetch", "POST", "locations", { id: id }, {})
      .then((data) => {
        if (data.type === "ERROR") {
          console.error("Error fetching data:", data.msg);
          return;
        } else {
          data.forEach((location) => {
            addCard(
              id,
              name,
              email,
              phone,
              location.location_name,
              location.address,
              location.city,
              location.country,
              location.postal_code
            );
            addToSelect(location, name);
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });
  }

  function addToSelect(target, name) {
    const customSelect = document.getElementById("customSelect");

    const option = document.createElement("option");
    option.value = target.id;
    option.textContent = name;

    customSelect.appendChild(option);
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
