const baseUrl = "http://127.0.0.1:5000";
const advancedUrl = baseUrl + "/medewerkers/";

const user = JSON.parse(localStorage.getItem("user"));

document.addEventListener("DOMContentLoaded", function () {
  refreshCardContainer();
});

function toggleVisibilityCard(card) {
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

document
  .getElementById("conditionalButton")
  .addEventListener("click", function () {
    $("#addModal").modal("show");
  });

document
  .getElementById("addItemForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const first_name = document.getElementById("firstname").value;
    const last_name = document.getElementById("lastname").value;
    const date_of_birth = document.getElementById("dob").value;
    const email = document.getElementById("item_email").value;
    const phone = document.getElementById("item_phone").value;
    const roleSelect = document.getElementById("roleSelect").value;
    const locationSelect = document.getElementById("locationSelect").value;

    console.log(roleSelect);
    let hireDate = new Date();

    return;
    sendServerReq(
      "insert",
      "POST",
      "our_workers",
      {
        first_name: first_name,
        last_name: last_name,
        date_of_birth: date_of_birth,
        email: email,
        phone: phone,
        location_id: locationSelect,
        role_id: roleSelect,
        hire_date: `${hireDate.getFullYear()}-${(
          "0" +
          (hireDate.getMonth() + 1)
        ).slice(-2)}-${("0" + hireDate.getDate()).slice(-2)}`,
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
        }
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });
  });

function deleteCard(id, table) {
  sendServerReq("delete", "DELETE", table, { id: id }, {})
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

function sortCardContainer() {
  const sortSelect = document.getElementById("sortSelect");
  const sortValue = sortSelect.value;

  const cardContainer = document.getElementById("cardContainer");
  const cards = Array.from(cardContainer.getElementsByClassName("col-md-4"));

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

function generateCardWithContent(id, title, desc, email, phone, dob, location) {
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
        <p>${desc}</p>
        <ul id='card-data' style='display: none;'>
          <li>${email}</li>
          <li>${phone}</li>
          <li>${dob}</li>
          <li>${location}</li>
        </ul>
           <button class="remove-button btn btn-danger btn-sm" style="display: ${
             user.role_id > 25 ? "block" : "none"
           };">Remove</button>
      </div>
    </div>
  `;

  cardCol
    .querySelector(".remove-button")
    .addEventListener("click", function () {
      deleteCard(id);
    });

  cardContainer.appendChild(cardCol);

  cardCol.querySelector(".card-body").addEventListener("click", function () {
    toggleVisibilityCard(cardCol);
  });

  sortCardContainer();
}

function refreshCardContainer() {
  const cardContainer = document.getElementById("cardContainer");
  cardContainer.innerHTML = "";

  const roleSelect = document.getElementById("roleSelect");
  roleSelect.innerHTML = "";
  const locationSelect = document.getElementById("locationSelect");
  locationSelect.innerHTML = "";

  sendServerReq("fetch", "POST", "our_workers", {}, {}).then((data) => {
    if (data.type === "ERROR") {
      console.error("Error fetching data:", data.msg);
      return;
    } else {
      document.getElementById("conditionalButton").style.display = "block";
      data.forEach((item) => {
        searchForLocation(
          item.id,
          item.location_id,
          item.role_id,
          `${item.first_name} - ${item.last_name}`,
          item.date_of_birth,
          item.email,
          item.phone
        );
      });
    }
  });

  function searchForLocation(id, location, role, name, dob, email, phone) {
    sendServerReq("fetch", "POST", "locations", { id: location }, {})
      .then((data) => {
        if (data.type === "ERROR") {
          console.error("Error fetching data:", data.msg);
          return;
        } else {
          data.forEach((location) => {
            addToSelect("location", location, location.location_name);
            seachForFunction(
              id,
              role,
              name,
              location.location_name,
              email,
              phone,
              dob,
              `${location.country} - ${location.address}, ${location.postal_code}, ${location.city}`
            );
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });
  }

  function seachForFunction(id, role, name, desc, email, phone, dob, location) {
    sendServerReq("fetch", "POST", "worker_roles", { id: role }, {})
      .then((data) => {
        if (data.type === "ERROR") {
          console.error("Error fetching data:", data.msg);
          return;
        } else {
          data.forEach((group) => {
            addToSelect("role", group, group.role_name);
            generateCardWithContent(
              id,
              `${name} - ${group.role_name}`,
              desc,
              email,
              phone,
              dob,
              location
            );
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });
  }

  function addToSelect(query, target, name) {
    const customSelect = document.getElementById(query + "Select");

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
