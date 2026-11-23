const loginForm = document.getElementById('loginForm');
const message = document.getElementById('message');
const loginButton = document.getElementById('loginButton');

if (loginForm) {
  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
      message.innerText = 'Please enter email and password.';
      message.style.color = 'red';
      return;
    }

    try {
      if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = 'Signing in...';
      }

      const response = await fetch('http://localhost:5002/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (loginButton) {
          loginButton.disabled = false;
          loginButton.textContent = 'Login';
        }
        message.innerText = data.message || 'Login failed.';
        message.style.color = 'red';
        return;
      }

      message.innerText = 'Login successful. Redirecting...';
      message.style.color = 'green';
      localStorage.setItem('cyberousUser', JSON.stringify(data.user));
      setTimeout(() => {
        window.location.href = 'pages/dashboard.html';
      }, 700);
    } catch (error) {
      if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
      }
      message.innerText = 'Unable to connect to backend server.';
      message.style.color = 'red';
      console.error(error);
    }
  });
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('cyberousUser'));
  } catch (error) {
    return null;
  }
}

function renderDashboard() {
  const dashboardRoot = document.getElementById('dashboardRoot');
  if (!dashboardRoot) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  const searchInput = document.getElementById('dashboardSearch');
  const searchResults = document.getElementById('dashboardSearchResults');
  const themeToggle = document.getElementById('themeToggle');
  const notificationsToggle = document.getElementById('notificationsToggle');
  const notificationsPanel = document.getElementById('notificationsPanel');
  let searchableItems = [];

  const escapeSearchValue = (value) => String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));

  const applyTheme = (darkMode) => {
    document.body.classList.toggle('dark-mode', darkMode);
    if (themeToggle) themeToggle.textContent = darkMode ? '☀' : '◔';
    localStorage.setItem('cyberousDarkMode', String(darkMode));
  };

  applyTheme(localStorage.getItem('cyberousDarkMode') === 'true');
  themeToggle?.addEventListener('click', () => applyTheme(!document.body.classList.contains('dark-mode')));

  const renderSearchResults = (query) => {
    if (!searchResults) return;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      searchResults.hidden = true;
      searchResults.innerHTML = '';
      return;
    }
    const matches = searchableItems.filter((item) => item.searchText.includes(normalizedQuery)).slice(0, 8);
    searchResults.innerHTML = matches.length
      ? matches.map((item) => `<a href="${item.href}"><strong>${escapeSearchValue(item.title)}</strong><small>${escapeSearchValue(item.type)}</small></a>`).join('')
      : '<div class="search-empty">No matching module or data found.</div>';
    searchResults.hidden = false;
  };

  searchInput?.addEventListener('input', () => renderSearchResults(searchInput.value));
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.toolbar-left')) {
      if (searchResults) searchResults.hidden = true;
    }
  });

  notificationsToggle?.addEventListener('click', () => {
    if (notificationsPanel) notificationsPanel.hidden = !notificationsPanel.hidden;
  });

  const fetchDashboard = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/dashboard');
      const data = await res.json();

      if (!res.ok) throw new Error('Failed to fetch dashboard');

      document.getElementById('userName').textContent = user.name;
      document.getElementById('totalProjects').textContent = data.totalProjects;
      document.getElementById('totalTasks').textContent = data.totalTasks;
      document.getElementById('completedTasks').textContent = data.completedTasks;
      document.getElementById('pendingTasks').textContent = data.pendingTasks;

      const projectStatuses = data.projectStatusCounts || { completed: 0, inProgress: 0, notStarted: 0 };
      const projectCount = Math.max(data.totalProjects, 1);
      const completedProjectPercent = Math.round((projectStatuses.completed / projectCount) * 100);
      const inProgressProjectPercent = Math.round((projectStatuses.inProgress / projectCount) * 100);
      const notStartedProjectPercent = Math.max(0, 100 - completedProjectPercent - inProgressProjectPercent);
      const progressRing = document.getElementById('projectProgressRing');
      const progressValue = document.getElementById('projectProgressValue');
      const progressLegend = document.getElementById('projectProgressLegend');

      if (progressRing) {
        progressRing.style.background = `conic-gradient(#3b82f6 0 ${completedProjectPercent}%, #22c55e ${completedProjectPercent}% ${completedProjectPercent + inProgressProjectPercent}%, #38bdf8 ${completedProjectPercent + inProgressProjectPercent}% 100%)`;
      }
      if (progressValue) progressValue.textContent = `${completedProjectPercent}%`;
      if (progressLegend) {
        progressLegend.innerHTML = [
          ['#3b82f6', 'Completed', completedProjectPercent],
          ['#22c55e', 'In Progress', inProgressProjectPercent],
          ['#38bdf8', 'Not Started', notStartedProjectPercent]
        ].map(([color, label, percent]) => `<div class="legend-item"><span class="dot" style="background:${color};"></span>${label} (${percent}%)</div>`).join('');
      }

      const taskStatuses = data.taskStatusCounts || { completed: 0, pending: 0, inProgress: 0 };
      const taskTotal = Math.max(data.totalTasks, 1);
      const taskBars = [
        ['completed', taskStatuses.completed],
        ['pending', taskStatuses.pending],
        ['inprogress', taskStatuses.inProgress]
      ];
      const taskChart = document.getElementById('taskStatusChart');
      if (taskChart) {
        taskChart.innerHTML = taskBars.map(([className, count]) => `
          <div class="bar-group" title="${className}: ${count}">
            <div class="bar ${className}" style="height:${Math.max(8, Math.round((count / taskTotal) * 100))}%;"></div>
          </div>
        `).join('');
      }

      const dashboardDate = document.getElementById('dashboardDate');
      if (dashboardDate) {
        dashboardDate.textContent = `📅 ${new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}`;
      }

      const notificationItems = [...(data.notifications || []), ...(data.recentActivities || []).slice(0, 3)];
      const notificationCount = document.getElementById('notificationCount');
      if (notificationCount) notificationCount.textContent = notificationItems.length;
      if (notificationsPanel) {
        notificationsPanel.innerHTML = notificationItems.length
          ? notificationItems.slice(0, 6).map((item) => `<div><strong>${escapeSearchValue(item.message || item.text)}</strong><small>${escapeSearchValue(item.time || 'Recent')}</small></div>`).join('')
          : '<div class="search-empty">No new notifications.</div>';
      }

      const [projectsResponse, tasksResponse, employeesResponse, clientsResponse] = await Promise.all([
        fetch('http://localhost:5002/api/projects'),
        fetch('http://localhost:5002/api/tasks'),
        fetch('http://localhost:5002/api/employees'),
        fetch('http://localhost:5002/api/clients')
      ]);
      const [projects, tasks, employees, clients] = await Promise.all([
        projectsResponse.json(), tasksResponse.json(), employeesResponse.json(), clientsResponse.json()
      ]);
      searchableItems = [
        ['Dashboard', 'Module', 'dashboard.html'], ['Projects', 'Module', 'projects.html'],
        ['Tasks', 'Module', 'tasks.html'], ['Client Requests', 'Module', 'client-requests.html'],
        ['Employees', 'Module', 'employees.html'], ['Reports', 'Module', 'reports.html'],
        ['Calendar', 'Module', 'calendar.html'], ['Messages', 'Module', 'messages.html'],
        ['Settings', 'Module', 'settings.html'],
        ...projects.map((item) => ({ title: item.projectName, type: 'Project', href: 'projects.html', searchText: `${item.projectName} ${item.clientName || ''}`.toLowerCase() })),
        ...tasks.map((item) => ({ title: item.title, type: 'Task', href: 'tasks.html', searchText: `${item.title} ${item.assignee || ''} ${item.status || ''}`.toLowerCase() })),
        ...employees.map((item) => ({ title: item.name, type: 'Employee', href: 'employees.html', searchText: `${item.name} ${item.email || ''} ${item.role || ''}`.toLowerCase() })),
        ...clients.map((item) => ({ title: item.name || item.company, type: 'Client', href: 'client-requests.html', searchText: `${item.name || ''} ${item.company || ''} ${item.email || ''}`.toLowerCase() }))
      ].map((item) => Array.isArray(item)
        ? { title: item[0], type: item[1], href: item[2], searchText: item[0].toLowerCase() }
        : item);

      const projectRows = data.recentProjects.map((project) => `
        <tr>
          <td>${project.projectName}</td>
          <td>${project.clientName || 'N/A'}</td>
          <td>${project.manager || 'N/A'}</td>
          <td>${project.startDate || '-'}</td>
          <td>${project.deadline || '-'}</td>
          <td>
            <select class="status-select project-status-select" data-project-id="${project.id}" aria-label="Update project status">
              <option value="Not Started" ${project.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
              <option value="In Progress" ${project.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </td>
          <td>${project.progress}%</td>
        </tr>
      `).join('');

      document.getElementById('projectTableBody').innerHTML = projectRows;

      const activityList = data.recentActivities.map((item) => `
        <li>${item.text} <span>${item.time}</span></li>
      `).join('');

      document.getElementById('activityList').innerHTML = activityList;

      document.querySelectorAll('.project-status-select').forEach((select) => {
        select.addEventListener('change', async () => {
          const response = await fetch(`http://localhost:5002/api/projects/${select.dataset.projectId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: select.value })
          });
          if (!response.ok) {
            alert('Unable to update project status.');
            return;
          }
          fetchDashboard();
        });
      });
    } catch (error) {
      console.error(error);
    }
  };

  fetchDashboard();
}

function renderEmployeesPage() {
  const tableBody = document.getElementById('employeeTableBody');
  if (!tableBody) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  document.getElementById('employeeUserName').textContent = user.name;

  const form = document.getElementById('employeeForm');
  const formBox = document.getElementById('employeeFormBox');
  const toggleButton = document.getElementById('toggleEmployeeForm');
  const cancelButton = document.getElementById('cancelEmployeeForm');
  const formTitle = document.getElementById('employeeFormTitle');
  const photoInput = document.getElementById('employeePhotoInput');
  const actionsMenu = document.getElementById('employeeActionsMenu');
  let selectedPhotoEmployeeId = null;
  let activeEmployeeId = null;

  const positionActionsMenu = (button) => {
    if (!button || !actionsMenu || actionsMenu.hidden) return;
    const buttonRect = button.getBoundingClientRect();
    const menuWidth = actionsMenu.offsetWidth || 120;
    const menuHeight = actionsMenu.offsetHeight;
    const left = Math.min(
      Math.max(8, buttonRect.right - menuWidth),
      window.innerWidth - menuWidth - 8
    );
    const belowTop = buttonRect.bottom + 4;
    const top = belowTop + menuHeight <= window.innerHeight
      ? belowTop
      : Math.max(8, buttonRect.top - menuHeight - 4);

    actionsMenu.style.left = `${left}px`;
    actionsMenu.style.top = `${top}px`;
  };

  const hideForm = () => {
    if (formBox) formBox.hidden = true;
    if (form) {
      form.reset();
      delete form.dataset.employeeId;
      form.dataset.mode = 'create';
    }
    if (formTitle) formTitle.textContent = 'Add Employee';
  };

  const showForm = (employee = null) => {
    if (!formBox) return;
    if (employee) {
      form.dataset.mode = 'edit';
      form.dataset.employeeId = employee.id;
      formTitle.textContent = 'Update Employee';
      document.getElementById('employeeName').value = employee.name || '';
      document.getElementById('employeeEmail').value = employee.email || '';
      document.getElementById('employeeDepartment').value = employee.department || '';
      document.getElementById('employeeRole').value = employee.role || '';
      document.getElementById('employeeStatus').value = employee.status || 'Active';
    } else {
      form.dataset.mode = 'create';
      delete form.dataset.employeeId;
      formTitle.textContent = 'Add Employee';
      form.reset();
    }
    formBox.hidden = false;
  };

  if (toggleButton) {
    toggleButton.addEventListener('click', () => showForm());
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', hideForm);
  }

  const searchInput = document.querySelector('.search-box input');
  const renderRows = (data) => {
    tableBody.innerHTML = data.map((emp, index) => {
      const initials = emp.name
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');

      const displayId = Number(emp.id) || index + 1;
      const statusClass = String(emp.status || 'Active').toLowerCase() === 'active' ? 'completed' : 'not-started';
      const photoUrl = emp.photo ? `http://localhost:5002${emp.photo}` : '';
      const employeePhoto = photoUrl
        ? `<img class="employee-avatar" src="${photoUrl}" alt="${emp.name} photo" />`
        : `<span class="employee-avatar">${initials}</span>`;

      return `
        <tr>
          <td>${displayId}</td>
          <td>
            <div class="employee-name-cell">
              ${employeePhoto}
              <span>${emp.name}</span>
            </div>
          </td>
          <td>${emp.email}</td>
          <td><span class="cell-tag dept-${(emp.department || 'Development').toLowerCase().replace(/\s+/g, '-')}">${emp.department}</span></td>
          <td>${emp.role}</td>
          <td><span class="badge ${statusClass}">${emp.status || 'Active'}</span></td>
          <td>
            <button class="table-action actions-toggle" type="button" data-action="open-actions" data-id="${emp.id}" data-photo="${photoUrl}">Actions</button>
          </td>
        </tr>
      `;
    }).join('');
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/employees');
      const data = await res.json();
      renderRows(data);

      if (searchInput) {
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
          renderRows(data.filter((emp) =>
            [emp.name, emp.email, emp.department, emp.role, emp.status]
              .join(' ')
              .includes(query)
          ));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', async () => {
      const res = await fetch('http://localhost:5002/api/employees');
      const data = await res.json();
      const query = searchInput.value.trim().toLowerCase();
      renderRows(query
        ? data.filter((emp) => [emp.name, emp.email, emp.department, emp.role, emp.status]
            .join(' ')
            .toLowerCase()
            .includes(query))
        : data);
    });
  }

  tableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    if (button.dataset.action === 'open-actions') {
      if (!actionsMenu.hidden && activeEmployeeId === Number(button.dataset.id)) {
        actionsMenu.hidden = true;
        activeEmployeeId = null;
        return;
      }

      activeEmployeeId = Number(button.dataset.id);
      actionsMenu.querySelectorAll('[data-action]').forEach((actionButton) => {
        actionButton.dataset.id = button.dataset.id;
        actionButton.dataset.photo = button.dataset.photo || '';
      });
      actionsMenu.hidden = false;
      positionActionsMenu(button);
      return;
    }
  });

  document.addEventListener('click', (event) => {
    if (actionsMenu.hidden || event.target.closest('#employeeActionsMenu, [data-action="open-actions"]')) return;
    actionsMenu.hidden = true;
    activeEmployeeId = null;
  });

  actionsMenu.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const employeeId = activeEmployeeId;
    actionsMenu.hidden = true;

    if (button.dataset.action === 'view') {
      if (button.dataset.photo) {
        window.open(button.dataset.photo, '_blank', 'noopener,noreferrer');
      } else {
        alert('This employee does not have a photo yet.');
      }
      return;
    }

    if (button.dataset.action === 'upload') {
      selectedPhotoEmployeeId = employeeId;
      photoInput?.click();
      return;
    }

    if (button.dataset.action === 'edit') {
      const res = await fetch('http://localhost:5002/api/employees');
      const data = await res.json();
      const employeeToEdit = data.find((emp) => emp.id === employeeId);
      if (employeeToEdit) showForm(employeeToEdit);
      return;
    }

    if (button.dataset.action === 'delete') {
      const confirmDelete = window.confirm('Delete this employee?');
      if (!confirmDelete) return;

      const res = await fetch(`http://localhost:5002/api/employees/${employeeId}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (res.ok) {
        fetchEmployees();
      } else {
        alert(result.message || 'Unable to delete employee.');
      }
      return;
    }
  });

  window.addEventListener('resize', () => {
    const activeButton = tableBody.querySelector(`[data-action="open-actions"][data-id="${activeEmployeeId}"]`);
    positionActionsMenu(activeButton);
  });
  window.addEventListener('scroll', () => {
    const activeButton = tableBody.querySelector(`[data-action="open-actions"][data-id="${activeEmployeeId}"]`);
    positionActionsMenu(activeButton);
  }, true);

  fetchEmployees();

  if (photoInput) {
    photoInput.addEventListener('change', async () => {
      const file = photoInput.files[0];
      if (!file || !selectedPhotoEmployeeId) return;
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        photoInput.value = '';
        return;
      }

      const formData = new FormData();
      formData.append('photo', file);
      try {
        const res = await fetch(`http://localhost:5002/api/employees/${selectedPhotoEmployeeId}/photo`, {
          method: 'POST',
          body: formData
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Unable to upload photo.');
        await fetchEmployees();
      } catch (error) {
        alert(error.message);
      } finally {
        photoInput.value = '';
        selectedPhotoEmployeeId = null;
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        name: document.getElementById('employeeName').value,
        email: document.getElementById('employeeEmail').value,
        department: document.getElementById('employeeDepartment').value,
        role: document.getElementById('employeeRole').value,
        status: document.getElementById('employeeStatus').value
      };

      const mode = form.dataset.mode || 'create';
      const employeeId = form.dataset.employeeId;
      const url = mode === 'edit' && employeeId ? `http://localhost:5002/api/employees/${employeeId}` : 'http://localhost:5002/api/employees';
      const method = mode === 'edit' && employeeId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok) {
        hideForm();
        fetchEmployees();
      } else {
        alert(result.message || 'Unable to save employee.');
      }
    });
  }
}

