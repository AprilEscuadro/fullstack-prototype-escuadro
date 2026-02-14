// ============================================
// Configuration & Constants
// ============================================

const CONFIG = {
    STORAGE_KEY: 'ipt_demo_v1',
    APP_NAME: 'Full-Stack App',
    
    DEFAULT_DATA: {
        accounts: [
            {
                id: 1,
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'Password123!',
                role: 'admin',
                verified: true,
                createdAt: new Date().toISOString()
            }
        ],
        departments: [
            {
                id: 1,
                name: 'Engineering',
                description: 'Software development team',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'HR',
                description: 'Human Resources',
                createdAt: new Date().toISOString()
            }
        ],
        employees: [],
        requests: []
    }
};

// Helper function to generate unique IDs
function generateId(array) {
    if (!array || array.length === 0) return 1;
    return Math.max(...array.map(item => item.id || 0)) + 1;
}

// ============================================
// Data Storage Functions
// ============================================

function loadFromStorage() {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    return CONFIG.DEFAULT_DATA;
}

function saveToStorage(data) {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

function initializeDatabase() {
    const data = loadFromStorage();
    window.db = data;
    return data;
}

function persistDatabase() {
    return saveToStorage(window.db);
}

function getAll(collection) {
    return window.db[collection] || [];
}

function getById(collection, id) {
    const items = getAll(collection);
    return items.find(item => item.id === parseInt(id));
}

function getByProperty(collection, property, value) {
    const items = getAll(collection);
    return items.find(item => item[property] === value);
}

function addItem(collection, item) {
    if (!window.db[collection]) {
        window.db[collection] = [];
    }
    
    item.id = generateId(window.db[collection]);
    item.createdAt = new Date().toISOString();
    
    window.db[collection].push(item);
    persistDatabase();
    
    return item;
}

function updateItem(collection, id, updates) {
    const items = window.db[collection];
    const index = items.findIndex(item => item.id === parseInt(id));
    
    if (index !== -1) {
        items[index] = { ...items[index], ...updates };
        items[index].updatedAt = new Date().toISOString();
        persistDatabase();
        return items[index];
    }
    
    return null;
}

function deleteItem(collection, id) {
    const items = window.db[collection];
    const index = items.findIndex(item => item.id === parseInt(id));
    
    if (index !== -1) {
        items.splice(index, 1);
        persistDatabase();
        return true;
    }
    
    return false;
}

// ============================================
// Authentication Functions
// ============================================

function getCurrentUser() {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    const user = getByProperty('accounts', 'email', token);
    return user;
}

function isAuthenticated() {
    return getCurrentUser() !== null;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

function login(email, password) {
    const user = getByProperty('accounts', 'email', email);
    
    if (!user) {
        return { success: false, message: 'Invalid email or password' };
    }
    
    if (user.password !== password) {
        return { success: false, message: 'Invalid email or password' };
    }
    
    if (!user.verified) {
        return { success: false, message: 'Please verify your email first' };
    }
    
    localStorage.setItem('auth_token', email);
    
    return { success: true, user: user };
}

function logout() {
    localStorage.removeItem('auth_token');
    window.location.hash = '#/';
    updateNavigation();
}

function register(firstName, lastName, email, password) {
    const existing = getByProperty('accounts', 'email', email);
    if (existing) {
        return { success: false, message: 'Email already registered' };
    }
    
    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
    }
    
    const newUser = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        role: 'user',
        verified: false
    };
    
    addItem('accounts', newUser);
    localStorage.setItem('unverified_email', email);
    
    return { success: true, user: newUser };
}

function verifyEmail(email) {
    const user = getByProperty('accounts', 'email', email);
    
    if (!user) {
        return { success: false, message: 'User not found' };
    }
    
    updateItem('accounts', user.id, { verified: true });
    localStorage.removeItem('unverified_email');
    
    return { success: true, message: 'Email verified successfully' };
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.hash = '#/login';
        return false;
    }
    return true;
}

function requireAdmin() {
    if (!requireAuth()) return false;
    
    if (!isAdmin()) {
        showToast('Access denied. Admin privileges required.', 'danger');
        window.location.hash = '#/';
        return false;
    }
    return true;
}

