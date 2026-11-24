(function () {
    "use strict";

    const auth = window.EnglishFlowAuth;

    if (!auth) {
        console.error("English Flow authentication is missing.");
        return;
    }

    const overlay = document.createElement("div");
    overlay.className = "ef-auth-overlay";
    overlay.hidden = true;

    overlay.innerHTML = `
        <section class="ef-auth-modal"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="ef-title">

            <button type="button"
                    class="ef-auth-close"
                    aria-label="Close">&times;</button>

            <div class="ef-auth-brand">
                English<span>Flow</span>
            </div>

            <h2 class="ef-auth-title" id="ef-title"></h2>

            <p class="ef-auth-subtitle" id="ef-subtitle"></p>

            <div class="ef-auth-message"
                 role="status"
                 aria-live="polite"></div>

            <form class="ef-auth-form"></form>

            <div class="ef-auth-switch"></div>

        </section>
    `;

    document.body.appendChild(overlay);

    const form = overlay.querySelector("form");
    const title = overlay.querySelector("#ef-title");
    const subtitle = overlay.querySelector("#ef-subtitle");
    const message = overlay.querySelector(".ef-auth-message");
    const switchArea = overlay.querySelector(".ef-auth-switch");

    let mode = "signin";
    let previousFocus = null;
    let recovery = false;
    let busy = false;
    let savedEmail = "";

    function notify(text, type = "info") {
        message.textContent = text;
        message.className = "ef-auth-message " + type;
    }

    function field(label, name, type, autocomplete) {
        return `
            <div class="ef-auth-field">
                <label for="ef-${name}">${label}</label>
                <input id="ef-${name}"
                       name="${name}"
                       type="${type}"
                       autocomplete="${autocomplete}"
                       required>
            </div>
        `;
    }

    function link(label, target) {
        return `
            <button type="button"
                    class="ef-auth-link"
                    data-mode="${target}">
                ${label}
            </button>
        `;
    }

    function open(nextMode = "signin") {

        if (busy) return;

        if (overlay.hidden) {
            previousFocus = document.activeElement;
        }

        mode = nextMode;
        overlay.hidden = false;
        document.body.style.overflow = "hidden";

        notify("");

        let fields = "";
        let buttonText = "";

        if (mode === "signup") {

            title.textContent = "Create your account";
            subtitle.textContent =
                "Start your IELTS Academic journey.";

            fields =
                field("Full name", "name", "text", "name") +
                field("Email address", "email", "email", "email") +
                field("Password", "password", "password", "new-password") +
                field("Confirm password", "confirm", "password", "new-password");

            buttonText = "Create account";

            switchArea.innerHTML =
                "Already have an account? " +
                link("Sign in", "signin");

        } else if (mode === "forgot") {

            title.textContent = "Forgot password?";
            subtitle.textContent =
                "We will send you a password reset link.";

            fields = field(
                "Email address", "email", "email", "email"
            );

            buttonText = "Send reset link";
            switchArea.innerHTML = link("Back to sign in", "signin");

        } else if (mode === "resend") {

            title.textContent = "Verify your email";
            subtitle.textContent =
                "Request another verification email.";

            fields = field(
                "Email address", "email", "email", "email"
            );

            buttonText = "Resend verification email";
            switchArea.innerHTML = link("Back to sign in", "signin");

        } else if (mode === "update") {

            title.textContent = "Set a new password";
            subtitle.textContent =
                "Choose a secure password for your account.";

            fields =
                field("New password", "password", "password", "new-password") +
                field("Confirm password", "confirm", "password", "new-password");

            buttonText = "Update password";
            switchArea.innerHTML = "";

        } else {

            mode = "signin";

            title.textContent = "Welcome back";
            subtitle.textContent =
                "Sign in to continue your IELTS journey.";

            fields =
                field("Email address", "email", "email", "email") +
                field("Password", "password", "password", "current-password") +
                `<div class="ef-auth-forgot">
                    ${link("Forgot password?", "forgot")}
                </div>`;

            buttonText = "Sign in";

            switchArea.innerHTML =
                "Don't have an account? " +
                link("Sign up", "signup") +
                "<br>" +
                link("Resend verification email", "resend");
        }

        form.innerHTML = fields + `
            <button class="ef-auth-submit" type="submit">
                ${buttonText}
            </button>
        `;

        const emailInput = form.querySelector('[name="email"]');

        if (emailInput) {
            emailInput.value = savedEmail;
        }

        form.querySelector("input")?.focus();
    }

    function close() {

        if (busy || recovery) return;

        overlay.hidden = true;
        document.body.style.overflow = "";
        form.reset();

        if (previousFocus?.isConnected) {
            previousFocus.focus();
        }
    }

    auth.open = open;

    overlay.addEventListener("click", function (event) {

        const target = event.target.closest("[data-mode]");

        if (target) {
            open(target.dataset.mode);
            return;
        }

        if (
            event.target === overlay ||
            event.target.closest(".ef-auth-close")
        ) {
            close();
        }
    });

    document.addEventListener("keydown", function (event) {

        if (overlay.hidden) return;

        if (event.key === "Escape") {
            close();
        }

        if (event.key === "Tab") {

            const elements = Array.from(
                overlay.querySelectorAll(
                    "button:not(:disabled), input:not(:disabled)"
                )
            );

            const first = elements[0];
            const last = elements[elements.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault();
                first?.focus();
            }
        }
    });

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (busy) return;

        const values = Object.fromEntries(new FormData(form));
        const submit = form.querySelector(".ef-auth-submit");
        const originalText = submit.textContent;

        savedEmail = values.email || savedEmail;

        busy = true;
        submit.disabled = true;
        submit.textContent = "Please wait...";
        notify("");

        let nextMode = null;
        let successMessage = "";
        let shouldClose = false;

        try {

            if (mode === "signup") {

                const result = await auth.signUp(
                    values.name,
                    values.email,
                    values.password,
                    values.confirm
                );

                if (result.session) {
                    shouldClose = true;
                } else {
                    nextMode = "resend";
                    successMessage =
                        "Check your inbox and spam folder for the verification link.";
                }

            } else if (mode === "signin") {

                await auth.signIn(
                    values.email,
                    values.password
                );

                shouldClose = true;

            } else if (mode === "forgot") {

                await auth.resetPassword(values.email);

                notify(
                    "If an account exists, a password reset link will be sent to your email.",
                    "success"
                );

            } else if (mode === "resend") {

                await auth.resendVerification(values.email);

                notify(
                    "Verification email requested. Please check your inbox.",
                    "success"
                );

            } else if (mode === "update") {

                await auth.updatePassword(
                    values.password,
                    values.confirm
                );

                recovery = false;

                nextMode = "signin";
                successMessage =
                    "Your password has been updated successfully.";

                await auth.signOut();
            }

        } catch (error) {

            notify(
                error.message || "Something went wrong. Please try again.",
                "error"
            );

        } finally {

            busy = false;
            submit.disabled = false;
            submit.textContent = originalText;
        }

        if (nextMode) {
            open(nextMode);
            notify(successMessage, "success");
        }

        if (shouldClose) {
            close();
        }
    });

    function renderAccount(session) {

        const actions = document.getElementById("auth-actions");

        if (!actions) return;

        if (!session?.user) {

            actions.innerHTML = `
                <button class="btn" type="button" id="sign-in">
                    Sign in
                </button>
                <button class="btn primary" type="button" id="sign-up">
                    Sign up
                </button>
            `;

            actions.querySelector("#sign-in")
                .addEventListener("click", () => open("signin"));

            actions.querySelector("#sign-up")
                .addEventListener("click", () => open("signup"));

            return;
        }

        const user = session.user;

        const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "Student";

        actions.innerHTML = `
            <div class="ef-auth-user">
                <span class="ef-auth-avatar"></span>
                <span class="ef-user-name"></span>
            </div>
            <button type="button" class="ef-auth-logout">
                Sign out
            </button>
        `;

        actions.querySelector(".ef-auth-avatar").textContent =
            name.charAt(0).toUpperCase();

        actions.querySelector(".ef-user-name").textContent =
            name.split(" ")[0];

        actions.querySelector(".ef-auth-logout")
            .addEventListener("click", async function () {

                try {
                    await auth.signOut();
                } catch (error) {
                    alert(error.message);
                }
            });
    }

    auth.onAuthChange(function (event, session) {

        renderAccount(session);

        if (event === "PASSWORD_RECOVERY") {
            recovery = true;
            open("update");
        }
    });

    auth.getSession()
        .then(renderAccount)
        .catch(console.error);

})();