function renderProjectsPage() {
  const tableBody = document.getElementById('projectsBody');
  if (!tableBody) return;

  const projectViewPanel = document.getElementById('projectViewPanel');
  const projectViewDetails = document.getElementById('projectViewDetails');
  const closeProjectView = document.getElementById('closeProjectView');
  const escapeProjectValue = (value) => String(value || '-').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));

  if (closeProjectView) {
    closeProjectView.addEventListener('click', () => {
      projectViewPanel.hidden = true;
    });
  }

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  document.getElementById('projectsUserName').textContent = user.name;

  const populateProjectOptions = async () => {
    const clientSelect = document.getElementById('projectClient');
    const managerSelect = document.getElementById('projectManager');
    const projectNameInput = document.getElementById('projectName');
    if (!clientSelect || !managerSelect) return;

    try {
      const [requestsResponse, employeesResponse] = await Promise.all([
        fetch('http://localhost:5002/api/client-requests'),
        fetch('http://localhost:5002/api/employees')
      ]);
      if (!requestsResponse.ok || !employeesResponse.ok) {
        throw new Error('Unable to load current clients and employees.');
      }
      const requests = await requestsResponse.json();
      const employees = await employeesResponse.json();
      const requestByClient = new Map();
      const requestClientKeys = new Set();

      clientSelect.innerHTML = '<option value="">Select Client</option>';
      const requestClients = [];
      (Array.isArray(requests) ? requests : []).forEach((request) => {
        if (request.status !== 'Approved') return;
        const clientName = String(request.company || request.clientName || '').trim();
        const clientKey = clientName.toLowerCase();
        if (clientName && !requestClientKeys.has(clientKey)) {
          requestClients.push(clientName);
          requestClientKeys.add(clientKey);
          requestByClient.set(clientName, request);
        }
      });
      requestClients.forEach((clientName) => {
        const option = document.createElement('option');
        option.value = clientName;
        option.textContent = clientName;
        clientSelect.appendChild(option);
      });

      clientSelect.onchange = () => {
        const request = requestByClient.get(clientSelect.value);
        if (!request || !projectNameInput) return;
        const projectType = request.projectType || 'Website Development';
        projectNameInput.value = `${projectType} - ${request.company || request.clientName}`;
      };

      clientSelect.onfocus = populateProjectOptions;

      managerSelect.innerHTML = '<option value="">Select Manager</option>';
      (Array.isArray(employees) ? employees : [])
        .filter((employee) => employee.status !== 'Inactive')
        .forEach((employee) => {
          const option = document.createElement('option');
          option.value = employee.name;
          option.textContent = employee.name;
          managerSelect.appendChild(option);
        });
    } catch (error) {
      console.error('Unable to load project clients and managers.', error);
    }
  };

  populateProjectOptions();

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/projects');
      const data = await res.json();
      tableBody.innerHTML = data.map((project) => `
        <tr>
          <td>${project.id}</td>
          <td>${project.projectName}</td>
          <td>${project.clientName}</td>
          <td>${project.manager}</td>
          <td>${project.startDate}</td>
          <td>${project.deadline}</td>
          <td>
            <select class="status-select project-status-select" data-project-id="${project.id}" aria-label="Update project status">
              <option value="Not Started" ${project.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
              <option value="In Progress" ${project.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </td>
          <td>
            <div class="request-actions">
              <button type="button" class="small-btn project-view-btn" data-project-id="${project.id}">View</button>
              <button type="button" class="small-btn delete-btn project-delete-btn" data-project-id="${project.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');

      tableBody.querySelectorAll('.project-view-btn').forEach((button) => {
        button.addEventListener('click', () => {
          const project = data.find((item) => item.id === Number(button.dataset.projectId));
          if (!project) return;
          projectViewDetails.innerHTML = `
            <div><strong>Project ID</strong><span>${escapeProjectValue(project.id)}</span></div>
            <div><strong>Project Name</strong><span>${escapeProjectValue(project.projectName)}</span></div>
            <div><strong>Client</strong><span>${escapeProjectValue(project.clientName)}</span></div>
            <div><strong>Manager</strong><span>${escapeProjectValue(project.manager)}</span></div>
            <div><strong>Start Date</strong><span>${escapeProjectValue(project.startDate)}</span></div>
            <div><strong>Deadline</strong><span>${escapeProjectValue(project.deadline)}</span></div>
            <div><strong>Status</strong><span>${escapeProjectValue(project.status)}</span></div>
            <div><strong>Progress</strong><span>${escapeProjectValue(project.progress)}%</span></div>
            <div class="request-view-full"><strong>Description</strong><span>${escapeProjectValue(project.description)}</span></div>
          `;
          projectViewPanel.hidden = false;
          projectViewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      tableBody.querySelectorAll('.project-status-select').forEach((select) => {
        select.addEventListener('change', async () => {
          try {
            const response = await fetch(`http://localhost:5002/api/projects/${select.dataset.projectId}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: select.value })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Unable to update project status.');
            fetchProjects();
          } catch (error) {
            console.error(error);
            alert(error.message || 'Unable to update project status.');
            fetchProjects();
          }
        });
      });

      tableBody.querySelectorAll('.project-delete-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          if (!window.confirm('Delete this project and its matching client request?')) return;
          try {
            const response = await fetch(`http://localhost:5002/api/projects/${button.dataset.projectId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Unable to delete project.');
            fetchProjects();
          } catch (error) {
            console.error(error);
            alert(error.message || 'Unable to delete project.');
          }
        });
      });
    } catch (error) {
      console.error(error);
    }
  };

  fetchProjects();

  const form = document.getElementById('projectForm');
  const projectFormCard = document.getElementById('projectFormCard');
  const closeProjectForm = document.getElementById('closeProjectForm');
  if (closeProjectForm && projectFormCard) {
    closeProjectForm.addEventListener('click', () => {
      form.reset();
      projectFormCard.hidden = true;
    });
  }
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        projectName: document.getElementById('projectName').value,
        clientName: document.getElementById('projectClient').value,
        manager: document.getElementById('projectManager').value,
        startDate: document.getElementById('startDate').value,
        deadline: document.getElementById('deadline').value,
        description: document.getElementById('projectDescription').value,
        status: document.getElementById('projectStatus').value,
        progress: 0
      };

      const res = await fetch('http://localhost:5002/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok) {
        form.reset();
        fetchProjects();
      } else {
        alert(result.message || 'Unable to add project.');
      }
    });
  }
}

const formatStatusMeta = (statusHistory = [], currentStatus = 'Pending') => {
  const history = Array.isArray(statusHistory) && statusHistory.length ? statusHistory : [{ status: currentStatus, changedAt: new Date().toISOString() }];
  const entries = history
    .map((item) => `${item.status} (${new Date(item.changedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})`)
    .join(' • ');

  return `<span class="status-badge-info" title="Status history: ${entries}">${currentStatus}</span>`;
};

function renderClientRequestsPage() {
  const tableBody = document.getElementById('requestsBody');
  if (!tableBody) return;

  const requestViewPanel = document.getElementById('requestViewPanel');
  const requestViewDetails = document.getElementById('requestViewDetails');
  const closeRequestView = document.getElementById('closeRequestView');
  const escapeRequestValue = (value) => String(value || '-').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));

  if (closeRequestView) {
    closeRequestView.addEventListener('click', () => {
      requestViewPanel.hidden = true;
    });
  }

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  const username = document.getElementById('requestsUserName');
  if (username) username.textContent = user.name;

  const fetchRequests = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/client-requests');
      const data = await res.json();
      tableBody.innerHTML = data.map((request) => {
        const status = request.status || 'Pending';
        const badgeClass = status.toLowerCase().replace(/\s+/g, '-');
        const statusText = status === 'In Progress' ? 'In Progress' : status;
        return `
        <tr>
          <td>${request.id}</td>
          <td>${request.clientName}</td>
          <td>${request.email || '-'}</td>
          <td>${request.phone || '-'}</td>
          <td>${request.websiteNeed || '-'}</td>
          <td>${request.projectType || 'Website Development'}</td>
          <td>${request.budget || '-'}</td>
          <td><span class="status-pill ${badgeClass}">${statusText}</span></td>
          <td>
            <select class="status-select" data-request-id="${request.id}" aria-label="Update client request status">
              <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Approved" ${status === 'Approved' ? 'selected' : ''}>Approved</option>
            </select>
            <div class="request-actions">
              <button type="button" class="small-btn request-view-btn" data-request-id="${request.id}">View</button>
              <button type="button" class="small-btn delete-btn request-delete-btn" data-request-id="${request.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
      }).join('');

      const statusSelects = tableBody.querySelectorAll('.status-select');
      statusSelects.forEach((select) => {
        select.addEventListener('change', async () => {
          const id = select.getAttribute('data-request-id');
          const nextStatus = select.value;

          try {
            const requestRes = await fetch(`http://localhost:5002/api/client-requests/${id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: nextStatus })
            });
            const requestResult = await requestRes.json();

            if (requestRes.ok) {
              fetchRequests();
              renderClientsPage();
            } else {
              alert(requestResult.message || 'Unable to update request status.');
            }
          } catch (error) {
            console.error(error);
            alert('Unable to update request status.');
          }
        });
      });

      tableBody.querySelectorAll('.request-view-btn').forEach((button) => {
        button.addEventListener('click', () => {
          const request = data.find((item) => item.id === Number(button.dataset.requestId));
          if (!request) return;
          const history = (request.statusHistory || []).map((item) => `<li><strong>${escapeRequestValue(item.status)}</strong> - ${escapeRequestValue(new Date(item.changedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))}</li>`).join('') || '<li>No status history</li>';
          requestViewDetails.innerHTML = `
            <div><strong>Request ID</strong><span>${escapeRequestValue(request.id)}</span></div>
            <div><strong>Client Name</strong><span>${escapeRequestValue(request.clientName)}</span></div>
            <div><strong>Company</strong><span>${escapeRequestValue(request.company)}</span></div>
            <div><strong>Email</strong><span>${escapeRequestValue(request.email)}</span></div>
            <div><strong>Phone</strong><span>${escapeRequestValue(request.phone)}</span></div>
            <div><strong>Address</strong><span>${escapeRequestValue(request.address)}</span></div>
            <div><strong>Project Type</strong><span>${escapeRequestValue(request.projectType || 'Website Development')}</span></div>
            <div><strong>Website Requirement</strong><span>${escapeRequestValue(request.websiteNeed)}</span></div>
            <div><strong>Budget</strong><span>${escapeRequestValue(request.budget)}</span></div>
            <div><strong>Priority</strong><span>${escapeRequestValue(request.priority || 'Medium')}</span></div>
            <div><strong>Current Status</strong><span>${escapeRequestValue(request.status || 'Pending')}</span></div>
            <div><strong>Submitted Date</strong><span>${escapeRequestValue(request.requestDate)}</span></div>
            <div><strong>Approved Date</strong><span>${escapeRequestValue(request.approvedAt ? new Date(request.approvedAt).toLocaleDateString('en-GB') : '-')}</span></div>
            <div><strong>Completed Date</strong><span>${escapeRequestValue(request.completedAt ? new Date(request.completedAt).toLocaleDateString('en-GB') : '-')}</span></div>
            <div class="request-view-full"><strong>Notes</strong><span>${escapeRequestValue(request.notes)}</span></div>
            <div class="request-view-full"><strong>Status History</strong><ul>${history}</ul></div>
          `;
          requestViewPanel.hidden = false;
          requestViewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      tableBody.querySelectorAll('.request-delete-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          if (!window.confirm('Delete this client request? The client will be notified.')) return;
          try {
            const response = await fetch(`http://localhost:5002/api/client-requests/${button.dataset.requestId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Unable to delete client request.');
            fetchRequests();
          } catch (error) {
            console.error(error);
            alert(error.message || 'Unable to delete client request.');
          }
        });
      });
    } catch (error) {
      console.error(error);
    }
  };

  fetchRequests();
}

