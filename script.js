
const SUPABASE_URL = "https://oxyiaqomqvzmgrsagroc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4A95N9DBr72t7DStUrOrHw__Jn9f_gz";

let supabaseClient = null;

const accountButton = document.getElementById("account-button");
const accountModal = document.getElementById("account-modal");

function showMessage(message) {
    const authMessage = document.getElementById("auth-message");

    if (authMessage) {
        authMessage.textContent = message;
    }
}

if (typeof supabase === "undefined") {
    showMessage("Supabase failed to load. Check your internet connection and refresh the page.");
    console.error("Supabase library is unavailable.");
} else {
    supabaseClient = supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    console.log("Supabase client initialised!");
}

if (accountButton && accountModal && supabaseClient) {
    const closeButton = document.getElementById("close-account");
    const backdrop = document.getElementById("modal-backdrop");
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");
    const showSignupButton = document.getElementById("show-signup");
    const showLoginButton = document.getElementById("show-login");
    const accountTitle = document.getElementById("account-title");
    const accountDescription = document.getElementById("account-description");

    function closeAccountModal() {
        accountModal.hidden = true;
    }

    function showSignup() {
        if (!signupForm || !loginForm) return;

        signupForm.hidden = false;
        loginForm.hidden = true;

        if (accountTitle) {
            accountTitle.textContent = "Create your account";
        }

        if (accountDescription) {
            accountDescription.textContent =
                "Join Planora and organise your learning.";
        }

        showMessage("");
    }

    function showLogin() {
        if (!signupForm || !loginForm) return;

        signupForm.hidden = true;
        loginForm.hidden = false;

        if (accountTitle) {
            accountTitle.textContent = "Welcome back!";
        }

        if (accountDescription) {
            accountDescription.textContent =
                "Log in to access your Planora account.";
        }

        showMessage("");
    }

    accountButton.addEventListener("click", () => {
        accountModal.hidden = false;
    });

    closeButton?.addEventListener("click", closeAccountModal);
    backdrop?.addEventListener("click", closeAccountModal);
    showSignupButton?.addEventListener("click", showSignup);
    showLoginButton?.addEventListener("click", showLogin);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !accountModal.hidden) {
            closeAccountModal();
        }
    });

    signupForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nameInput = document.getElementById("signup-name");
        const emailInput = document.getElementById("signup-email");
        const passwordInput = document.getElementById("signup-password");

        if (!nameInput || !emailInput || !passwordInput) {
            showMessage("Some sign-up fields are missing.");
            return;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!name || !email || !password) {
            showMessage("Please complete all sign-up fields.");
            return;
        }

        showMessage("Creating your account...");

        try {
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
                showMessage(error.message);
                console.error("Signup error:", error);
                return;
            }

            if (data.session) {
                accountButton.textContent = name.charAt(0).toUpperCase();
                showMessage("Account created successfully!");
            } else {
                showMessage(
                    "Sign-up request accepted. Check your email to confirm your account."
                );
            }
        } catch (error) {
            console.error("Signup connection error:", error);
            showMessage(
                error.message || "Could not connect to Supabase. Please try again."
            );
        }
    });

    loginForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("login-password");

        if (!emailInput || !passwordInput) {
            showMessage("Some login fields are missing.");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage("Please enter your email and password.");
            return;
        }

        showMessage("Logging in...");

        try {
            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) {
                showMessage(error.message);
                console.error("Login error:", error);
                return;
            }

            const name = data.user?.user_metadata?.full_name;

            accountButton.textContent =
                name?.charAt(0)?.toUpperCase() || "U";

            showMessage("Logged in successfully!");
        } catch (error) {
            console.error("Login connection error:", error);
            showMessage(
                error.message || "Could not connect to Supabase. Please try again."
            );
        }
    });
}
