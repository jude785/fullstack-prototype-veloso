const STORAGE_KEY = 'ipt_demo_v1'; // [cite: 232]
let currentUser = null;
let db = { accounts: [], departments: [], employees: [], requests: [] };

function loadFromStorage() { // [cite: 233]
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        db = JSON.parse(data);
    } else {
        // SEED DEFAULT ADMIN [cite: 236]
        db.accounts = [{ firstName: 'Admin', lastName: 'User', email: 'admin@example.com', password: 'Password123!', role: 'Admin', verified: true }];
        // SEED DEPARTMENTS [cite: 237]
        db.departments = [{ name: 'Engineering', description: 'Software team' }, { name: 'HR', description: 'Human Resources' }];
        saveToStorage();
    }
}
function saveToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } // [cite: 238]
function navigateTo(hash) { window.location.hash = hash; } // [cite: 187]

function handleRouting() { // [cite: 188]
    const hash = window.location.hash || '#/';
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active')); // [cite: 190]
    
    // ROUTE MATCHING [cite: 191]
    if (hash === '#/') document.getElementById('home-page').classList.add('active');
    else if (hash === '#/login') document.getElementById('login-page').classList.add('active');
    else if (hash === '#/register') document.getElementById('register-page').classList.add('active');
    else if (hash === '#/verify-email') document.getElementById('verify-email-page').classList.add('active');
    else if (hash === '#/profile') {
        if (!currentUser) { navigateTo('#/login'); return; } // [cite: 192]
        renderProfile();
        document.getElementById('profile-page').classList.add('active');
    } else if (['#/employees', '#/departments', '#/accounts'].includes(hash)) {
        if (!currentUser || currentUser.role !== 'Admin') { navigateTo('#/'); return; } // [cite: 193]
        if(hash === '#/employees') { renderEmployees(); document.getElementById('employees-page').classList.add('active'); }
        if(hash === '#/departments') { renderDepartments(); document.getElementById('departments-page').classList.add('active'); }
        if(hash === '#/accounts') { renderAccounts(); document.getElementById('accounts-page').classList.add('active'); }
    } else if (hash === '#/requests') {
        if (!currentUser) { navigateTo('#/login'); return; }
        renderRequests();
        document.getElementById('requests-page').classList.add('active');
    }
}

function setAuthState(isAuth, user) { // [cite: 222]
    const body = document.body;
    const dropdownBtn = document.getElementById('userDropdown');
    
    if (isAuth) {
        currentUser = user; // [cite: 223]
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated'); // [cite: 224]
        dropdownBtn.textContent = user.firstName; // [cite: 30]
        if (user.role === 'Admin') body.classList.add('is-admin'); // [cite: 225]
        else body.classList.remove('is-admin');
        document.getElementById('profileName').textContent = `${user.firstName} ${user.lastName}`;
    } else {
        currentUser = null;
        body.classList.add('not-authenticated');
        body.classList.remove('authenticated');
        body.classList.remove('is-admin');
        dropdownBtn.textContent = 'Account';
    }
}

// LOGIN LOGIC [cite: 213]
document.getElementById('loginForm').addEventListener('submit', (e) => { 
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    // [cite: 216] Find account matching email, password, AND verified: true
    const user = db.accounts.find(a => a.email === email && a.password === pass && a.verified);
    if (user) {
        localStorage.setItem('auth_token', email); // [cite: 217]
        setAuthState(true, user); // [cite: 218]
        navigateTo('#/profile'); // [cite: 219]
    } else {
        alert('Invalid credentials or email not verified.\n\nDefault Admin:\nEmail: admin@example.com\nPass: Password123!'); // [cite: 220]
    }
});

// REGISTRATION LOGIC [cite: 200]
document.getElementById('registerForm').addEventListener('submit', (e) => { 
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    if (db.accounts.find(acc => acc.email === email)) { alert('Email exists!'); return; } // [cite: 202]
    
    // [cite: 203] Save with verified: false
    const newAcc = { 
        firstName: document.getElementById('regFirstName').value, 
        lastName: document.getElementById('regLastName').value, 
        email: email, 
        password: document.getElementById('regPassword').value, 
        role: 'User', 
        verified: false 
    };
    db.accounts.push(newAcc);
    saveToStorage();
    localStorage.setItem('unverified_email', email); // [cite: 203]
    navigateTo('#/verify-email'); // [cite: 204]
});

