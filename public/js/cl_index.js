const baseUrl = "http://127.0.0.1:5000";
const advancedUrl = baseUrl + "/";

document.addEventListener("DOMContentLoaded", function () {
  sendServerReq("fetch", "POST", "our_workers", { role_id: 50 }, {}).then(
    (data) => {
      if (data.type) {
        toggleInputs(false);
      } else {
        data.forEach((item, index) => {
          if (item.email) {
            toggleInputs(true);
          }
        });
      }
    }
  );

  var registerButton = document.getElementById("registerButton");
  var loginButton = document.getElementById("loginButton");
  registerButton.addEventListener("click", function (event) {
    event.preventDefault();
    handleRegister();
  });
  loginButton.addEventListener("click", function (event) {
    event.preventDefault();
    handleLogin();
  });
});
function toggleInputs(isAdminActive) {
  var register = document.querySelector(".register");
  var login = document.querySelector(".login");
  if (isAdminActive) {
    login.style.display = "block";
    register.style.display = "none";
  } else {
    login.style.display = "none";
    register.style.display = "block";
  }
}

function handleRegister() {
  var firstName = document.getElementById("firstname").value;
  var lastName = document.getElementById("lastname").value;
  var dob = document.getElementById("dob").value;
  var email = document.getElementById("emailReg").value;
  var phone = document.getElementById("phone").value;
  var password = document.getElementById("passwordReg").value;
  var confirmPassword = document.getElementById("passwordRegConfirm").value;
  var currentDate = new Date().toISOString().split("T")[0];

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  var payload = {
    first_name: firstName,
    last_name: lastName,
    date_of_birth: dob,
    email: email,
    secret_password: password,
    phone: phone,
    hire_date: currentDate,
    role_id: 50,
  };

  sendServerReq("insert", "POST", "our_workers", payload, {}).then((data) => {
    console.log(data);
    if (data.type) {
      toggleInputs(false);
      alert("failed to create a account!");
    } else {
      toggleInputs(true);
    }
  });
}

function handleLogin() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  sendServerReq(
    "fetch",
    "POST",
    "our_workers",
    {
      email: email,
      secret_password: password,
    },
    {}
  ).then((data) => {
    if (data.type) {
      alert("invalid");
    } else {
      data.forEach((item, index) => {
        localStorage.setItem("user", JSON.stringify(item));
        window.location.href = baseUrl + "/dashboard";
      });
    }
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
