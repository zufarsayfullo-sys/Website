(function () {
    "use strict";

    const db = window.EnglishFlowDB;

    if (!db) {
        console.error("Supabase connection is missing.");
        return;
    }

    const REDIRECT_URL = window.location.origin + "/";

    window.EnglishFlowAuth = {

        // REGISTER
        async signUp(name, email, password, confirmPassword) {

            name = name.trim();
            email = email.trim();

            if (!name || !email || !password) {
                throw new Error("Please complete all fields.");
            }

            if (password.length < 8) {
                throw new Error(
                    "Password must contain at least 8 characters."
                );
            }

            if (password !== confirmPassword) {
                throw new Error("Passwords do not match.");
            }

            const { data, error } = await db.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        full_name: name
                    },
                    emailRedirectTo: REDIRECT_URL
                }
            });

            if (error) throw error;

            return data;
        },

        // SIGN IN
        async signIn(email, password) {

            const { data, error } =
                await db.auth.signInWithPassword({
                    email: email.trim(),
                    password
                });

            if (error) throw error;

            return data;
        },

        // SIGN OUT
        async signOut() {

            const { error } = await db.auth.signOut();

            if (error) throw error;
        },

        // RESEND VERIFICATION EMAIL
        async resendVerification(email) {

            const { data, error } = await db.auth.resend({
                type: "signup",
                email: email.trim(),
                options: {
                    emailRedirectTo: REDIRECT_URL
                }
            });

            if (error) throw error;

            return data;
        },

        // FORGOT PASSWORD
        async resetPassword(email) {

            const { data, error } =
                await db.auth.resetPasswordForEmail(
                    email.trim(),
                    {
                        redirectTo: REDIRECT_URL
                    }
                );

            if (error) throw error;

            return data;
        },

        // SET NEW PASSWORD
        async updatePassword(password, confirmPassword) {

            if (password.length < 8) {
                throw new Error(
                    "Password must contain at least 8 characters."
                );
            }

            if (password !== confirmPassword) {
                throw new Error("Passwords do not match.");
            }

            const { data, error } = await db.auth.updateUser({
                password
            });

            if (error) throw error;

            return data;
        },

        // GET CURRENT SESSION
        async getSession() {

            const { data, error } = await db.auth.getSession();

            if (error) throw error;

            return data.session;
        },

        // GET CURRENT USER
        async getUser() {

            const { data, error } = await db.auth.getUser();

            if (error) throw error;

            return data.user;
        },

        // MONITOR AUTHENTICATION CHANGES
        onAuthChange(callback) {

            return db.auth.onAuthStateChange(
                (event, session) => {
                    callback(event, session);
                }
            );
        },

        // PROTECT PRIVATE PAGES
        async requireAuth() {

            const session = await this.getSession();

            if (!session) {
                window.location.replace(REDIRECT_URL);
                return null;
            }

            return session.user;
        }
    };

})();
