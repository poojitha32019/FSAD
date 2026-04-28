import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const FILE_BASE = import.meta.env.VITE_FILE_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  loginSendOtp: (data) => api.post('/auth/login/send-otp', data),
  loginVerifyOtp: (email, otp) => api.post('/auth/login/verify-otp', { email, otp }),
  sendOtp: (email) => api.post('/auth/send-otp', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
};

// Student
export const studentAPI = {
  getProfile: (userId) => api.get(`/student/${userId}/profile`),
  saveProfile: (userId, formData) => api.post(`/student/${userId}/profile`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getProjects: (userId) => api.get(`/student/${userId}/projects`),
  createProject: (userId, formData) => api.post(`/student/${userId}/projects`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProject: (userId, projectId, formData) => api.put(`/student/${userId}/projects/${projectId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProject: (userId, projectId) => api.delete(`/student/${userId}/projects/${projectId}`),
  getSkills: (userId) => api.get(`/student/${userId}/skills`),
  saveSkill: (userId, data) => api.post(`/student/${userId}/skills`, data),
  deleteSkill: (userId, skillId) => api.delete(`/student/${userId}/skills/${skillId}`),
  getHackathons: (userId) => api.get(`/student/${userId}/hackathons`),
  saveHackathon: (userId, formData) => api.post(`/student/${userId}/hackathons`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteHackathon: (userId, id) => api.delete(`/student/${userId}/hackathons/${id}`),
  getInternships: (userId) => api.get(`/student/${userId}/internships`),
  saveInternship: (userId, data) => api.post(`/student/${userId}/internships`, data),
  deleteInternship: (userId, id) => api.delete(`/student/${userId}/internships/${id}`),
  getCertifications: (userId) => api.get(`/student/${userId}/certifications`),
  saveCertification: (userId, data) => api.post(`/student/${userId}/certifications`, data),
  deleteCertification: (userId, id) => api.delete(`/student/${userId}/certifications/${id}`),
  getFeedback: (userId) => api.get(`/student/${userId}/feedback`),
  getProjectFeedback: (userId, projectId) => api.get(`/student/${userId}/projects/${projectId}/feedback`),
  replyToFeedback: (userId, feedbackId, reply) => api.put(`/student/${userId}/feedback/${feedbackId}/reply`, { reply }),
};

// Admin
export const adminAPI = {
  getStudentSkills: (userId) => api.get(`/student/${userId}/skills`),
  getStudentProjects: (userId) => api.get(`/student/${userId}/projects`),
  getStudentHackathons: (userId) => api.get(`/student/${userId}/hackathons`),
  getStudentInternships: (userId) => api.get(`/student/${userId}/internships`),
  getStudentCertifications: (userId) => api.get(`/student/${userId}/certifications`),
  deleteStudentSkill: (userId, skillId) => api.delete(`/student/${userId}/skills/${skillId}`),
  deleteStudentHackathon: (userId, id) => api.delete(`/student/${userId}/hackathons/${id}`),
  deleteStudentInternship: (userId, id) => api.delete(`/student/${userId}/internships/${id}`),
  deleteStudentCertification: (userId, id) => api.delete(`/student/${userId}/certifications/${id}`),
  getAllStudents: () => api.get('/admin/students'),
  getStudentProfile: (userId) => api.get(`/admin/students/${userId}/profile`),
  deleteStudent: (userId) => api.delete(`/admin/students/${userId}`),
  getAllProjects: () => api.get('/admin/projects'),
  updateProjectStatus: (projectId, status, grade) =>
    api.put(`/admin/projects/${projectId}/status`, { status, grade }),
  deleteProject: (projectId) => api.delete(`/admin/projects/${projectId}`),
  giveFeedback: (projectId, adminId, data) =>
    api.post(`/admin/projects/${projectId}/feedback?adminId=${adminId}`, data),
  givePortfolioFeedback: (studentId, adminId, section, data) =>
    api.post(`/admin/students/${studentId}/feedback?adminId=${adminId}&section=${encodeURIComponent(section)}`, data),
  getProjectFeedback: (projectId) => api.get(`/admin/projects/${projectId}/feedback`),
  getAnalytics: () => api.get('/admin/analytics'),
};

export const fileURL = (path) => path ? `${FILE_BASE}/files/${path.replace('uploads/', '')}` : null;

export default api;
