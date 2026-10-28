const SUPABASE_URL = "https://oxyiaqomqvzmgrsagroc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_4A95N9DBr72t7DStUrOrHw__Jn9f_gz";

let supabaseClient = null;

const accountButton = document.getElementById("account-button");
const accountModal = document.getElementById("account-modal");

const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const addTaskButton = document.getElementById("add-task-button");

let taskStatus = null;

function showMessage(message) {
    const authMessage = document.getElementById("auth-message");

    if (authMessage) {
        authMessage.textContent = message;
    }
}

function setupTaskStatus() {
    if (!taskList || taskStatus) return;

    taskStatus = document.createElement("p");
    taskStatus.id = "task-status";
    taskStatus.setAttribute("role", "status");
    taskStatus.setAttribute("aria-live", "polite");

    taskList.parentElement?.insertBefore(taskStatus, taskList);
}

function showTaskMessage(message) {
    setupTaskStatus();

    if (taskStatus) {
        taskStatus.textContent = message;
    }
}

if (typeof supabase === "undefined") {
    showMessage(
        "Supabase failed to load. Check your internet connection and refresh."
    );

    console.error("Supabase library is unavailable.");
} else {
    supabaseClient = supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    console.log("Supabase client initialised!");
}

function updateAccountButton(user) {
    if (!accountButton) return;

    if (user) {
        const name = user.user_metadata?.full_name;

        accountButton.textContent =
            name?.charAt(0)?.toUpperCase() ||
            user.email?.charAt(0)?.toUpperCase() ||
            "U";

        accountButton.setAttribute("aria-label", "Account signed in");
    } else {
        accountButton.textContent = "U";
        accountButton.setAttribute("aria-label", "Sign up or log in");
    }
}

async function restoreAccountButton() {
    if (!accountButton || !supabaseClient) return;

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Session restore error:", error);
        return;
    }

    updateAccountButton(data.session?.user);
}

restoreAccountButton();

if (accountButton && accountModal && supabaseClient) {
    const closeButton = document.getElementById("close-account");
    const backdrop = document.getElementById("modal-backdrop");
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");
    const showSignupButton = document.getElementById("show-signup");
    const showLoginButton = document.getElementById("show-login");
    const accountTitle = document.getElementById("account-title");
    const accountDescription = document.getElementById(
        "account-description"
    );

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

        const name = document.getElementById("signup-name")?.value.trim();
        const email = document.getElementById("signup-email")?.value.trim();
        const password = document.getElementById("signup-password")?.value;

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
                updateAccountButton(data.user);
                showMessage("Account created successfully!");
                closeAccountModal();
                await loadTasks();
            } else {
                showMessage(
                    "Sign-up accepted. Check your email to confirm your account."
                );
            }
        } catch (error) {
            console.error("Signup connection error:", error);
            showMessage(
                error.message || "Could not connect to Supabase."
            );
        }
    });

    loginForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("login-email")?.value.trim();
        const password = document.getElementById("login-password")?.value;

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

            updateAccountButton(data.user);
            showMessage("Logged in successfully!");
            closeAccountModal();
            await loadTasks();
        } catch (error) {
            console.error("Login connection error:", error);
            showMessage(
                error.message || "Could not connect to Supabase."
            );
        }
    });
}

async function getCurrentUser() {
    if (!supabaseClient) return null;

    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error("Could not get current user:", error);
        return null;
    }

    return data.user;
}

function promptLogin() {
    if (accountModal) {
        accountModal.hidden = false;
        document.getElementById("show-login")?.click();
        showMessage("Please log in to access your tasks.");
    } else {
        showTaskMessage("Please log in to access your tasks.");
    }
}

