const SUPABASE_URL = "https://oxyiaqomqvzmgrsagroc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4A95N9DBr72t7DStUrOrHw__Jn9f_gz"

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase client initialised.")

const accountButton = document.getElementById("account-button");
const accountModal = document.getElementById("account-modal");
const closeAccountButton = document.getElementById("close-account");
const modalBackdrop = document.getElementById("modal-backdrop");

const signupForm = document.getElementById("signup-form");
const showLogInButton = document.getElementById("login-form");

const accountTitle = document.getElementById("account-title");
const accountDescription = document.getElementById("account-description");

accountButton.addEventListener("click", () => {
    accountModal.hidden = false;
});

function closeAccountModal() {
    accountModal.hidden = true;
}

showSignupButton.addEventListener("click", closeAccountModal);
modalBackdrop.addEventListener("click", closeAccountModal);

showSignupButton.addEventListener("click", () => {
    signupForm.hidden = false;
    loginForm.hidden = true;

    accountTitle.textContent = "Create your account";
    accountDescription.textContent =
        "Join Planora and organise your learning.";
});

showLogInButton.addEventListener("click", () => {
    signupForm.hiddden = true;
    loginForm.hidden = false;

    accountTitle.textContent="Welcome back!";
    accountDescription.textContent =
        "Log in to access your Planora account.";
});
