document.addEventListener('DOMContentLoaded', () => {
    console.log("App Initialized...");

    // --- 1. SELECT ELEMENTS ---
    const homeView = document.getElementById('home-view');
    const registerView = document.getElementById('register-view');
    const verifyView = document.getElementById('verify-view');
    const loginView = document.getElementById('login-view');
    const profileView = document.getElementById('profile-view'); // Dashboard view
    
    const authNav = document.getElementById('auth-nav'); // Contains Login/Register
    const adminNav = document.getElementById('admin-nav'); // Admin dropdown
    const loginVerifyAlert = document.getElementById('login-verify-alert');

    const linkLogin = document.getElementById('link-login');
    const linkRegister = document.getElementById('link-register');
    const btnGetStarted = document.getElementById('btn-get-started');
    const btnCancelReg = document.getElementById('btn-cancel-reg');
    const btnCancelLogin = document.getElementById('btn-cancel-login');
    const navBrand = document.getElementById('nav-brand');
    const linkLogout = document.getElementById('link-logout');
    
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const displayEmail = document.getElementById('display-email');

    // --- 2. VIEW SWITCHING FUNCTIONS ---
    const hideAllViews = () => {
        const views = [homeView, registerView, verifyView, loginView, profileView];
        views.forEach(view => { if(view) view.style.display = 'none'; });
    };

    const showRegister = (e) => {
        if (e) e.preventDefault();
        hideAllViews();
        registerView.style.display = 'block';
    };

    const showHome = (e) => {
        if (e) e.preventDefault();
        hideAllViews();
        homeView.style.display = 'block';
        
        // Show Login/Register links again if logged out
        if (authNav) authNav.style.display = 'flex'; 
        if (adminNav) adminNav.style.display = 'none';
    };

    const showVerify = () => {
        hideAllViews();
        verifyView.style.display = 'block';
    };

    const showLogin = (withAlert = false) => {
        hideAllViews();
        loginView.style.display = 'block';
        if (withAlert) {
            loginVerifyAlert.setAttribute('style', 'background-color: #d1e7dd; color: #0f5132; display: flex !important;');
        } else {
            loginVerifyAlert.setAttribute('style', 'display: none !important;');
        }
    };

    // Transition to Profile Dashboard
    const showProfile = () => {
        hideAllViews();
        profileView.style.display = 'block';
        
        // Swap Navbar UI: Remove Login/Register and show Admin
        if (authNav) authNav.style.display = 'none'; 
        if (adminNav) adminNav.style.display = 'block';
    };

    // --- 3. EVENT LISTENERS ---
    if (linkRegister) linkRegister.addEventListener('click', showRegister);
    if (btnGetStarted) btnGetStarted.addEventListener('click', showRegister);
    if (linkLogin) linkLogin.addEventListener('click', () => showLogin(false));
    
    if (btnCancelReg) btnCancelReg.addEventListener('click', showHome);
    if (btnCancelLogin) btnCancelLogin.addEventListener('click', showHome);
    if (navBrand) navBrand.addEventListener('click', showHome);

    // --- 4. FORM SUBMISSIONS ---
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailValue = document.getElementById('reg-email').value;
            if (displayEmail) displayEmail.textContent = emailValue;
            showVerify();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            localStorage.setItem('isLoggedIn', 'true');
            showProfile(); 
        });
    }

    if (linkLogout) {
        linkLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            location.reload(); 
        });
    }

    // --- 5. BUTTONS & INITIAL STATE ---
    const btnSimulate = document.getElementById('btn-simulate-verify');
    if (btnSimulate) {
        btnSimulate.addEventListener('click', () => showLogin(true));
    }

    const btnToLogin = document.getElementById('btn-to-login');
    if (btnToLogin) {
        btnToLogin.addEventListener('click', () => showLogin(false));
    }

    if (localStorage.getItem('isLoggedIn') === 'true') {
        showProfile();
    }
});