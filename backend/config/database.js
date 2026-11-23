const dbState = {
  users: [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@cyberous.com',
      password: 'admin123',
      role: 'Admin',
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  departments: [
    { id: 1, name: 'Development', status: 'Active' },
    { id: 2, name: 'Testing', status: 'Active' },
    { id: 3, name: 'DevOps', status: 'Active' },
    { id: 4, name: 'Security', status: 'Active' },
    { id: 5, name: 'HR', status: 'Active' }
  ],
  employees: [
    { id: 1, name: 'Rahul Sharma', email: 'rahul@cyberous.in', department: 'Development', role: 'Developer', status: 'Active' },
    { id: 2, name: 'Priya Joshi', email: 'priya@cyberous.in', department: 'Testing', role: 'Tester', status: 'Active' },
    { id: 3, name: 'Amit Verma', email: 'amit@cyberous.in', department: 'DevOps', role: 'DevOps Engineer', status: 'Active' },
    { id: 4, name: 'Neha Singh', email: 'neha@cyberous.in', department: 'HR', role: 'HR Executive', status: 'Active' },
    { id: 5, name: 'Vikram Patel', email: 'vikram@cyberous.in', department: 'Security', role: 'Security Analyst', status: 'Active' }
  ],
  clients: [
    {
      id: 1,
      name: 'ABC Corp',
      company: 'ABC Corp',
      phone: '+1 555 221 4455',
      email: 'hello@abccorp.com',
      address: 'New York, USA',
      websiteNeed: 'Corporate website redesign with contact and portfolio pages',
      budget: '$2,500 - $5,000',
      status: 'Approved',
      projectType: 'Website Development',
      requestedAt: '2026-08-20'
    },
    {
      id: 2,
      name: 'XYZ Pvt Ltd',
      company: 'XYZ Pvt Ltd',
      phone: '+91 99880 77888',
      email: 'sales@xyzpvt.com',
      address: 'Bengaluru, India',
      websiteNeed: 'Business website with services and enquiry form',
      budget: '$1,500 - $3,000',
      status: 'Pending',
      projectType: 'Business Website',
      requestedAt: '2026-08-21'
    },
    {
      id: 3,
      name: 'Tech Corp',
      company: 'Tech Corp',
      phone: '+44 7700 900123',
      email: 'info@techcorp.io',
      address: 'London, UK',
      websiteNeed: 'SaaS landing page and lead generation funnel',
      budget: '$3,000 - $6,000',
      status: 'Approved',
      projectType: 'Landing Page',
      requestedAt: '2026-08-22'
    },
    {
      id: 4,
      name: 'Global Inc',
      company: 'Global Inc',
      phone: '+1 415 304 2000',
      email: 'connect@globalinc.com',
      address: 'San Francisco, USA',
      websiteNeed: 'Multi-page company website and CRM integration',
      budget: '$5,000 - $8,000',
      status: 'Pending',
      projectType: 'Website + CRM',
      requestedAt: '2026-08-23'
    }
  ],
  projects: [
    { id: 1, projectName: 'Cyber Security Audit', clientName: 'ABC Corp', manager: 'Rahul Sharma', startDate: '2025-01-02', deadline: '2025-08-20', status: 'In Progress', progress: 70, description: 'Penetration testing and remediation planning' },
    { id: 2, projectName: 'Website Development', clientName: 'XYZ Pvt Ltd', manager: 'Priya Joshi', startDate: '2025-05-03', deadline: '2025-09-15', status: 'In Progress', progress: 45, description: 'Responsive redesign and CMS implementation' },
    { id: 3, projectName: 'VAPT Assessment', clientName: 'Tech Corp', manager: 'Amit Verma', startDate: '2025-10-02', deadline: '2025-12-25', status: 'Completed', progress: 100, description: 'Vulnerability assessment and remediation report' },
    { id: 4, projectName: 'Mobile App Security', clientName: 'Global Inc', manager: 'Neha Singh', startDate: '2025-12-12', deadline: '2026-01-20', status: 'In Progress', progress: 60, description: 'Security review for mobile application' },
    { id: 5, projectName: 'Cloud Security Audit', clientName: 'Global Inc', manager: 'Vikram Patel', startDate: '2025-05-15', deadline: '2026-02-15', status: 'Not Started', progress: 0, description: 'Cloud asset mapping and hardening review' }
  ],
  clientRequests: [
    {
      id: 1,
      clientName: 'ABC Corp',
      company: 'ABC Corp',
      email: 'hello@abccorp.com',
      phone: '+1 555 221 4455',
      address: 'New York, USA',
      websiteNeed: 'Corporate website redesign with portfolio and contact form',
      budget: '$2,500 - $5,000',
      notes: 'Need a modern corporate web presence and enquiry form.',
      status: 'Approved',
      priority: 'High',
      requestDate: '2026-08-20',
      approvedAt: '2026-08-22'
    },
    {
      id: 2,
      clientName: 'XYZ Pvt Ltd',
      company: 'XYZ Pvt Ltd',
      email: 'sales@xyzpvt.com',
      phone: '+91 99880 77888',
      address: 'Bengaluru, India',
      websiteNeed: 'Business website for service details and quote requests',
      budget: '$1,500 - $3,000',
      notes: 'Want a simple, responsive website with lead capture forms.',
      status: 'Open',
      priority: 'Medium',
      requestDate: '2026-08-21'
    },
    {
      id: 3,
      clientName: 'Tech Corp',
      company: 'Tech Corp',
      email: 'info@techcorp.io',
      phone: '+44 7700 900123',
      address: 'London, UK',
      websiteNeed: 'SaaS landing page and contact flow for product inquiries',
      budget: '$3,000 - $6,000',
      notes: 'Need a conversion-focused landing page for new product release.',
      status: 'In Progress',
      priority: 'High',
      requestDate: '2026-08-22'
    },
    {
      id: 4,
      clientName: 'Global Inc',
      company: 'Global Inc',
      email: 'connect@globalinc.com',
      phone: '+1 415 304 2000',
      address: 'San Francisco, USA',
      websiteNeed: 'Multi-page company website with CRM integration',
      budget: '$5,000 - $8,000',
      notes: 'Need a polished corporate website and integration with existing leads system.',
      status: 'Pending',
      priority: 'Low',
      requestDate: '2026-08-23'
    },
    {
      id: 5,
      clientName: 'SecureSoft',
      company: 'SecureSoft',
      email: 'team@securesoft.dev',
      phone: '+91 98765 43210',
      address: 'Pune, India',
      websiteNeed: 'Security service website and case studies page',
      budget: '$2,000 - $4,000',
      notes: 'Need service pages, testimonial section, and request form.',
      status: 'Open',
      priority: 'Medium',
      requestDate: '2026-08-24'
    }
  ],
  tasks: [
    { id: 1, title: 'Create compliance checklist', priority: 'High', status: 'Pending', assignee: 'Rahul Sharma' },
    { id: 2, title: 'Review firewall logs', priority: 'Medium', status: 'Completed', assignee: 'Vikram Patel' },
    { id: 3, title: 'Update project dashboard', priority: 'Low', status: 'Pending', assignee: 'Priya Joshi' }
  ],
  activities: [
    { id: 1, text: 'Task assigned to Rahul Sharma', time: '10 min ago' },
    { id: 2, text: 'Project “Cloud Security” created', time: '1 hour ago' },
    { id: 3, text: 'Client request from ABC Corp', time: '2 hours ago' },
    { id: 4, text: 'Task completed by Priya Joshi', time: '3 hours ago' }
  ],
  notifications: [
    { id: 1, message: 'Security review deadline updated' },
    { id: 2, message: 'New client request received' }
  ],
  tasks: [
    { id: 1, title: 'Create compliance checklist', priority: 'High', status: 'Pending', assignee: 'Rahul Sharma' },
    { id: 2, title: 'Review firewall logs', priority: 'Medium', status: 'Completed', assignee: 'Vikram Patel' },
    { id: 3, title: 'Update project dashboard', priority: 'Low', status: 'Pending', assignee: 'Priya Joshi' },
    { id: 4, title: 'Client onboarding call', priority: 'High', status: 'In Progress', assignee: 'Amit Verma' },
    { id: 5, title: 'Prepare sprint review deck', priority: 'Medium', status: 'Pending', assignee: 'Neha Singh' }
  ],
  calendarEvents: [
    { id: 1, title: 'Project Review', date: '2026-09-02', type: 'Meeting', assignee: 'Rahul Sharma' },
    { id: 2, title: 'Client Audit Call', date: '2026-09-04', type: 'Call', assignee: 'Priya Joshi' },
    { id: 3, title: 'Security Sprint', date: '2026-09-06', type: 'Task', assignee: 'Vikram Patel' },
    { id: 4, title: 'Team Sync', date: '2026-09-09', type: 'Meeting', assignee: 'Amit Verma' }
  ],
  messages: [
    { id: 1, sender: 'ABC Corp', subject: 'Audit timeline update', preview: 'Please share the revised schedule for the security review.', time: '10:30 AM' },
    { id: 2, sender: 'Priya Joshi', subject: 'Status report', preview: 'The internal review is complete and ready for sign-off.', time: 'Yesterday' },
    { id: 3, sender: 'System', subject: 'Deadline reminder', preview: 'Your next project review is due in 2 days.', time: '2 days ago' }
  ],
  settings: {
    companyName: 'Cyberous Workflow',
    timezone: 'UTC+05:30',
    notificationsEnabled: true,
    weeklySummaryEmail: true,
    darkMode: false,
    defaultLanguage: 'English'
  },
  reports: [
    {
      id: 1,
      name: 'Monthly Project Status Report',
      category: 'Project Health',
      status: 'On Track',
      generatedOn: '2026-08-30',
      owner: 'Rahul Sharma'
    },
    {
      id: 2,
      name: 'Task Completion Summary',
      category: 'Operations',
      status: 'Healthy',
      generatedOn: '2026-08-29',
      owner: 'Priya Joshi'
    },
    {
      id: 3,
      name: 'Client Request Overview',
      category: 'Client Services',
      status: 'Review',
      generatedOn: '2026-08-28',
      owner: 'Amit Verma'
    },
    {
      id: 4,
      name: 'Compliance Audit Snapshot',
      category: 'Security',
      status: 'Critical',
      generatedOn: '2026-08-27',
      owner: 'Vikram Patel'
    }
  ]
};

module.exports = { dbState };
