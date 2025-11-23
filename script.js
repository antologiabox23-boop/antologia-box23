/**
 * Antología Box23 - Sistema de Gestión
 * Lógica principal de la aplicación
 * Autor: [Tu Nombre]
 * Versión: 2.0 (Clean Code)
 */

'use strict';

// ==========================================
// 1. CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================
const AppState = {
    users: [],
    attendance: [],
    income: [],
    backupConfig: {
        autoBackupInterval: 15 * 60 * 1000, // 15 minutos
        lastBackup: null
    },
    // Simulación de base de datos local
    dbKeys: {
        USERS: 'antologia_users',
        ATTENDANCE: 'antologia_attendance',
        INCOME: 'antologia_income'
    }
};

// ==========================================
// 2. MÓDULO DE UTILIDADES (Helpers)
// ==========================================
const Utils = {
    generateId: () => '_' + Math.random().toString(36).substr(2, 9),
    
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    },

    formatDate: (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    },

    showAlert: (message, type = 'success') => {
        // Podrías implementar SweetAlert2 aquí o usar alertas nativas
        alert(message); 
    },

    saveToLocal: () => {
        localStorage.setItem(AppState.dbKeys.USERS, JSON.stringify(AppState.users));
        localStorage.setItem(AppState.dbKeys.ATTENDANCE, JSON.stringify(AppState.attendance));
        localStorage.setItem(AppState.dbKeys.INCOME, JSON.stringify(AppState.income));
        AppState.backupConfig.lastBackup = new Date();
        Utils.updateDashboardStats(); // Actualizar UI cada vez que se guarda
    },

    loadFromLocal: () => {
        const users = localStorage.getItem(AppState.dbKeys.USERS);
        const attendance = localStorage.getItem(AppState.dbKeys.ATTENDANCE);
        const income = localStorage.getItem(AppState.dbKeys.INCOME);

        if (users) AppState.users = JSON.parse(users);
        if (attendance) AppState.attendance = JSON.parse(attendance);
        if (income) AppState.income = JSON.parse(income);
    },
    
    updateDashboardStats: () => {
        // Actualiza los contadores del Dashboard principal
        document.getElementById('infoUsers').textContent = AppState.users.length;
        document.getElementById('infoAttendance').textContent = AppState.attendance.length;
        document.getElementById('infoIncome').textContent = AppState.income.length;
        
        // Reportes Tab
        document.getElementById('reportTotalUsers').textContent = AppState.users.filter(u => u.status === 'active').length;
    }
};

// ==========================================
// 3. MÓDULO DE USUARIOS
// ==========================================
const UserManager = {
    init: () => {
        // Listener para el formulario de crear usuario
        document.getElementById('userForm').addEventListener('submit', UserManager.handleAddUser);
        // Listener para búsqueda
        document.getElementById('searchUserInput').addEventListener('input', UserManager.renderUsers);
        
        UserManager.renderUsers();
    },

    handleAddUser: (e) => {
        e.preventDefault();
        
        const newUser = {
            id: Utils.generateId(),
            name: document.getElementById('name').value,
            document: document.getElementById('document').value,
            phone: document.getElementById('phone').value,
            birthdate: document.getElementById('birthdate').value,
            eps: document.getElementById('eps').value,
            rh: document.getElementById('rh').value,
            emergencyContact: document.getElementById('emergencyContact').value,
            emergencyPhone: document.getElementById('emergencyPhone').value,
            classTime: document.getElementById('classTime').value,
            affiliationType: document.getElementById('affiliationType').value,
            status: document.getElementById('status').value,
            createdAt: new Date().toISOString()
        };

        // Validación simple de duplicados
        const exists = AppState.users.some(u => u.document === newUser.document);
        if (exists) {
            Utils.showAlert('Ya existe un usuario con este documento', 'error');
            return;
        }

        AppState.users.push(newUser);
        Utils.saveToLocal();
        UserManager.renderUsers();
        document.getElementById('userForm').reset();
        Utils.showAlert('Usuario registrado correctamente');
    },

    renderUsers: () => {
        const tbody = document.getElementById('usersList');
        const searchTerm = document.getElementById('searchUserInput')?.value.toLowerCase() || '';
        
        tbody.innerHTML = '';

        const filteredUsers = AppState.users.filter(user => 
            user.name.toLowerCase().includes(searchTerm) || 
            user.document.includes(searchTerm)
        );

        filteredUsers.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id.substr(0, 6)}...</td>
                <td>${user.name}</td>
                <td>${user.document}</td>
                <td>${user.phone}</td>
                <td><span class="badge bg-info">${user.classTime}</span></td>
                <td>
                    <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                        ${user.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="UserManager.editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="WhatsAppManager.openModal('${user.phone}')">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    editUser: (id) => {
        const user = AppState.users.find(u => u.id === id);
        if (!user) return;
        
        // Lógica para llenar el modal #editUserModal y mostrarlo
        // Aquí deberías usar Bootstrap Modal API
        // const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        // Llenar campos...
        // modal.show();
        console.log("Editando usuario:", user.name);
    }
};

