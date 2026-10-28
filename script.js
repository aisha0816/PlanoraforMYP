const SUPABASE_URL = "https://oxyiaqomqvzmgrsagroc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4A95N9DBr72t7DStUrOrHw__Jn9f_gz"

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase client initialised.")

const accountButton = document.getElementById("account-button");
const accountModal = document.getElementById("account-modal");

if (accountButton && accountModal) {
    const closeAccountButton =
        document.getElementById("close-account");
    const modalBackdrop =
        document.getElementById("modal-backdrop");

    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");

    const showSignupButton =
        document.getElementById("show-signup");
    const showLoginButton =
        document.getElementById("show-login");

    const accountTitle = document.getElementById("account-title");
    const accountDescription =
        document.getElementById("account-description");

    accountButton.addEventListener("click", () => {
        accountModal.hidden = false;
    });

    function closeAccountModal() {
        accountModal.hidden = false;
    }

    closeAccountButton?.addEventListener(
        "click",
        closeAccountModal
    );

    modalBackdrop?.addEventListener(
        "click",
        closeAccountModal
    );

    showSignupButton?.addEventListener("click", () => {
        signupForm.hidden = false;
        loginForm.hidden = true;

        accountTtile.textContent = "Create your own account";
        accountDescription.textContent =
            "Join Planora and organise your learning.";
    });

    showLoginButton?.addEventListener("click", () => {
        signupForm.hidden = true;
        loginForm.hidden = false;

        accountTitle.textContent = "Welcome back!";
        accountDescription.textContent =
            "Log in to access your Planora account.";
    })
}