function updateNavigation() {
    const authenticated = isAuthenticated();
    const admin = isAdmin();
    const user = getCurrentUser();
    
    // Update body classes
    document.body.classList.remove('authenticated', 'not-authenticated', 'is-admin');
    
    if (authenticated) {
        document.body.classList.add('authenticated');
        if (admin) {
            document.body.classList.add('is-admin');
        }
        
        // Update user name in navigation
        if (user) {
            const userName = user.firstName; // First name only
            document.querySelectorAll('.user-name').forEach(el => {
                el.textContent = userName;
            });
        }
    } else {
        document.body.classList.add('not-authenticated');
    }
}

// ============================================
// Utility Functions
// ============================================

function showToast(message, type = 'info') {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = container.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ============================================
// Router - Hash-based routing
// ============================================

function handleRouting() {
    const hash = window.location.hash.slice(1) || '/';
    const routes = {
        '/': renderHome,
        '/login': renderLogin,
        '/register': renderRegister,
        '/verify': renderVerify,
        '/profile': () => requireAuth() && renderProfile(),
        '/requests': () => requireAuth() && renderRequests(),
        '/employees': () => requireAdmin() && renderEmployees(),
        '/accounts': () => requireAdmin() && renderAccounts(),
        '/departments': () => requireAdmin() && renderDepartments()
    };
    
    const route = routes[hash] || renderHome;
    route();
    updateNavigation();
}

// ============================================
// Page Rendering Functions
// ============================================

function renderHome() {
    const content = document.getElementById('app-content');
    const isAuth = isAuthenticated();
    
    content.innerHTML = `
        <div class="text-center mb-5">
            <h1 class="display-4 fw-bold mb-3">Welcome to Full-Stack App</h1>
            <p class="lead text-muted mb-4">A static prototype before backend integration. Simulates:</p>
            
            <div class="row justify-content-center mb-4">
                <div class="col-md-6">
                    <ul class="list-unstyled text-start">
                        <li class="mb-2"><i class="bi bi-check-circle-fill text-success"></i> Email registration + fake verification</li>
                        <li class="mb-2"><i class="bi bi-check-circle-fill text-success"></i> Login with JWT-like token simulation</li>
                        <li class="mb-2"><i class="bi bi-check-circle-fill text-success"></i> Role-based UI (Admin/User)</li>
                        <li class="mb-2"><i class="bi bi-check-circle-fill text-success"></i> CRUD for Employees, Departments, Requests</li>
                    </ul>
                </div>
            </div>
            
            <div class="alert alert-info d-inline-block">
                <i class="bi bi-info-circle"></i> <strong>Note:</strong> All data is stored in <code>localStorage</code>. Refresh to reset.
            </div>
            
            <div class="mt-4">
                ${!isAuth ? `
                    <a href="#/register" class="btn btn-primary btn-lg me-2">
                        Get Started <i class="bi bi-arrow-right"></i>
                    </a>
                ` : `
                    <a href="#/profile" class="btn btn-primary btn-lg">
                        Go to Profile <i class="bi bi-arrow-right"></i>
                    </a>
                `}
            </div>
        </div>
    `;
}

function renderLogin() {
    const content = document.getElementById('app-content');
    
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <div class="card shadow">
                    <div class="card-body p-4">
                        <h2 class="card-title mb-4">Login</h2>
                        
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" required placeholder="Enter your email">
                            </div>
                            
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" required placeholder="Enter your password">
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-box-arrow-in-right"></i> Login
                                </button>
                                <a href="#/" class="btn btn-outline-secondary">Cancel</a>
                            </div>
                        </form>
                        
                        <div class="text-center mt-3">
                            <small class="text-muted">
                                Don't have an account? <a href="#/register">Register here</a>
                            </small>
                        </div>
                        
                        <div class="alert alert-info mt-3 mb-0">
                            <strong><i class="bi bi-info-circle"></i> Demo Credentials:</strong><br>
                            <small>
                                Email: admin@example.com<br>
                                Password: Password123!
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address', 'danger');
            return;
        }
        
        const result = login(email, password);
        
        if (result.success) {
            showToast('Login successful!', 'success');
            setTimeout(() => {
                window.location.hash = '#/profile';
                // updateNavigation will be called by handleRouting
            }, 500);
        } else {
            showToast(result.message, 'danger');
        }
    });
}