// ==========================================
// 4. MÓDULO DE ASISTENCIA
// ==========================================
const AttendanceManager = {
    init: () => {
        const dateInput = document.getElementById('attendanceDate');
        // Establecer fecha de hoy por defecto
        dateInput.valueAsDate = new Date();
        
        document.getElementById('refreshAttendance').addEventListener('click', AttendanceManager.renderList);
        document.getElementById('saveAttendance').addEventListener('click', AttendanceManager.saveDay);
        
        AttendanceManager.renderList();
    },

    renderList: () => {
        const listContainer = document.getElementById('attendanceUsersList');
        listContainer.innerHTML = '';
        
        // Solo mostrar usuarios activos para tomar lista
        const activeUsers = AppState.users.filter(u => u.status === 'active');
        
        activeUsers.forEach(user => {
            const div = document.createElement('div');
            div.className = 'attendance-user-item';
            div.innerHTML = `
                <div class="attendance-check-container">
                    <input type="checkbox" class="form-check-input attendance-checkbox" 
                           data-user-id="${user.id}" id="att_${user.id}">
                </div>
                <div class="attendance-user-info">
                    <div class="attendance-user-name">${user.name}</div>
                    <div class="attendance-user-details">${user.classTime} - ${user.affiliationType}</div>
                </div>
            `;
            listContainer.appendChild(div);
        });
        
        // Actualizar contadores
        document.getElementById('totalUsersCount').textContent = activeUsers.length;
    },

    saveDay: () => {
        const date = document.getElementById('attendanceDate').value;
        const checkboxes = document.querySelectorAll('.attendance-checkbox:checked');
        
        let count = 0;
        checkboxes.forEach(chk => {
            const userId = chk.getAttribute('data-user-id');
            AppState.attendance.push({
                id: Utils.generateId(),
                userId: userId,
                date: date,
                timestamp: new Date().toISOString()
            });
            count++;
        });

        Utils.saveToLocal();
        Utils.showAlert(`Se registraron ${count} asistencias para el día ${date}`);
        // Limpiar checkboxes
        document.querySelectorAll('.attendance-checkbox').forEach(c => c.checked = false);
    }
};

// ==========================================
// 5. MÓDULO DE PAGOS (INCOME)
// ==========================================
const IncomeManager = {
    init: () => {
        // Llenar select de usuarios en pagos
        IncomeManager.populateUserSelect();
        
        document.getElementById('incomeForm').addEventListener('submit', IncomeManager.handlePayment);
    },

    populateUserSelect: () => {
        const select = document.getElementById('incomeUserSelect');
        select.innerHTML = '<option value="">Seleccionar usuario</option>';
        
        AppState.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (${user.document})`;
            select.appendChild(option);
        });
    },

    handlePayment: (e) => {
        e.preventDefault();
        
        const payment = {
            id: Utils.generateId(),
            userId: document.getElementById('incomeUserSelect').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            amount: parseFloat(document.getElementById('amount').value),
            method: document.getElementById('paymentMethod').value,
            description: document.getElementById('description').value,
            date: new Date().toISOString()
        };

        AppState.income.push(payment);
        Utils.saveToLocal();
        Utils.showAlert('Pago registrado correctamente');
        document.getElementById('incomeForm').reset();
        IncomeManager.renderHistory();
    },

    renderHistory: () => {
        // Lógica para renderizar la tabla #incomeTable (similar a UserManager.renderUsers)
    }
};

// ==========================================
// 6. MÓDULO DE WHATSAPP
// ==========================================
const WhatsAppManager = {
    openModal: (phone) => {
        // Limpiar el número (quitar espacios, guiones, +57)
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('57')) cleanPhone = cleanPhone.substring(2);
        
        document.getElementById('whatsappNumber').value = cleanPhone;
        
        // Abrir modal usando Bootstrap 5
        const modalEl = document.getElementById('whatsappModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
        
        // Configurar botón de envío
        document.getElementById('whatsappLink').onclick = () => {
            const msg = document.getElementById('whatsappMessage').value;
            const finalPhone = document.getElementById('whatsappNumber').value;
            const url = `https://wa.me/57${finalPhone}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        };
    }
};

// ==========================================
// 7. INICIALIZACIÓN PRINCIPAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sistema Antología Box23 Iniciando...');
    
    // 1. Cargar datos
    Utils.loadFromLocal();
    
    // 2. Inicializar Módulos
    UserManager.init();
    AttendanceManager.init();
    IncomeManager.init();
    
    // 3. Inicializar tooltips de Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // 4. Actualizar Dashboard inicial
    Utils.updateDashboardStats();

    // Exponer funciones globales necesarias para onclick en HTML (si las hay)
    window.UserManager = UserManager;
    window.WhatsAppManager = WhatsAppManager;
});