function renderReportsPage() {
  const root = document.getElementById('reportsRoot');
  if (!root) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  const userName = document.getElementById('reportsUserName');
  if (userName) userName.textContent = user.name;

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/reports');
      const data = await res.json();

      const statsContainer = document.getElementById('reportsStats');
      if (statsContainer) {
        statsContainer.innerHTML = data.stats.map((stat) => `
          <div class="stat-card">
            <div class="stat-label">${stat.label}</div>
            <div class="stat-value">${stat.value}</div>
            <div class="stat-trend">${stat.trend}</div>
          </div>
        `).join('');
      }

      const summaryCards = document.getElementById('summaryCards');
      if (summaryCards) {
        summaryCards.innerHTML = `
          <div class="summary-block">
            <span>Total Reports</span>
            <strong>${data.summary.totalReports}</strong>
          </div>
          <div class="summary-block">
            <span>On Track</span>
            <strong>${data.summary.onTrackReports}</strong>
          </div>
          <div class="summary-block">
            <span>In Review</span>
            <strong>${data.summary.reviewReports}</strong>
          </div>
          <div class="summary-block critical">
            <span>Critical</span>
            <strong>${data.summary.criticalReports}</strong>
          </div>
        `;
      }

      const tableBody = document.getElementById('reportsTableBody');
      if (tableBody) {
        tableBody.innerHTML = data.reports.map((report) => `
          <tr>
            <td>${report.id}</td>
            <td>${report.name}</td>
            <td>${report.category}</td>
            <td><span class="badge ${report.status.toLowerCase().replace(/\s+/g, '-')}">${report.status}</span></td>
            <td>${report.generatedOn}</td>
            <td>${report.owner}</td>
          </tr>
        `).join('');
      }
    } catch (error) {
      console.error(error);
    }
  };

  fetchReports();
}