function renderRegister() {
    const content = document.getElementById('app-content');
    
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <div class="card shadow">
                    <div class="card-body p-4">
                        <h2 class="card-title mb-4">Register Account</h2>
                        
                        <form id="registerForm">
                            <div class="mb-3">
                                <label for="firstName" class="form-label">First Name</label>
                                <input type="text" class="form-control" id="firstName" required placeholder="Enter your first name">
                            </div>
                            
                            <div class="mb-3">
                                <label for="lastName" class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="lastName" required placeholder="Enter your last name">
                            </div>
                            
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" required placeholder="Enter your email">
                            </div>
                            
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" required minlength="6" placeholder="Minimum 6 characters">
                                <div class="form-text">Password must be at least 6 characters long</div>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-success">
                                    <i class="bi bi-person-plus"></i> Sign Up
                                </button>
                                <a href="#/" class="btn btn-outline-secondary">Cancel</a>
                            </div>
                        </form>
                        
                        <div class="text-center mt-3">
                            <small class="text-muted">
                                Already have an account? <a href="#/login">Login here</a>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address', 'danger');
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'danger');
            return;
        }
        
        const result = register(firstName, lastName, email, password);
        
        if (result.success) {
            showToast('Registration successful! Please verify your email.', 'success');
            setTimeout(() => {
                window.location.hash = '#/verify';
            }, 1000);
        } else {
            showToast(result.message, 'danger');
        }
    });
}

