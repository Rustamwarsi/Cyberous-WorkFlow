const loginForm = document.getElementById("loginForm");

const message = document.getElementById("message");


loginForm.addEventListener("submit", function (event) {

    event.preventDefault();


    const email =
        document.getElementById("email").value;


    const password =
        document.getElementById("password").value;


    if (email === "" || password === "") {

        message.innerText =
            "Please enter email and password.";

        message.style.color = "red";

        return;
    }


    message.innerText =
        "Login system frontend is ready.";

    message.style.color = "green";

});