function renderTasksPage() {
  const tableBody = document.getElementById('tasksTableBody');
  if (!tableBody) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  const userName = document.getElementById('tasksUserName');
  if (userName) userName.textContent = user.name;
  const form = document.getElementById('taskFormData');
  const formPanel = document.getElementById('taskForm');
  const openFormButton = document.getElementById('openTaskForm');
  const closeFormButton = document.getElementById('closeTaskForm');
  const formTitle = document.getElementById('taskFormTitle');
  const submitButton = document.getElementById('submitTaskButton');

  const openTaskForm = () => {
    if (formPanel) formPanel.hidden = false;
    formPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetTaskForm = () => {
    form?.reset();
    if (form) {
      form.dataset.mode = 'create';
      delete form.dataset.taskId;
    }
    if (formTitle) formTitle.textContent = 'Add Task';
    if (submitButton) submitButton.textContent = 'Add Task';
    if (formPanel) formPanel.hidden = true;
  };

  const fillTaskForm = (task) => {
    if (!form) return;
    form.dataset.mode = 'edit';
    form.dataset.taskId = task.id;
    document.getElementById('taskTitle').value = task.title || '';
    document.getElementById('taskPriority').value = task.priority || 'Medium';
    document.getElementById('taskStatus').value = task.status || 'Pending';
    document.getElementById('taskAssignee').value = task.assignee || '';
    if (formTitle) formTitle.textContent = 'Update Task';
    if (submitButton) submitButton.textContent = 'Update Task';
    openTaskForm();
  };

  openFormButton?.addEventListener('click', () => {
    resetTaskForm();
    openTaskForm();
  });
  closeFormButton?.addEventListener('click', resetTaskForm);

  const fetchTasks = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/tasks');
      const data = await res.json();
      tableBody.innerHTML = data.map((task) => `
        <tr>
          <td>${task.id}</td>
          <td>${task.title}</td>
          <td><span class="badge ${task.priority.toLowerCase()}">${task.priority}</span></td>
          <td><span class="badge ${task.status.toLowerCase().replace(/\s+/g, '-')}">${task.status}</span></td>
          <td>${task.assignee}</td>
          <td class="task-actions">
            <button class="table-action task-edit" type="button" data-task-action="edit" data-id="${task.id}">Update</button>
            <button class="table-action task-delete" type="button" data-task-action="delete" data-id="${task.id}">Delete</button>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error(error);
    }
  };

  fetchTasks();

  tableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-task-action]');
    if (!button) return;
    const taskId = Number(button.dataset.id);

    if (button.dataset.taskAction === 'edit') {
      const res = await fetch('http://localhost:5002/api/tasks');
      const tasks = await res.json();
      const task = tasks.find((item) => Number(item.id) === taskId);
      if (task) fillTaskForm(task);
      return;
    }

    if (button.dataset.taskAction === 'delete') {
      if (!window.confirm('Delete this task?')) return;
      const res = await fetch(`http://localhost:5002/api/tasks/${taskId}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        await fetchTasks();
        if (Number(form?.dataset.taskId) === taskId) resetTaskForm();
      } else {
        alert(result.message || 'Unable to delete task.');
      }
    }
  });

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        title: document.getElementById('taskTitle').value,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        assignee: document.getElementById('taskAssignee').value
      };

      const taskId = form.dataset.taskId;
      const isEdit = form.dataset.mode === 'edit' && taskId;
      const res = await fetch(isEdit ? `http://localhost:5002/api/tasks/${taskId}` : 'http://localhost:5002/api/tasks', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok) {
        resetTaskForm();
        await fetchTasks();
      } else {
        alert(result.message || 'Unable to add task.');
      }
    });
  }
}