function renderVerify() {
    const content = document.getElementById('app-content');
    const unverifiedEmail = localStorage.getItem('unverified_email');
    
    if (!unverifiedEmail) {
        window.location.hash = '#/';
        return;
    }
    
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <div class="card shadow">
                    <div class="card-body p-4">
                        <h2 class="card-title mb-4">Verify Your Email</h2>
                        
                        <div class="alert alert-success">
                            <i class="bi bi-check-circle-fill"></i>
                            A verification link has been sent to <strong id="userEmail">${unverifiedEmail}</strong>
                        </div>
                        
                        <p class="mt-3">
                            For demo purposes, click below to simulate email verification:
                        </p>
                        
                        <div class="d-grid gap-2">
                            <button onclick="simulateVerification()" class="btn btn-success">
                                <i class="bi bi-check-circle"></i> Simulate Email Verification
                            </button>
                            <a href="#/" class="btn btn-outline-secondary">Go to Home</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function simulateVerification() {
    const email = localStorage.getItem('unverified_email');
    
    if (!email) {
        showToast('No pending verification found', 'danger');
        return;
    }
    
    const result = verifyEmail(email);
    
    if (result.success) {
        showToast('Email verified! You may now log in.', 'success');
        setTimeout(() => {
            window.location.hash = '#/login';
        }, 1500);
    } else {
        showToast(result.message, 'danger');
    }
}

function renderProfile() {
    const content = document.getElementById('app-content');
    const user = getCurrentUser();
    
    if (!user) {
        window.location.hash = '#/login';
        return;
    }
    
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow">
                    <div class="card-body p-4">
                        <h2 class="card-title mb-4">My Profile</h2>
                        <div id="profileContent">
                            <div class="text-center mb-4">
                                <div class="display-1 text-primary mb-3">
                                    <i class="bi bi-person-circle"></i>
                                </div>
                                <h3>${user.firstName} ${user.lastName}</h3>
                            </div>
                            
                            <div class="list-group list-group-flush mb-3">
                                <div class="list-group-item">
                                    <div class="d-flex w-100 justify-content-between align-items-center">
                                        <strong><i class="bi bi-envelope"></i> Email</strong>
                                        <span class="text-muted">${user.email}</span>
                                    </div>
                                </div>
                                <div class="list-group-item">
                                    <div class="d-flex w-100 justify-content-between align-items-center">
                                        <strong><i class="bi bi-shield"></i> Role</strong>
                                        <span class="badge bg-${user.role === 'admin' ? 'primary' : 'success'}">
                                            ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                    </div>
                                </div>
                                <div class="list-group-item">
                                    <div class="d-flex w-100 justify-content-between align-items-center">
                                        <strong><i class="bi bi-check-circle"></i> Status</strong>
                                        <span class="badge bg-success">
                                            ${user.verified ? 'Verified' : 'Not Verified'}
                                        </span>
                                    </div>
                                </div>
                                ${user.createdAt ? `
                                <div class="list-group-item">
                                    <div class="d-flex w-100 justify-content-between align-items-center">
                                        <strong><i class="bi bi-calendar"></i> Member Since</strong>
                                        <span class="text-muted">${formatDate(user.createdAt)}</span>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                            
                            <div class="d-grid">
                                <button onclick="openEditModal()" class="btn btn-primary">
                                    <i class="bi bi-pencil"></i> Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function openEditModal() {
    const user = getCurrentUser();
    const modalsContainer = document.getElementById('modals-container');
    
    modalsContainer.innerHTML = `
        <div class="modal fade" id="editModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Profile</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editProfileForm">
                            <div class="mb-3">
                                <label for="editFirstName" class="form-label">First Name</label>
                                <input type="text" class="form-control" id="editFirstName" required value="${user.firstName}">
                            </div>
                            <div class="mb-3">
                                <label for="editLastName" class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="editLastName" required value="${user.lastName}">
                            </div>
                            <div class="mb-3">
                                <label for="editEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="editEmail" required value="${user.email}">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveProfile()">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

function saveProfile() {
    const user = getCurrentUser();
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    
    if (!firstName || !lastName || !email) {
        showToast('Please fill in all fields', 'danger');
        return;
    }
    
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email', 'danger');
        return;
    }
    
    if (email !== user.email) {
        const existing = getByProperty('accounts', 'email', email);
        if (existing) {
            showToast('Email already in use', 'danger');
            return;
        }
    }
    
    updateItem('accounts', user.id, {
        firstName: firstName,
        lastName: lastName,
        email: email
    });
    
    if (email !== user.email) {
        localStorage.setItem('auth_token', email);
    }
    
    showToast('Profile updated successfully!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    renderProfile();
    updateNavigation();
}

// Continue in next part...

function renderRequests() {
    const content = document.getElementById('app-content');
    
    content.innerHTML = `
        <div class="card shadow">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <h4 class="mb-0"><i class="bi bi-clipboard-check"></i> My Requests</h4>
                <button class="btn btn-success" onclick="openNewRequestModal()">
                    <i class="bi bi-plus-circle"></i> New Request
                </button>
            </div>
            <div class="card-body">
                <div id="noRequests" class="text-center py-5" style="display: none">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <h3 class="text-muted mt-3">You have no requests yet.</h3>
                    <button class="btn btn-primary mt-3" onclick="openNewRequestModal()">
                        Create One
                    </button>
                </div>
                <div class="table-responsive" id="requestsTable" style="display: none">
                    <table class="table table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Items</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="requestsBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    loadRequests();
}

let itemCounter = 0;

function loadRequests() {
    const currentUser = getCurrentUser();
    const allRequests = getAll('requests');
    const userRequests = allRequests.filter(req => req.employeeEmail === currentUser.email);

    const noRequestsDiv = document.getElementById('noRequests');
    const requestsTable = document.getElementById('requestsTable');
    const tbody = document.getElementById('requestsBody');

    if (userRequests.length === 0) {
        noRequestsDiv.style.display = 'block';
        requestsTable.style.display = 'none';
        return;
    }

    noRequestsDiv.style.display = 'none';
    requestsTable.style.display = 'block';

    userRequests.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = userRequests.map(req => {
        const statusClass = req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'warning';
        return `
            <tr>
                <td>${formatDate(req.date)}</td>
                <td><strong>${req.type}</strong></td>
                <td>${req.items.length} item(s)</td>
                <td><span class="badge bg-${statusClass}">${req.status}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary" onclick="viewRequest(${req.id})"><i class="bi bi-eye"></i> View</button>
                        ${req.status === 'Pending' ? `<button class="btn btn-danger" onclick="deleteRequest(${req.id})"><i class="bi bi-x-circle"></i> Cancel</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openNewRequestModal() {
    itemCounter = 0;
    const modalsContainer = document.getElementById('modals-container');
    
    modalsContainer.innerHTML = `
        <div class="modal fade" id="requestModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">New Request</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="requestForm">
                            <div class="mb-3">
                                <label class="form-label">Type</label>
                                <select class="form-select" id="requestType" required>
                                    <option value="">Select type...</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Leave">Leave</option>
                                    <option value="Resources">Resources</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Items</label>
                                <div id="itemsList"></div>
                                <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addFormItem()">
                                    <i class="bi bi-plus"></i> Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-success" onclick="submitRequest()">Submit Request</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('requestModal'));
    modal.show();
    addFormItem();
}

function addFormItem() {
    itemCounter++;
    const itemsList = document.getElementById('itemsList');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'input-group mb-2';
    itemDiv.id = `item-${itemCounter}`;
    itemDiv.innerHTML = `
        <input type="text" class="form-control item-name" placeholder="Item name" required>
        <input type="number" class="form-control item-quantity" placeholder="Qty" value="1" min="1" required style="max-width: 100px;">
        <button type="button" class="btn btn-outline-danger" onclick="removeItem('item-${itemCounter}')">
            <i class="bi bi-x"></i>
        </button>
    `;
    itemsList.appendChild(itemDiv);
}

function removeItem(itemId) {
    const itemDiv = document.getElementById(itemId);
    const itemsList = document.getElementById('itemsList');
    if (itemsList.children.length > 1) {
        itemDiv.remove();
    } else {
        showToast('At least one item is required', 'warning');
    }
}

function submitRequest() {
    const type = document.getElementById('requestType').value;
    if (!type) {
        showToast('Please select a request type', 'danger');
        return;
    }

    const itemRows = document.querySelectorAll('#itemsList .input-group');
    const items = [];
    for (let row of itemRows) {
        const name = row.querySelector('.item-name').value.trim();
        const quantity = parseInt(row.querySelector('.item-quantity').value);
        if (!name || !quantity || quantity < 1) {
            showToast('Please fill in all item fields correctly', 'danger');
            return;
        }
        items.push({ name, quantity });
    }

    if (items.length === 0) {
        showToast('Please add at least one item', 'danger');
        return;
    }

    const currentUser = getCurrentUser();
    const newRequest = {
        type: type,
        items: items,
        status: 'Pending',
        employeeEmail: currentUser.email,
        date: new Date().toISOString(),
    };

    addItem('requests', newRequest);
    showToast('Request submitted successfully!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
    loadRequests();
}

function viewRequest(id) {
    const request = getById('requests', id);
    const statusClass = request.status === 'Approved' ? 'success' : request.status === 'Rejected' ? 'danger' : 'warning';
    
    const modalsContainer = document.getElementById('modals-container');
    modalsContainer.innerHTML = `
        <div class="modal fade" id="viewRequestModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Request Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3"><strong>Type:</strong> ${request.type}</div>
                        <div class="mb-3"><strong>Date:</strong> ${formatDate(request.date)}</div>
                        <div class="mb-3"><strong>Status:</strong> <span class="badge bg-${statusClass}">${request.status}</span></div>
                        <div class="mb-3">
                            <strong>Items:</strong>
                            <table class="table table-sm mt-2">
                                <thead><tr><th>Item Name</th><th>Quantity</th></tr></thead>
                                <tbody>
                                    ${request.items.map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td></tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('viewRequestModal'));
    modal.show();
}

function deleteRequest(id) {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    deleteItem('requests', id);
    showToast('Request cancelled successfully', 'success');
    loadRequests();
}

function renderEmployees() {
    const content = document.getElementById('app-content');
    
    content.innerHTML = `
        <div class="card shadow">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <h4 class="mb-0"><i class="bi bi-people"></i> Employees</h4>
                <button class="btn btn-success" onclick="openAddModal('employee')">
                    <i class="bi bi-plus-circle"></i> Add Employee
                </button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Position</th>
                                <th>Department</th>
                                <th>Hire Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="employeesBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    loadEmployees();
}

function loadEmployees() {
    const employees = getAll('employees');
    const accounts = getAll('accounts');
    const departments = getAll('departments');
    const tbody = document.getElementById('employeesBody');
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No employees found</td></tr>';
        return;
    }
    
    tbody.innerHTML = employees.map(emp => {
        const user = accounts.find(a => a.email === emp.userEmail);
        const dept = departments.find(d => d.id === emp.departmentId);
        return `
            <tr>
                <td><strong>${emp.employeeNumber}</strong></td>
                <td>${user ? `${user.firstName} ${user.lastName}` : emp.userEmail}</td>
                <td>${emp.position}</td>
                <td>${dept ? dept.name : 'Unknown'}</td>
                <td>${emp.hireDate ? formatDate(emp.hireDate) : '-'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary" onclick="editEmployee(${emp.id})"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-danger" onclick="deleteEmployee(${emp.id})"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function populateDropdowns() {
    const accounts = getAll('accounts');
    const userEmailSelect = document.getElementById('userEmail');
    userEmailSelect.innerHTML = '<option value="">Select user account...</option>' +
        accounts.map(acc => `<option value="${acc.email}">${acc.firstName} ${acc.lastName} (${acc.email})</option>`).join('');
    
    const departments = getAll('departments');
    const deptSelect = document.getElementById('departmentId');
    deptSelect.innerHTML = '<option value="">Select department...</option>' +
        departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('');
}

function openAddModal(type) {
    if (type === 'employee') {
        const modalsContainer = document.getElementById('modals-container');
        
        modalsContainer.innerHTML = `
            <div class="modal fade" id="employeeModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalTitle">Add Employee</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="employeeForm">
                                <input type="hidden" id="employeeId">
                                <div class="mb-3">
                                    <label class="form-label">Employee ID</label>
                                    <input type="text" class="form-control" id="employeeNumber" required placeholder="e.g., EMP001">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">User Email</label>
                                    <select class="form-select" id="userEmail" required>
                                        <option value="">Select user account...</option>
                                    </select>
                                    <div class="form-text">Must match an existing account</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Position</label>
                                    <input type="text" class="form-control" id="position" required placeholder="e.g., Software Engineer">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Department</label>
                                    <select class="form-select" id="departmentId" required>
                                        <option value="">Select department...</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Hire Date</label>
                                    <input type="date" class="form-control" id="hireDate" required value="${new Date().toISOString().split('T')[0]}">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="saveEmployee()">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        populateDropdowns();
        const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
        modal.show();
    }
}

function editEmployee(id) {
    const emp = getById('employees', id);
    const modalsContainer = document.getElementById('modals-container');
    
    modalsContainer.innerHTML = `
        <div class="modal fade" id="employeeModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Employee</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="employeeForm">
                            <input type="hidden" id="employeeId" value="${emp.id}">
                            <div class="mb-3">
                                <label class="form-label">Employee ID</label>
                                <input type="text" class="form-control" id="employeeNumber" required value="${emp.employeeNumber}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">User Email</label>
                                <select class="form-select" id="userEmail" required>
                                    <option value="">Select user account...</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Position</label>
                                <input type="text" class="form-control" id="position" required value="${emp.position}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Department</label>
                                <select class="form-select" id="departmentId" required>
                                    <option value="">Select department...</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Hire Date</label>
                                <input type="date" class="form-control" id="hireDate" required value="${emp.hireDate}">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveEmployee()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    populateDropdowns();
    document.getElementById('userEmail').value = emp.userEmail;
    document.getElementById('departmentId').value = emp.departmentId;
    
    const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
    modal.show();
}

function saveEmployee() {
    const id = document.getElementById('employeeId').value;
    const employeeNumber = document.getElementById('employeeNumber').value.trim();
    const userEmail = document.getElementById('userEmail').value;
    const position = document.getElementById('position').value.trim();
    const departmentId = parseInt(document.getElementById('departmentId').value);
    const hireDate = document.getElementById('hireDate').value;
    
    if (!employeeNumber || !userEmail || !position || !departmentId || !hireDate) {
        showToast('Please fill in all fields', 'danger');
        return;
    }
    
    const existing = getAll('employees').find(e => 
        e.employeeNumber === employeeNumber && (!id || e.id !== parseInt(id))
    );
    if (existing) {
        showToast('Employee ID already exists', 'danger');
        return;
    }
    
    const user = getByProperty('accounts', 'email', userEmail);
    if (!user) {
        showToast('Selected user account does not exist', 'danger');
        return;
    }
    
    const employeeData = { employeeNumber, userEmail, position, departmentId, hireDate };
    
    if (id) {
        updateItem('employees', id, employeeData);
        showToast('Employee updated successfully!', 'success');
    } else {
        addItem('employees', employeeData);
        showToast('Employee created successfully!', 'success');
    }
    
    bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();
    loadEmployees();
}

function deleteEmployee(id) {
    const emp = getById('employees', id);
    if (!confirm(`Are you sure you want to delete employee ${emp.employeeNumber}?`)) return;
    deleteItem('employees', id);
    showToast('Employee deleted successfully!', 'success');
    loadEmployees();
}

function renderAccounts() {
    const content = document.getElementById('app-content');
    
    content.innerHTML = `
        <div class="card shadow">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <h4 class="mb-0"><i class="bi bi-person-badge"></i> Accounts</h4>
                <button class="btn btn-success" onclick="openAddAccountModal()">
                    <i class="bi bi-plus-circle"></i> Add Account
                </button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Verified</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="accountsBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    loadAccounts();
}

function loadAccounts() {
    const accounts = getAll('accounts');
    const tbody = document.getElementById('accountsBody');
    const currentUser = getCurrentUser();
    
    if (accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No accounts found</td></tr>';
        return;
    }
    
    tbody.innerHTML = accounts.map(account => `
        <tr>
            <td><strong>${account.firstName} ${account.lastName}</strong></td>
            <td>${account.email}</td>
            <td><span class="badge bg-${account.role === 'admin' ? 'primary' : 'success'}">${account.role.charAt(0).toUpperCase() + account.role.slice(1)}</span></td>
            <td>${account.verified ? '<span class="badge bg-success"><i class="bi bi-check"></i></span>' : '<span class="badge bg-warning"><i class="bi bi-x"></i></span>'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-primary" onclick="editAccount(${account.id})"><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn btn-warning" onclick="openResetPasswordModal(${account.id})"><i class="bi bi-key"></i> Reset</button>
                    ${account.id !== currentUser.id ? 
                        `<button class="btn btn-danger" onclick="deleteAccount(${account.id})"><i class="bi bi-trash"></i></button>` : 
                        '<button class="btn btn-outline-secondary" disabled title="Cannot delete yourself"><i class="bi bi-trash"></i></button>'
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddAccountModal() {
    const modalsContainer = document.getElementById('modals-container');
    
    modalsContainer.innerHTML = `
        <div class="modal fade" id="accountModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Account</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="accountForm">
                            <input type="hidden" id="accountId">
                            <div class="mb-3">
                                <label class="form-label">First Name</label>
                                <input type="text" class="form-control" id="firstName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="lastName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" required>
                            </div>
                            <div class="mb-3" id="passwordGroup">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" required minlength="6">
                                <div class="form-text">Minimum 6 characters</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Role</label>
                                <select class="form-select" id="role" required>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="verified">
                                <label class="form-check-label" for="verified">Verified</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveAccount()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
    modal.show();
}

function editAccount(id) {
    const account = getById('accounts', id);
    const modalsContainer = document.getElementById('modals-container');
    
    modalsContainer.innerHTML = `
        <div class="modal fade" id="accountModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Account</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="accountForm">
                            <input type="hidden" id="accountId" value="${account.id}">
                            <div class="mb-3">
                                <label class="form-label">First Name</label>
                                <input type="text" class="form-control" id="firstName" required value="${account.firstName}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="lastName" required value="${account.lastName}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" required value="${account.email}">
                            </div>
                            <div class="mb-3" id="passwordGroup" style="display: none;">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" minlength="6">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Role</label>
                                <select class="form-select" id="role" required>
                                    <option value="user" ${account.role === 'user' ? 'selected' : ''}>User</option>
                                    <option value="admin" ${account.role === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="verified" ${account.verified ? 'checked' : ''}>
                                <label class="form-check-label" for="verified">Verified</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveAccount()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
    modal.show();
}

function saveAccount() {
    const id = document.getElementById('accountId').value;
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const verified = document.getElementById('verified').checked;
    
    if (!firstName || !lastName || !email || !role) {
        showToast('Please fill in all fields', 'danger');
        return;
    }
    
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email', 'danger');
        return;
    }
    
    const existingAccount = getByProperty('accounts', 'email', email);
    if (existingAccount && (!id || existingAccount.id !== parseInt(id))) {
        showToast('Email already exists', 'danger');
        return;
    }
    
    if (id) {
        updateItem('accounts', id, { firstName, lastName, email, role, verified });
        showToast('Account updated successfully!', 'success');
    } else {
        if (!password || password.length < 6) {
            showToast('Password must be at least 6 characters', 'danger');
            return;
        }
        addItem('accounts', { firstName, lastName, email, password, role, verified });
        showToast('Account created successfully!', 'success');
    }
    
    bootstrap.Modal.getInstance(document.getElementById('accountModal')).hide();
    loadAccounts();
}

function openResetPasswordModal(id) {
    const modalsContainer = document.getElementById('modals-container');
    modalsContainer.innerHTML = `
        <div class="modal fade" id="resetPasswordModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Reset Password</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="resetAccountId" value="${id}">
                        <div class="mb-3">
                            <label class="form-label">New Password</label>
                            <input type="password" class="form-control" id="newPassword" required minlength="6">
                            <div class="form-text">Minimum 6 characters</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="resetPassword()">Reset Password</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
    modal.show();
}

function resetPassword() {
    const id = document.getElementById('resetAccountId').value;
    const newPassword = document.getElementById('newPassword').value;
    
    if (!newPassword || newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }
    
    updateItem('accounts', id, { password: newPassword });
    showToast('Password reset successfully!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal')).hide();
}

function deleteAccount(id) {
    const account = getById('accounts', id);
    if (!confirm(`Are you sure you want to delete ${account.firstName} ${account.lastName}?`)) return;
    deleteItem('accounts', id);
    showToast('Account deleted successfully!', 'success');
    loadAccounts();
}

function renderDepartments() {
    const content = document.getElementById('app-content');
    
    content.innerHTML = `
        <div class="card shadow">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <h4 class="mb-0"><i class="bi bi-building"></i> Departments</h4>
                <button class="btn btn-success" onclick="openAddDepartmentModal()">
                    <i class="bi bi-plus-circle"></i> Add Department
                </button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="departmentsBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    loadDepartments();
}

function loadDepartments() {
    const departments = getAll('departments');
    const tbody = document.getElementById('departmentsBody');
    
    if (departments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No departments found</td></tr>';
        return;
    }
    
    tbody.innerHTML = departments.map(dept => `
        <tr>
            <td><strong>${dept.name}</strong></td>
            <td>${dept.description || '-'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-primary" onclick="editDepartment(${dept.id})"><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn btn-danger" onclick="deleteDepartment(${dept.id})"><i class="bi bi-trash"></i> Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddDepartmentModal() {
    const modalsContainer = document.getElementById('modals-container');
    
    modalsContainer.innerHTML = `
        <div class="modal fade" id="departmentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Department</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="departmentForm">
                            <input type="hidden" id="departmentId">
                            <div class="mb-3">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-control" id="name" required placeholder="e.g., Engineering">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="description" rows="3" placeholder="Brief description"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveDepartment()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('departmentModal'));
    modal.show();
}

function editDepartment(id) {
    const dept = getById('departments', id);
    const modalsContainer = document.getElementById('modals-container');
    
    modalsContainer.innerHTML = `
        <div class="modal fade" id="departmentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Department</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="departmentForm">
                            <input type="hidden" id="departmentId" value="${dept.id}">
                            <div class="mb-3">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-control" id="name" required value="${dept.name}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="description" rows="3">${dept.description || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveDepartment()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('departmentModal'));
    modal.show();
}

function saveDepartment() {
    const id = document.getElementById('departmentId').value;
    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    
    if (!name) {
        showToast('Please enter a department name', 'danger');
        return;
    }
    
    const existing = getAll('departments').find(d => 
        d.name.toLowerCase() === name.toLowerCase() && (!id || d.id !== parseInt(id))
    );
    
    if (existing) {
        showToast('Department name already exists', 'danger');
        return;
    }
    
    if (id) {
        updateItem('departments', id, { name, description });
        showToast('Department updated successfully!', 'success');
    } else {
        addItem('departments', { name, description });
        showToast('Department created successfully!', 'success');
    }
    
    bootstrap.Modal.getInstance(document.getElementById('departmentModal')).hide();
    loadDepartments();
}

function deleteDepartment(id) {
    const dept = getById('departments', id);
    const employees = getAll('employees').filter(emp => emp.departmentId === id);
    
    if (employees.length > 0) {
        showToast(`Cannot delete department with ${employees.length} employee(s)`, 'danger');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${dept.name}?`)) return;
    deleteItem('departments', id);
    showToast('Department deleted successfully!', 'success');
    loadDepartments();
}

// ============================================
// Initialize Application
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize database
    initializeDatabase();
    
    // Set up hash routing
    window.addEventListener('hashchange', handleRouting);
    window.addEventListener('load', handleRouting);
    
    // Initial routing
    handleRouting();
});