// EMAIL VERIFICATION [cite: 205]
document.getElementById('simulateVerifyBtn').addEventListener('click', () => { 
    const email = localStorage.getItem('unverified_email'); // [cite: 209]
    const acc = db.accounts.find(a => a.email === email);
    if (acc) { 
        acc.verified = true; // [cite: 210]
        saveToStorage(); // [cite: 211]
        alert('Email verified! You may now log in.'); 
        navigateTo('#/login'); // [cite: 212]
    }
});

// LOGOUT [cite: 226]
document.getElementById('logoutBtn').addEventListener('click', (e) => { 
    e.preventDefault(); 
    localStorage.removeItem('auth_token'); // [cite: 227]
    setAuthState(false, null); // [cite: 228]
    navigateTo('#/'); // [cite: 229]
});

// PROFILE [cite: 241]
function renderProfile() { 
    document.getElementById('profileEmail').textContent = currentUser.email; 
    document.getElementById('profileRole').textContent = currentUser.role; 
    // "Edit Profile button... can just show alert" [cite: 245] is handled in HTML onclick
}

// --- ADMIN FEATURES [cite: 247] ---

function renderEmployees() { // [cite: 259]
    const tbody = document.getElementById('employeesTableBody'); tbody.innerHTML = '';
    db.employees.forEach(emp => {
        const linkedUser = db.accounts.find(a => a.email === emp.userEmail);
        tbody.innerHTML += `<tr><td>${emp.id}</td><td>${linkedUser ? linkedUser.firstName : 'Unknown'}</td><td>${emp.position}</td><td>${emp.department}</td><td><button class="btn btn-sm btn-danger" onclick="deleteItem('employees', '${emp.id}')">Delete</button></td></tr>`;
    });
    // Populate dropdown [cite: 265]
    const select = document.getElementById('empDept'); select.innerHTML = '';
    db.departments.forEach(dept => select.innerHTML += `<option value="${dept.name}">${dept.name}</option>`);
}

document.getElementById('employeeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    // Validate User Email [cite: 263]
    if (!db.accounts.find(a => a.email === document.getElementById('empEmail').value)) { alert('User email not found!'); return; }
    
    db.employees.push({ 
        id: document.getElementById('empId').value, 
        userEmail: document.getElementById('empEmail').value, 
        position: document.getElementById('empPosition').value, 
        department: document.getElementById('empDept').value 
    });
    saveToStorage(); bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide(); renderEmployees();
});

function renderDepartments() { // [cite: 255]
    const tbody = document.getElementById('departmentsTableBody'); tbody.innerHTML = '';
    db.departments.forEach(dept => tbody.innerHTML += `<tr><td>${dept.name}</td><td>${dept.description}</td><td><button class="btn btn-sm btn-secondary" onclick="alert('Not implemented')">Edit</button> <button class="btn btn-sm btn-danger">Delete</button></td></tr>`);
}

function renderAccounts() { // [cite: 249]
    const tbody = document.getElementById('accountsTableBody'); tbody.innerHTML = '';
    db.accounts.forEach((acc, index) => {
        // [cite: 250] Actions: Edit, Reset PW, Delete
        tbody.innerHTML += `
            <tr>
                <td>${acc.firstName} ${acc.lastName}</td>
                <td>${acc.email}</td>
                <td>${acc.role}</td>
                <td>${acc.verified?'✅':'❌'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editAccount('${acc.email}')">Edit</button> 
                    <button class="btn btn-sm btn-warning" onclick="resetPassword('${acc.email}')">Reset PW</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem('accounts', ${index})">Delete</button>
                </td>
            </tr>`;
    });
}

function openAccountModal() { // [cite: 251]
    document.getElementById('accountForm').reset();
    document.getElementById('accModalTitle').textContent = 'Add Account';
    document.getElementById('accEmailOriginal').value = ''; 
    document.getElementById('accPasswordDiv').style.display = 'block'; 
    new bootstrap.Modal(document.getElementById('accountModal')).show(); 
}

function editAccount(email) { // [cite: 252] "Edit: pre-fill form"
    const acc = db.accounts.find(a => a.email === email);
    if (!acc) return;
    document.getElementById('accModalTitle').textContent = 'Edit Account';
    document.getElementById('accEmailOriginal').value = acc.email;
    document.getElementById('accFirstName').value = acc.firstName;
    document.getElementById('accLastName').value = acc.lastName;
    document.getElementById('accEmail').value = acc.email;
    document.getElementById('accRole').value = acc.role;
    document.getElementById('accVerified').checked = acc.verified;
    document.getElementById('accPasswordDiv').style.display = 'none'; 
    new bootstrap.Modal(document.getElementById('accountModal')).show();
}