function renderClientsPage() {
  const tableBody = document.getElementById('clientsTableBody');
  if (!tableBody) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  const userName = document.getElementById('clientsUserName');
  if (userName) userName.textContent = user.name;

  const fetchClients = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/clients');
      const data = await res.json();
      tableBody.innerHTML = data.map((client) => {
        const status = client.status || 'Pending';
        const statusHtml = formatStatusMeta(client.statusHistory, status);
        return `
        <tr>
          <td>${client.id}</td>
          <td>${client.name}</td>
          <td>${client.company || client.name}</td>
          <td>${client.email || '-'}</td>
          <td>${client.phone || '-'}</td>
          <td>${client.address || '-'}</td>
          <td>${client.projectType || '-'}</td>
          <td>${client.websiteNeed || '-'}</td>
          <td>${client.budget || '-'}</td>
          <td>${client.notes || '-'}</td>
          <td>
            ${statusHtml}
            <div class="status-history-mini">${(client.statusHistory || []).map((item) => `${item.status}: ${new Date(item.changedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`).join(' • ')}</div>
          </td>
          <td>
            <select class="status-select client-status-select" data-client-id="${client.id}" aria-label="Update client status">
              <option value="Not Started" ${status === 'Not Started' ? 'selected' : ''}>Not Started</option>
              <option value="In Progress" ${status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Approved" ${status === 'Approved' ? 'selected' : ''}>Approved</option>
            </select>
          </td>
        </tr>
      `;
      }).join('');

      const clientStatusSelects = tableBody.querySelectorAll('.client-status-select');
      clientStatusSelects.forEach((select) => {
        select.addEventListener('change', async () => {
          const id = select.getAttribute('data-client-id');
          const nextStatus = select.value;

          try {
            const clientRes = await fetch(`http://localhost:5002/api/clients/${id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: nextStatus })
            });
            const clientResult = await clientRes.json();

            if (clientRes.ok) {
              fetchClients();
              renderClientRequestsPage();
            } else {
              alert(clientResult.message || 'Unable to update client status.');
            }
          } catch (error) {
            console.error(error);
            alert('Unable to update client status.');
          }
        });
      });
    } catch (error) {
      console.error(error);
    }
  };

  fetchClients();

  const form = document.getElementById('clientFormData');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        name: document.getElementById('clientName').value,
        company: document.getElementById('clientCompany').value,
        phone: document.getElementById('clientPhone').value,
        email: document.getElementById('clientEmail').value,
        address: document.getElementById('clientAddress').value,
        budget: document.getElementById('clientBudget').value,
        websiteNeed: document.getElementById('websiteRequirement').value,
        notes: document.getElementById('clientNotes').value,
        status: document.getElementById('clientStatus')?.value || 'Pending'
      };

      const res = await fetch('http://localhost:5002/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok) {
        form.reset();
        fetchClients();
        const requestsPage = document.getElementById('requestsBody');
        if (requestsPage) {
          renderClientRequestsPage();
        }
      } else {
        alert(result.message || 'Unable to add client.');
      }
    });
  }
}

function renderCalendarPage() {
  const grid = document.getElementById('calendarGrid');
  const monthLabel = document.getElementById('calendarMonthLabel');
  if (!grid || !monthLabel) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  const userName = document.getElementById('calendarUserName');
  if (userName) userName.textContent = user.name;
  const eventFormCard = document.getElementById('eventFormCard');
  const eventForm = document.getElementById('eventForm');
  const openEventForm = document.getElementById('openEventForm');
  const closeEventForm = document.getElementById('closeEventForm');
  const eventFormMessage = document.getElementById('eventFormMessage');

  if (openEventForm && eventFormCard) {
    openEventForm.addEventListener('click', () => {
      eventFormCard.hidden = false;
      eventFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (closeEventForm && eventFormCard && eventForm) {
    closeEventForm.addEventListener('click', () => {
      eventForm.reset();
      eventFormCard.hidden = true;
      if (eventFormMessage) eventFormMessage.textContent = '';
    });
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/calendar');
      const data = await res.json();

      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const firstWeekday = firstDay.getDay();
      const totalDays = lastDay.getDate();

      monthLabel.textContent = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

      const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let calendarCells = weekdayLabels.map((label) => `<div class="calendar-day-label">${label}</div>`).join('');

      for (let i = 0; i < firstWeekday; i += 1) {
        calendarCells += '<div class="calendar-day empty-day"></div>';
      }

      for (let day = 1; day <= totalDays; day += 1) {
        const loopDate = new Date(year, month, day);
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = (Array.isArray(data) ? data : []).filter((event) => event.date === dateKey);
        const eventMarkup = dayEvents.map((event) => `
          <div class="calendar-event-item event-${event.type.toLowerCase()}">
            <strong>${event.title}</strong>
            <span>${event.type}</span>
            <button type="button" class="calendar-event-delete" data-event-id="${event.id}" aria-label="Delete ${event.title}">Delete</button>
          </div>
        `).join('');

        calendarCells += `
          <div class="calendar-day ${dayEvents.length ? 'has-events' : ''}">
            <div class="calendar-date">${day}</div>
            <div class="calendar-events">${eventMarkup || '<span class="calendar-empty">No events</span>'}</div>
          </div>
        `;
      }

      const remainingCells = (7 - ((firstWeekday + totalDays) % 7)) % 7;
      for (let i = 0; i < remainingCells; i += 1) {
        calendarCells += '<div class="calendar-day empty-day"></div>';
      }

      grid.innerHTML = calendarCells;
      grid.querySelectorAll('.calendar-event-delete').forEach((button) => {
        button.addEventListener('click', async () => {
          if (!window.confirm('Delete this event?')) return;
          try {
            const response = await fetch(`http://localhost:5002/api/calendar/${button.dataset.eventId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Unable to delete event.');
            fetchEvents();
          } catch (error) {
            console.error(error);
            alert(error.message || 'Unable to delete event.');
          }
        });
      });
    } catch (error) {
      console.error(error);
    }
  };

  fetchEvents();

  if (eventForm) {
    eventForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        title: document.getElementById('eventTitle').value.trim(),
        date: document.getElementById('eventDate').value,
        type: document.getElementById('eventType').value
      };

      try {
        const response = await fetch('http://localhost:5002/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Unable to save event.');
        eventForm.reset();
        eventFormCard.hidden = true;
        if (eventFormMessage) eventFormMessage.textContent = '';
        fetchEvents();
      } catch (error) {
        console.error(error);
        if (eventFormMessage) {
          eventFormMessage.textContent = error.message || 'Unable to save event.';
          eventFormMessage.style.color = 'red';
        }
      }
    });
  }
}

