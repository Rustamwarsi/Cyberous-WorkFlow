const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const dotenv = require('dotenv');
const { dbState } = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;
const frontendDir = path.join(__dirname, '../frontend');
const uploadsDir = path.join(__dirname, 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const employeePhotoUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `employee-${req.params.id}-${Date.now()}${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
      return;
    }
    callback(new Error('Only image files are allowed.'));
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(frontendDir));

app.locals.db = dbState;

const normalizeEmployeeIds = (db) => {
  if (!db || !Array.isArray(db.employees)) return db;

  db.employees = db.employees
    .map((employee, index) => ({
      ...employee,
      id: index + 1,
      name: employee.name || '',
      email: employee.email || '',
      department: employee.department || '',
      role: employee.role || '',
      status: employee.status || 'Active'
    }))
    .sort((a, b) => Number(a.id) - Number(b.id));

  return db;
};

const normalizeClientRequestIds = (db) => {
  if (!db || !Array.isArray(db.clientRequests)) return db;

  db.clientRequests.forEach((request, index) => {
    request.id = index + 1;
  });

  return db;
};

const normalizeProjectIds = (db) => {
  if (!db || !Array.isArray(db.projects)) return db;

  db.projects.forEach((project, index) => {
    project.id = index + 1;
  });

  return db;
};

const normalizeTaskIds = (db) => {
  if (!db || !Array.isArray(db.tasks)) return db;

  db.tasks.forEach((task, index) => {
    task.id = index + 1;
  });

  return db;
};

const readDb = (req) => normalizeClientRecords(normalizeClientRequestIds(normalizeProjectIds(normalizeTaskIds(normalizeEmployeeIds(req.app.locals.db)))));

const normalizeClientRecords = (db) => {
  if (!db || !Array.isArray(db.clients)) return db;

  db.clients = db.clients.map((client) => {
    const matchingRequest = Array.isArray(db.clientRequests)
      ? db.clientRequests.find((request) => request.email === client.email || request.phone === client.phone)
      : null;
    const status = normalizeClientStatus(client.status || matchingRequest?.status);
    return {
      ...client,
      company: client.company || matchingRequest?.company || client.name || '',
      address: client.address || matchingRequest?.address || '',
      websiteNeed: client.websiteNeed || matchingRequest?.websiteNeed || '',
      budget: client.budget || matchingRequest?.budget || '',
      notes: client.notes || matchingRequest?.notes || '',
      projectType: client.projectType || matchingRequest?.projectType || 'Website Development',
      status,
      statusHistory: Array.isArray(client.statusHistory) && client.statusHistory.length
        ? client.statusHistory
        : (matchingRequest?.statusHistory || createStatusHistory(status, matchingRequest?.updatedAt || matchingRequest?.requestDate))
    };
  });

  return db;
};

const normalizeClientStatus = (status) => {
  const value = String(status || '').trim();
  if (!value) return 'Pending';

  const normalized = value.toLowerCase();
  if (normalized.includes('approve')) return 'Approved';
  if (normalized.includes('complete')) return 'Completed';
  if (normalized.includes('progress')) return 'In Progress';
  if (normalized.includes('not started')) return 'Not Started';
  if (normalized.includes('open')) return 'Pending';
  if (normalized.includes('pending')) return 'Pending';

  return 'Pending';
};

const createStatusHistory = (status, date = new Date().toISOString()) => {
  const normalizedStatus = normalizeClientStatus(status);
  return [{ status: normalizedStatus, changedAt: date }];
};

const appendStatusHistory = (history, status, date = new Date().toISOString()) => {
  const normalizedStatus = normalizeClientStatus(status);
  const list = Array.isArray(history) ? history.map((item) => ({
    status: normalizeClientStatus(item.status),
    changedAt: item.changedAt || date
  })) : [];

  const exists = list.some((item) => item.status === normalizedStatus && item.changedAt === date);
  if (!exists) {
    list.push({ status: normalizedStatus, changedAt: date });
  }

  return list;
};

const syncClientRecord = (db, request) => {
  if (!db || !Array.isArray(db.clients)) return;
  if (!request || (!request.email && !request.phone)) return;

  const status = normalizeClientStatus(request.status);
  const existingClient = db.clients.find((client) => client.email === request.email || client.phone === request.phone);
  const clientPayload = {
    id: existingClient ? existingClient.id : Date.now(),
    name: request.clientName || existingClient?.name || '',
    company: request.company || existingClient?.company || request.clientName || '',
    phone: request.phone || existingClient?.phone || '',
    email: request.email || existingClient?.email || '',
    address: request.address || existingClient?.address || '',
    websiteNeed: request.websiteNeed || existingClient?.websiteNeed || '',
    budget: request.budget || existingClient?.budget || '',
    notes: request.notes || existingClient?.notes || '',
    status,
    statusHistory: appendStatusHistory(existingClient?.statusHistory || request.statusHistory, request.status, request.updatedAt || new Date().toISOString()),
    projectType: request.projectType || existingClient?.projectType || 'Website Development',
    requestedAt: request.requestDate || existingClient?.requestedAt || new Date().toISOString().split('T')[0]
  };

  if (existingClient) {
    Object.assign(existingClient, clientPayload);
  } else {
    db.clients.unshift(clientPayload);
  }
};

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Cyberous WorkFlow Backend is Running Successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('/client', (req, res) => {
  res.sendFile(path.join(frontendDir, 'client.html'));
});

app.get('/client-portal', (req, res) => {
  res.sendFile(path.join(frontendDir, 'client.html'));
});

app.get('/pages/clients.html', (req, res) => {
  res.redirect('/client');
});

app.get('/pages/:page', (req, res) => {
  const pageName = req.params.page;
  const pagePath = path.join(frontendDir, 'pages', `${pageName}.html`);
  res.sendFile(pagePath);
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }

  const user = readDb(req).users.find(
    (item) => item.email.toLowerCase() === String(email).toLowerCase()
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.'
    });
  }

  if (user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.'
    });
  }

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

app.get('/api/dashboard', (req, res) => {
  const db = readDb(req);
  const projectStatusCounts = {
    completed: db.projects.filter((project) => project.status === 'Completed').length,
    inProgress: db.projects.filter((project) => project.status === 'In Progress').length,
    notStarted: db.projects.filter((project) => project.status === 'Not Started').length
  };
  const taskStatusCounts = {
    completed: db.tasks.filter((task) => task.status === 'Completed').length,
    pending: db.tasks.filter((task) => task.status === 'Pending').length,
    inProgress: db.tasks.filter((task) => task.status === 'In Progress').length
  };

  res.json({
    totalProjects: db.projects.length,
    totalTasks: db.tasks.length,
    completedTasks: db.tasks.filter((task) => task.status === 'Completed').length,
    pendingTasks: db.tasks.filter((task) => task.status !== 'Completed').length,
    projectProgress: db.projects.map((project) => ({
      name: project.projectName,
      progress: project.progress,
      status: project.status
    })),
    projectStatusCounts,
    taskStatusCounts,
    totalEmployees: db.employees.length,
    totalClients: db.clients.length,
    notifications: Array.isArray(db.notifications) ? db.notifications : [],
    recentActivities: db.activities,
    recentProjects: db.projects.slice(0, 5)
  });
});

app.get('/api/employees', (req, res) => {
  const db = readDb(req);
  res.json(db.employees);
});

app.post('/api/employees/:id/photo', employeePhotoUpload.single('photo'), (req, res) => {
  const db = readDb(req);
  const employee = db.employees.find((item) => item.id === Number(req.params.id));

  if (!employee) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(404).json({ success: false, message: 'Employee not found.' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select an image.' });
  }

  if (employee.photo) {
    const oldPhotoPath = path.join(__dirname, employee.photo.replace(/^\/uploads\//, ''));
    if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
  }

  employee.photo = `/uploads/${req.file.filename}`;
  res.json({ success: true, employee });
});

app.delete('/api/employees/:id/photo', (req, res) => {
  const db = readDb(req);
  const employee = db.employees.find((item) => item.id === Number(req.params.id));

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found.' });
  }

  if (employee.photo) {
    const photoPath = path.join(__dirname, employee.photo.replace(/^\/uploads\//, ''));
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    delete employee.photo;
  }

  res.json({ success: true, employee });
});

app.get('/api/projects', (req, res) => {
  const db = readDb(req);
  res.json(db.projects);
});

app.get('/api/client-requests', (req, res) => {
  const db = readDb(req);
  res.json(db.clientRequests);
});

app.get('/api/client-notifications', (req, res) => {
  const db = readDb(req);
  const email = String(req.query.email || '').trim().toLowerCase();
  const notifications = Array.isArray(db.clientNotifications) ? db.clientNotifications : [];
  res.json(email ? notifications.filter((item) => item.email.toLowerCase() === email) : []);
});

app.get('/api/clients', (req, res) => {
  const db = readDb(req);
  res.json(db.clients);
});

app.get('/api/tasks', (req, res) => {
  const db = readDb(req);
  res.json(db.tasks);
});

app.get('/api/calendar', (req, res) => {
  const db = readDb(req);
  res.json(db.calendarEvents);
});

app.post('/api/calendar', (req, res) => {
  const db = readDb(req);
  const { title, date, type } = req.body;
  const allowedTypes = ['Meeting', 'Call', 'Task'];

  if (!title || !date || !type) {
    return res.status(400).json({ success: false, message: 'Event title, date, and type are required.' });
  }

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid event type.' });
  }

  const event = { id: Date.now(), title, date, type };
  db.calendarEvents.push(event);
  res.status(201).json({ success: true, event });
});

app.delete('/api/calendar/:id', (req, res) => {
  const db = readDb(req);
  const eventIndex = db.calendarEvents.findIndex((event) => event.id === Number(req.params.id));

  if (eventIndex === -1) {
    return res.status(404).json({ success: false, message: 'Calendar event not found.' });
  }

  const [event] = db.calendarEvents.splice(eventIndex, 1);
  res.json({ success: true, message: 'Calendar event deleted successfully.', event });
});

app.get('/api/messages', (req, res) => {
  const db = readDb(req);
  res.json(db.messages);
});

app.get('/api/settings', (req, res) => {
  const db = readDb(req);
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  const db = readDb(req);
  db.settings = { ...db.settings, ...req.body };
  res.json({ success: true, settings: db.settings });
});

app.get('/api/reports', (req, res) => {
  const db = readDb(req);
  const completedProjects = db.projects.filter((project) => project.status === 'Completed').length;
  const activeProjects = db.projects.filter((project) => project.status === 'In Progress').length;
  const avgProgress = Math.round(
    db.projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / Math.max(db.projects.length, 1)
  );
  const delayedTasks = db.tasks.filter((task) => task.status !== 'Completed').length;

  res.json({
    stats: [
      { label: 'Active Projects', value: activeProjects, trend: '+12%' },
      { label: 'Completed Projects', value: completedProjects, trend: '+8%' },
      { label: 'Avg Progress', value: `${avgProgress}%`, trend: '+5%' },
      { label: 'Pending Tasks', value: delayedTasks, trend: '-3%' }
    ],
    reports: db.reports,
    summary: {
      totalReports: db.reports.length,
      onTrackReports: db.reports.filter((report) => report.status === 'On Track').length,
      reviewReports: db.reports.filter((report) => report.status === 'Review').length,
      criticalReports: db.reports.filter((report) => report.status === 'Critical').length
    }
  });
});

app.post('/api/employees', (req, res) => {
  const db = readDb(req);
  const { name, email, department, role, status } = req.body;

  if (!name || !email || !department || !role) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
  }

  const nextEmployeeId = db.employees.length
    ? Math.max(...db.employees.map((employee) => Number(employee.id) || 0)) + 1
    : 1;

  const employee = {
    id: nextEmployeeId,
    name,
    email,
    department,
    role,
    status: status || 'Active'
  };

  db.employees.push(employee);
  res.status(201).json({ success: true, employee });
});

app.put('/api/employees/:id', (req, res) => {
  const db = readDb(req);
  const { id } = req.params;
  const { name, email, department, role, status } = req.body;

  if (!name || !email || !department || !role) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
  }

  const employeeIndex = db.employees.findIndex((employee) => employee.id === Number(id));
  if (employeeIndex === -1) {
    return res.status(404).json({ success: false, message: 'Employee not found.' });
  }

  db.employees[employeeIndex] = {
    ...db.employees[employeeIndex],
    name,
    email,
    department,
    role,
    status: status || 'Active'
  };

  res.json({ success: true, employee: db.employees[employeeIndex] });
});

app.delete('/api/employees/:id', (req, res) => {
  const db = readDb(req);
  const { id } = req.params;
  const employeeIndex = db.employees.findIndex((employee) => employee.id === Number(id));

  if (employeeIndex === -1) {
    return res.status(404).json({ success: false, message: 'Employee not found.' });
  }

  const [deletedEmployee] = db.employees.splice(employeeIndex, 1);
  if (deletedEmployee.photo) {
    const photoPath = path.join(__dirname, deletedEmployee.photo.replace(/^\/uploads\//, ''));
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
  }
  res.json({ success: true, employee: deletedEmployee });
});

app.post('/api/projects', (req, res) => {
  const db = readDb(req);
  const { projectName, clientName, manager, startDate, deadline, description, status, progress } = req.body;

  if (!projectName || !clientName || !manager || !startDate || !deadline) {
    return res.status(400).json({ success: false, message: 'Please fill all required project fields.' });
  }

  const project = {
    id: Date.now(),
    projectName,
    clientName,
    manager,
    startDate,
    deadline,
    description: description || '',
    status: status || 'Not Started',
    progress: Number(progress) || 0
  };

  db.projects.push(project);
  normalizeProjectIds(db);
  res.status(201).json({ success: true, project });
});

app.put('/api/projects/:id/status', (req, res) => {
  const db = readDb(req);
  const project = db.projects.find((item) => item.id === Number(req.params.id));
  const allowedStatuses = ['Not Started', 'In Progress', 'Completed'];
  const status = String(req.body.status || '').trim();

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid project status.' });
  }

  project.status = status;
  if (status === 'Completed') project.progress = 100;

  const matchingRequest = db.clientRequests.find((request) => request.company === project.clientName || request.clientName === project.clientName);
  if (matchingRequest) {
    const changedAt = new Date().toISOString();
    matchingRequest.status = status;
    matchingRequest.updatedAt = changedAt;
    matchingRequest.statusHistory = appendStatusHistory(matchingRequest.statusHistory, matchingRequest.status, changedAt);
    if (status === 'Completed') matchingRequest.completedAt = changedAt;
    syncClientRecord(db, matchingRequest);
  }

  res.json({ success: true, project, request: matchingRequest || null });
});

app.delete('/api/projects/:id', (req, res) => {
  const db = readDb(req);
  const projectIndex = db.projects.findIndex((project) => project.id === Number(req.params.id));

  if (projectIndex === -1) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  const [project] = db.projects.splice(projectIndex, 1);
  const matchingRequestIndex = db.clientRequests.findIndex((request) => request.company === project.clientName || request.clientName === project.clientName);
  let deletedRequest = null;

  if (matchingRequestIndex !== -1) {
    [deletedRequest] = db.clientRequests.splice(matchingRequestIndex, 1);
    db.clientNotifications = Array.isArray(db.clientNotifications) ? db.clientNotifications : [];
    db.clientNotifications.unshift({
      id: Date.now(),
      email: deletedRequest.email,
      message: `Your client request was deleted because project "${project.projectName}" was deleted.`,
      deletedAt: new Date().toISOString()
    });
    normalizeClientRequestIds(db);
  }

  normalizeProjectIds(db);
  res.json({ success: true, message: 'Project and matching client request deleted successfully.', project, deletedRequest });
});

app.post('/api/client-requests', (req, res) => {
  const db = readDb(req);
  const {
    clientName,
    company,
    email,
    phone,
    address,
    websiteNeed,
    budget,
    notes,
    priority,
    status,
    requestDate,
    projectType
  } = req.body;

  if (!clientName || !email || !phone || !websiteNeed || !budget) {
    return res.status(400).json({
      success: false,
      message: 'Client name, email, phone, website requirement, and budget are required.'
    });
  }

  const requestStatus = normalizeClientStatus(status || 'Pending');
  const createdAt = new Date().toISOString();
  const request = {
    id: Date.now(),
    clientName,
    company: company || clientName,
    email,
    phone,
    address: address || '',
    websiteNeed,
    budget,
    notes: notes || '',
    priority: priority || 'Medium',
    projectType: projectType || 'Website Development',
    status: requestStatus,
    statusHistory: createStatusHistory(requestStatus, createdAt),
    requestDate: requestDate || new Date().toISOString().split('T')[0],
    updatedAt: createdAt
  };

  db.clientRequests.unshift(request);
  normalizeClientRequestIds(db);
  syncClientRecord(db, request);
  res.status(201).json({ success: true, request });
});

app.put('/api/clients/:id/status', (req, res) => {
  const db = readDb(req);
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required.' });
  }

  const normalizedStatus = normalizeClientStatus(status);
  const clientIndex = db.clients.findIndex((client) => client.id === Number(id));

  if (clientIndex === -1) {
    return res.status(404).json({ success: false, message: 'Client not found.' });
  }

  const client = db.clients[clientIndex];
  const changedAt = new Date().toISOString();
  client.status = normalizedStatus;
  client.statusHistory = appendStatusHistory(client.statusHistory, normalizedStatus, changedAt);

  const matchingRequest = db.clientRequests.find((request) => request.email === client.email || request.phone === client.phone);
  if (matchingRequest) {
    matchingRequest.status = normalizedStatus;
    matchingRequest.updatedAt = changedAt;
    matchingRequest.statusHistory = appendStatusHistory(matchingRequest.statusHistory, normalizedStatus, changedAt);
    if (normalizedStatus === 'Approved') {
      matchingRequest.approvedAt = changedAt;
    }
  }

  res.json({ success: true, client, request: matchingRequest || null });
});

app.put('/api/client-requests/:id/status', (req, res) => {
  const db = readDb(req);
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required.' });
  }

  const normalizedStatus = normalizeClientStatus(status);
  const requestIndex = db.clientRequests.findIndex((request) => request.id === Number(id));

  if (requestIndex === -1) {
    return res.status(404).json({ success: false, message: 'Client request not found.' });
  }

  const request = db.clientRequests[requestIndex];
  const changedAt = new Date().toISOString();
  request.status = normalizedStatus;
  request.updatedAt = changedAt;
  request.statusHistory = appendStatusHistory(request.statusHistory, normalizedStatus, changedAt);

  if (normalizedStatus === 'Approved') {
    request.approvedAt = changedAt;
  }
  if (normalizedStatus === 'Completed') {
    request.completedAt = changedAt;
  }

  syncClientRecord(db, request);
  res.json({ success: true, request, client: db.clients.find((client) => client.email === request.email || client.phone === request.phone) || null });
});

app.delete('/api/client-requests/:id', (req, res) => {
  const db = readDb(req);
  const requestIndex = db.clientRequests.findIndex((request) => request.id === Number(req.params.id));

  if (requestIndex === -1) {
    return res.status(404).json({ success: false, message: 'Client request not found.' });
  }

  const [request] = db.clientRequests.splice(requestIndex, 1);
  const matchingProjectIndex = db.projects.findIndex((project) => project.clientName === request.clientName);
  let deletedProject = null;
  if (matchingProjectIndex !== -1) {
    [deletedProject] = db.projects.splice(matchingProjectIndex, 1);
    normalizeProjectIds(db);
  }
  db.clientNotifications = Array.isArray(db.clientNotifications) ? db.clientNotifications : [];
  db.clientNotifications.unshift({
    id: Date.now(),
    email: request.email,
    message: `Your client request was deleted by the team on ${new Date().toLocaleDateString('en-GB')}.`,
    deletedAt: new Date().toISOString()
  });

  res.json({ success: true, message: 'Client request and matching project deleted successfully.', request, deletedProject });
});

app.put('/api/client-requests/:id/approve', (req, res) => {
  const db = readDb(req);
  const { id } = req.params;
  const requestIndex = db.clientRequests.findIndex((request) => request.id === Number(id));

  if (requestIndex === -1) {
    return res.status(404).json({ success: false, message: 'Client request not found.' });
  }

  const request = db.clientRequests[requestIndex];
  const changedAt = new Date().toISOString();
  request.status = 'Approved';
  request.approvedAt = changedAt;
  request.updatedAt = changedAt;
  request.statusHistory = appendStatusHistory(request.statusHistory, 'Approved', changedAt);

  syncClientRecord(db, request);
  res.json({ success: true, request, client: db.clients.find((client) => client.email === request.email || client.phone === request.phone) || null });
});

app.post('/api/tasks', (req, res) => {
  const db = readDb(req);
  const { title, priority, status, assignee } = req.body;

  if (!title || !priority || !status || !assignee) {
    return res.status(400).json({ success: false, message: 'Please fill all required task fields.' });
  }

  const task = {
    id: db.tasks.length
      ? Math.max(...db.tasks.map((item) => Number(item.id) || 0)) + 1
      : 1,
    title,
    priority,
    status,
    assignee
  };

  db.tasks.push(task);
  res.status(201).json({ success: true, task });
});

app.put('/api/tasks/:id', (req, res) => {
  const db = readDb(req);
  const taskIndex = db.tasks.findIndex((task) => task.id === Number(req.params.id));
  const { title, priority, status, assignee } = req.body;

  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  if (!title || !priority || !status || !assignee) {
    return res.status(400).json({ success: false, message: 'Please fill all required task fields.' });
  }

  db.tasks[taskIndex] = {
    ...db.tasks[taskIndex],
    title,
    priority,
    status,
    assignee
  };

  res.json({ success: true, task: db.tasks[taskIndex] });
});

app.delete('/api/tasks/:id', (req, res) => {
  const db = readDb(req);
  const taskIndex = db.tasks.findIndex((task) => task.id === Number(req.params.id));

  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  const [deletedTask] = db.tasks.splice(taskIndex, 1);
  normalizeTaskIds(db);
  res.json({ success: true, task: deletedTask });
});

app.post('/api/clients', (req, res) => {
  const db = readDb(req);
  const {
    name,
    company,
    phone,
    email,
    address,
    websiteNeed,
    budget,
    notes,
    status
  } = req.body;

  if (!name || !company || !phone || !email || !websiteNeed || !budget) {
    return res.status(400).json({
      success: false,
      message: 'Please fill all required client information: name, company, phone, email, website requirement, and budget.'
    });
  }

  const normalizedStatus = normalizeClientStatus(status || 'Pending');
  const createdAt = new Date().toISOString();
  const client = {
    id: Date.now(),
    name,
    company,
    phone,
    email,
    address: address || '',
    websiteNeed,
    budget,
    notes: notes || '',
    status: normalizedStatus,
    statusHistory: createStatusHistory(normalizedStatus, createdAt),
    projectType: 'Website Development',
    requestedAt: new Date().toISOString().split('T')[0]
  };

  db.clients.unshift(client);
  db.clientRequests.unshift({
    id: Date.now() + 1,
    clientName: name,
    company,
    email,
    phone,
    address: address || '',
    websiteNeed,
    budget,
    notes: notes || '',
    priority: 'Medium',
    status: normalizedStatus,
    statusHistory: createStatusHistory(normalizedStatus, createdAt),
    requestDate: new Date().toISOString().split('T')[0],
    updatedAt: createdAt
  });

  normalizeClientRequestIds(db);

  res.status(201).json({ success: true, client });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`Cyberous WorkFlow server running on http://localhost:${PORT}`);
});