function resetPassword(email) { // [cite: 253] "Reset Password: prompt for new password"
    const newPass = prompt("Enter new password (min 6 chars):");
    if (newPass && newPass.length >= 6) {
        const acc = db.accounts.find(a => a.email === email);
        if (acc) { acc.password = newPass; saveToStorage(); alert("Password updated."); }
    } else if (newPass) { alert("Password too short."); }
}

document.getElementById('accountForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const originalEmail = document.getElementById('accEmailOriginal').value;
    const email = document.getElementById('accEmail').value;
    
    if (originalEmail) { // UPDATE
        const acc = db.accounts.find(a => a.email === originalEmail);
        acc.firstName = document.getElementById('accFirstName').value;
        acc.lastName = document.getElementById('accLastName').value;
        acc.email = email;
        acc.role = document.getElementById('accRole').value;
        acc.verified = document.getElementById('accVerified').checked;
    } else { // CREATE
        if (db.accounts.find(a => a.email === email)) { alert('Email exists!'); return; }
        db.accounts.push({ 
            firstName: document.getElementById('accFirstName').value, 
            lastName: document.getElementById('accLastName').value, 
            email: email, 
            password: document.getElementById('accPassword').value, 
            role: document.getElementById('accRole').value, 
            verified: document.getElementById('accVerified').checked 
        });
    }
    saveToStorage(); bootstrap.Modal.getInstance(document.getElementById('accountModal')).hide(); renderAccounts();
});

// REQUESTS [cite: 270]
function renderRequests() {
    const container = document.getElementById('requestsContainer'); 
    // [cite: 271] "shows only requests where employeeEmail === currentUser.email"
    const myRequests = db.requests.filter(r => r.employeeEmail === currentUser.email); 
    if (myRequests.length === 0) { container.innerHTML = '<p>You have no requests yet.</p>'; return; }
    
    let html = '<table class="table"><thead><tr><th>Date</th><th>Type</th><th>Status</th><th>Items</th></tr></thead><tbody>';
    // [cite: 277] "Display requests... with status badges"
    myRequests.forEach(req => html += `<tr><td>${req.date}</td><td>${req.type}</td><td><span class="badge bg-warning text-dark">${req.status}</span></td><td>${req.items.map(i=>i.qty+'x '+i.name).join(', ')}</td></tr>`);
    container.innerHTML = html + '</tbody></table>';
}

function openRequestModal() { document.getElementById('reqItemsContainer').innerHTML = ''; addRequestItemRow(); new bootstrap.Modal(document.getElementById('requestModal')).show(); }

// [cite: 274] "Dynamic item fields... with + to add more"
function addRequestItemRow() { document.getElementById('reqItemsContainer').innerHTML += `<div class="input-group mb-2"><input type="text" class="form-control" placeholder="Item"><input type="number" class="form-control" placeholder="Qty" value="1" style="max-width:80px;"><button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">x</button></div>`; }

document.getElementById('requestForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const items = []; document.querySelectorAll('#reqItemsContainer .input-group').forEach(row => items.push({ name: row.querySelectorAll('input')[0].value, qty: row.querySelectorAll('input')[1].value }));
    if(items.length === 0) { alert("Add at least one item"); return; } // [cite: 275]
    
    // [cite: 276] Save request
    db.requests.push({ type: document.getElementById('reqType').value, items: items, status: 'Pending', date: new Date().toLocaleDateString(), employeeEmail: currentUser.email });
    saveToStorage(); bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide(); renderRequests();
});

function deleteItem(type, id) {
    if(!confirm('Delete?')) return; //  "confirm"
    
    if(type === 'employees') {
        db.employees = db.employees.filter(e => e.id !== id);
    }
    
    if(type === 'accounts') {
        //  "prevent self-deletion"
        // Note: 'id' here is the index in the array
        const accountToDelete = db.accounts[id];
        if (currentUser && accountToDelete.email === currentUser.email) {
            alert("You cannot delete your own account!");
            return;
        }
        db.accounts.splice(id, 1);
    }
    
    saveToStorage();
    if(type === 'employees') renderEmployees();
    if(type === 'accounts') renderAccounts();
}

window.addEventListener('hashchange', handleRouting); // [cite: 194]
window.addEventListener('load', () => {
    loadFromStorage(); // [cite: 239]
    const token = localStorage.getItem('auth_token');
    if (token) { const user = db.accounts.find(a => a.email === token); if (user) setAuthState(true, user); }
    
    // Force Home Page on Refresh (Best Practice for this prototype)
    window.location.hash = '#/'; 
    handleRouting();
});