function renderMessagesPage() {
  const list = document.getElementById('messagesList');
  if (!list) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  const userName = document.getElementById('messagesUserName');
  if (userName) userName.textContent = user.name;

  const fetchMessages = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/messages');
      const data = await res.json();
      list.innerHTML = data.map((message) => `
        <div class="message-item">
          <div class="message-sender">${message.sender}</div>
          <div class="message-content">
            <h4>${message.subject}</h4>
            <p>${message.preview}</p>
          </div>
          <div class="message-time">${message.time}</div>
        </div>
      `).join('');
    } catch (error) {
      console.error(error);
    }
  };

  fetchMessages();
}

function renderSettingsPage() {
  const form = document.getElementById('settingsForm');
  if (!form) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  const userName = document.getElementById('settingsUserName');
  if (userName) userName.textContent = user.name;
  const saveSettingsButton = document.getElementById('saveSettingsButton');
  const settingsMessage = document.getElementById('settingsMessage');

  const loadSettings = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/settings');
      const data = await res.json();
      document.getElementById('companyName').value = data.companyName || '';
      document.getElementById('timezone').value = data.timezone || '';
      document.getElementById('defaultLanguage').value = data.defaultLanguage || '';
      document.getElementById('notificationsEnabled').value = String(Boolean(data.notificationsEnabled));
      document.getElementById('weeklySummaryEmail').value = String(Boolean(data.weeklySummaryEmail));
      document.getElementById('darkMode').value = String(Boolean(data.darkMode));
    } catch (error) {
      console.error(error);
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      companyName: document.getElementById('companyName').value,
      timezone: document.getElementById('timezone').value,
      defaultLanguage: document.getElementById('defaultLanguage').value,
      notificationsEnabled: document.getElementById('notificationsEnabled').value === 'true',
      weeklySummaryEmail: document.getElementById('weeklySummaryEmail').value === 'true',
      darkMode: document.getElementById('darkMode').value === 'true'
    };

    if (saveSettingsButton) {
      saveSettingsButton.disabled = true;
      saveSettingsButton.textContent = 'Saving...';
    }

    try {
      const res = await fetch('http://localhost:5002/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Unable to save settings.');
      if (settingsMessage) {
        settingsMessage.textContent = 'Settings saved successfully.';
        settingsMessage.style.color = 'green';
      }
    } catch (error) {
      if (settingsMessage) {
        settingsMessage.textContent = error.message || 'Unable to save settings.';
        settingsMessage.style.color = 'red';
      }
    } finally {
      if (saveSettingsButton) {
        saveSettingsButton.disabled = false;
        saveSettingsButton.textContent = 'Save Settings';
      }
    }
  });

  loadSettings();
}

