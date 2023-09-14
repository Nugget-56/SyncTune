const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        console.log(entry)
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
        else {
            entry.target.classList.remove('show');
        }
    });
});

const observer2 = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
      console.log(entry)
      if (entry.isIntersecting) {
          entry.target.classList.add('show-move');
      }
  });
});

const observer3 = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
      console.log(entry)
      if (entry.isIntersecting) {
          entry.target.classList.add('show-one');
      }
  });
});

const hiddenElements = document.querySelectorAll('.hidden');
const hiddenElements2 = document.querySelectorAll('.hidden-move');
const hiddenElements3 = document.querySelectorAll('.hidden-one');

hiddenElements.forEach((el) => observer.observe(el));
hiddenElements2.forEach((el) => observer2.observe(el)); 
hiddenElements3.forEach((el) => observer3.observe(el)); 

const toggle = document.getElementsByClassName('toggle-button')[0]
const navbarLinks = document.getElementsByClassName('navbar-items')[0]

toggle.addEventListener('click', (event) => {
    event.preventDefault();
    navbarLinks.classList.toggle('active');
})

const toggleLogin = () => {
  document.body.dataset.login = document.body.dataset.login === "true" ? "flase" : "true";
}

const loginContainer = document.getElementsByClassName("login-container")[0];
const RegisterContainer = document.getElementsByClassName("register-container")[0];
const loginToggle = document.getElementById("login-toggle");
const registerToggle = document.getElementById("register-toggle");

loginToggle.addEventListener('click', (event) => {
    event.preventDefault();
    RegisterContainer.style.display = 'none';
    loginContainer.style.display = 'flex'
    registerToggle.style.display = 'flex';
    loginToggle.style.display = 'none';
})

registerToggle.addEventListener('click', (event) => {
    event.preventDefault();
    RegisterContainer.style.display = 'flex';
    loginContainer.style.display = 'none'
    registerToggle.style.display = 'none';
    loginToggle.style.display = 'flex';
})

function handleInput(input, label) {
    input.addEventListener('input', function() {
      if (this.value !== '') {
        label.classList.add('active');
      } else {
        label.classList.remove('active');
      }
    });
}

const emailInput = document.getElementById('email-l');
const emailLabel = document.querySelector('#email-l ~ label');
handleInput(emailInput, emailLabel);

const passwordInput = document.getElementById('password-l');
const passwordLabel = document.querySelector('#password-l ~ label');
handleInput(passwordInput, passwordLabel);

const usernameInput = document.getElementById('username');
const usernameLabel = document.querySelector('#username ~ label');
handleInput(usernameInput, usernameLabel);

const emailInput2 = document.getElementById('email');
const emailLabel2 = document.querySelector('#email ~ label');
handleInput(emailInput2, emailLabel2);

const passwordInput2 = document.getElementById('password');
const passwordLabel2 = document.querySelector('#password ~ label');
handleInput(passwordInput2, passwordLabel2);

