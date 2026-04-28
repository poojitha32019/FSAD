import { useState, useEffect, useCallback, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { useTheme } from '../ThemeContext';
import { studentAPI, fileURL } from '../api';
import './StudentDashboard.css';

function StudentDashboard({ user, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const userId = user.id;
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState({
    firstName: '', middleName: '', lastName: '', gender: '', dob: '', identification: '', languages: '', photo: null,
    contact: '', email: '', linkedin: '', github: '', summary: '',
    educationLevel: '',
    postGrad: { type: '', branch: '', institution: '', cgpa: '', doc: null },
    graduation: { type: '', branch: '', institution: '', cgpa: '', doc: null },
    preUniversity: { type: '', institution: '', marks: '', doc: null },
    secondary: { board: '', institution: '', marks: '', doc: null },
    technicalSkills: [], softSkills: [], resume: null
  });
  const [projects, setProjects] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [internships, setInternships] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [photoFile, setPhotoFile] = useState(null); // stores actual File for upload
  const [projectFilter, setProjectFilter] = useState('all');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyInputs, setReplyInputs] = useState({});
  const [badgePopup, setBadgePopup] = useState(null);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', error: false });

  // Load all data from backend on mount
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, projectsRes, skillsRes, hackathonsRes, internshipsRes, certsRes, feedbackRes] = await Promise.all([
        studentAPI.getProfile(userId).catch(() => null),
        studentAPI.getProjects(userId).catch(() => ({ data: [] })),
        studentAPI.getSkills(userId).catch(() => ({ data: [] })),
        studentAPI.getHackathons(userId).catch(() => ({ data: [] })),
        studentAPI.getInternships(userId).catch(() => ({ data: [] })),
        studentAPI.getCertifications(userId).catch(() => ({ data: [] })),
        studentAPI.getFeedback(userId).catch(() => ({ data: [] })),
      ]);

      if (profileRes?.data) {
        const p = profileRes.data;
        setPortfolio(prev => ({
          ...prev,
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          email: p.email || '',
          gender: p.gender || '',
          dob: p.dob || '',
          identification: p.identification || '',
          languages: p.languages || '',
          contact: p.contact || '',
          linkedin: p.linkedin || '',
          github: p.github || '',
          summary: p.summary || '',
          educationLevel: p.educationLevel || '',
          photo: p.photoPath ? fileURL(p.photoPath) : null,
          year: p.year || '',
          postGrad: { type: p.postGradType || '', branch: p.postGradSpecialization || '', specialization: p.postGradSpecialization || '', institution: p.postGradInstitution || '', cgpa: p.postGradCgpa || '', doc: null },
          graduation: { type: p.gradType || '', branch: p.gradSpecialization || '', specialization: p.gradSpecialization || '', institution: p.gradInstitution || '', cgpa: p.gradCgpa || '', doc: null },
          preUniversity: { type: p.preUniType || '', institution: p.preUniInstitution || '', marks: p.preUniMarks || '', doc: null },
          secondary: { board: p.secondaryBoard || '', institution: p.secondaryInstitution || '', marks: p.secondaryMarks || '', doc: null },
          technicalSkills: skillsRes?.data || [],
        }));
      }

      const projectsData = projectsRes?.data || [];
      const projectsWithFeedback = await Promise.all(projectsData.map(async (p) => {
        try {
          const fbRes = await studentAPI.getProjectFeedback(userId, p.id);
          return { ...p, github: p.githubLink, milestones: p.milestones ? JSON.parse(p.milestones) : [], feedback: fbRes.data || [] };
        } catch {
          return { ...p, github: p.githubLink, milestones: p.milestones ? JSON.parse(p.milestones) : [], feedback: [] };
        }
      }));
      setProjects(projectsWithFeedback);
      setHackathons(hackathonsRes?.data || []);
      setInternships(internshipsRes?.data || []);
      setCertifications(certsRes?.data || []);
      setFeedbackList(feedbackRes?.data || []);

      // Load feedback for each project inline
      const projectList = projectsRes?.data || [];
      const feedbackPerProject = await Promise.all(
        projectList.map(p => studentAPI.getProjectFeedback(userId, p.id).catch(() => ({ data: [] })))
      );
      setProjects(projectList.map((p, i) => ({
        ...p,
        github: p.githubLink,
        milestones: p.milestones ? JSON.parse(p.milestones) : [],
        feedback: feedbackPerProject[i]?.data || [],
      })));
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  const prevEarnedRef = useRef(null);

  const BADGES = [
    { id: 'first_upload', icon: '🚀', label: 'First Upload', desc: 'Uploaded your first project', earned: () => projects.length >= 1 },
    { id: 'gold_tier', icon: '🥇', label: 'Gold Tier', desc: 'Achieved top grade on a project', earned: () => projects.some(p => p.grade === 'A+' || p.grade === 'A') },
    { id: 'streak', icon: '🔥', label: 'Streak', desc: 'Added 3+ projects', earned: () => projects.length >= 3 },
    { id: 'top_rated', icon: '⭐', label: 'Top Rated', desc: 'Received 5-star feedback', earned: () => projects.some(p => p.feedback?.some(f => f.rating === 5)) },
    { id: 'polyglot', icon: '🌐', label: 'Polyglot Coder', desc: 'Used 3+ different technologies', earned: () => new Set(projects.flatMap(p => (p.technologies||'').split(',').map(t=>t.trim().toLowerCase()).filter(Boolean))).size >= 3 },
    { id: 'completionist', icon: '✅', label: 'Completionist', desc: 'Completed 2+ projects', earned: () => projects.filter(p => p.status === 'completed').length >= 2 },
    { id: 'milestone_master', icon: '📌', label: 'Milestone Master', desc: 'Set milestones on a project', earned: () => projects.some(p => p.milestones?.length > 0) },
    { id: 'certified', icon: '🎓', label: 'Certified', desc: 'Added a certification', earned: () => certifications.length >= 1 },
  ];

  // Check for newly earned badges after data loads and show popup
  useEffect(() => {
    if (loading) return;
    const currentEarned = new Set(BADGES.filter(b => b.earned()).map(b => b.id));
    if (prevEarnedRef.current !== null) {
      const newlyEarned = BADGES.filter(b => currentEarned.has(b.id) && !prevEarnedRef.current.has(b.id));
      if (newlyEarned.length > 0) {
        setBadgePopup(newlyEarned[0]);
        setTimeout(() => setBadgePopup(null), 4000);
      }
    }
    prevEarnedRef.current = currentEarned;
  }, [projects, certifications, loading]);

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(item || {});
    setShowModal(true);
  };

  const handleReplySubmit = async (projectId, feedbackId, fbIndex) => {
    const key = `${projectId}-${fbIndex}`;
    const reply = replyInputs[key]?.trim();
    if (!reply) return;
    try {
      await studentAPI.replyToFeedback(userId, feedbackId, reply);
      setReplyingTo(null);
      setReplyInputs(prev => { const n = {...prev}; delete n[key]; return n; });
      await loadAllData();
    } catch (err) {
      console.error('Reply error:', err);
      alert('Failed to send reply.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (modalType === 'project') {
      if (!formData.title?.trim()) { alert('Project title is required!'); return; }
      if (!formData.description?.trim()) { alert('Project description is required!'); return; }
      if (!formData.technologies?.trim()) { alert('Technologies used is required!'); return; }
    }

    try {
      if (modalType === 'project') {
        const fd = new FormData();
        const projectData = {
          title: formData.title, description: formData.description,
          technologies: formData.technologies, role: formData.role,
          priority: formData.priority || 'medium', status: formData.status || 'not-started',
          progress: formData.progress || 0, deadline: formData.deadline,
          demo: formData.demo, githubLink: formData.github,
          subject: formData.subject,
          milestones: JSON.stringify(formData.milestones || []),
        };
        fd.append('project', new Blob([JSON.stringify(projectData)], { type: 'application/json' }));
        if (formData.screenshot instanceof File) fd.append('screenshot', formData.screenshot);
        if (formData.projectFile instanceof File) fd.append('projectFile', formData.projectFile);
        if (editingItem?.id) {
          await studentAPI.updateProject(userId, editingItem.id, fd);
        } else {
          await studentAPI.createProject(userId, fd);
        }
      } else if (modalType === 'hackathon') {
        if (!formData.name?.trim()) { alert('Hackathon name is required!'); return; }
        const fd = new FormData();
        fd.append('hackathon', new Blob([JSON.stringify({ id: editingItem?.id, name: formData.name, summary: formData.summary, website: formData.website })], { type: 'application/json' }));
        if (formData.certificate instanceof File) fd.append('certificate', formData.certificate);
        await studentAPI.saveHackathon(userId, fd);
      } else if (modalType === 'internship') {
        if (!formData.company?.trim()) { alert('Company name is required!'); return; }
        if (!formData.role?.trim()) { alert('Role is required!'); return; }
        await studentAPI.saveInternship(userId, { id: editingItem?.id, company: formData.company, role: formData.role, duration: formData.duration, work: formData.work });
      } else if (modalType === 'certification') {
        if (!formData.name?.trim()) { alert('Certification name is required!'); return; }
        if (!formData.issueDate) { alert('Issue date is required!'); return; }
        await studentAPI.saveCertification(userId, { id: editingItem?.id, name: formData.name, issueDate: formData.issueDate, expiryDate: formData.expiryDate, licenseId: formData.licenseId, link: formData.link });
      } else if (modalType === 'milestone') {
        const fd = new FormData();
        const projectData = { milestones: JSON.stringify(formData.milestones || []), progress: formData.progress, status: formData.status };
        fd.append('project', new Blob([JSON.stringify(projectData)], { type: 'application/json' }));
        await studentAPI.updateProject(userId, editingItem.id, fd);
      } else if (modalType === 'skill') {
        if (!formData.category) { alert('Skill category is required!'); return; }
        if (!formData.skills?.trim()) { alert('Skills are required!'); return; }
        await studentAPI.saveSkill(userId, { id: editingItem?.id, category: formData.category, skills: formData.skills, certLink: formData.certLink });
      }
      await loadAllData();
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save. Please try again.');
    }

    setShowModal(false);
    setFormData({});
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      const profileData = {
        firstName: portfolio.firstName,
        lastName: portfolio.lastName,
        gender: portfolio.gender, dob: portfolio.dob, identification: portfolio.identification,
        languages: portfolio.languages, contact: portfolio.contact, linkedin: portfolio.linkedin,
        github: portfolio.github, summary: portfolio.summary, educationLevel: portfolio.educationLevel,
        postGradType: portfolio.postGrad.type,
        postGradSpecialization: portfolio.postGrad.specialization || portfolio.postGrad.branch || '',
        postGradInstitution: portfolio.postGrad.institution, postGradCgpa: portfolio.postGrad.cgpa,
        gradType: portfolio.graduation.type,
        gradSpecialization: portfolio.graduation.specialization || portfolio.graduation.branch || '',
        gradInstitution: portfolio.graduation.institution, gradCgpa: portfolio.graduation.cgpa,
        preUniType: portfolio.preUniversity.type, preUniInstitution: portfolio.preUniversity.institution,
        preUniMarks: portfolio.preUniversity.marks, secondaryBoard: portfolio.secondary.board,
        secondaryInstitution: portfolio.secondary.institution, secondaryMarks: portfolio.secondary.marks,
        department: portfolio.graduation.specialization || portfolio.graduation.branch || '',
        year: portfolio.year || null,
        gpa: portfolio.graduation.cgpa ? parseFloat(portfolio.graduation.cgpa) : null,
      };
      fd.append('profile', new Blob([JSON.stringify(profileData)], { type: 'application/json' }));
      if (photoFile instanceof File) fd.append('photo', photoFile);
      if (portfolio.resume instanceof File) fd.append('resume', portfolio.resume);
      await studentAPI.saveProfile(userId, fd);
      await loadAllData();
      setIsEditingBasicInfo(false);
      setPhotoFile(null);
      alert('Portfolio saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save portfolio.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.querySelector('.resume-content');
    const opt = {
      margin: 0.5,
      filename: `${portfolio.firstName}_${portfolio.lastName}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'project') await studentAPI.deleteProject(userId, id);
      if (type === 'hackathon') await studentAPI.deleteHackathon(userId, id);
      if (type === 'internship') await studentAPI.deleteInternship(userId, id);
      if (type === 'certification') await studentAPI.deleteCertification(userId, id);
      if (type === 'skill') await studentAPI.deleteSkill(userId, id);
      await loadAllData();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete.');
    }
  };

  const renderContent = () => {
    switch(activeSection) {
      case 'overview':
        return (
          <div className="section">
            <h2>📊 Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card"><h3>{projects.length}</h3><p>Projects</p></div>
              <div className="stat-card"><h3>{hackathons.length}</h3><p>Hackathons</p></div>
              <div className="stat-card"><h3>{certifications.length}</h3><p>Certifications</p></div>
              <div className="stat-card"><h3>{portfolio.technicalSkills.length}</h3><p>Skills</p></div>
            </div>

            <div className="project-summary-bar" style={{marginTop:'1.5rem'}}>
              <div className="project-summary-item"><span className="ps-count">{projects.length}</span><span className="ps-label">Total</span></div>
              <div className="project-summary-item"><span className="ps-count ps-inprogress">{projects.filter(p=>p.status==='in-progress').length}</span><span className="ps-label">In Progress</span></div>
              <div className="project-summary-item"><span className="ps-count ps-done">{projects.filter(p=>p.status==='completed').length}</span><span className="ps-label">Completed</span></div>
              <div className="project-summary-item"><span className="ps-count ps-hold">{projects.filter(p=>p.status==='on-hold').length}</span><span className="ps-label">On Hold</span></div>
              <div className="project-summary-item"><span className="ps-count ps-notstarted">{projects.filter(p=>p.status==='not-started').length}</span><span className="ps-label">Not Started</span></div>
            </div>

            {projects.some(p=>p.grade) && (
              <div style={{marginTop:'1.5rem',background:'var(--glass-bg)',borderRadius:'16px',padding:'1.2rem',border:'1px solid var(--glass-border)'}}>
                <strong style={{color:'var(--text-primary)'}}>🎓 Grade Summary</strong>
                <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',marginTop:'0.8rem'}}>
                  {['A+','A','B+','B','C+','C','D','F'].map(g=>{
                    const cnt = projects.filter(p=>p.grade===g).length;
                    return cnt > 0 ? <span key={g} className={`grade-badge grade-${g.replace('+','plus')}`}>{g}: {cnt}</span> : null;
                  })}
                </div>
              </div>
            )}

            {projects.some(p=>p.feedback?.length>0) && (
              <div style={{marginTop:'1.5rem',background:'var(--glass-bg)',borderRadius:'16px',padding:'1.2rem',border:'1px solid var(--glass-border)'}}>
                <strong style={{color:'var(--text-primary)'}}>💬 Recent Feedback</strong>
                {projects.flatMap(p=>(p.feedback||[]).map(fb=>({...fb,title:p.title}))).slice(-2).map((fb,i)=>(
                  <div key={i} style={{marginTop:'0.6rem',padding:'0.6rem',background:'var(--bg-card)',borderRadius:'8px',borderLeft:'3px solid var(--accent-purple)'}}>
                    <p style={{margin:0,fontSize:'0.85rem'}}><strong>{fb.from}</strong> on <em>{fb.title}</em></p>
                    <p style={{margin:'0.2rem 0 0',fontSize:'0.85rem',color:'var(--text-secondary)'}}>{fb.message}</p>
                    {fb.strengths&&<p style={{margin:'0.2rem 0 0',fontSize:'0.8rem',color:'#28a745'}}>✅ {fb.strengths}</p>}
                    {fb.improve&&<p style={{margin:'0.2rem 0 0',fontSize:'0.8rem',color:'#3b82f6'}}>📈 {fb.improve}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'portfolio': {
        const postGradOptions = {
          'MBA': ['MBA Finance', 'MBA Marketing', 'MBA HR', 'MBA Operations'],
          'MTech': ['CSE', 'Mechanical', 'ECE', 'EEE', 'Civil']
        };
        const gradOptions = {
          'BTech': ['CSE', 'AIDS', 'ECE', 'ETE', 'EEE', 'Mechanical', 'Civil', 'Aerospace'],
          'BSc': ['Computer Science', 'Physics', 'Chemistry', 'Mathematics'],
          'BBA': ['General', 'Finance', 'Marketing'],
          'BCA': ['General']
        };
        
        return (
          <div className="section">
            <div className="section-header">
              <h2>📝 Basic Information</h2>

              {!isEditingBasicInfo ? (
                <button className="add-btn" onClick={() => setIsEditingBasicInfo(true)}>✏️ Edit</button>
              ) : (
                <button className="add-btn" onClick={saveProfile}>💾 Save</button>
              )}
            </div>
            
            <div className="info-card">
              <h3>👤 Personal Details</h3>
              <div className="form-group">
                <label>Upload Photo</label>
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setPhotoFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setPortfolio({...portfolio, photo: reader.result});
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{display: portfolio.photo ? 'none' : 'block'}}
                  disabled={!isEditingBasicInfo}
                />
                {portfolio.photo && (
                  <div style={{position: 'relative', display: 'inline-block'}}>
                    <img src={portfolio.photo} alt="Profile" style={{width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%', marginTop: '1rem'}} />
                    <button 
                      type="button"
                      onClick={() => setPortfolio({...portfolio, photo: null})}
                      style={{position: 'absolute', top: '1rem', right: '0', background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '1.2rem'}}
                    >×</button>
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input value={portfolio.firstName} onChange={(e) => setPortfolio({...portfolio, firstName: e.target.value})} required disabled={!isEditingBasicInfo} />
                </div>
                <div className="form-group">
                  <label>Middle Name</label>
                  <input value={portfolio.middleName} onChange={(e) => setPortfolio({...portfolio, middleName: e.target.value})} placeholder="Optional" disabled={!isEditingBasicInfo} />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input value={portfolio.lastName} onChange={(e) => setPortfolio({...portfolio, lastName: e.target.value})} required disabled={!isEditingBasicInfo} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select value={portfolio.gender} onChange={(e) => setPortfolio({...portfolio, gender: e.target.value})}>
                    <option value="">-- Select --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={portfolio.dob} onChange={(e) => setPortfolio({...portfolio, dob: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Identification (Aadhar/Passport/Other)</label>
                <input value={portfolio.identification} onChange={(e) => setPortfolio({...portfolio, identification: e.target.value})} placeholder="Enter ID number" />
              </div>
              <div className="form-group">
                <label>Languages Known</label>
                <input value={portfolio.languages} onChange={(e) => setPortfolio({...portfolio, languages: e.target.value})} placeholder="e.g., English, Hindi, Telugu" />
              </div>
            </div>

            <div className="info-card">
              <h3>🎓 Education Level</h3>
              <div className="form-group">
                <label>Select Education Level</label>
                <select value={portfolio.educationLevel} onChange={(e) => setPortfolio({...portfolio, educationLevel: e.target.value})}>
                  <option value="">-- Select --</option>
                  <option value="graduation">Graduation Only</option>
                  <option value="postgraduation">Post Graduation</option>
                </select>
              </div>
              {(portfolio.educationLevel === 'graduation' || portfolio.educationLevel === 'postgraduation') && (
                <div className="form-group">
                  <label>Current Year of Study</label>
                  <select value={portfolio.year || ''} onChange={(e) => setPortfolio({...portfolio, year: e.target.value})}>
                    <option value="">-- Select Year --</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              )}
            </div>

            {portfolio.educationLevel === 'postgraduation' && (
              <>
                <h3 style={{marginTop: '2rem'}}>Post Graduation Details</h3>
                <div className="form-group">
                  <label>Post Graduation Type</label>
                  <select value={portfolio.postGrad.type} onChange={(e) => setPortfolio({...portfolio, postGrad: {...portfolio.postGrad, type: e.target.value, specialization: ''}})}>
                    <option value="">-- Select --</option>
                    <option value="MBA">MBA</option>
                    <option value="MTech">MTech</option>
                  </select>
                </div>
                {portfolio.postGrad.type && (
                  <div className="form-group">
                    <label>Specialization</label>
                    <select value={portfolio.postGrad.specialization} onChange={(e) => setPortfolio({...portfolio, postGrad: {...portfolio.postGrad, specialization: e.target.value}})}>
                      <option value="">-- Select --</option>
                      {postGradOptions[portfolio.postGrad.type]?.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Institution Name</label>
                  <input value={portfolio.postGrad.institution} onChange={(e) => setPortfolio({...portfolio, postGrad: {...portfolio.postGrad, institution: e.target.value}})} />
                </div>
                <div className="form-group">
                  <label>CGPA</label>
                  <input type="number" step="0.01" value={portfolio.postGrad.cgpa} onChange={(e) => setPortfolio({...portfolio, postGrad: {...portfolio.postGrad, cgpa: e.target.value}})} />
                </div>
                <div className="form-group">
                  <label>Upload Certificate (.pdf, .jpg, .jpeg)</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg" onChange={(e) => setPortfolio({...portfolio, postGrad: {...portfolio.postGrad, doc: e.target.files[0]}})} />
                  {portfolio.postGrad.doc && <small>✓ {portfolio.postGrad.doc.name}</small>}
                </div>
              </>
            )}

            {(portfolio.educationLevel === 'graduation' || portfolio.educationLevel === 'postgraduation') && (
              <>
                <h3 style={{marginTop: '2rem'}}>Graduation Details</h3>
                <div className="form-group">
                  <label>Graduation Type</label>
                  <select value={portfolio.graduation.type} onChange={(e) => setPortfolio({...portfolio, graduation: {...portfolio.graduation, type: e.target.value, specialization: ''}})}>
                    <option value="">-- Select --</option>
                    <option value="BTech">BTech</option>
                    <option value="BSc">BSc</option>
                    <option value="BBA">BBA</option>
                    <option value="BCA">BCA</option>
                  </select>
                </div>
                {portfolio.graduation.type && (
                  <div className="form-group">
                    <label>Specialization</label>
                    <select value={portfolio.graduation.specialization} onChange={(e) => setPortfolio({...portfolio, graduation: {...portfolio.graduation, specialization: e.target.value}})}>
                      <option value="">-- Select --</option>
                      {gradOptions[portfolio.graduation.type]?.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Institution Name</label>
                  <input value={portfolio.graduation.institution} onChange={(e) => setPortfolio({...portfolio, graduation: {...portfolio.graduation, institution: e.target.value}})} />
                </div>
                <div className="form-group">
                  <label>CGPA</label>
                  <input type="number" step="0.01" value={portfolio.graduation.cgpa} onChange={(e) => setPortfolio({...portfolio, graduation: {...portfolio.graduation, cgpa: e.target.value}})} />
                </div>
                <div className="form-group">
                  <label>Upload Certificate (.pdf, .jpg, .jpeg)</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg" onChange={(e) => setPortfolio({...portfolio, graduation: {...portfolio.graduation, doc: e.target.files[0]}})} />
                  {portfolio.graduation.doc && <small>✓ {portfolio.graduation.doc.name}</small>}
                </div>
              </>
            )}

            <h3 style={{marginTop: '2rem'}}>Pre-University Education</h3>
            <div className="form-group">
              <label>Stream</label>
              <select value={portfolio.preUniversity.type} onChange={(e) => setPortfolio({...portfolio, preUniversity: {...portfolio.preUniversity, type: e.target.value}})}>
                <option value="">-- Select --</option>
                <option value="MPC">MPC</option>
                <option value="BiPC">BiPC</option>
                <option value="MBiPC">MBiPC</option>
                <option value="ITI">ITI</option>
              </select>
            </div>
            <div className="form-group">
              <label>Institution Name</label>
              <input value={portfolio.preUniversity.institution} onChange={(e) => setPortfolio({...portfolio, preUniversity: {...portfolio.preUniversity, institution: e.target.value}})} />
            </div>
            <div className="form-group">
              <label>Marks/Percentage/GPA</label>
              <input value={portfolio.preUniversity.marks} onChange={(e) => setPortfolio({...portfolio, preUniversity: {...portfolio.preUniversity, marks: e.target.value}})} />
            </div>
            <div className="form-group">
              <label>Upload Certificate</label>
              <input type="file" accept=".pdf,.jpg,.jpeg" onChange={(e) => setPortfolio({...portfolio, preUniversity: {...portfolio.preUniversity, doc: e.target.files[0]}})} />
              {portfolio.preUniversity.doc && <small>✓ {portfolio.preUniversity.doc.name}</small>}
            </div>

            <h3 style={{marginTop: '2rem'}}>Secondary Education (10th)</h3>
            <div className="form-group">
              <label>Board</label>
              <select value={portfolio.secondary.board} onChange={(e) => setPortfolio({...portfolio, secondary: {...portfolio.secondary, board: e.target.value}})}>
                <option value="">-- Select --</option>
                <option value="ICSE">ICSE</option>
                <option value="CBSE">CBSE</option>
                <option value="SSC">SSC</option>
              </select>
            </div>
            <div className="form-group">
              <label>Institution Name</label>
              <input value={portfolio.secondary.institution} onChange={(e) => setPortfolio({...portfolio, secondary: {...portfolio.secondary, institution: e.target.value}})} />
            </div>
            <div className="form-group">
              <label>Marks/Percentage/GPA</label>
              <input value={portfolio.secondary.marks} onChange={(e) => setPortfolio({...portfolio, secondary: {...portfolio.secondary, marks: e.target.value}})} />
            </div>
            <div className="form-group">
              <label>Upload Certificate</label>
              <input type="file" accept=".pdf,.jpg,.jpeg" onChange={(e) => setPortfolio({...portfolio, secondary: {...portfolio.secondary, doc: e.target.files[0]}})} />
              {portfolio.secondary.doc && <small>✓ {portfolio.secondary.doc.name}</small>}
            </div>

            <h3 style={{marginTop: '2rem'}}>Contact Information</h3>
            <div className="form-group">
              <label>Contact Number</label>
              <input value={portfolio.contact} onChange={(e) => setPortfolio({...portfolio, contact: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={portfolio.email} onChange={(e) => setPortfolio({...portfolio, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label>LinkedIn Profile Link</label>
              <input value={portfolio.linkedin} onChange={(e) => setPortfolio({...portfolio, linkedin: e.target.value})} />
            </div>
            <div className="form-group">
              <label>GitHub Profile Link</label>
              <input value={portfolio.github} onChange={(e) => setPortfolio({...portfolio, github: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Professional Summary (2-3 lines)</label>
              <textarea value={portfolio.summary} onChange={(e) => setPortfolio({...portfolio, summary: e.target.value})} rows="3" />
            </div>
            <button className="add-btn" onClick={saveProfile} style={{marginTop: '1rem'}}>💾 Save Portfolio</button>
          </div>
        );
      }
      case 'skills':
        return (
          <div className="section">
            <div className="section-header">
              <h2>💻 Skills</h2>
              <button className="add-btn" onClick={() => openModal('skill')}>+ Add Skill</button>
            </div>
            <div className="skills-list">
              {portfolio.technicalSkills.map((skill, idx) => (
                <div key={idx} className="skill-card">
                  <h4>{skill.category}</h4>
                  <p>{skill.skills}</p>
                  {skill.certLink && <a href={skill.certLink} target="_blank" rel="noreferrer">📄 Certificate</a>}
                  <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                    <button className="edit-btn-small" onClick={() => {
                      setEditingItem({...skill, index: idx});
                      setFormData(skill);
                      setShowModal(true);
                      setModalType('skill');
                    }}>✏️ Edit</button>
                    <button className="delete-btn-small" onClick={() => handleDelete('skill', skill.id)}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {portfolio.technicalSkills.length === 0 && (
              <p style={{textAlign: 'center', color: '#6c757d', padding: '2rem'}}>No skills added yet. Click "+ Add Skill" to get started!</p>
            )}
          </div>
        );
      
      case 'projects': {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const filteredProjects = projects
          .filter(p => projectFilter === 'all' || p.status === projectFilter)
          .sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));

        const statusCounts = {
          all: projects.length,
          'not-started': projects.filter(p => p.status === 'not-started').length,
          'in-progress': projects.filter(p => p.status === 'in-progress').length,
          completed: projects.filter(p => p.status === 'completed').length,
          'on-hold': projects.filter(p => p.status === 'on-hold').length,
        };

        return (
          <div className="section">
            <div className="section-header">
              <h2>🔥 Projects</h2>
              <button className="add-btn" onClick={() => openModal('project')}>+ Add Project</button>
            </div>

            {/* Project Summary Bar */}
            <div className="project-summary-bar">
              <div className="project-summary-item">
                <span className="ps-count">{projects.length}</span>
                <span className="ps-label">Total</span>
              </div>
              <div className="project-summary-item">
                <span className="ps-count ps-inprogress">{statusCounts['in-progress']}</span>
                <span className="ps-label">In Progress</span>
              </div>
              <div className="project-summary-item">
                <span className="ps-count ps-done">{statusCounts['completed']}</span>
                <span className="ps-label">Completed</span>
              </div>
              <div className="project-summary-item">
                <span className="ps-count ps-hold">{statusCounts['on-hold']}</span>
                <span className="ps-label">On Hold</span>
              </div>
              <div className="project-summary-item">
                <span className="ps-count ps-notstarted">{statusCounts['not-started']}</span>
                <span className="ps-label">Not Started</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="project-filter-tabs">
              {['all','not-started','in-progress','completed','on-hold'].map(f => (
                <button
                  key={f}
                  className={`filter-tab ${projectFilter === f ? 'active' : ''}`}
                  onClick={() => setProjectFilter(f)}
                >
                  {f === 'all' ? '📋 All' : f === 'not-started' ? '⏳ Not Started' : f === 'in-progress' ? '🔄 In Progress' : f === 'completed' ? '✅ Completed' : '⏸️ On Hold'}
                  <span className="filter-count">{statusCounts[f]}</span>
                </button>
              ))}
            </div>

            <div className="projects-grid">
              {filteredProjects.length === 0 && (
                <p style={{color: 'var(--text-secondary)', padding: '2rem', gridColumn: '1/-1', textAlign: 'center'}}>
                  No projects found. {projectFilter !== 'all' ? 'Try a different filter.' : 'Click "+ Add Project" to get started!'}
                </p>
              )}
              {filteredProjects.map(project => {
                const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed';
                return (
                  <div key={project.id} className={`project-card ${isOverdue ? 'project-overdue' : ''}`}>
                    {/* Priority + Status badges */}
                    <div className="project-card-badges">
                      {project.priority && (
                        <span className={`priority-badge priority-${project.priority}`}>
                          {project.priority === 'high' ? '🔴 High' : project.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                        </span>
                      )}
                      {project.status && (
                        <span className={`pstatus-badge pstatus-${project.status}`}>
                          {project.status === 'not-started' ? '⏳ Not Started' : project.status === 'in-progress' ? '🔄 In Progress' : project.status === 'completed' ? '✅ Done' : '⏸️ On Hold'}
                        </span>
                      )}
                      {project.status === 'approved' && <span style={{background:'#28a745',color:'#fff',borderRadius:'8px',padding:'0.2rem 0.6rem',fontSize:'0.75rem',fontWeight:700}}>✅ Approved</span>}
                      {project.status === 'rejected' && <span style={{background:'#dc3545',color:'#fff',borderRadius:'8px',padding:'0.2rem 0.6rem',fontSize:'0.75rem',fontWeight:700}}>❌ Rejected</span>}
                      {project.status === 'pending' && <span style={{background:'#ffc107',color:'#1a1a1a',borderRadius:'8px',padding:'0.2rem 0.6rem',fontSize:'0.75rem',fontWeight:700}}>⏳ Pending Review</span>}
                      {isOverdue && <span className="overdue-badge">⚠️ Overdue</span>}
                    </div>

                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <p><strong>Technologies:</strong> <span style={{display:'flex',flexWrap:'wrap',gap:'0.3rem',marginTop:'0.3rem'}}>{(project.technologies||'').split(',').map((t,i)=>t.trim()&&<span key={i} className="tech-tag">{t.trim()}</span>)}</span></p>
                    {project.role && <p><strong>Role:</strong> {project.role}</p>}
                    {project.deadline && (
                      <p className={isOverdue ? 'deadline-overdue' : 'deadline-ok'}>
                        📅 <strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}
                      </p>
                    )}
                    {project.grade 
                      ? <p><strong>Grade:</strong> <span className={`grade-badge grade-${(project.grade||'').replace('+','plus')}`}>{project.grade}</span></p>
                      : <p><strong>Grade:</strong> <span className="grade-badge grade-pending">⏳ Not graded yet</span></p>
                    }
                    <div style={{display:'flex',gap:'0.8rem',flexWrap:'wrap',marginTop:'0.5rem'}}>
                      {project.demo && <a href={project.demo} target="_blank" rel="noreferrer" className="project-link-btn">🔗 Demo</a>}
                      {project.github && <a href={project.github} target="_blank" rel="noreferrer" className="project-link-btn">💻 GitHub</a>}
                    </div>
                    {project.screenshot && <p>📸 Screenshot: {project.screenshot.name}</p>}
                    {project.projectFile && <p>📁 Project File: {project.projectFile.name}</p>}

                    {/* Progress Bar */}
                    <div style={{marginTop: '1rem'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem'}}>
                        <strong style={{fontSize:'0.9rem'}}>Progress</strong>
                        <span className="progress-percent-badge">{project.progress || 0}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${
                            (project.progress || 0) === 100 ? 'progress-complete' :
                            (project.progress || 0) >= 60 ? 'progress-high' :
                            (project.progress || 0) >= 30 ? 'progress-mid' : ''
                          }`}
                          style={{width: `${project.progress || 0}%`}}
                        />
                      </div>
                    </div>

                    {/* Milestones */}
                    {project.milestones && project.milestones.length > 0 && (
                      <div className="milestones-box">
                        <strong>📌 Milestones</strong>
                        {Array.isArray(project.milestones) ? (
                          <div style={{marginTop:'0.5rem'}}>
                            {project.milestones.map((ms, i) => (
                              <div key={i} className={`milestone-row milestone-${ms.state}`}>
                                <span className="milestone-dot">{ms.state==='done'?'✅':ms.state==='active'?'🔄':'⏳'}</span>
                                <span className="milestone-title">{ms.title}</span>
                                {ms.due && <span className="milestone-due">📅 {ms.due}</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <pre className="milestones-pre">{project.milestones}</pre>
                        )}
                      </div>
                    )}

                    {/* Faculty Feedback */}
                    {project.feedback && project.feedback.length > 0 && (
                      <div className="feedback-display">
                        <strong style={{color: 'var(--accent-purple)'}}>💬 Faculty Feedback:</strong>
                        {project.feedback.map((fb, idx) => {
                          const key = `${project.id}-${idx}`;
                          return (
                            <div key={idx} className="feedback-item-card">
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'0.5rem'}}>
                                <p style={{margin: 0, fontSize: '0.9rem'}}><strong>{fb.adminName}:</strong> {fb.message}</p>
                                {fb.rating && <span className="star-rating">{[1,2,3,4,5].map(s=><span key={s} style={{color:s<=fb.rating?'#ffc107':'#ccc',fontSize:'1rem'}}>★</span>)}</span>}
                              </div>
                              {fb.strengths && <p style={{margin:'0.3rem 0 0',fontSize:'0.82rem',color:'#28a745'}}>✅ <strong>Strengths:</strong> {fb.strengths}</p>}
                              {fb.improve && <p style={{margin:'0.2rem 0 0',fontSize:'0.82rem',color:'#3b82f6'}}>📈 <strong>Improve:</strong> {fb.improve}</p>}
                              {fb.studentReply
                                ? <p style={{margin:'0.4rem 0 0',fontSize:'0.85rem',color:'var(--accent-blue)',borderLeft:'3px solid var(--accent-blue)',paddingLeft:'0.5rem'}}>↩ <strong>Your reply:</strong> {fb.studentReply}</p>
                                : replyingTo === key ? (
                                    <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem'}}>
                                      <input
                                        className="reply-input"
                                        placeholder="Write a reply..."
                                        value={replyInputs[key] || ''}
                                        onChange={e => setReplyInputs(prev => ({...prev, [key]: e.target.value}))}
                                        autoFocus
                                      />
                                      <button type="button" className="add-btn" style={{padding:'0.3rem 0.7rem',fontSize:'0.8rem'}} onClick={() => handleReplySubmit(project.id, fb.id, idx)}>Send</button>
                                      <button type="button" className="cancel-btn" style={{padding:'0.3rem 0.7rem',fontSize:'0.8rem'}} onClick={() => setReplyingTo(null)}>✕</button>
                                    </div>
                                  ) : (
                                    <button type="button" className="reply-btn" onClick={() => setReplyingTo(key)}>↩ Reply</button>
                                  )
                              }
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="action-buttons">
                      <button className="add-btn" onClick={() => {
                        setEditingItem(project);
                        setFormData({milestones: project.milestones || [], progress: project.progress || 0, status: project.status || 'not-started'});
                        setModalType('milestone');
                        setShowModal(true);
                      }}>📈 Track</button>
                      <button className="edit-btn" onClick={() => openModal('project', project)}>✏️ Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete('project', project.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'hackathons':
        return (
          <div className="section">
            <div className="section-header">
              <h2>🏆 Hackathons/Skillathons</h2>
              <button className="add-btn" onClick={() => openModal('hackathon')}>+ Add Hackathon</button>
            </div>
            <div className="projects-grid">
              {hackathons.map(hack => (
                <div key={hack.id} className="project-card">
                  <h3>{hack.name}</h3>
                  <p>{hack.summary}</p>
                  {hack.website && <p><a href={hack.website} target="_blank" rel="noreferrer">🔗 Website</a></p>}
                  {hack.certificate && <p>🏅 Certificate attached</p>}
                  <div className="action-buttons">
                    <button className="edit-btn" onClick={() => openModal('hackathon', hack)}>✏️ Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete('hackathon', hack.id)}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'internships':
        return (
          <div className="section">
            <div className="section-header">
              <h2>💼 Internships/Experience</h2>
              <button className="add-btn" onClick={() => openModal('internship')}>+ Add Internship</button>
            </div>
            <div className="projects-grid">
              {internships.map(intern => (
                <div key={intern.id} className="project-card">
                  <h3>{intern.company}</h3>
                  <p><strong>Role:</strong> {intern.role}</p>
                  <p><strong>Duration:</strong> {intern.duration}</p>
                  <p>{intern.work}</p>
                  <div className="action-buttons">
                    <button className="edit-btn" onClick={() => openModal('internship', intern)}>✏️ Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete('internship', intern.id)}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'certifications':
        return (
          <div className="section">
            <div className="section-header">
              <h2>🎓 Certifications</h2>
              <button className="add-btn" onClick={() => openModal('certification')}>+ Add Certification</button>
            </div>
            <div className="projects-grid">
              {certifications.map(cert => (
                <div key={cert.id} className="project-card">
                  <h3>{cert.name}</h3>
                  <p><strong>Issue Date:</strong> {cert.issueDate}</p>
                  <p><strong>Expiry Date:</strong> {cert.expiryDate || 'No Expiration'}</p>
                  <p><strong>License ID:</strong> {cert.licenseId}</p>
                  {cert.link && <p><a href={cert.link} target="_blank" rel="noreferrer">🔗 Verify Credential</a></p>}
                  <div className="action-buttons">
                    <button className="edit-btn" onClick={() => openModal('certification', cert)}>✏️ Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete('certification', cert.id)}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'resume':
        return (
          <div className="section">
            <h2>📄 Resume Generator</h2>
            <p style={{color: '#6c757d', marginBottom: '2rem'}}>Generate and download your resume based on all the information you've entered</p>
            
            <div className="resume-preview">
              <h3>Resume Preview</h3>
              <div className="resume-content">
                <div className="resume-section" style={{display: 'flex', alignItems: 'flex-start', gap: '2rem'}}>
                  {portfolio.photo && (
                    <div>
                      <img src={portfolio.photo} alt="Profile" style={{width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', border: '3px solid #667eea'}} />
                    </div>
                  )}
                  <div style={{flex: 1}}>
                    <h4>{`${portfolio.firstName} ${portfolio.middleName} ${portfolio.lastName}`.trim() || 'Your Name'}</h4>
                    <p style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem', marginTop: '0.5rem'}}>
                      {portfolio.email && <span>{portfolio.email}</span>}
                      {portfolio.contact && <span>| {portfolio.contact}</span>}
                      {portfolio.gender && <span>| {portfolio.gender}</span>}
                      {portfolio.dob && <span>| DOB: {portfolio.dob}</span>}
                    </p>
                    {portfolio.languages && <p>Languages: {portfolio.languages}</p>}
                    <p style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem'}}>
                      {portfolio.linkedin && <span>LinkedIn: <a href={portfolio.linkedin} target="_blank" rel="noreferrer">{portfolio.linkedin}</a></span>}
                      {portfolio.github && <span>| GitHub: <a href={portfolio.github} target="_blank" rel="noreferrer">{portfolio.github}</a></span>}
                    </p>
                  </div>
                </div>

                {portfolio.summary && (
                  <div className="resume-section">
                    <h4>Professional Summary</h4>
                    <p>{portfolio.summary}</p>
                  </div>
                )}

                <div className="resume-section">
                  <h4>Education</h4>
                  {portfolio.postGrad.type && <p><strong>Post Graduation:</strong> {portfolio.postGrad.type} - {portfolio.postGrad.specialization}, {portfolio.postGrad.institution} (CGPA: {portfolio.postGrad.cgpa})</p>}
                  {portfolio.graduation.type && <p><strong>Graduation:</strong> {portfolio.graduation.type} - {portfolio.graduation.specialization}, {portfolio.graduation.institution} (CGPA: {portfolio.graduation.cgpa})</p>}
                  {portfolio.preUniversity.type && <p><strong>Pre-University ({portfolio.preUniversity.type}):</strong> {portfolio.preUniversity.institution} - {portfolio.preUniversity.marks}</p>}
                  {portfolio.secondary.board && <p><strong>Secondary ({portfolio.secondary.board}):</strong> {portfolio.secondary.institution} - {portfolio.secondary.marks}</p>}
                </div>

                {portfolio.technicalSkills.length > 0 && (
                  <div className="resume-section">
                    <h4>Technical Skills</h4>
                    {portfolio.technicalSkills.map((skill, idx) => (
                      <p key={idx}><strong>{skill.category}:</strong> {skill.skills}</p>
                    ))}
                  </div>
                )}

                {projects.length > 0 && (
                  <div className="resume-section">
                    <h4>Projects</h4>
                    {projects.map((project, idx) => (
                      <div key={idx} style={{marginBottom: '1rem'}}>
                        <p><strong>{project.title}</strong></p>
                        <p>{project.description}</p>
                        <p><em>Technologies: {project.technologies}</em></p>
                        {project.github && <p>GitHub: {project.github}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {hackathons.length > 0 && (
                  <div className="resume-section">
                    <h4>Hackathons & Competitions</h4>
                    {hackathons.map((hack, idx) => (
                      <p key={idx}><strong>{hack.name}</strong> - {hack.summary}</p>
                    ))}
                  </div>
                )}

                {internships.length > 0 && (
                  <div className="resume-section">
                    <h4>Experience</h4>
                    {internships.map((intern, idx) => (
                      <div key={idx} style={{marginBottom: '1rem'}}>
                        <p><strong>{intern.role}</strong> at {intern.company}</p>
                        <p>{intern.duration}</p>
                        <p>{intern.work}</p>
                      </div>
                    ))}
                  </div>
                )}

                {certifications.length > 0 && (
                  <div className="resume-section">
                    <h4>Certifications</h4>
                    {certifications.map((cert, idx) => (
                      <p key={idx}>
                        <strong>{cert.name}</strong> - {cert.issueDate}
                        {cert.link && <> | <a href={cert.link} target="_blank" rel="noreferrer">Verify Credential</a></>}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{marginTop: '2rem', display: 'flex', gap: '1rem'}}>
              <button className="add-btn" onClick={handleDownloadPDF}>📥 Download as PDF</button>
              <button className="add-btn" onClick={() => alert('Resume data copied!')}>📋 Copy Resume Text</button>
            </div>

            <div style={{marginTop: '3rem'}}>
              <h3>Portfolio Website Link</h3>
              <div className="form-group">
                <label>Your Portfolio URL</label>
                <input placeholder="https://yourportfolio.com" />
                <small style={{color: '#6c757d'}}>Share this link to showcase your complete portfolio</small>
              </div>
            </div>
          </div>
        );
      
      case 'feedback':
        return (
          <div className="section">
            <h2>💬 Feedback</h2>
            {feedbackList.length === 0 ? (
              <p style={{color:'var(--text-secondary)',padding:'2rem',textAlign:'center'}}>No feedback received yet. Feedback from educators will appear here.</p>
            ) : (
              <div className="projects-grid">
                {feedbackList.map((fb, idx) => (
                  <div key={idx} className="project-card">
                    <p style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:'0.5rem'}}>📁 {fb.projectTitle}</p>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <strong>{fb.adminName}</strong>
                      {fb.rating && <span className="star-rating">{[1,2,3,4,5].map(s=><span key={s} style={{color:s<=fb.rating?'#ffc107':'#ccc',fontSize:'1.1rem'}}>★</span>)}</span>}
                    </div>
                    <p style={{marginTop:'0.5rem'}}>{fb.message}</p>
                    {fb.strengths && (
                      <div style={{marginTop:'0.5rem',padding:'0.5rem 0.8rem',background:'rgba(40,167,69,0.08)',borderRadius:'8px',borderLeft:'3px solid #28a745'}}>
                        <p style={{margin:0,fontSize:'0.85rem',color:'#28a745'}}><strong>✅ Strengths:</strong> {fb.strengths}</p>
                      </div>
                    )}
                    {fb.improve && (
                      <div style={{marginTop:'0.5rem',padding:'0.5rem 0.8rem',background:'rgba(59,130,246,0.08)',borderRadius:'8px',borderLeft:'3px solid #3b82f6'}}>
                        <p style={{margin:0,fontSize:'0.85rem',color:'#3b82f6'}}><strong>📈 Areas to Improve:</strong> {fb.improve}</p>
                      </div>
                    )}
                    {fb.grade && <p style={{marginTop:'0.5rem'}}><strong>Grade:</strong> <span className={`grade-badge grade-${(fb.grade||'').replace('+','plus')}`}>{fb.grade}</span></p>}
                    <p style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.5rem'}}>{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'achievements':
        return (
          <div className="section">
            <h2>🏆 Achievements</h2>
            <p style={{color:'var(--text-secondary)',marginBottom:'1.5rem'}}>Earn badges by completing milestones across your portfolio.</p>
            <div className="badges-grid">
              {BADGES.map(badge => {
                const earned = badge.earned();
                return (
                  <div key={badge.id} className={`badge-card ${earned ? 'badge-earned' : 'badge-locked'}`}>
                    <div className="badge-icon">{earned ? badge.icon : '🔒'}</div>
                    <div className="badge-label">{badge.label}</div>
                    <div className="badge-desc">{badge.desc}</div>
                    {earned && <div className="badge-earned-tag">✨ Earned</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="section">
            <h2>⚙️ Settings</h2>
            <div className="info-card">
              <h3>🔒 Change Password</h3>
              {pwMsg.text && (
                <div style={{padding:'0.7rem 1rem',borderRadius:'8px',marginBottom:'1rem',
                  background: pwMsg.error ? 'rgba(220,53,69,0.1)' : 'rgba(40,167,69,0.1)',
                  border: `1px solid ${pwMsg.error ? 'rgba(220,53,69,0.3)' : 'rgba(40,167,69,0.3)'}`,
                  color: pwMsg.error ? '#dc3545' : '#28a745', fontSize:'0.9rem'}}>
                  {pwMsg.text}
                </div>
              )}
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={pwForm.current}
                  onChange={e => setPwForm({...pwForm, current: e.target.value})}
                  placeholder="Enter current password" />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={pwForm.newPw}
                  onChange={e => setPwForm({...pwForm, newPw: e.target.value})}
                  placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={pwForm.confirm}
                  onChange={e => setPwForm({...pwForm, confirm: e.target.value})}
                  placeholder="Re-enter new password" />
              </div>
              <button className="add-btn" onClick={async () => {
                setPwMsg({ text: '', error: false });
                if (!pwForm.current.trim()) { setPwMsg({ text: 'Enter your current password.', error: true }); return; }
                if (pwForm.newPw.length < 6) { setPwMsg({ text: 'New password must be at least 6 characters.', error: true }); return; }
                if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ text: 'New passwords do not match.', error: true }); return; }
                try {
                  await studentAPI.changePassword(userId, pwForm.current, pwForm.newPw);
                  setPwMsg({ text: '✅ Password changed successfully!', error: false });
                  setPwForm({ current: '', newPw: '', confirm: '' });
                } catch (err) {
                  setPwMsg({ text: err.response?.data?.error || 'Failed. Check your current password.', error: true });
                }
              }}>🔒 Change Password</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderModal = () => {
    if (modalType === 'project') {
      return (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Title</label>
            <input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Description (What problem it solves)</label>
            <textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Technologies Used</label>
            <input value={formData.technologies || ''} onChange={(e) => setFormData({...formData, technologies: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Your Role</label>
            <input value={formData.role || ''} onChange={(e) => setFormData({...formData, role: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={formData.priority || 'medium'} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={formData.status || 'not-started'} onChange={(e) => setFormData({...formData, status: e.target.value})}>
              <option value="not-started">⏳ Not Started</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="on-hold">⏸️ On Hold</option>
            </select>
          </div>
          <div className="form-group">
            <label>Deadline</label>
            <input type="date" value={formData.deadline || ''} onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Screenshots (.jpg, .pdf)</label>
            <input type="file" accept=".jpg,.jpeg,.pdf" onChange={(e) => setFormData({...formData, screenshot: e.target.files[0]})} />
            {formData.screenshot && <small>✓ {formData.screenshot.name}</small>}
          </div>
          <div className="form-group">
            <label>Upload Project Files (.zip, .rar, .pdf, .docx)</label>
            <input type="file" accept=".zip,.rar,.pdf,.docx" onChange={(e) => setFormData({...formData, projectFile: e.target.files[0]})} />
            {formData.projectFile && <small>✓ {formData.projectFile.name}</small>}
          </div>
          <div className="form-group">
            <label>Demo Link</label>
            <input type="url" value={formData.demo || ''} onChange={(e) => setFormData({...formData, demo: e.target.value})} />
          </div>
          <div className="form-group">
            <label>GitHub Repository</label>
            <input type="url" value={formData.github || ''} onChange={(e) => setFormData({...formData, github: e.target.value})} />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="add-btn">{editingItem ? 'Update' : 'Add'}</button>
          </div>
        </form>
      );
    } else if (modalType === 'hackathon') {
      return (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Hackathon Name</label>
            <input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Summary</label>
            <textarea value={formData.summary || ''} onChange={(e) => setFormData({...formData, summary: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Website Link</label>
            <input type="url" value={formData.website || ''} onChange={(e) => setFormData({...formData, website: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Certificate (.pdf)</label>
            <input type="file" accept=".pdf" onChange={(e) => setFormData({...formData, certificate: e.target.files[0]})} />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="add-btn">{editingItem ? 'Update' : 'Add'}</button>
          </div>
        </form>
      );
    } else if (modalType === 'internship') {
      return (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company Name</label>
            <input value={formData.company || ''} onChange={(e) => setFormData({...formData, company: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input value={formData.role || ''} onChange={(e) => setFormData({...formData, role: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Duration</label>
            <input placeholder="e.g., 3 months" value={formData.duration || ''} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Work Done</label>
            <textarea value={formData.work || ''} onChange={(e) => setFormData({...formData, work: e.target.value})} />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="add-btn">{editingItem ? 'Update' : 'Add'}</button>
          </div>
        </form>
      );
    } else if (modalType === 'skill') {
      return (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <select value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} required>
              <option value="">-- Select Category --</option>
              <option value="Programming Languages">Programming Languages</option>
              <option value="Core CS Concepts">Core CS Concepts</option>
              <option value="Databases & Warehousing">Databases & Warehousing</option>
              <option value="Web Development">Web Development</option>
              <option value="Cloud & DevOps">Cloud & DevOps</option>
              <option value="Backend Frameworks">Backend Frameworks</option>
              <option value="Developer Tools">Developer Tools</option>
              <option value="Soft Skills">Soft Skills</option>
            </select>
          </div>
          <div className="form-group">
            <label>Skills (comma separated)</label>
            <textarea 
              placeholder="e.g., Java, Python, C++" 
              value={formData.skills || ''} 
              onChange={(e) => setFormData({...formData, skills: e.target.value})} 
              required 
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Certificate Link (Optional)</label>
            <input type="url" value={formData.certLink || ''} onChange={(e) => setFormData({...formData, certLink: e.target.value})} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label>Or Upload Certificate (Optional)</label>
            <input type="file" accept=".pdf" onChange={(e) => setFormData({...formData, cert: e.target.files[0]})} />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="add-btn">{editingItem ? 'Update' : 'Add'} Skill</button>
          </div>
        </form>
      );
    } else if (modalType === 'certification') {
      return (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Certification Name</label>
            <input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Issue Date</label>
            <input type="date" value={formData.issueDate || ''} onChange={(e) => setFormData({...formData, issueDate: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Expiry Date (Optional)</label>
            <input type="date" value={formData.expiryDate || ''} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label>License ID</label>
            <input value={formData.licenseId || ''} onChange={(e) => setFormData({...formData, licenseId: e.target.value})} placeholder="Enter license/credential ID" />
          </div>
          <div className="form-group">
            <label>Certification Link (Optional)</label>
            <input type="url" value={formData.link || ''} onChange={(e) => setFormData({...formData, link: e.target.value})} placeholder="https://..." />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="add-btn">{editingItem ? 'Update' : 'Add'}</button>
          </div>
        </form>
      );
    } else if (modalType === 'milestone') {
      const msList = Array.isArray(formData.milestones) ? formData.milestones : [];
      return (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Status</label>
            <select value={formData.status || 'not-started'} onChange={(e) => setFormData({...formData, status: e.target.value})}>
              <option value="not-started">⏳ Not Started</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="on-hold">⏸️ On Hold</option>
            </select>
          </div>
          <div className="form-group">
            <label>Progress: <strong>{formData.progress || 0}%</strong></label>
            <input type="range" min="0" max="100" step="5" value={formData.progress || 0}
              onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})}
              style={{width:'100%', accentColor:'var(--accent-purple)'}}
            />
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--text-secondary)'}}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div className="form-group">
            <label>Milestones</label>
            {msList.map((ms, i) => (
              <div key={i} className="milestone-editor-row">
                <input placeholder="Milestone title" value={ms.title||''} onChange={(e)=>{const u=[...msList];u[i]={...u[i],title:e.target.value};setFormData({...formData,milestones:u});}} />
                <select value={ms.state||'pending'} onChange={(e)=>{const u=[...msList];u[i]={...u[i],state:e.target.value};setFormData({...formData,milestones:u});}}>
                  <option value="pending">⏳ Pending</option>
                  <option value="active">🔄 Active</option>
                  <option value="done">✅ Done</option>
                </select>
                <input type="date" value={ms.due||''} onChange={(e)=>{const u=[...msList];u[i]={...u[i],due:e.target.value};setFormData({...formData,milestones:u});}} />
                <button type="button" className="delete-btn-small" onClick={()=>{const u=msList.filter((_,j)=>j!==i);setFormData({...formData,milestones:u});}}>✕</button>
              </div>
            ))}
            <button type="button" className="add-btn" style={{marginTop:'0.5rem',padding:'0.5rem 1rem',fontSize:'0.85rem'}} onClick={()=>setFormData({...formData,milestones:[...msList,{title:'',state:'pending',due:''}]})}>+ Add Milestone</button>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="add-btn">Update Progress</button>
          </div>
        </form>
      );
    }
  };

  return (
    <div className="dashboard-layout">
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      {loading && <div style={{position:'fixed',top:0,left:0,right:0,height:'3px',background:'var(--accent-purple)',zIndex:9999,animation:'slideIn 1s infinite'}}></div>}
      <aside className="sidebar">
        <div className="sidebar-header"><h3>👨🎓 Student Portal</h3></div>
        <nav className="sidebar-nav">
          <button className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')}>📊 Overview</button>
          <button className={activeSection === 'portfolio' ? 'active' : ''} onClick={() => setActiveSection('portfolio')}>📝 Basic Info</button>
          <button className={activeSection === 'skills' ? 'active' : ''} onClick={() => setActiveSection('skills')}>💻 Skills</button>
          <button className={activeSection === 'projects' ? 'active' : ''} onClick={() => setActiveSection('projects')}>🔥 Projects</button>
          <button className={activeSection === 'hackathons' ? 'active' : ''} onClick={() => setActiveSection('hackathons')}>🏆 Hackathons</button>
          <button className={activeSection === 'internships' ? 'active' : ''} onClick={() => setActiveSection('internships')}>💼 Internships</button>
          <button className={activeSection === 'certifications' ? 'active' : ''} onClick={() => setActiveSection('certifications')}>🎓 Certifications</button>
          <button className={activeSection === 'resume' ? 'active' : ''} onClick={() => setActiveSection('resume')}>📄 Resume</button>
          <button className={activeSection === 'feedback' ? 'active' : ''} onClick={() => setActiveSection('feedback')}>💬 Feedback</button>
          <button className={activeSection === 'achievements' ? 'active' : ''} onClick={() => setActiveSection('achievements')}>🏆 Achievements</button>
          <button className={activeSection === 'settings' ? 'active' : ''} onClick={() => setActiveSection('settings')}>⚙️ Settings</button>
        </nav>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            {portfolio.photo && <img src={portfolio.photo} alt="Profile" style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', border: '3px solid #667eea'}} />}
            <h1>Welcome, {user.name || user.email}</h1>
          </div>
        </header>
        <div className="dashboard-content">{renderContent()}</div>
      </main>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h2>
            {renderModal()}
          </div>
        </div>
      )}

      {badgePopup && (
        <div className="badge-popup">
          <div className="badge-popup-icon">{badgePopup.icon}</div>
          <div className="badge-popup-text">
            <div className="badge-popup-title">🏆 Achievement Unlocked!</div>
            <div className="badge-popup-label">{badgePopup.label}</div>
            <div className="badge-popup-desc">{badgePopup.desc}</div>
          </div>
          <button className="badge-popup-close" onClick={() => setBadgePopup(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