function logoutUser() {
  localStorage.removeItem('cyberousUser');
  window.location.href = '../index.html';
}

function ensureAdminLogout() {
  const sidebarUser = document.querySelector('.sidebar-user');
  if (sidebarUser && !sidebarUser.querySelector('[data-logout]')) {
    const logoutButton = document.createElement('button');
    logoutButton.type = 'button';
    logoutButton.className = 'sidebar-logout';
    logoutButton.textContent = 'Logout';
    logoutButton.setAttribute('data-logout', 'true');
    sidebarUser.appendChild(logoutButton);
  }

  const userPill = document.querySelector('.user-pill');
  if (userPill && !userPill.querySelector('#logoutBtn, [data-logout]')) {
    const logoutButton = document.createElement('button');
    logoutButton.type = 'button';
    logoutButton.className = 'logout-btn';
    logoutButton.textContent = 'Logout';
    logoutButton.setAttribute('data-logout', 'true');
    userPill.appendChild(logoutButton);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  ensureAdminLogout();
  renderDashboard();
  renderEmployeesPage();
  renderProjectsPage();
  renderClientRequestsPage();
  renderReportsPage();
  renderTasksPage();
  renderClientsPage();
  renderCalendarPage();
  renderMessagesPage();
  renderSettingsPage();

  const addEmployeeBtn = document.querySelector('[data-scroll-target="employeeForm"]');
  if (addEmployeeBtn) {
    addEmployeeBtn.addEventListener('click', () => {
      const form = document.getElementById('employeeForm');
      if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const addProjectBtn = document.querySelector('[data-scroll-target="projectForm"]');
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', () => {
      const formCard = document.getElementById('projectFormCard');
      const form = document.getElementById('projectForm');
      if (formCard) {
        formCard.hidden = false;
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  const addClientBtn = document.querySelector('[data-scroll-target="clientForm"]');
  if (addClientBtn) {
    addClientBtn.addEventListener('click', () => {
      const form = document.getElementById('clientForm');
      if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const logoutButtons = document.querySelectorAll('#logoutBtn, [data-logout]');
  logoutButtons.forEach((button) => {
    button.addEventListener('click', logoutUser);
  });
});
