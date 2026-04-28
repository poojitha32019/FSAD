import { useState, useEffect, useCallback } from 'react';
import html2pdf from 'html2pdf.js';
import { useTheme } from '../ThemeContext';
import { adminAPI } from '../api';
import './AdminDashboard.css';

function AdminDashboard({ user, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  // const adminId = user.id; // reserved for future admin-specific API calls
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState({ totalStudents: 0, totalProjects: 0, pendingProjects: 0, approvedProjects: 0, rejectedProjects: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, projectsRes, analyticsRes] = await Promise.all([
        adminAPI.getAllStudents().catch(() => ({ data: [] })),
        adminAPI.getAllProjects().catch(() => ({ data: [] })),
        adminAPI.getAnalytics().catch(() => ({ data: {} })),
      ]);
      setStudents(studentsRes.data || []);
      setProjects((projectsRes.data || []).map(p => ({ ...p, github: p.githubLink, feedback: [], milestones: (() => { try { return p.milestones ? JSON.parse(p.milestones) : []; } catch { return []; } })() })));
      setAnalytics(analyticsRes.data || {});
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const [activeSection, setActiveSection] = useState('overview');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDeptFilter, setStudentDeptFilter] = useState('all');
  const [studentYearFilter, setStudentYearFilter] = useState('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');
  const [submissionSubjectFilter, setSubmissionSubjectFilter] = useState('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('all');
  const [giveFeedbackProject, setGiveFeedbackProject] = useState(null);
  const [gfRating, setGfRating] = useState(0);
  const [gfGrade, setGfGrade] = useState('');

  const [gfComment, setGfComment] = useState('');
  const [gfStrengths, setGfStrengths] = useState('');
  const [gfImprove, setGfImprove] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackGrade, setFeedbackGrade] = useState('');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', projects: 0, department: '', year: '', gpa: '', studentStatus: 'Active' });
  const [viewingPortfolio, setViewingPortfolio] = useState(null);
  const [portfolioFeedback, setPortfolioFeedback] = useState('');
  const [feedbackSection, setFeedbackSection] = useState('');
  const [adminProfile, setAdminProfile] = useState({
    fullName: user.name || 'Admin User',
    institution: 'Tech University',
    email: user.email || 'admin@example.com'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [viewingProjectDetails, setViewingProjectDetails] = useState(null);


  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadData(); }, [activeSection]);


  const handleApprove = async (projectId) => {
    try {
      await adminAPI.updateProjectStatus(projectId, 'approved', null);
      await loadData();
    } catch (err) { console.error(err); alert('Failed to approve.'); }
  };

  const handleReject = async (projectId) => {
    try {
      await adminAPI.updateProjectStatus(projectId, 'rejected', null);
      await loadData();
    } catch (err) { console.error(err); alert('Failed to reject.'); }
  };

  const handleAddFeedback = async (projectId) => {
    if (!feedbackText.trim()) { alert('Feedback cannot be empty!'); return; }
    try {
      await adminAPI.giveFeedback(projectId, user.userId, { message: feedbackText, rating: feedbackRating || null, grade: feedbackGrade || null });
      if (feedbackGrade) await adminAPI.updateProjectStatus(projectId, null, feedbackGrade);
      setFeedbackText(''); setFeedbackRating(0); setFeedbackGrade(''); setSelectedProject(null);
      await loadData();
    } catch (err) { console.error(err); alert('Failed to submit feedback.'); }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Delete this project?')) {
      try { await adminAPI.deleteProject(id); await loadData(); }
      catch (err) { console.error(err); alert('Failed to delete project.'); }
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Delete this student?')) {
      try { await adminAPI.deleteStudent(id); await loadData(); }
      catch (err) { console.error(err); alert('Failed to delete student.'); }
    }
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    alert('To add a student, ask them to register via the Register page.');
    closeStudentModal();
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setStudentForm({ name: `${student.firstName} ${student.lastName}`, email: student.email, projects: student.projectCount || 0, department: student.department || '', year: student.year || '', gpa: student.gpa || '', studentStatus: student.studentStatus || 'Active' });
    setShowStudentModal(true);
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setEditingStudent(null);
    setStudentForm({ name: '', email: '', projects: 0, department: '', year: '', gpa: '', studentStatus: 'Active' });
  };

  const handleViewPortfolio = async (student) => {
    try {
      const [profileRes, skillsRes, projectsRes, hackathonsRes, internshipsRes, certsRes] = await Promise.all([
        adminAPI.getStudentProfile(student.userId).catch(() => ({ data: {} })),
        adminAPI.getStudentSkills(student.userId).catch(() => ({ data: [] })),
        adminAPI.getStudentProjects(student.userId).catch(() => ({ data: [] })),
        adminAPI.getStudentHackathons(student.userId).catch(() => ({ data: [] })),
        adminAPI.getStudentInternships(student.userId).catch(() => ({ data: [] })),
        adminAPI.getStudentCertifications(student.userId).catch(() => ({ data: [] })),
      ]);
      setViewingPortfolio({
        ...student,
        name: `${student.firstName} ${student.lastName}`,
        portfolio: {
          personalInfo: {
            firstName: profileRes.data.firstName || student.firstName,
            lastName: profileRes.data.lastName || student.lastName,
            email: profileRes.data.email || student.email,
            phone: profileRes.data.contact || '',
            linkedin: profileRes.data.linkedin || '',
            github: profileRes.data.github || ''
          },
          skills: skillsRes.data || [],
          projects: (projectsRes.data || []).map(p => ({ ...p, github: p.githubLink })),
          hackathons: hackathonsRes.data || [],
          internships: internshipsRes.data || [],
          certifications: certsRes.data || []
        }
      });
    } catch (err) {
      console.error('Failed to load student portfolio:', err);
    }
  };

  const handlePortfolioFeedback = (section) => {
    if (!portfolioFeedback.trim()) {
      alert('Feedback cannot be empty!');
      return;
    }
    alert(`Feedback sent for ${section}: ${portfolioFeedback}`);
    setPortfolioFeedback('');
    setFeedbackSection('');
  };

  const handleDeletePortfolioItem = (section, itemId) => {
    if (!window.confirm(`Delete this ${section} item?`)) return;
    const updatedStudent = { ...viewingPortfolio };
    updatedStudent.portfolio[section] = updatedStudent.portfolio[section].filter(item => item.id !== itemId);
    setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    setViewingPortfolio(updatedStudent);
  };

  const handleSaveProfile = () => {
    setIsEditingProfile(false);
  };

  const handleGiveFeedbackSubmit = async () => {
    if (!gfComment.trim()) { alert('Comment is required!'); return; }
    try {
      await adminAPI.giveFeedback(giveFeedbackProject.id, user.userId, { message: gfComment, rating: gfRating || null, grade: gfGrade || null, strengths: gfStrengths, improve: gfImprove });
      if (gfGrade) await adminAPI.updateProjectStatus(giveFeedbackProject.id, null, gfGrade);
      setGiveFeedbackProject(null); setGfRating(0); setGfGrade(''); setGfComment(''); setGfStrengths(''); setGfImprove('');
      await loadData();
    } catch (err) { console.error(err); alert('Failed to submit feedback.'); }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('reports-content');
    const opt = { margin: 0.5, filename: 'Reports_Analytics.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    html2pdf().set(opt).from(element).save();
  };

  const monthlySubmissions = [
    { month: 'Aug', count: 3 }, { month: 'Sep', count: 5 }, { month: 'Oct', count: 4 },
    { month: 'Nov', count: 7 }, { month: 'Dec', count: 6 }, { month: 'Jan', count: projects.length }
  ];
  const maxBar = Math.max(...monthlySubmissions.map(m => m.count), 1);

  const deptBreakdown = students.reduce((acc, s) => {
    acc[s.department] = (acc[s.department] || 0) + 1; return acc;
  }, {});
  const totalStudents = students.length || 1;

  const allGrades = projects.map(p => p.grade).filter(Boolean);
  const gradeGroups = { A: 0, B: 0, C: 0, D: 0 };
  allGrades.forEach(g => {
    if (g.startsWith('A')) gradeGroups.A++;
    else if (g.startsWith('B')) gradeGroups.B++;
    else if (g.startsWith('C')) gradeGroups.C++;
    else gradeGroups.D++;
  });
  const totalGrades = allGrades.length || 1;

  const handleDownloadFile = (file, filename) => {
    if (file) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = filename;
      link.click();
    }
  };

  const handleDownloadResume = (student) => {
    const p = student.portfolio?.personalInfo || {};
    const skills = student.portfolio?.skills || [];
    const projects = student.portfolio?.projects || [];
    const hackathons = student.portfolio?.hackathons || [];
    const internships = student.portfolio?.internships || [];
    const certifications = student.portfolio?.certifications || [];

    const html = `
      <div style="font-family:Arial,sans-serif;padding:2rem;color:#222;">
        <h1 style="margin:0">${p.firstName || ''} ${p.lastName || ''}</h1>
        <p style="margin:0.3rem 0">${p.email || ''} ${p.phone ? '| ' + p.phone : ''}</p>
        ${p.linkedin ? `<p style="margin:0">LinkedIn: ${p.linkedin}</p>` : ''}
        ${p.github ? `<p style="margin:0">GitHub: ${p.github}</p>` : ''}
        ${skills.length > 0 ? `<h3 style="border-bottom:1px solid #ccc;padding-bottom:4px">Skills</h3>${skills.map(s => `<p><strong>${s.category}:</strong> ${s.skills || s.name}</p>`).join('')}` : ''}
        ${projects.length > 0 ? `<h3 style="border-bottom:1px solid #ccc;padding-bottom:4px">Projects</h3>${projects.map(pr => `<p><strong>${pr.title}</strong> - ${pr.description || ''}<br/><em>${pr.technologies || ''}</em></p>`).join('')}` : ''}
        ${internships.length > 0 ? `<h3 style="border-bottom:1px solid #ccc;padding-bottom:4px">Experience</h3>${internships.map(i => `<p><strong>${i.role}</strong> at ${i.company} (${i.duration || ''})<br/>${i.work || ''}</p>`).join('')}` : ''}
        ${hackathons.length > 0 ? `<h3 style="border-bottom:1px solid #ccc;padding-bottom:4px">Hackathons</h3>${hackathons.map(h => `<p><strong>${h.name}</strong> - ${h.summary || ''}</p>`).join('')}` : ''}
        ${certifications.length > 0 ? `<h3 style="border-bottom:1px solid #ccc;padding-bottom:4px">Certifications</h3>${certifications.map(c => `<p><strong>${c.name}</strong> - ${c.issueDate || ''}</p>`).join('')}` : ''}
      </div>`;

    const el = document.createElement('div');
    el.innerHTML = html;
    html2pdf().set({
      margin: 0.5,
      filename: `${p.firstName || 'Student'}_${p.lastName || ''}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(el).save();
  };

  return (
    <div className="dashboard">
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      {loading && <div style={{position:'fixed',top:0,left:0,right:0,height:'3px',background:'#667eea',zIndex:9999}}></div>}
      <div className="sidebar">
        <div className="sidebar-header">🏫 Admin Panel</div>
        <nav className="sidebar-nav">
          <button 
            className={activeSection === 'overview' ? 'active' : ''}
            onClick={() => setActiveSection('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={activeSection === 'students' ? 'active' : ''}
            onClick={() => setActiveSection('students')}
          >
            🎓 Students
          </button>
          <button 
            className={activeSection === 'projects' ? 'active' : ''}
            onClick={() => setActiveSection('projects')}
          >
            📁 Project Submissions
          </button>
          <button 
            className={activeSection === 'givefeedback' ? 'active' : ''}
            onClick={() => setActiveSection('givefeedback')}
          >
            💬 Give Feedback
          </button>
          <button 
            className={activeSection === 'reports' ? 'active' : ''}
            onClick={() => setActiveSection('reports')}
          >
            📈 Reports & Analytics
          </button>
          <button 
            className={activeSection === 'achievements' ? 'active' : ''}
            onClick={() => setActiveSection('achievements')}
          >
            🏆 Achievements
          </button>
          <button 
            className={activeSection === 'profile' ? 'active' : ''}
            onClick={() => setActiveSection('profile')}
          >
            👤 Profile
          </button>
        </nav>
        <button className="logout-btn-sidebar" onClick={onLogout}>Logout</button>
      </div>

      <div className="main-content">
        <header className="content-header">
          <h1>
            {activeSection === 'overview' ? '📊 Overview' : 
             activeSection === 'students' ? '🎓 Students Management' : 
             activeSection === 'profile' ? '👤 Profile Settings' :
             activeSection === 'givefeedback' ? '💬 Give Feedback' :
             activeSection === 'reports' ? '📈 Reports & Analytics' :
             activeSection === 'achievements' ? '🏆 Achievements' :
             '📁 Project Submissions'}
          </h1>
          <div className="user-info">
            <span>Welcome, {user.name || 'Admin'}</span>
          </div>
        </header>

        <div className="content-body">
          {activeSection === 'overview' && (
            <>
              <div className="stats-grid">
                <div className="stat-card"><h3>{analytics.totalStudents || students.length}</h3><p>Total Students</p></div>
                <div className="stat-card"><h3>{analytics.totalProjects || projects.length}</h3><p>Total Projects</p></div>
                <div className="stat-card"><h3>{analytics.pendingProjects ?? projects.filter(p => p.status === 'pending').length}</h3><p>Pending Review</p></div>
                <div className="stat-card"><h3>{analytics.approvedProjects ?? projects.filter(p => p.status === 'approved').length}</h3><p>Approved</p></div>
              </div>

              <div className="project-summary-bar" style={{marginBottom:'1.5rem'}}>
                <div className="project-summary-item"><span className="ps-count">{projects.length}</span><span className="ps-label">Total</span></div>
                <div className="project-summary-item"><span className="ps-count ps-inprogress">{projects.filter(p=>p.status==='approved').length}</span><span className="ps-label">Approved</span></div>
                <div className="project-summary-item"><span className="ps-count ps-hold">{projects.filter(p=>p.status==='pending').length}</span><span className="ps-label">Pending</span></div>
                <div className="project-summary-item"><span className="ps-count" style={{color:'#dc3545'}}>{projects.filter(p=>p.status==='rejected').length}</span><span className="ps-label">Rejected</span></div>
                <div className="project-summary-item"><span className="ps-count ps-done">{projects.filter(p=>p.grade).length}</span><span className="ps-label">Graded</span></div>
              </div>

              <div className="section">
                <h2>Recent Activity</h2>
                <div className="activity-list">
                  {projects.length > 0 ? (
                    <>
                      <div className="activity-item"><span className="activity-icon">📝</span><div><strong>New project submitted</strong><p>{projects[projects.length-1]?.studentName} submitted "{projects[projects.length-1]?.title}"</p></div></div>
                      {projects.filter(p => p.status === 'approved').length > 0 && (
                        <div className="activity-item"><span className="activity-icon">✅</span><div><strong>Project approved</strong><p>"{projects.find(p => p.status === 'approved')?.title}" has been approved</p></div></div>
                      )}
                    </>
                  ) : (
                    <div className="activity-item"><span className="activity-icon">📋</span><div><strong>No recent activity</strong><p>No projects submitted yet</p></div></div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeSection === 'students' && (
            <div className="section">
              <div className="section-header">
                <h2>Student List</h2>
                <button className="add-btn" onClick={() => setShowStudentModal(true)}>+ Add Student</button>
              </div>
              <div className="student-filters">
                <input
                  className="student-search"
                  placeholder="🔍 Search by name or email..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
                <select value={studentDeptFilter} onChange={e => setStudentDeptFilter(e.target.value)}>
                  <option value="all">All Departments</option>
                  {[...new Set(students.map(s => s.department).filter(Boolean))].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={studentYearFilter} onChange={e => setStudentYearFilter(e.target.value)}>
                  <option value="all">All Years</option>
                  {['1st Year','2nd Year','3rd Year','4th Year'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={studentStatusFilter} onChange={e => setStudentStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Honours">Honours</option>
                  <option value="Probation">Probation</option>
                </select>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Year</th>
                      <th>Projects</th>
                      <th>GPA</th>
                      <th>Last Active</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter(s =>
                        (studentSearch === '' || (`${s.firstName} ${s.lastName}`).toLowerCase().includes(studentSearch.toLowerCase()) || (s.email||'').toLowerCase().includes(studentSearch.toLowerCase())) &&
                        (studentDeptFilter === 'all' || s.department === studentDeptFilter) &&
                        (studentYearFilter === 'all' || s.year === studentYearFilter) &&
                        (studentStatusFilter === 'all' || s.studentStatus === studentStatusFilter)
                      )
                      .map(student => (
                        <tr key={student.userId || student.id}>
                          <td><strong>{student.firstName} {student.lastName}</strong></td>
                          <td>{student.email}</td>
                          <td>{student.department || '—'}</td>
                          <td>{student.year || '—'}</td>
                          <td>{student.projectCount ?? 0}</td>
                          <td>{student.gpa ? <span className={`gpa-badge gpa-${student.gpa >= 3.5 ? 'high' : student.gpa >= 2.5 ? 'mid' : 'low'}`}>{student.gpa}</span> : '—'}</td>
                          <td>{student.lastActive || '—'}</td>
                          <td><span className={`student-status-badge sstatus-${(student.studentStatus||'Active').toLowerCase()}`}>{student.studentStatus || 'Active'}</span></td>
                          <td>
                            <button className="view-btn-small" onClick={() => handleViewPortfolio(student)} title="View Profile">👁️ Profile</button>
                            <button className="edit-btn-small" onClick={() => handleEditStudent(student)}>✏️</button>
                            <button className="download-btn-small" onClick={() => handleDownloadResume(student)} title="Download Resume">📥</button>
                            <button className="delete-btn-small" onClick={() => handleDeleteStudent(student.userId || student.id)}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'projects' && (
            <div className="section">
              <h2>All Project Submissions</h2>
              <div className="student-filters" style={{marginBottom:'1.5rem'}}>
                <select value={submissionSubjectFilter} onChange={e => setSubmissionSubjectFilter(e.target.value)}>
                  <option value="all">All Subjects</option>
                  {[...new Set(projects.map(p => p.subject).filter(Boolean))].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={submissionStatusFilter} onChange={e => setSubmissionStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="projects-grid">
                {projects
                  .filter(p =>
                    (submissionSubjectFilter === 'all' || p.subject === submissionSubjectFilter) &&
                    (submissionStatusFilter === 'all' || p.status === submissionStatusFilter)
                  )
                  .map(project => {
                    const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed';
                    return (
                    <div key={project.id} className={`project-card ${isOverdue ? 'project-overdue' : ''}`}>
                      <div className="project-card-badges">
                        {project.priority && <span className={`priority-badge priority-${project.priority}`}>{project.priority==='high'?'🔴 High':project.priority==='medium'?'🟡 Medium':'🟢 Low'}</span>}
                        <span className={`status-badge status-${project.status}`}>{project.status}</span>
                        {isOverdue && <span className="overdue-badge">⚠️ Overdue</span>}
                      </div>
                      <h3>{project.title}</h3>
                      <p><strong>Student:</strong> {project.studentName || project.student}</p>
                      {project.subject && <p><strong>Subject:</strong> {project.subject}</p>}
                      <p>{project.description}</p>
                      {project.technologies && <p><strong>Tech:</strong> <span style={{display:'flex',flexWrap:'wrap',gap:'0.3rem',marginTop:'0.3rem'}}>{project.technologies.split(',').map((t,i)=>t.trim()&&<span key={i} className="tech-tag">{t.trim()}</span>)}</span></p>}
                      {project.deadline && <p className={isOverdue?'deadline-overdue':'deadline-ok'}>📅 <strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>}
                      {project.grade
                        ? <p><strong>Grade:</strong> <span className={`grade-badge grade-${(project.grade||'').replace('+','plus')}`}>{project.grade}</span></p>
                        : <p><strong>Grade:</strong> <span className="grade-badge grade-pending">⏳ Not graded</span></p>}
                      <div style={{marginTop:'0.8rem'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.3rem'}}>
                          <strong style={{fontSize:'0.85rem'}}>Progress</strong>
                          <span className="progress-percent-badge">{project.progress}%</span>
                        </div>
                        <div className="progress-bar"><div className={`progress-fill ${project.progress===100?'progress-complete':project.progress>=60?'progress-high':project.progress>=30?'progress-mid':''}`} style={{width:`${project.progress}%`}}></div></div>
                      </div>
                      {project.milestones && project.milestones.length > 0 && (
                        <div className="milestones-box">
                          <strong>📌 Milestones</strong>
                          <div style={{marginTop:'0.4rem'}}>
                            {project.milestones.map((ms,i)=>(
                              <div key={i} className={`milestone-row milestone-${ms.state}`}>
                                <span className="milestone-dot">{ms.state==='done'?'✅':ms.state==='active'?'🔄':'⏳'}</span>
                                <span className="milestone-title">{ms.title}</span>
                                {ms.due&&<span className="milestone-due">📅 {ms.due}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {project.feedback.length > 0 && (
                        <div style={{marginTop:'0.8rem'}}>
                          <strong style={{fontSize:'0.85rem'}}>💬 Feedback:</strong>
                          {project.feedback.map((fb, idx) => (
                            <div key={idx} className="feedback-item">
                              <strong>{fb.adminName}:</strong> {fb.message}
                              {fb.strengths && <p style={{margin:'0.2rem 0 0',fontSize:'0.8rem',color:'#28a745'}}>✅ {fb.strengths}</p>}
                              {fb.improve && <p style={{margin:'0.2rem 0 0',fontSize:'0.8rem',color:'#3b82f6'}}>📈 {fb.improve}</p>}
                              {fb.studentReply && <p style={{margin:'0.3rem 0 0',fontSize:'0.82rem',color:'var(--accent-purple)',borderLeft:'3px solid var(--accent-purple)',paddingLeft:'0.5rem'}}>↩ Student replied: {fb.studentReply}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="action-buttons">
                        <button className="view-btn" onClick={() => setViewingProjectDetails(project)}>👁️ View</button>
                        <button className="feedback-btn" onClick={() => { setGiveFeedbackProject(project); setActiveSection('givefeedback'); }}>💬 Review</button>
                        <button className="approve-btn" onClick={() => handleApprove(project.id)} style={{opacity:project.status==='approved'?0.5:1}}>✓ Approve</button>
                        <button className="reject-btn" onClick={() => handleReject(project.id)} style={{opacity:project.status==='rejected'?0.5:1}}>✗ Reject</button>
                        <button className="delete-btn" onClick={() => handleDeleteProject(project.id)}>🗑️ Delete</button>
                      </div>
                    </div>
                  )}
                )}
              </div>
            </div>
          )}

          {activeSection === 'givefeedback' && (
            <div className="gf-layout">
              <div className="gf-main">
                <div className="section">
                  <h2>💬 Give Feedback</h2>
                  {!giveFeedbackProject ? (
                    <>
                      <p style={{color:'var(--text-secondary)',marginBottom:'1rem'}}>Select a project to give structured feedback:</p>
                      <div className="projects-grid">
                        {projects.map(p => (
                          <div key={p.id} className="project-card" style={{cursor:'pointer'}} onClick={() => setGiveFeedbackProject(p)}>
                            <div className="project-header">
                              <h3>{p.title}</h3>
                              <span className={`status-badge status-${p.status}`}>{p.status}</span>
                            </div>
                            <p><strong>Student:</strong> {p.student}</p>
                            <p>{p.description}</p>
                            <div className="progress-bar"><div className="progress-fill" style={{width:`${p.progress}%`}}></div></div>
                            <p style={{fontSize:'0.85rem',marginTop:'0.4rem'}}>Progress: {p.progress}%</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="gf-form">
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                        <h3>Feedback for: <span style={{color:'var(--accent-purple)'}}>{giveFeedbackProject.title}</span></h3>
                        <button className="cancel-btn" onClick={() => setGiveFeedbackProject(null)}>← Back</button>
                      </div>

                      <div className="form-group">
                        <label>⭐ Star Rating</label>
                        <div style={{display:'flex',gap:'0.5rem',fontSize:'2rem',cursor:'pointer'}}>
                          {[1,2,3,4,5].map(s => (
                            <span key={s} onClick={() => setGfRating(s)} style={{color: s <= gfRating ? '#ffc107' : 'var(--border)', transition:'color 0.2s'}}>★</span>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>🎓 Grade</label>
                        <select value={gfGrade} onChange={e => setGfGrade(e.target.value)}>
                          <option value="">-- Select Grade --</option>
                          {['A+','A','B+','B','C+','C','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>💬 Comment</label>
                        <textarea value={gfComment} onChange={e => setGfComment(e.target.value)} placeholder="Overall feedback comment..." rows={4} />
                      </div>

                      <div className="form-group">
                        <label>✅ Strengths</label>
                        <textarea value={gfStrengths} onChange={e => setGfStrengths(e.target.value)} placeholder="What did the student do well?" rows={3} />
                      </div>

                      <div className="form-group">
                        <label>📈 Areas to Improve</label>
                        <textarea value={gfImprove} onChange={e => setGfImprove(e.target.value)} placeholder="What can be improved?" rows={3} />
                      </div>

                      <div className="form-actions">
                        <button className="cancel-btn" onClick={() => setGiveFeedbackProject(null)}>Cancel</button>
                        <button className="add-btn" onClick={handleGiveFeedbackSubmit}>✅ Submit Feedback</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {giveFeedbackProject && (
                <div className="gf-sidebar">
                  <div className="section" style={{marginBottom:'1rem'}}>
                    <h3>👤 Student Profile</h3>
                    {(() => {
                      const st = students.find(s => `${s.firstName} ${s.lastName}` === (giveFeedbackProject.studentName || giveFeedbackProject.student));
                      return st ? (
                        <div>
                          <p><strong>{st.firstName} {st.lastName}</strong></p>
                          <p style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>{st.email}</p>
                          <p style={{fontSize:'0.85rem'}}>{st.department} · {st.year}</p>
                          <p style={{fontSize:'0.85rem'}}>GPA: <strong>{st.gpa || '—'}</strong></p>
                          <p style={{fontSize:'0.85rem'}}>Projects: <strong>{st.projectCount ?? 0}</strong></p>
                          <span className={`student-status-badge sstatus-${(st.studentStatus||'Active').toLowerCase()}`}>{st.studentStatus || 'Active'}</span>
                        </div>
                      ) : <p style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>Student: {giveFeedbackProject.studentName}</p>;
                    })()}
                  </div>
                  <div className="section">
                    <h3>📁 Other Projects</h3>
                    {projects.filter(p => (p.studentName || p.student) === (giveFeedbackProject.studentName || giveFeedbackProject.student) && p.id !== giveFeedbackProject.id).length === 0
                      ? <p style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>No other projects.</p>
                      : projects.filter(p => (p.studentName || p.student) === (giveFeedbackProject.studentName || giveFeedbackProject.student) && p.id !== giveFeedbackProject.id).map(p => (
                          <div key={p.id} style={{padding:'0.7rem',background:'var(--glass-bg)',borderRadius:'10px',marginBottom:'0.5rem',border:'1px solid var(--glass-border)'}}>
                            <p style={{margin:0,fontWeight:600,fontSize:'0.9rem'}}>{p.title}</p>
                            <span className={`status-badge status-${p.status}`} style={{fontSize:'0.75rem'}}>{p.status}</span>
                            {p.grade && <span style={{marginLeft:'0.5rem',fontWeight:700,fontSize:'0.85rem',color:'#28a745'}}>{p.grade}</span>}
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'reports' && (
            <div className="section">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h2>📈 Reports & Analytics</h2>
                <button className="add-btn" onClick={handleExportPDF}>📄 Export PDF</button>
              </div>
              <div id="reports-content">
                <div className="reports-grid">
                  <div className="report-card">
                    <h3>📊 Submissions (Last 6 Months)</h3>
                    <div className="bar-chart">
                      {monthlySubmissions.map(m => (
                        <div key={m.month} className="bar-col">
                          <div className="bar-fill" style={{height:`${(m.count/maxBar)*140}px`}}>
                            <span className="bar-val">{m.count}</span>
                          </div>
                          <span className="bar-label">{m.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="report-card">
                    <h3>🏫 Department Breakdown</h3>
                    {Object.entries(deptBreakdown).map(([dept, count]) => (
                      <div key={dept} style={{marginBottom:'0.8rem'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.3rem'}}>
                          <span style={{fontSize:'0.9rem',color:'var(--text-primary)'}}>{dept}</span>
                          <span style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>{Math.round((count/totalStudents)*100)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width:`${(count/totalStudents)*100}%`}}></div>
                        </div>
                      </div>
                    ))}
                    {Object.keys(deptBreakdown).length === 0 && <p style={{color:'var(--text-secondary)',fontSize:'0.9rem'}}>No department data.</p>}
                  </div>

                  <div className="report-card">
                    <h3>🎓 Grade Distribution</h3>
                    {allGrades.length === 0 ? (
                      <p style={{color:'var(--text-secondary)',fontSize:'0.9rem'}}>No grades assigned yet.</p>
                    ) : (
                      Object.entries(gradeGroups).map(([g, count]) => (
                        <div key={g} style={{marginBottom:'0.8rem'}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.3rem'}}>
                            <span style={{fontSize:'0.9rem',color:'var(--text-primary)',fontWeight:600}}>Grade {g}</span>
                            <span style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>{Math.round((count/totalGrades)*100)}% ({count})</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{width:`${(count/totalGrades)*100}%`, background: g==='A'?'#28a745':g==='B'?'#3b82f6':g==='C'?'#ffc107':'#dc3545'}}></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="report-card">
                    <h3>📋 Summary</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.8rem'}}>
                      <div className="report-stat"><span>Total Students</span><strong>{students.length}</strong></div>
                      <div className="report-stat"><span>Total Submissions</span><strong>{projects.length}</strong></div>
                      <div className="report-stat"><span>Pending Review</span><strong>{projects.filter(p=>p.status==='pending').length}</strong></div>
                      <div className="report-stat"><span>Approved</span><strong style={{color:'#28a745'}}>{projects.filter(p=>p.status==='approved').length}</strong></div>
                      <div className="report-stat"><span>Rejected</span><strong style={{color:'#dc3545'}}>{projects.filter(p=>p.status==='rejected').length}</strong></div>
                      <div className="report-stat"><span>Graded</span><strong>{allGrades.length}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'achievements' && (
            <div className="section">
              <h2>🏆 Student Achievements Overview</h2>
              <p style={{color:'var(--text-secondary)',marginBottom:'1.5rem'}}>Overview of student badges and milestones earned across the platform.</p>
              <div className="reports-grid">
                <div className="report-card">
                  <h3>📊 Badge Stats</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:'0.8rem'}}>
                    <div className="report-stat"><span>🚀 First Upload</span><strong>{projects.length >= 1 ? '✅ Earned' : '🔒 Locked'}</strong></div>
                    <div className="report-stat"><span>🔥 Streak (3+ projects)</span><strong>{projects.length >= 3 ? '✅ Earned' : '🔒 Locked'}</strong></div>
                    <div className="report-stat"><span>🥇 Gold Tier (A/A+ grade)</span><strong>{projects.some(p=>p.grade==='A'||p.grade==='A+') ? '✅ Earned' : '🔒 Locked'}</strong></div>
                    <div className="report-stat"><span>⭐ Top Rated (5-star)</span><strong>{projects.some(p=>p.feedback?.some(f=>f.rating===5)) ? '✅ Earned' : '🔒 Locked'}</strong></div>
                    <div className="report-stat"><span>✅ Completionist (2+ done)</span><strong>{projects.filter(p=>p.status==='completed').length >= 2 ? '✅ Earned' : '🔒 Locked'}</strong></div>
                  </div>
                </div>
                <div className="report-card">
                  <h3>📌 Milestone Progress</h3>
                  {projects.filter(p=>p.milestones&&p.milestones.length>0).length === 0
                    ? <p style={{color:'var(--text-secondary)',fontSize:'0.9rem'}}>No milestones set yet.</p>
                    : projects.filter(p=>p.milestones&&p.milestones.length>0).map(p=>(
                        <div key={p.id} style={{marginBottom:'1rem'}}>
                          <p style={{fontWeight:600,marginBottom:'0.4rem'}}>{p.title} <span style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>({p.student})</span></p>
                          {p.milestones.map((ms,i)=>(
                            <div key={i} className={`milestone-row milestone-${ms.state}`}>
                              <span className="milestone-dot">{ms.state==='done'?'✅':ms.state==='active'?'🔄':'⏳'}</span>
                              <span className="milestone-title">{ms.title}</span>
                              {ms.due&&<span className="milestone-due">📅 {ms.due}</span>}
                            </div>
                          ))}
                        </div>
                      ))
                  }
                </div>
                <div className="report-card">
                  <h3>🔄 Project Status Breakdown</h3>
                  {[['approved','✅ Approved','#28a745'],['pending','⏳ Pending','#ffc107'],['rejected','❌ Rejected','#dc3545']].map(([s,label,color])=>(
                    <div key={s} style={{marginBottom:'0.8rem'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.3rem'}}>
                        <span style={{fontSize:'0.9rem',color:'var(--text-primary)'}}>{label}</span>
                        <span style={{fontSize:'0.85rem',color}}>{projects.filter(p=>p.status===s).length}</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{width:`${(projects.filter(p=>p.status===s).length/(projects.length||1))*100}%`,background:color}}></div></div>
                    </div>
                  ))}
                </div>
                <div className="report-card">
                  <h3>🎓 Top Students by Projects</h3>
                  {students.length > 0 ? students.sort((a,b)=>(b.projectCount||0)-(a.projectCount||0)).slice(0,5).map(s=>(
                    <div key={s.userId} className="report-stat">
                      <span>{s.firstName} {s.lastName} <span style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{s.department}</span></span>
                      <strong>{s.projectCount || 0} projects</strong>
                    </div>
                  )) : (
                    <p style={{color:'var(--text-secondary)',fontSize:'0.9rem'}}>No students registered yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="section">
              <div className="profile-header-section">
                <h2>Admin Profile</h2>
                {!isEditingProfile && (
                  <button className="edit-btn" onClick={() => setIsEditingProfile(true)}>✏️ Edit Profile</button>
                )}
              </div>
              
              <div className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={adminProfile.fullName}
                    onChange={(e) => setAdminProfile({...adminProfile, fullName: e.target.value})}
                    disabled={!isEditingProfile}
                  />
                </div>
                <div className="form-group">
                  <label>Institution</label>
                  <input 
                    type="text" 
                    value={adminProfile.institution}
                    onChange={(e) => setAdminProfile({...adminProfile, institution: e.target.value})}
                    disabled={!isEditingProfile}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={adminProfile.email}
                    onChange={(e) => setAdminProfile({...adminProfile, email: e.target.value})}
                    disabled={!isEditingProfile}
                  />
                </div>
                {isEditingProfile && (
                  <button className="save-btn" onClick={handleSaveProfile}>💾 Save Profile</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
        <div className="modal" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Feedback</h2>
            <div className="form-group">
              <label>Assign Grade</label>
              <select value={feedbackGrade} onChange={(e) => setFeedbackGrade(e.target.value)}>
                <option value="">-- Select Grade --</option>
                {['A+','A','B+','B','C+','C','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Star Rating</label>
              <div style={{display:'flex', gap:'0.4rem', fontSize:'1.6rem', cursor:'pointer'}}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} onClick={() => setFeedbackRating(s)} style={{color: s <= feedbackRating ? '#ffc107' : '#ccc', transition:'color 0.2s'}}>★</span>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Your Feedback</label>
              <textarea 
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Enter your feedback here..."
              />
            </div>
            <div className="form-actions">
              <button className="cancel-btn" onClick={() => { setSelectedProject(null); setFeedbackRating(0); setFeedbackGrade(''); }}>Cancel</button>
              <button className="add-btn" onClick={() => handleAddFeedback(selectedProject)}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {showStudentModal && (
        <div className="modal" onClick={closeStudentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingStudent ? 'Edit Student' : 'Add Student'}</h2>
            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Projects Count</label>
                <input 
                  type="number" 
                  value={studentForm.projects}
                  onChange={(e) => setStudentForm({...studentForm, projects: parseInt(e.target.value)})}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input type="text" value={studentForm.department} onChange={e=>setStudentForm({...studentForm,department:e.target.value})} placeholder="e.g., Computer Science" />
              </div>
              <div className="form-group">
                <label>Year</label>
                <select value={studentForm.year} onChange={e=>setStudentForm({...studentForm,year:e.target.value})}>
                  <option value="">-- Select Year --</option>
                  {['1st Year','2nd Year','3rd Year','4th Year'].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>GPA</label>
                <input type="number" step="0.01" min="0" max="4" value={studentForm.gpa} onChange={e=>setStudentForm({...studentForm,gpa:parseFloat(e.target.value)||''})} placeholder="e.g., 3.8" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={studentForm.studentStatus} onChange={e=>setStudentForm({...studentForm,studentStatus:e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Honours">Honours</option>
                  <option value="Probation">Probation</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeStudentModal}>Cancel</button>
                <button type="submit" className="add-btn">{editingStudent ? 'Update' : 'Add'} Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingProjectDetails && (
        <div className="modal" onClick={() => setViewingProjectDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📁 Project Details</h2>
            <div className="project-details">
              <div className="form-group">
                <label><strong>Title:</strong></label>
                <p>{viewingProjectDetails.title}</p>
              </div>
              <div className="form-group">
                <label><strong>Student:</strong></label>
                <p>{viewingProjectDetails.student}</p>
              </div>
              <div className="form-group">
                <label><strong>Description:</strong></label>
                <p>{viewingProjectDetails.description}</p>
              </div>
              <div className="form-group">
                <label><strong>Status:</strong></label>
                <p className={`status-badge status-${viewingProjectDetails.status}`}>{viewingProjectDetails.status}</p>
              </div>
              <div className="form-group">
                <label><strong>Progress:</strong></label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${viewingProjectDetails.progress}%` }}></div>
                </div>
                <p>{viewingProjectDetails.progress}%</p>
              </div>
              {viewingProjectDetails.demo && (
                <div className="form-group">
                  <label><strong>Demo Link:</strong></label>
                  <p><a href={viewingProjectDetails.demo} target="_blank" rel="noreferrer">🔗 {viewingProjectDetails.demo}</a></p>
                </div>
              )}
              {viewingProjectDetails.github && (
                <div className="form-group">
                  <label><strong>GitHub Link:</strong></label>
                  <p><a href={viewingProjectDetails.github} target="_blank" rel="noreferrer">💻 {viewingProjectDetails.github}</a></p>
                </div>
              )}
              {viewingProjectDetails.projectFile && (
                <div className="form-group">
                  <label><strong>Project File:</strong></label>
                  <button className="download-btn" onClick={() => handleDownloadFile(viewingProjectDetails.projectFile, viewingProjectDetails.projectFile.name)}>
                    📥 Download {viewingProjectDetails.projectFile.name}
                  </button>
                </div>
              )}
              {viewingProjectDetails.screenshot && (
                <div className="form-group">
                  <label><strong>Screenshot:</strong></label>
                  <button className="download-btn" onClick={() => handleDownloadFile(viewingProjectDetails.screenshot, viewingProjectDetails.screenshot.name)}>
                    📥 Download {viewingProjectDetails.screenshot.name}
                  </button>
                </div>
              )}
            </div>
            <div className="form-actions">
              <button className="cancel-btn" onClick={() => setViewingProjectDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {viewingPortfolio && (
        <div className="modal portfolio-modal" onClick={() => setViewingPortfolio(null)}>
          <div className="modal-content portfolio-content" onClick={(e) => e.stopPropagation()}>
            <div className="portfolio-header">
              <h2>📋 {viewingPortfolio.name}'s Portfolio</h2>
              <button className="close-btn" onClick={() => setViewingPortfolio(null)}>✕</button>
            </div>

            <div className="portfolio-sections">
              <div className="portfolio-section">
                <h3>👤 Personal Information</h3>
                <div className="info-display">
                  <p><strong>Name:</strong> {viewingPortfolio.portfolio.personalInfo.firstName} {viewingPortfolio.portfolio.personalInfo.lastName}</p>
                  <p><strong>Email:</strong> {viewingPortfolio.portfolio.personalInfo.email}</p>
                  <p><strong>Phone:</strong> {viewingPortfolio.portfolio.personalInfo.phone || 'Not provided'}</p>
                  {viewingPortfolio.portfolio.personalInfo.linkedin && (
                    <p><strong>LinkedIn:</strong> <a href={viewingPortfolio.portfolio.personalInfo.linkedin} target="_blank" rel="noreferrer">{viewingPortfolio.portfolio.personalInfo.linkedin}</a></p>
                  )}
                  {viewingPortfolio.portfolio.personalInfo.github && (
                    <p><strong>GitHub:</strong> <a href={viewingPortfolio.portfolio.personalInfo.github} target="_blank" rel="noreferrer">{viewingPortfolio.portfolio.personalInfo.github}</a></p>
                  )}
                </div>
                <button className="download-btn-small" onClick={() => handleDownloadResume(viewingPortfolio)}>📥 Download Resume</button>
              </div>

              <div className="portfolio-section">
                <h3>💻 Skills ({viewingPortfolio.portfolio.skills.length})</h3>
                {viewingPortfolio.portfolio.skills.map(skill => (
                  <div key={skill.id} className="portfolio-item">
                    <div>
                      <strong>{skill.category}:</strong> {skill.name}
                    </div>
                    <button className="delete-btn-small" onClick={() => handleDeletePortfolioItem('skills', skill.id)}>🗑️</button>
                  </div>
                ))}
                <button className="feedback-btn-small" onClick={() => setFeedbackSection('skills')}>💬 Feedback</button>
              </div>

              <div className="portfolio-section">
                <h3>📁 Projects ({viewingPortfolio.portfolio.projects.length})</h3>
                {viewingPortfolio.portfolio.projects.map(project => (
                  <div key={project.id} className="portfolio-item">
                    <div>
                      <strong>{project.title}</strong>
                      <p>{project.description}</p>
                      {project.demo && <p><a href={project.demo} target="_blank" rel="noreferrer">🔗 Demo Link</a></p>}
                      {project.github && <p><a href={project.github} target="_blank" rel="noreferrer">💻 GitHub Link</a></p>}
                      {project.projectFile && (
                        <p>
                          <button className="download-btn-small" onClick={() => handleDownloadFile(project.projectFile, project.projectFile.name)}>📥 Download Project File</button>
                        </p>
                      )}
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                      </div>
                      <small>Progress: {project.progress}%</small>
                    </div>
                    <button className="delete-btn-small" onClick={() => handleDeletePortfolioItem('projects', project.id)}>🗑️</button>
                  </div>
                ))}
                <button className="feedback-btn-small" onClick={() => setFeedbackSection('projects')}>💬 Feedback</button>
              </div>

              <div className="portfolio-section">
                <h3>🏆 Hackathons ({viewingPortfolio.portfolio.hackathons.length})</h3>
                {viewingPortfolio.portfolio.hackathons.map(hackathon => (
                  <div key={hackathon.id} className="portfolio-item">
                    <div>
                      <strong>{hackathon.name}</strong>
                      <p>{hackathon.summary}</p>
                    </div>
                    <button className="delete-btn-small" onClick={() => handleDeletePortfolioItem('hackathons', hackathon.id)}>🗑️</button>
                  </div>
                ))}
                {viewingPortfolio.portfolio.hackathons.length === 0 && <p className="empty-msg">No hackathons added</p>}
                <button className="feedback-btn-small" onClick={() => setFeedbackSection('hackathons')}>💬 Feedback</button>
              </div>

              <div className="portfolio-section">
                <h3>💼 Internships ({viewingPortfolio.portfolio.internships.length})</h3>
                {viewingPortfolio.portfolio.internships.map(internship => (
                  <div key={internship.id} className="portfolio-item">
                    <div>
                      <strong>{internship.role}</strong> at {internship.company}
                      <p>Duration: {internship.duration}</p>
                    </div>
                    <button className="delete-btn-small" onClick={() => handleDeletePortfolioItem('internships', internship.id)}>🗑️</button>
                  </div>
                ))}
                {viewingPortfolio.portfolio.internships.length === 0 && <p className="empty-msg">No internships added</p>}
                <button className="feedback-btn-small" onClick={() => setFeedbackSection('internships')}>💬 Feedback</button>
              </div>

              <div className="portfolio-section">
                <h3>📜 Certifications ({viewingPortfolio.portfolio.certifications.length})</h3>
                {viewingPortfolio.portfolio.certifications.map(cert => (
                  <div key={cert.id} className="portfolio-item">
                    <div>
                      <strong>{cert.name}</strong>
                      <p>Issued: {cert.issueDate}</p>
                    </div>
                    <button className="delete-btn-small" onClick={() => handleDeletePortfolioItem('certifications', cert.id)}>🗑️</button>
                  </div>
                ))}
                {viewingPortfolio.portfolio.certifications.length === 0 && <p className="empty-msg">No certifications added</p>}
                <button className="feedback-btn-small" onClick={() => setFeedbackSection('certifications')}>💬 Feedback</button>
              </div>

              {feedbackSection && (
                <div className="feedback-box">
                  <h4>Feedback for {feedbackSection}</h4>
                  <textarea 
                    value={portfolioFeedback}
                    onChange={(e) => setPortfolioFeedback(e.target.value)}
                    placeholder="Enter your feedback..."
                  />
                  <div className="form-actions">
                    <button className="cancel-btn" onClick={() => { setFeedbackSection(''); setPortfolioFeedback(''); }}>Cancel</button>
                    <button className="add-btn" onClick={() => handlePortfolioFeedback(feedbackSection)}>Send Feedback</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
