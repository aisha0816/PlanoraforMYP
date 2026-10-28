const SUPABASE_URL = "https://oxyiaqomqvzmgrsagroc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4A95N9DBr72t7DStUrOrHw__Jn9f_gz";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase client initialised!");

const accountButton = document.getElementById("account-button");
const accountModal = document.getElementById("account-modal");

if (accountButton && accountModal) {
    const closeButton = document.getElementById("close-account");
    const backdrop = document.getElementById("modal-backdrop");

    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");

    const showSignupButton = document.getElementById("show-signup");
    const showLoginButton = document.getElementById("show-login");

    const accountTitle = document.getElementById("account-title");
    const accountDescription =
        document.getElementById("account-description");
    const authMessage = document.getElementById("auth-message");

    function closeAccountModal() {
        accountModal.hidden = true;
    }

    accountButton.addEventListener("click", () => {
        accountModal.hidden = false;
    });

    closeButton?.addEventListener("click", closeAccountModal);
    backdrop?.addEventListener("click", closeAccountModal);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !accountModal.hidden) {
            closeAccountModal();
        }
    });

    showSignupButton?.addEventListener("click", () => {
        signupForm.hidden = false;
        loginForm.hidden = true;
        authMessage.textContent = "";

        accountTitle.textContent = "Create your account";
        accountDescription.textContent =
            "Join Planora and organise your learning.";
    });

    showLoginButton?.addEventListener("click", () => {
        signupForm.hidden = true;
        loginForm.hidden = false;
        authMessage.textContent = "";

        accountTitle.textContent = "Welcome back!";
        accountDescription.textContent =
            "Log in to access your Planora account.";
    });

    signupForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        authMessage.textContent = "Creating your account...";

        const name = document
            .getElementById("signup-name").value.trim();
        const email = document
            .getElementById("signup-email").value.trim();
        const password = document
            .getElementById("signup-password").value;

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });

        if (error) {
            authMessage.textContent = error.message;
            return;
        }

        authMessage.textContent = data.session
            ? "Account created successfully!"
            : "Account created! Check your email to confirm your account.";
    });

    loginForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        authMessage.textContent = "Logging in...";

        const email = document
            .getElementById("login-email").value.trim();
        const password = document
            .getElementById("login-password").value;

        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            authMessage.textContent = error.message;
            return;
        }

        const { data } = await supabaseClient.auth.getUser();

        authMessage.textContent = "Logged in successfully!";
        accountButton.textContent =
            data.user?.user_metadata?.full_name?.charAt(0)?.toUpperCase()
            || "U";
    });
}
