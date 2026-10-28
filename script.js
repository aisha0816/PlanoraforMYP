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

    const isCompleting = !task.completed;

    const { error } = await supabaseClient
        .from("tasks")
        .update({
            completed: isCompleting,
            completed_at: isCompleting ? new Date().toISOString() : null
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

    if (typeof loadProgress === "function") {
        await loadProgress();
    }
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

const scheduleForm = document.getElementById("schedule-form");
const scheduleList = document.getElementById("schedule-list");
const scheduleStatus = document.getElementById("schedule-status");
const addSessionButton = document.getElementById("add-session-button");

function showScheduleMessage(message) {
    if (scheduleStatus) {
        scheduleStatus.textContent = message;
    }
}

function renderSessions(sessions) {
    if (!scheduleList) return;

    scheduleList.replaceChildren();

    if (sessions.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "No sessions planned yet.";
        scheduleList.appendChild(emptyMessage);
        return;
    }

    sessions.forEach((session) => {
        const item = document.createElement("li");
        item.className = "schedule-session";

        const title = document.createElement("h3");
        title.textContent = session.title;

        const date = document.createElement("p");
        const [year, month, day] = session.session_date
            .split("-")
            .map(Number);

        date.textContent = new Date(year, month - 1, day)
            .toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric"
            });

        const time = document.createElement("p");

        function formatTime(value) {
            const [hours, minutes] = value.split(":").map(Number);
            const formatted = new Date();
            formatted.setHours(hours, minutes, 0, 0);

            return formatted.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            });
        }

        time.textContent =
            `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteSession(session.id, deleteButton);
        });

        item.append(title, date, time, deleteButton);
        scheduleList.appendChild(item);
    });
}

async function loadSessions() {
    if (!scheduleList || !supabaseClient) return;

    showScheduleMessage("Loading sessions...");

    const user = await getCurrentUser();

    if (!user) {
        renderSessions([]);
        showScheduleMessage("Log in to view and save your schedule.");
        return;
    }

    const { data, error } = await supabaseClient
        .from("schedule_sessions")
        .select("id, title, session_date, start_time, end_time")
        .eq("user_id", user.id)
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) {
        console.error("Could not load sessions:", error);
        showScheduleMessage(`Could not load sessions: ${error.message}`);
        return;
    }

    renderSessions(data || []);
    showScheduleMessage("");
}

if (scheduleForm && scheduleList && supabaseClient) {
    scheduleForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const title = document.getElementById("session-title")?.value.trim();
        const sessionDate = document.getElementById("session-date")?.value;
        const startTime = document.getElementById("session-start")?.value;
        const endTime = document.getElementById("session-end")?.value;

        if (!title || !sessionDate || !startTime || !endTime) {
            showScheduleMessage("Please complete all fields.");
            return;
        }

        if (endTime <= startTime) {
            showScheduleMessage("The end time must be after the start time.");
            return;
        }

        const user = await getCurrentUser();

        if (!user) {
            showScheduleMessage("Please log in before adding a session.");

            if (accountModal) {
                accountModal.hidden = false;
                document.getElementById("show-login")?.click();
            }

            return;
        }

        if (addSessionButton) addSessionButton.disabled = true;

        showScheduleMessage("Saving session...");

        try {
            const { error } = await supabaseClient
                .from("schedule_sessions")
                .insert({
                    user_id: user.id,
                    title,
                    session_date: sessionDate,
                    start_time: startTime,
                    end_time: endTime
                });

            if (error) {
                console.error("Could not save session:", error);
                showScheduleMessage(`Could not save session: ${error.message}`);
                return;
            }

            scheduleForm.reset();
            showScheduleMessage("Session added successfully!");
            await loadSessions();
        } catch (error) {
            console.error("Schedule connection error:", error);
            showScheduleMessage("Connection failed. Please try again.");
        } finally {
            if (addSessionButton) addSessionButton.disabled = false;
        }
    });

    loadSessions();
}

async function deleteSession(sessionId, button) {
    const user = await getCurrentUser();

    if (!user) {
        showScheduleMessage("Please log in to delete sessions.");
        return;
    }

    if (!window.confirm("Delete this study session?")) return;

    button.disabled = true;

    try {
        const { error } = await supabaseClient
            .from("schedule_sessions")
            .delete()
            .eq("id", sessionId)
            .eq("user_id", user.id);

        if (error) {
            console.error("Could not delete session:", error);
            showScheduleMessage(`Could not delete session: ${error.message}`);
            return;
        }

        showScheduleMessage("Session deleted.");
        await loadSessions();
    } catch (error) {
        console.error("Schedule deletion error:", error);
        showScheduleMessage("Connection failed. Please try again.");
    } finally {
        button.disabled = false;
    }
}

const timerDisplay = document.getElementById("timer-display");
const timerMode = document.getElementById("timer-mode");
const timerStartButton = document.getElementById("timer-start");
const timerResetButton = document.getElementById("timer-reset");
const timerBreakButton = document.getElementById("timer-break");
const timerMessage = document.getElementById("timer-message");

let timerInterval = null;
let timerPhase = "focus";
let timerDuration = 25 * 60;
let timerRemaining = timerDuration;
let timerEndTime = null;
let timerRunning = false;
let completedFocusSessions = 0;

function formatTimerTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}

function updateTimerDisplay() {
    if (!timerDisplay) return;

    timerDisplay.textContent = formatTimerTime(timerRemaining);
}

function updateTimerMode() {
    if (!timerMode) return;

    if (timerPhase === "focus") {
        timerMode.textContent = "Focus session";
        timerDuration = 25 * 60;
    } else if (timerPhase === "short-break") {
        timerMode.textContent = "Short break";
        timerDuration = 5 * 60;
    } else {
        timerMode.textContent = "Long break";
        timerDuration = 15 * 60;
    }
}

function stopTimerInterval() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerButtons() {
    if (timerStartButton) {
        timerStartButton.textContent = timerRunning ? "Pause" : "Start";
    }

    if (timerBreakButton) {
        timerBreakButton.textContent =
            timerPhase === "focus" ? "Take a break" : "Back to focus";
    }
}

function switchTimerPhase(phase, message) {
    stopTimerInterval();

    timerPhase = phase;
    timerRunning = false;
    timerEndTime = null;

    updateTimerMode();
    timerRemaining = timerDuration;

    updateTimerDisplay();
    updateTimerButtons();

    if (timerMessage) {
        timerMessage.textContent = message;
    }
}

async function loadCompletedFocusSessions() {
    const user = await getCurrentUser();

    if (!user) {
        completedFocusSessions = 0;
        return;
    }

    const { count, error } = await supabaseClient
        .from("pomodoro_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    if (error) {
        console.error("Error loading Pomodoro sessions:", error);
        return;
    }

    completedFocusSessions = count ?? 0;
}

async function saveCompletedFocusSession() {
    const user = await getCurrentUser();

    if (!user) {
        if (timerMessage) {
            timerMessage.textContent =
                "Focus session complete! Log in to save your progress.";
        }

        return false;
    }

    const { error } = await supabaseClient
        .from("pomodoro_sessions")
        .insert({ user_id: user.id });

    if (error) {
        console.error("Error saving Pomodoro session:", error);

        if (timerMessage) {
            timerMessage.textContent =
                "Session complete, but progress could not be saved.";
        }

        return false;
    }

    completedFocusSessions += 1;
    return true;
}

async function finishTimerPhase() {
    stopTimerInterval();
    timerRunning = false;
    timerEndTime = null;

    if (timerPhase === "focus") {
        const saved = await saveCompletedFocusSession();

        if (!saved) {
            switchTimerPhase(
                "short-break",
                "Focus session complete! Take a 5-minute break."
            );
            return;
        }

        if (completedFocusSessions % 4 === 0) {
            switchTimerPhase(
                "long-break",
                "Focus session complete! Time for a 15-minute break."
            );
        } else {
            switchTimerPhase(
                "short-break",
                "Focus session complete! Time for a 5-minute break."
            );
        }
    } else {
        switchTimerPhase(
            "focus",
            "Break finished! Ready for another focus session?"
        );
    }
}

function tickTimer() {
    if (!timerRunning || timerEndTime === null) return;

    timerRemaining = Math.max(
        0,
        Math.ceil((timerEndTime - Date.now()) / 1000)
    );

    updateTimerDisplay();

    if (timerRemaining <= 0) {
        finishTimerPhase();
    }
}

function startTimer() {
    if (timerRunning) {
        timerRemaining = Math.max(
            0,
            Math.ceil((timerEndTime - Date.now()) / 1000)
        );

        timerRunning = false;
        timerEndTime = null;
        stopTimerInterval();

        if (timerMessage) {
            timerMessage.textContent = "Timer paused. Resume when ready.";
        }

        updateTimerDisplay();
        updateTimerButtons();
        return;
    }

    if (timerRemaining <= 0) {
        timerRemaining = timerDuration;
    }

    timerRunning = true;
    timerEndTime = Date.now() + timerRemaining * 1000;

    if (timerMessage) {
        timerMessage.textContent =
            timerPhase === "focus"
                ? "Focus time. You've got this!"
                : "Enjoy your break!";
    }

    updateTimerButtons();
    stopTimerInterval();
    tickTimer();

    if (timerRunning) {
        timerInterval = setInterval(tickTimer, 250);
    }
}

function resetTimer() {
    stopTimerInterval();

    timerRunning = false;
    timerEndTime = null;
    timerRemaining = timerDuration;

    updateTimerDisplay();
    updateTimerButtons();

    if (timerMessage) {
        timerMessage.textContent = "Timer reset. Ready when you are!";
    }
}

if (
    timerDisplay &&
    timerMode &&
    timerStartButton &&
    timerResetButton &&
    timerBreakButton
) {
    updateTimerMode();
    updateTimerDisplay();
    updateTimerButtons();
    loadCompletedFocusSessions();

    timerStartButton.addEventListener("click", startTimer);
    timerResetButton.addEventListener("click", resetTimer);

    timerBreakButton.addEventListener("click", () => {
        if (timerPhase === "focus") {
            switchTimerPhase(
                "short-break",
                "Take a breather. Your break has started!"
            );
        } else {
            switchTimerPhase(
                "focus",
                "Back to focus whenever you're ready!"
            );
        }
    });
}

const progressTotal = document.getElementById("progress-total");
const progressCompleted = document.getElementById("progress-completed");
const progressRate = document.getElementById("progress-rate");
const progressFocus = document.getElementById("progress-focus");
const progressStatus = document.getElementById("progress-status");
const goalDescription = document.getElementById("goal-description");
const goalProgress = document.getElementById("goal-progress");
const goalCount = document.getElementById("goal-count");
const progressTodayTasks = document.getElementById("progress-today-tasks");
const progressTodayFocus = document.getElementById("progress-today-focus");
const weeklyReflection = document.getElementById("weekly-reflection");
const saveReflectionButton = document.getElementById("save-reflection");
const reflectionStatus = document.getElementById("reflection-status");

function progressLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function progressLocalDayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
        start: start.toISOString(),
        end: end.toISOString()
    };
}

function progressWeekStart() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const daysSinceMonday = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - daysSinceMonday);

    return progressLocalDateString(date);
}

async function loadWeeklyReflection(userId) {
    if (!weeklyReflection) return;

    const weekStart = progressWeekStart();

    const { data, error } = await supabaseClient
        .from("weekly_reflections")
        .select("reflection")
        .eq("user_id", userId)
        .eq("week_start", weekStart)
        .maybeSingle();

    if (error) {
        console.error("Could not load weekly reflection:", error);

        if (reflectionStatus) {
            reflectionStatus.textContent =
                "Could not load your reflection. Please try again.";
        }

        return;
    }

    weeklyReflection.value = data?.reflection ?? "";

    if (reflectionStatus) {
        reflectionStatus.textContent = "";
    }
}

async function loadProgress() {
    if (!progressTotal || !supabaseClient) return;

    if (progressStatus) {
        progressStatus.textContent = "Loading your progress...";
    }

    const user = await getCurrentUser();

    if (!user) {
        progressTotal.textContent = "0";
        progressCompleted.textContent = "0";
        progressRate.textContent = "0%";
        progressFocus.textContent = "0";
        progressTodayTasks.textContent = "0";
        progressTodayFocus.textContent = "0";

        goalDescription.textContent =
            "Log in and add tasks with due dates to track your daily goal.";

        goalProgress.max = 1;
        goalProgress.value = 0;
        goalCount.textContent = "0 tasks completed today";

        if (weeklyReflection) {
            weeklyReflection.value = "";
        }

        if (progressStatus) {
            progressStatus.textContent =
                "Log in to see your personal progress.";
        }

        if (reflectionStatus) {
            reflectionStatus.textContent =
                "Log in to load and save your weekly reflection.";
        }

        return;
    }

    const { data: tasks, error: tasksError } = await supabaseClient
        .from("tasks")
        .select("id, completed, completed_at, due_date")
        .eq("user_id", user.id);

    if (tasksError) {
        console.error("Could not load progress tasks:", tasksError);

        if (progressStatus) {
            progressStatus.textContent =
                "Could not load your progress. Please try again.";
        }

        return;
    }

    const { data: focusSessions, error: focusError } = await supabaseClient
        .from("pomodoro_sessions")
        .select("completed_at")
        .eq("user_id", user.id);

    if (focusError) {
        console.error("Could not load focus sessions:", focusError);

        if (progressStatus) {
            progressStatus.textContent =
                "Could not load your focus sessions. Please try again.";
        }

        return;
    }

    const today = progressLocalDateString();
    const { start, end } = progressLocalDayRange();

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
        task => task.completed
    ).length;

    const completionRate = totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    const completedToday = tasks.filter(task => {
        if (!task.completed || !task.completed_at) {
            return false;
        }

        return progressLocalDateString(
            new Date(task.completed_at)
        ) === today;
    }).length;

    const focusSessionsToday = focusSessions.filter(session => {
        const completedAt = new Date(session.completed_at).getTime();

        return completedAt >= new Date(start).getTime()
            && completedAt < new Date(end).getTime();
    }).length;

    const tasksDueToday = tasks.filter(
        task => task.due_date === today
    );

    const completedDueToday = tasksDueToday.filter(
        task => task.completed
    ).length;

    const dailyGoal = tasksDueToday.length;

    progressTotal.textContent = totalTasks;
    progressCompleted.textContent = completedTasks;
    progressRate.textContent = `${completionRate}%`;
    progressFocus.textContent = focusSessions.length;
    progressTodayTasks.textContent = completedToday;
    progressTodayFocus.textContent = focusSessionsToday;

    if (dailyGoal === 0) {
        goalDescription.textContent =
            "No tasks are due today. Add a due date to a task to create your daily goal.";

        goalProgress.max = 1;
        goalProgress.value = 0;
        goalCount.textContent = "0 tasks completed toward today's goal";
    } else {
        goalProgress.max = dailyGoal;
        goalProgress.value = completedDueToday;

        goalDescription.textContent =
            completedDueToday === dailyGoal
                ? "You have completed every task due today. Great work!"
                : "Complete your tasks due today to reach your daily goal.";

        goalCount.textContent =
            `${completedDueToday} of ${dailyGoal} tasks completed`;
    }

    if (progressStatus) {
        progressStatus.textContent =
            "Your progress has been updated.";
    }

    await loadWeeklyReflection(user.id);
}

if (saveReflectionButton) {
    saveReflectionButton.addEventListener("click", async () => {
        const user = await getCurrentUser();

        if (!user) {
            if (typeof promptLogin === "function") {
                promptLogin();
            }

            const showLoginButton = document.getElementById("show-login");

            if (showLoginButton) {
                showLoginButton.click();
            }

            if (reflectionStatus) {
                reflectionStatus.textContent =
                    "Log in to save your weekly reflection.";
            }

            return;
        }

        const reflection = weeklyReflection.value.trim();

        if (!reflection) {
            reflectionStatus.textContent =
                "Write a reflection before saving.";
            weeklyReflection.focus();
            return;
        }

        const weekStart = progressWeekStart();

        saveReflectionButton.disabled = true;
        reflectionStatus.textContent = "Saving your reflection...";

        const { error } = await supabaseClient
            .from("weekly_reflections")
            .upsert(
                {
                    user_id: user.id,
                    week_start: weekStart,
                    reflection: reflection,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: "user_id,week_start"
                }
            );

        saveReflectionButton.disabled = false;

        if (error) {
            console.error("Could not save weekly reflection:", error);

            reflectionStatus.textContent =
                "Could not save your reflection. Please try again.";

            return;
        }

        reflectionStatus.textContent =
            "Your weekly reflection has been saved!";
    });
}

if (progressTotal) {
    loadProgress();
}