function renderTasks(tasks) {
    if (!taskList) return;

    taskList.replaceChildren();

    if (tasks.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty message";
        emptyItem.textContent = "No tasks yet. Add your first task!";
        taskList.appendChild(emptyItem);
        return;
    }

    tasks.forEach((task) => {
        const item = document.createElement("li");
        item.className = "task-item";

        const details = document.createElement("div");
        details.className = "task-details";

        const title = document.createElement("h3");
        title.textContent = task.title;
        title.style.textDecoration = task.completed
            ? "line-through"
            : "none";

        const subject = document.createElement("p");
        subject.textContent = task.subject
            ? `Subject: ${task.subject}`
            : "No subject added";

        const priority = document.createElement("p");
        priority.textContent = `Priority: ${task.priority || "Medium"}`;

        const dueDate = document.createElement("p");
        dueDate.textContent = task.due_date
            ? `Due: ${task.due_date}`
            : "No due date";

        const completion = document.createElement("button");
        completion.type = "button";
        completion.textContent = task.completed
            ? "Mark incomplete"
            : "Mark complete";

        completion.addEventListener("click", () => {
            toggleTaskCompletion(task);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        details.append(title, subject, priority, dueDate);
        item.append(details, completion, deleteButton);
        taskList.appendChild(item);
    });
}

async function loadTasks() {
    if (!taskList || !supabaseClient) return;

    setupTaskStatus();

    const user = await getCurrentUser();

    if (!user) {
        renderTasks([]);
        showTaskMessage("Log in to view and save your personal tasks.");
        return;
    }

    showTaskMessage("Loading tasks...");

    const { data, error } = await supabaseClient
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load tasks:", error);
        showTaskMessage(`Could not load tasks: ${error.message}`);
        return;
    }

    renderTasks(data || []);
    showTaskMessage("");
}

if (taskForm && taskList && supabaseClient) {
    setupTaskStatus();

    addTaskButton?.addEventListener("click", async () => {
        const user = await getCurrentUser();

        if (!user) {
            promptLogin();
            return;
        }

        taskForm.hidden = !taskForm.hidden;

        if (!taskForm.hidden) {
            document.getElementById("task-input")?.focus();
        }
    });

    taskForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const user = await getCurrentUser();

        if (!user) {
            promptLogin();
            return;
        }

        const title = document.getElementById("task-input")?.value.trim();
        const subject = document.getElementById("task-subject")?.value.trim();
        const priority = document.getElementById("task-priority")?.value;
        const dueDate = document.getElementById("task-due-date")?.value;

        if (!title) {
            showTaskMessage("Please enter a task name.");
            return;
        }

        showTaskMessage("Saving your task...");

        const newTask = {
            user_id: user.id,
            title,
            subject: subject || null,
            priority: priority || "Medium",
            due_date: dueDate || null,
            completed: false
        };

        const { error } = await supabaseClient
            .from("tasks")
            .insert(newTask);

        if (error) {
            console.error("Could not save task:", error);
            showTaskMessage(`Could not save task: ${error.message}`);
            return;
        }

        taskForm.reset();
        document.getElementById("task-priority").value = "Medium";
        taskForm.hidden = true;

        showTaskMessage("Task saved!");
        await loadTasks();
    });

    loadTasks();
}

async function toggleTaskCompletion(task) {
    const user = await getCurrentUser();

    if (!user) {
        promptLogin();
        return;
    }

    const { error } = await supabaseClient
        .from("tasks")
        .update({
            completed: !task.completed
        })
        .eq("id", task.id)
        .eq("user_id", user.id);

    if (error) {
        console.error("Could not update task:", error);
        showTaskMessage(`Could not update task: ${error.message}`);
        return;
    }

    showTaskMessage("Task updated!");
    await loadTasks();
}

async function deleteTask(taskId) {
    const user = await getCurrentUser();

    if (!user) {
        promptLogin();
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    const { error } = await supabaseClient
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Could not delete task:", error);
        showTaskMessage(`Could not delete task: ${error.message}`);
        return;
    }

    showTaskMessage("Task deleted.");
    await loadTasks();
}
