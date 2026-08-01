import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ✅ Live Backend Base URL
const API_BASE_URL = 'https://makaut-backend-ybb8.onrender.com';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [role, setRole] = useState('student');
  const [adminSecret, setAdminSecret] = useState('');
  const [message, setMessage] = useState('');

  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  const [attendanceStatus, setAttendanceStatus] = useState({ isOpen: false, records: [] });
  const [hasSubmittedAttendance, setHasSubmittedAttendance] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState('');

  const [assignments, setAssignments] = useState([]);
  const [newAssign, setNewAssign] = useState({ title: '', description: '', deadline: '' });
  const [submissionLinks, setSubmissionLinks] = useState({});
  const [notices, setNotices] = useState([]);
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });
  const [routine, setRoutine] = useState(null);
  const [newRoutine, setNewRoutine] = useState({ semester: '', link: '' });
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({ title: '', subject: '', link: '', type: 'Notes' });
  const [forums, setForums] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyInputs, setReplyInputs] = useState({});

  const [gallery, setGallery] = useState([]);
  const [newPhoto, setNewPhoto] = useState({ title: '', imageUrl: '', category: 'TechFest' });
  const [alumni, setAlumni] = useState([]);
  const [newAlumni, setNewAlumni] = useState({ name: '', batch: '', role: '', linkedin: '' });

  const [allStudents, setAllStudents] = useState([]);

  // 🤖 AI Study Assistant States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState([
    { sender: 'ai', text: 'Hello! I am your MAKAUT AI Study Assistant. Ask me anything about C Programming, DSA, Algorithms, or your 3rd-semester syllabus!' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Dark Mode Toggle
  const [darkMode, setDarkMode] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchAttendanceStatus = async () => { try { const res = await axios.get(`${API_BASE_URL}/api/attendance/status`); setAttendanceStatus(res.data); } catch (err) {} };
  const fetchAssignments = async () => { try { const res = await axios.get(`${API_BASE_URL}/api/assignments`); setAssignments(res.data); } catch (err) {} };
  const fetchNotices = async () => { try { const res = await axios.get(`${API_BASE_URL}/api/notices`); setNotices(res.data); } catch (err) {} };
  const fetchRoutine = async () => { try { const res = await axios.get(`${API_BASE_URL}/api/routine`); setRoutine(res.data); } catch (err) {} };
  const fetchResources = async () => { try { const res = await axios.get(`${API_BASE_URL}/api/resources`); setResources(res.data); } catch (err) {} };
  const fetchForums = async () => { try { const res = await axios.get(`${API_BASE_URL}/api/forum`); setForums(res.data); } catch (err) {} };
  const fetchGallery = async () => { try { const res = await axios.get(`${API_BASE_URL}/api/gallery`); setGallery(res.data); } catch (err) {} };
  const fetchAlumni = async () => { try { const res = await axios.get(`${API_BASE_URL}/api/alumni`); setAlumni(res.data); } catch (err) {} };

  const fetchAllStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/users`);
      setAllStudents(res.data);
    } catch (err) {
      showToast("Failed to fetch students list", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (isLogin) {
        const res = await axios.post(`${API_BASE_URL}/api/login`, { email, password });
        setUser(res.data.user);
        setToken(res.data.token);

        if (localStorage.getItem(`attendance_${res.data.user.email}`)) setHasSubmittedAttendance(true);
        fetchAttendanceStatus(); fetchAssignments(); fetchNotices(); fetchRoutine(); fetchResources(); fetchForums(); fetchGallery(); fetchAlumni();
        if(res.data.user.role === 'admin') fetchAllStudents();
        setActiveTab('home');
        showToast("Login successful!", "success");
      } else {
        const res = await axios.post(`${API_BASE_URL}/api/register`, { name, email, password, role, adminSecret, roll: rollNumber });
        setMessage(`🎉 ${res.data.message} Now you can login.`);
        setIsLogin(true);
        showToast("Registered successfully!", "success");
      }
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Server error'}`);
      showToast(err.response?.data?.message || 'Server error', "error");
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        const res = await axios.post(`${API_BASE_URL}/api/user/update-avatar`, {
          email: user.email,
          avatar: base64String
        });
        setUser(res.data.user);
        showToast("Profile Photo Updated Successfully!", "success");
      } catch(err) {
        showToast("Failed to upload image.", "error");
      }
    };
  };

  const handleGiveAttendance = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser!", "error");
      return;
    }

    setAttendanceMsg("Fetching your live location... 📍");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/attendance/submit`, {
            studentEmail: user.email,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });

          setHasSubmittedAttendance(true);
          localStorage.setItem(`attendance_${user.email}`, 'true');
          setAttendanceMsg(res.data.message);
          fetchAttendanceStatus();
          showToast(res.data.message, "success");
        } catch (err) {
          const errorMsg = err.response?.data?.message || 'Failed';
          setAttendanceMsg(`❌ ${errorMsg}`);
          showToast(errorMsg, "error");
        }
      },
      () => {
        showToast("Please allow location access!", "error");
        setAttendanceMsg("Location permission denied.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleToggleByAdmin = async (openState) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/toggle-attendance`, { isOpen: openState });
      setAttendanceStatus(res.data.attendanceStatus);
      showToast("Attendance status updated!", "success");
    } catch (err) {
      showToast("Failed to toggle gate", "error");
    }
  };

  const handleDownloadExcel = () => {
    if (!attendanceStatus.records || attendanceStatus.records.length === 0) {
      showToast("No records to export!", "error");
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,Student Name,Roll Number,Timestamp\n";
    attendanceStatus.records.forEach(r => { csvContent += `${r.name},${r.roll},${r.time}\n`; });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Attendance exported successfully!", "success");
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/assignments/create`, newAssign);
      showToast("Assignment published successfully!", "success");
      setNewAssign({ title: '', description: '', deadline: '' });
      fetchAssignments();
    } catch (err) {
      showToast("Failed to publish assignment", "error");
    }
  };

  const handleSubmitAssignment = async (assignId) => {
    const link = submissionLinks[assignId];
    if (!link) {
      showToast("Please paste a submission link!", "error");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/assignments/submit/${assignId}`, { studentName: user.name, email: user.email, roll: user.roll, link: link });
      showToast("Assignment submitted successfully!", "success");
      fetchAssignments();
    } catch (err) {
      showToast(err.response?.data?.message || "Submission failed", "error");
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/notices/create`, newNotice);
      showToast("Notice published!", "success");
      setNewNotice({ title: '', content: '' });
      fetchNotices();
    } catch (err) {
      showToast("Failed to publish notice", "error");
    }
  };

  const handleUpdateRoutine = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/routine/update`, newRoutine);
      showToast("Routine updated!", "success");
      setNewRoutine({ semester: '', link: '' });
      fetchRoutine();
    } catch (err) {
      showToast("Failed to update routine", "error");
    }
  };

  const handleUploadResource = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/resources/create`, newResource);
      showToast("Study material uploaded!", "success");
      setNewResource({ title: '', subject: '', link: '', type: 'Notes' });
      fetchResources();
    } catch (err) {
      showToast("Failed to upload material", "error");
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if(!newQuestion) return;
    try {
      await axios.post(`${API_BASE_URL}/api/forum/create`, { authorName: user.name, authorRole: user.role, question: newQuestion });
      setNewQuestion('');
      fetchForums();
      showToast("Question posted to forum!", "success");
    } catch (err) {
      showToast("Failed to post question", "error");
    }
  };

  const handlePostReply = async (forumId) => {
    const text = replyInputs[forumId];
    if(!text) return;
    try {
      await axios.post(`${API_BASE_URL}/api/forum/reply/${forumId}`, { name: user.name, role: user.role, text: text, time: new Date().toLocaleString('en-IN') });
      setReplyInputs({...replyInputs, [forumId]: ''});
      fetchForums();
      showToast("Reply posted!", "success");
    } catch (err) {
      showToast("Failed to post reply", "error");
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/gallery/upload`, newPhoto);
      showToast("Photo added to Gallery! 📸", "success");
      setNewPhoto({ title: '', imageUrl: '', category: 'TechFest' });
      fetchGallery();
    } catch (err) {
      showToast("Failed to upload photo", "error");
    }
  };

  const handleAddAlumni = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/alumni/add`, newAlumni);
      showToast("Alumni profile added successfully! 🚀", "success");
      setNewAlumni({ name: '', batch: '', role: '', linkedin: '' });
      fetchAlumni();
    } catch (err) {
      showToast("Failed to add profile", "error");
    }
  };

  const handleToggleFreeze = async (studentId) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/toggle-freeze/${studentId}`);
      showToast(res.data.message, "success");
      fetchAllStudents();
    } catch (err) {
      showToast("Failed to change account status", "error");
    }
  };

  // 🤖 AI Assistant Submit Handler
  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userMsg = aiPrompt;
    setAiChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAiPrompt('');
    setAiLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/ai/chat`, { prompt: userMsg });
      setAiChatHistory(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (err) {
      setAiChatHistory(prev => [...prev, { sender: 'ai', text: '❌ Sorry, I am unable to process your request right now.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogout = () => { setUser(null); setToken(''); setEmail(''); setPassword(''); setActiveTab('home'); setHasSubmittedAttendance(false); showToast("Logged out successfully", "success"); };

  // Theme Colors
  const colors = darkMode ? {
    primary: '#3b82f6', sidebarBg: '#090d16', bgLight: '#0f172a', cardBg: '#1e293b', textMain: '#f8fafc', textMuted: '#94a3b8', success: '#10b981', danger: '#f43f5e', border: '#334155', accent: '#8b5cf6', orange: '#f97316'
  } : {
    primary: '#3b82f6', sidebarBg: '#1e293b', bgLight: '#f1f5f9', cardBg: '#ffffff', textMain: '#0f172a', textMuted: '#64748b', success: '#10b981', danger: '#f43f5e', border: '#e2e8f0', accent: '#8b5cf6', orange: '#f97316'
  };

  const cardStyle = { background: colors.cardBg, color: colors.textMain, padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: `1px solid ${colors.border}`, marginBottom: '24px' };
  const inputStyle = { padding: '12px 16px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: darkMode ? '#0f172a' : '#fff', color: colors.textMain, fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const btnStyle = (bg, color) => ({ padding: '12px 20px', background: bg, color: color, border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' });

  if (user) {
    const isAdmin = user.role === 'admin';
    const sidebarItemStyle = (isActive) => ({ padding: '14px 20px', cursor: 'pointer', background: isActive ? colors.primary : 'transparent', color: isActive ? '#ffffff' : '#cbd5e1', borderRadius: '8px', marginBottom: '8px', fontWeight: isActive ? '600' : '500', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '10px' });

    const userAvatar = user.avatar ? (
      <img src={user.avatar} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
    ) : (
      <div style={{ width: '32px', height: '32px', background: colors.primary, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
        {user.name.charAt(0).toUpperCase()}
      </div>
    );

    return (
      <div style={{ fontFamily: '"Inter", -apple-system, sans-serif', backgroundColor: colors.bgLight, color: colors.textMain, minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {toast.show && (
          <div style={{
            position: 'fixed', top: '24px', right: '24px', background: toast.type === 'success' ? '#10b981' : '#f43f5e', color: '#fff', padding: '14px 24px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: '600', fontSize: '14px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span>{toast.type === 'success' ? '✔️' : '❌'}</span>
            {toast.message}
          </div>
        )}

        {/* Top Navbar */}
        <nav style={{ background: darkMode ? '#090d16' : '#0f172a', color: '#ffffff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: colors.primary, borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>M</div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px' }}>MAKAUT <span style={{color: '#94a3b8', fontWeight: '400'}}>Portal</span></h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            <button
              onClick={() => { setDarkMode(!darkMode); showToast(darkMode ? "Switched to Light Mode" : "Switched to Dark Mode", "success"); }}
              style={{ background: darkMode ? '#1e293b' : '#334155', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {userAvatar}
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#ffffff' }}>{user.name}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{isAdmin ? 'Administrator' : user.roll}</p>
            </div>
            <button onClick={handleLogout} style={{ ...btnStyle('#1e293b', '#f87171'), border: '1px solid #334155', marginLeft: '10px' }}>Logout</button>
          </div>
        </nav>

        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ width: '260px', background: colors.sidebarBg, padding: '24px 16px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${colors.border}` }}>
            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', paddingLeft: '8px' }}>Menu</p>
            <div onClick={() => setActiveTab('home')} style={sidebarItemStyle(activeTab === 'home')}>📊 Dashboard</div>
            <div onClick={() => { setActiveTab('notices'); fetchNotices(); }} style={sidebarItemStyle(activeTab === 'notices')}>📢 Notice Board</div>
            <div onClick={() => { setActiveTab('materials'); fetchResources(); }} style={sidebarItemStyle(activeTab === 'materials')}>📂 Study Materials</div>
            <div onClick={() => setActiveTab('aiAssistant')} style={sidebarItemStyle(activeTab === 'aiAssistant')}>🤖 AI Study Assistant</div>
            <div onClick={() => { setActiveTab('forum'); fetchForums(); }} style={sidebarItemStyle(activeTab === 'forum')}>💬 Q&A Forum</div>
            <div onClick={() => { setActiveTab('routine'); fetchRoutine(); }} style={sidebarItemStyle(activeTab === 'routine')}>📅 Class Routine</div>
            <div onClick={() => { setActiveTab('attendance'); fetchAttendanceStatus(); }} style={sidebarItemStyle(activeTab === 'attendance')}>⏱️ Attendance</div>
            <div onClick={() => { setActiveTab('assignments'); fetchAssignments(); }} style={sidebarItemStyle(activeTab === 'assignments')}>📚 Assignments</div>

            {isAdmin && (
              <div onClick={() => { setActiveTab('manageStudents'); fetchAllStudents(); }} style={sidebarItemStyle(activeTab === 'manageStudents')}>👥 Manage Students</div>
            )}

            <div onClick={() => { setActiveTab('gallery'); fetchGallery(); }} style={sidebarItemStyle(activeTab === 'gallery')}>📸 Event Gallery</div>
            <div onClick={() => { setActiveTab('alumni'); fetchAlumni(); }} style={sidebarItemStyle(activeTab === 'alumni')}>🎓 Alumni Network</div>
            <div onClick={() => setActiveTab('profile')} style={sidebarItemStyle(activeTab === 'profile')}>⚙️ Profile & Settings</div>
          </div>

          <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <h2 style={{ color: colors.textMain, marginBottom: '24px' }}>Account Settings</h2>
                  <div style={{...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'}}>

                    <div style={{ position: 'relative' }}>
                      {user.avatar ? (
                        <img src={user.avatar} alt="Profile Big" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: `4px solid ${colors.primary}` }} />
                      ) : (
                        <div style={{ width: '120px', height: '120px', background: darkMode ? '#0f172a' : colors.bgLight, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: colors.textMuted, fontSize: '48px', fontWeight: 'bold', border: `4px solid ${colors.border}` }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div>
                      <input type="file" id="avatarUpload" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                      <label htmlFor="avatarUpload" style={{...btnStyle(colors.primary, '#fff'), display: 'inline-block', textAlign: 'center'}}>📸 Change Profile Photo</label>
                    </div>

                    <div style={{ width: '100%', borderTop: `1px solid ${colors.border}`, marginTop: '10px', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div><p style={{margin: 0, fontSize: '12px', color: colors.textMuted, textTransform: 'uppercase', fontWeight: '600'}}>Full Name</p><p style={{margin: '4px 0 0 0', color: colors.textMain, fontSize: '16px'}}>{user.name}</p></div>
                      <div><p style={{margin: 0, fontSize: '12px', color: colors.textMuted, textTransform: 'uppercase', fontWeight: '600'}}>Email Address</p><p style={{margin: '4px 0 0 0', color: colors.textMain, fontSize: '16px'}}>{user.email}</p></div>
                      <div><p style={{margin: 0, fontSize: '12px', color: colors.textMuted, textTransform: 'uppercase', fontWeight: '600'}}>Account Role</p><p style={{margin: '4px 0 0 0', color: colors.textMain, fontSize: '16px', textTransform: 'capitalize'}}>{user.role}</p></div>
                      {user.role === 'student' && <div><p style={{margin: 0, fontSize: '12px', color: colors.textMuted, textTransform: 'uppercase', fontWeight: '600'}}>Roll Number</p><p style={{margin: '4px 0 0 0', color: colors.textMain, fontSize: '16px'}}>{user.roll}</p></div>}
                    </div>

                  </div>
                </div>
              )}

              {/* HOME DASHBOARD */}
              {activeTab === 'home' && (
                <div>
                  <h2 style={{ color: colors.textMain, margin: '0 0 16px 0', fontSize: '24px' }}>Welcome, {user.name}!</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '20px' }}>
                    <div style={{ ...cardStyle, borderTop: `5px solid ${colors.primary}`, textAlign: 'center' }}>
                      <p style={{ color: colors.textMuted, margin: '0 0 8px 0', fontWeight: '700', fontSize: '14px' }}>NOTICES</p>
                      <h1 style={{ color: colors.textMain, margin: 0, fontSize: '48px', fontWeight: '900' }}>{notices.length}</h1>
                    </div>
                    <div style={{ ...cardStyle, borderTop: `5px solid ${colors.danger}`, textAlign: 'center' }}>
                      <p style={{ color: colors.textMuted, margin: '0 0 8px 0', fontWeight: '700', fontSize: '14px' }}>TASKS</p>
                      <h1 style={{ color: colors.danger, margin: 0, fontSize: '48px', fontWeight: '900' }}>{assignments.length}</h1>
                    </div>
                    <div style={{ ...cardStyle, borderTop: `5px solid ${colors.accent}`, textAlign: 'center' }}>
                      <p style={{ color: colors.textMuted, margin: '0 0 8px 0', fontWeight: '700', fontSize: '14px' }}>MATERIALS</p>
                      <h1 style={{ color: colors.accent, margin: 0, fontSize: '48px', fontWeight: '900' }}>{resources.length}</h1>
                    </div>
                    <div style={{ ...cardStyle, borderTop: `5px solid ${colors.orange}`, textAlign: 'center' }}>
                      <p style={{ color: colors.textMuted, margin: '0 0 8px 0', fontWeight: '700', fontSize: '14px' }}>FORUM</p>
                      <h1 style={{ color: colors.orange, margin: 0, fontSize: '48px', fontWeight: '900' }}>{forums.length}</h1>
                    </div>
                  </div>
                </div>
              )}

              {/* 🤖 AI STUDY ASSISTANT TAB */}
              {activeTab === 'aiAssistant' && (
                <div>
                  <h2 style={{ color: colors.textMain, marginBottom: '24px' }}>🤖 AI Study Assistant (Powered by Gemini)</h2>
                  <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', height: '500px' }}>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px', marginBottom: '16px' }}>
                      {aiChatHistory.map((chat, idx) => (
                        <div key={idx} style={{
                          alignSelf: chat.sender === 'user' ? 'flex-end' : 'flex-start',
                          background: chat.sender === 'user' ? colors.primary : (darkMode ? '#0f172a' : '#f1f5f9'),
                          color: chat.sender === 'user' ? '#fff' : colors.textMain,
                          padding: '12px 18px',
                          borderRadius: '12px',
                          maxWidth: '75%',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {chat.text}
                        </div>
                      ))}
                      {aiLoading && (
                        <div style={{ alignSelf: 'flex-start', background: darkMode ? '#0f172a' : '#f1f5f9', color: colors.textMuted, padding: '12px 18px', borderRadius: '12px', fontSize: '14px' }}>
                          Thinking... 🤖
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleAskAI} style={{ display: 'flex', gap: '10px', borderTop: `1px solid ${colors.border}`, paddingTop: '16px' }}>
                      <input
                        type="text"
                        placeholder="Ask a doubt about C, Python, DSA, or exams..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button type="submit" style={btnStyle(colors.primary, '#fff')}>Send 🚀</button>
                    </form>
                  </div>
                </div>
              )}

              {/* MANAGE STUDENTS */}
              {activeTab === 'manageStudents' && isAdmin && (
                <div>
                  <h2 style={{ color: colors.textMain, marginBottom: '24px' }}>👥 Student Accounts Directory & Control</h2>
                  <div style={{...cardStyle, padding: 0, overflow: 'hidden'}}>
                    <div style={{ padding: '20px', borderBottom: `1px solid ${colors.border}`, background: darkMode ? '#0f172a' : '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '16px' }}>Registered Students ({allStudents.length})</h3>
                      <button onClick={fetchAllStudents} style={{...btnStyle(colors.primary, '#fff'), padding: '8px 16px', fontSize: '12px'}}>🔄 Refresh List</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, background: darkMode ? '#090d16' : '#f1f5f9' }}>
                          <th style={{ padding: '16px 20px', fontWeight: '600' }}>Student Name</th>
                          <th style={{ padding: '16px 20px', fontWeight: '600' }}>Email</th>
                          <th style={{ padding: '16px 20px', fontWeight: '600' }}>Roll ID</th>
                          <th style={{ padding: '16px 20px', fontWeight: '600' }}>Status</th>
                          <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStudents.length > 0 ? allStudents.map((st) => (
                          <tr key={st._id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <td style={{ padding: '16px 20px', color: colors.textMain, fontWeight: '500' }}>{st.name}</td>
                            <td style={{ padding: '16px 20px', color: colors.textMuted }}>{st.email}</td>
                            <td style={{ padding: '16px 20px', color: colors.textMuted }}>{st.roll || 'N/A'}</td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ background: st.isFrozen ? (darkMode ? '#9f1239' : '#ffe4e6') : (darkMode ? '#065f46' : '#d1fae5'), color: st.isFrozen ? colors.danger : colors.success, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                {st.isFrozen ? '❄️ Frozen' : '🟢 Active'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                              <button onClick={() => handleToggleFreeze(st._id)} style={{ ...btnStyle(st.isFrozen ? colors.success : colors.danger, '#fff'), padding: '8px 16px', fontSize: '12px' }}>
                                {st.isFrozen ? 'Unfreeze 🟢' : 'Freeze ❄️'}
                              </button>
                            </td>
                          </tr>
                        )) : <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: colors.textMuted }}>No registered students found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* EVENT GALLERY */}
              {activeTab === 'gallery' && (
                <div>
                  <h2 style={{ color: colors.textMain, marginBottom: '24px' }}>📸 Campus Fest & Event Gallery</h2>
                  <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Upload Fest Photo</h3>
                    <form onSubmit={handleUploadPhoto} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px' }}>
                      <input type="text" placeholder="Photo Title" value={newPhoto.title} onChange={e => setNewPhoto({...newPhoto, title: e.target.value})} required style={inputStyle}/>
                      <input type="url" placeholder="Image Direct URL" value={newPhoto.imageUrl} onChange={e => setNewPhoto({...newPhoto, imageUrl: e.target.value})} required style={inputStyle}/>
                      <select value={newPhoto.category} onChange={e => setNewPhoto({...newPhoto, category: e.target.value})} style={inputStyle}>
                        <option value="TechFest" style={{background: colors.cardBg}}>TechFest</option>
                        <option value="Cultural" style={{background: colors.cardBg}}>Cultural Fest</option>
                        <option value="Sports" style={{background: colors.cardBg}}>Sports Meet</option>
                      </select>
                      <button type="submit" style={btnStyle(colors.primary, '#fff')}>Upload 📷</button>
                    </form>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
                    {gallery.length === 0 ? <p style={{color: colors.textMuted}}>No photos uploaded yet.</p> : gallery.map(photo => (
                      <div key={photo._id} style={{ ...cardStyle, padding: 0, overflow: 'hidden', borderTop: `4px solid ${colors.primary}` }}>
                        <img src={photo.imageUrl} alt={photo.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} onError={(e)=>{e.target.src='https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=500&q=80'}} />
                        <div style={{ padding: '16px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', background: darkMode ? '#1e3a8a' : '#dbeafe', color: colors.primary, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{photo.category}</span>
                          <h4 style={{ margin: '10px 0 4px 0', fontSize: '16px' }}>{photo.title}</h4>
                          <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>Uploaded on {photo.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ALUMNI NETWORK */}
              {activeTab === 'alumni' && (
                <div>
                  <h2 style={{ color: colors.textMain, marginBottom: '24px' }}>🎓 Senior & Alumni Network (Placements)</h2>
                  <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Add Your Profile / Senior Referral</h3>
                    <form onSubmit={handleAddAlumni} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px' }}>
                      <input type="text" placeholder="Full Name" value={newAlumni.name} onChange={e => setNewAlumni({...newAlumni, name: e.target.value})} required style={inputStyle}/>
                      <input type="text" placeholder="Batch (e.g. 2024)" value={newAlumni.batch} onChange={e => setNewAlumni({...newAlumni, batch: e.target.value})} required style={inputStyle}/>
                      <input type="text" placeholder="Current Role (e.g. SDE @ Google)" value={newAlumni.role} onChange={e => setNewAlumni({...newAlumni, role: e.target.value})} required style={inputStyle}/>
                      <input type="url" placeholder="LinkedIn Profile URL" value={newAlumni.linkedin} onChange={e => setNewAlumni({...newAlumni, linkedin: e.target.value})} required style={inputStyle}/>
                      <button type="submit" style={btnStyle(colors.accent, '#fff')}>Connect 🚀</button>
                    </form>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '24px' }}>
                    {alumni.length === 0 ? <p style={{color: colors.textMuted}}>No alumni profiles added yet.</p> : alumni.map(alum => (
                      <div key={alum._id} style={{ ...cardStyle, borderLeft: `4px solid ${colors.accent}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '18px' }}>{alum.name}</h3>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', background: darkMode ? '#2e1065' : '#ede9fe', color: colors.accent, padding: '4px 8px', borderRadius: '4px' }}>{alum.batch}</span>
                        </div>
                        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: colors.textMuted, fontWeight: '500' }}>💼 {alum.role}</p>
                        <a href={alum.linkedin} target="_blank" rel="noreferrer" style={{ ...btnStyle(colors.primary, '#fff'), display: 'block', textAlign: 'center', textDecoration: 'none' }}>🔗 Connect on LinkedIn</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FORUM */}
              {activeTab === 'forum' && (
                <div>
                  <h2 style={{color:colors.textMain}}>💬 Community Q&A Forum</h2>
                  <div style={cardStyle}>
                    <form onSubmit={handleAskQuestion} style={{display:'flex', gap:'10px'}}>
                      <input type="text" placeholder="Ask a question..." value={newQuestion} onChange={e=>setNewQuestion(e.target.value)} style={{...inputStyle, flex:1}}/>
                      <button type="submit" style={btnStyle(colors.orange, '#fff')}>Post</button>
                    </form>
                  </div>
                  {forums.map(f=>(
                    <div key={f._id} style={{...cardStyle, marginBottom:'15px'}}>
                      <h3>{f.question}</h3>
                      <p style={{fontSize:'12px', color:colors.textMuted}}>By {f.authorName} ({f.date})</p>
                      <hr style={{borderTop:`1px solid ${colors.border}`, margin:'15px 0'}}/>
                      {f.replies.map((r,i)=><p key={i} style={{background: darkMode ? '#0f172a' : '#f8fafc', padding:'10px', borderRadius:'8px'}}><b>{r.name}:</b> {r.text} <span style={{fontSize:'11px', color:colors.textMuted}}>({r.time})</span></p>)}
                      <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                        <input type="text" placeholder="Reply..." value={replyInputs[f._id]||''} onChange={e=>setReplyInputs({...replyInputs, [f._id]:e.target.value})} style={inputStyle}/>
                        <button onClick={()=>handlePostReply(f._id)} style={btnStyle(colors.primary, '#fff')}>Reply</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MATERIALS */}
              {activeTab === 'materials' && (
                <div>
                  <h2 style={{ color: colors.textMain, marginBottom: '24px' }}>📂 Study Materials & PYQs</h2>
                  {isAdmin && (
                    <div style={cardStyle}>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Upload New Material</h3>
                      <form onSubmit={handleUploadResource} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <input type="text" placeholder="Title (e.g. Module 1 Notes)" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} required style={inputStyle}/>
                        <input type="text" placeholder="Subject (e.g. C Programming)" value={newResource.subject} onChange={e => setNewResource({...newResource, subject: e.target.value})} required style={inputStyle}/>
                        <input type="url" placeholder="Google Drive PDF/Video Link" value={newResource.link} onChange={e => setNewResource({...newResource, link: e.target.value})} required style={inputStyle}/>
                        <select value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value})} style={inputStyle}>
                          <option value="Notes" style={{background: colors.cardBg}}>Notes / PPT</option>
                          <option value="PYQ" style={{background: colors.cardBg}}>Previous Year Questions</option>
                          <option value="Book" style={{background: colors.cardBg}}>E-Book</option>
                        </select>
                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="submit" style={btnStyle(colors.accent, '#fff')}>Upload Resource 📚</button>
                        </div>
                      </form>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {resources.length === 0 ? <p style={{color: colors.textMuted}}>No study materials uploaded yet.</p> : resources.map((res) => (
                      <div key={res._id} style={{ ...cardStyle, marginBottom: 0, borderTop: `4px solid ${colors.accent}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: colors.accent, background: darkMode ? '#2e1065' : '#ede9fe', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{res.type}</span>
                          <span style={{ fontSize: '12px', color: colors.textMuted }}>{res.date}</span>
                        </div>
                        <h3 style={{ margin: '8px 0', color: colors.textMain, fontSize: '18px' }}>{res.title}</h3>
                        <p style={{ margin: '0 0 16px 0', color: colors.textMuted, fontSize: '14px', fontWeight: '500' }}>{res.subject}</p>
                        <a href={res.link} target="_blank" rel="noreferrer" style={{...btnStyle(darkMode ? '#0f172a' : colors.bgLight, colors.textMain), display: 'block', textAlign: 'center', textDecoration: 'none', border: `1px solid ${colors.border}`}}>Access Material ↗</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTICES */}
              {activeTab === 'notices' && (
                <div>
                  <h2 style={{ color: colors.textMain, marginBottom: '24px' }}>📢 Notice Board</h2>
                  {isAdmin && (
                    <div style={cardStyle}>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: colors.textMain }}>Create Announcement</h3>
                      <form onSubmit={handleCreateNotice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input type="text" placeholder="Subject Title" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} required style={inputStyle}/>
                        <textarea placeholder="Detailed description..." value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} required style={{ ...inputStyle, height: '120px', resize: 'vertical' }}></textarea>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="submit" style={btnStyle(colors.primary, '#fff')}>Publish Notice</button>
                        </div>
                      </form>
                    </div>
                  )}
                  <h3 style={{ marginTop: '20px', marginBottom: '16px', fontSize: '16px', color: colors.textMain }}>Recent Notices</h3>
                  {notices.length === 0 ? <p style={{color: colors.textMuted}}>No notices available.</p> : notices.map((notice) => (
                    <div key={notice._id} style={{ ...cardStyle, borderLeft: `4px solid ${colors.primary}`, padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: colors.textMain, fontSize: '16px' }}>{notice.title}</h4>
                        <span style={{ fontSize: '12px', color: colors.textMuted, background: darkMode ? '#0f172a' : colors.bgLight, padding: '4px 10px', borderRadius: '12px' }}>{notice.date}</span>
                      </div>
                      <p style={{ color: colors.textMuted, margin: 0, fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{notice.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ROUTINE */}
              {activeTab === 'routine' && (
                <div>
                  <h2 style={{ color: colors.textMain, marginBottom: '24px' }}>📅 Class Routine</h2>
                  {isAdmin && (
                    <div style={cardStyle}>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: colors.textMain }}>Upload New Timetable</h3>
                      <form onSubmit={handleUpdateRoutine} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input type="text" placeholder="Semester/Batch (e.g., CSE 3rd Semester Routine)" value={newRoutine.semester} onChange={e => setNewRoutine({...newRoutine, semester: e.target.value})} required style={inputStyle}/>
                        <input type="url" placeholder="Google Drive / Image Link of Timetable" value={newRoutine.link} onChange={e => setNewRoutine({...newRoutine, link: e.target.value})} required style={inputStyle}/>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="submit" style={btnStyle(colors.primary, '#fff')}>Update Routine</button>
                        </div>
                      </form>
                    </div>
                  )}
                  <h3 style={{ marginTop: '20px', marginBottom: '16px', fontSize: '16px', color: colors.textMain }}>Current Active Routine</h3>
                  {routine ? (
                    <div style={{ ...cardStyle, borderLeft: `4px solid ${colors.primary}` }}>
                      <h4 style={{ margin: '0 0 8px 0', color: colors.textMain, fontSize: '18px' }}>{routine.semester}</h4>
                      <p style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '20px' }}>Last Updated: {routine.lastUpdated}</p>
                      <a href={routine.link} target="_blank" rel="noreferrer" style={{...btnStyle(darkMode ? '#0f172a' : '#f8fafc', colors.primary), border: `1px solid ${colors.border}`, textDecoration: 'none', display: 'inline-block'}}>View Document ↗</a>
                    </div>
                  ) : <p style={{color: colors.textMuted}}>No routine uploaded yet.</p>}
                </div>
              )}

              {/* ATTENDANCE */}
              {activeTab === 'attendance' && (
                <div>
                  <h2 style={{ color: colors.textMain, marginBottom: '24px' }}>Session & Attendance</h2>
                  {isAdmin ? (
                    <>
                      <div style={{...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Gate Control</h3>
                          <p style={{ margin: 0, fontSize: '14px', color: colors.textMuted }}>Current Status: <strong style={{color: attendanceStatus.isOpen ? colors.success : colors.danger}}>{attendanceStatus.isOpen ? 'Accepting Responses' : 'Closed'}</strong></p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button onClick={() => handleToggleByAdmin(true)} style={btnStyle(attendanceStatus.isOpen ? '#065f46' : colors.success, '#fff')}>Enable Port</button>
                          <button onClick={() => handleToggleByAdmin(false)} style={btnStyle(!attendanceStatus.isOpen ? '#9f1239' : colors.danger, '#fff')}>Disable Port</button>
                          <button onClick={fetchAttendanceStatus} style={{...btnStyle(darkMode ? '#0f172a' : colors.bgLight, colors.textMain), border: `1px solid ${colors.border}`}}>Refresh Data</button>
                          <button onClick={handleDownloadExcel} style={{...btnStyle('#f59e0b', '#fff'), boxShadow: '0 4px 6px rgba(245, 158, 11, 0.2)'}}>📥 Export to Excel</button>
                        </div>
                      </div>
                      <div style={{...cardStyle, padding: 0, overflow: 'hidden'}}>
                        <div style={{ padding: '20px', borderBottom: `1px solid ${colors.border}`, background: darkMode ? '#0f172a' : '#f8fafc' }}>
                          <h3 style={{ margin: 0, fontSize: '15px' }}>Live Datasheet ({attendanceStatus.records?.length || 0} Entries)</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, background: darkMode ? '#090d16' : '#f1f5f9' }}>
                              <th style={{ padding: '16px 20px', fontWeight: '600' }}>Student Name</th>
                              <th style={{ padding: '16px 20px', fontWeight: '600' }}>Roll ID</th>
                              <th style={{ padding: '16px 20px', fontWeight: '600' }}>Timestamp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceStatus.records?.length > 0 ? attendanceStatus.records.map((r, i) => (
                              <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                <td style={{ padding: '16px 20px', color: colors.textMain, fontWeight: '500' }}>{r.name}</td>
                                <td style={{ padding: '16px 20px', color: colors.textMuted }}>{r.roll}</td>
                                <td style={{ padding: '16px 20px', color: colors.success, fontWeight: '500' }}>{r.time}</td>
                              </tr>
                            )) : <tr><td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: colors.textMuted }}>No submissions recorded for this session.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
                      {attendanceStatus.isOpen ? (
                        hasSubmittedAttendance ? (
                          <div>
                            <div style={{ width: '48px', height: '48px', background: darkMode ? '#065f46' : '#d1fae5', color: colors.success, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '24px' }}>✓</div>
                            <p style={{ color: colors.success, fontWeight: '600', fontSize: '18px', margin: 0 }}>Attendance Logged Successfully</p>
                          </div>
                        ) : (
                          <button onClick={handleGiveAttendance} style={{...btnStyle(colors.success, '#fff'), padding: '16px 32px', fontSize: '16px', borderRadius: '30px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'}}>Mark Present Today</button>
                        )
                      ) : (
                         <div>
                            <div style={{ width: '48px', height: '48px', background: darkMode ? '#9f1239' : '#ffe4e6', color: colors.danger, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '24px' }}>×</div>
                            <p style={{ color: colors.danger, fontWeight: '600', fontSize: '18px', margin: 0 }}>Portal Currently Closed</p>
                            <p style={{ color: colors.textMuted, fontSize: '14px', marginTop: '8px' }}>Waiting for administrator to initiate session.</p>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ASSIGNMENTS */}
              {activeTab === 'assignments' && (
                <div>
                  <h2 style={{ color: colors.textMain, marginBottom: '24px' }}>📚 Task Management</h2>
                  {isAdmin && (
                    <div style={cardStyle}>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Issue New Assignment</h3>
                      <form onSubmit={handleCreateAssignment} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <input type="text" placeholder="Assignment Title" value={newAssign.title} onChange={e => setNewAssign({...newAssign, title: e.target.value})} required style={inputStyle}/>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <textarea placeholder="Instructions & Requirements..." value={newAssign.description} onChange={e => setNewAssign({...newAssign, description: e.target.value})} required style={{...inputStyle, height: '100px'}}></textarea>
                        </div>
                        <div>
                          <input type="date" value={newAssign.deadline} onChange={e => setNewAssign({...newAssign, deadline: e.target.value})} required style={inputStyle}/>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button type="submit" style={btnStyle(colors.primary, '#fff')}>Deploy Assignment</button>
                        </div>
                      </form>
                    </div>
                  )}
                  <h3 style={{ marginTop: '40px', marginBottom: '16px', fontSize: '16px', color: colors.textMain }}>Issued Tasks Overview</h3>
                  {assignments.length === 0 ? <p style={{color: colors.textMuted}}>No active assignments.</p> : assignments.map(assign => {
                    const isSubmitted = !isAdmin && assign.submissions.some(sub => sub.email === user.email);
                    return (
                      <div key={assign._id} style={{...cardStyle, padding: '24px', borderLeft: isAdmin ? `1px solid ${colors.border}` : `4px solid ${isSubmitted ? colors.success : colors.danger}`}}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', color: colors.textMain }}>{assign.title}</h4>
                          <span style={{ fontSize: '12px', color: colors.danger, background: darkMode ? '#9f1239' : '#ffe4e6', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>Due: {assign.deadline}</span>
                        </div>
                        <p style={{ color: colors.textMuted, margin: '0 0 20px 0', fontSize: '14px' }}>{assign.description}</p>

                        {isAdmin ? (
                          <div style={{ background: darkMode ? '#0f172a' : '#f8fafc', border: `1px solid ${colors.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                            <details style={{ padding: '0' }}>
                              <summary style={{ padding: '16px 20px', cursor: 'pointer', fontWeight: '600', color: colors.textMain, outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Submissions Log</span>
                                <span style={{ background: colors.primary, color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{assign.submissions.length}</span>
                              </summary>
                              <div style={{ borderTop: `1px solid ${colors.border}` }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                                  <thead>
                                    <tr style={{ background: darkMode ? '#090d16' : '#f1f5f9', color: colors.textMuted }}>
                                      <th style={{ padding: '12px 20px' }}>Roll No</th>
                                      <th style={{ padding: '12px 20px' }}>Student</th>
                                      <th style={{ padding: '12px 20px' }}>Resource Link</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {assign.submissions.map((sub, i) => (
                                      <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                        <td style={{ padding: '12px 20px', color: colors.textMuted }}>{sub.roll}</td>
                                        <td style={{ padding: '12px 20px', fontWeight: '500' }}>{sub.studentName}</td>
                                        <td style={{ padding: '12px 20px' }}><a href={sub.link} target="_blank" rel="noreferrer" style={{ color: colors.primary, textDecoration: 'none', fontWeight: '500' }}>View File ↗</a></td>
                                      </tr>
                                    ))}
                                    {assign.submissions.length === 0 && (
                                      <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: colors.textMuted }}>No submissions yet.</td></tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </details>
                          </div>
                        ) : (
                          isSubmitted ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.success, fontWeight: '500', fontSize: '14px' }}>
                               <span style={{ background: darkMode ? '#065f46' : '#d1fae5', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' }}>✓</span>
                               Assignment Submitted
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <input type="url" placeholder="Paste your Drive / GitHub link here" value={submissionLinks[assign._id] || ''} onChange={(e) => setSubmissionLinks({...submissionLinks, [assign._id]: e.target.value})} style={inputStyle} />
                              <button onClick={() => handleSubmitAssignment(assign._id)} style={{...btnStyle(colors.primary, '#fff'), whiteSpace: 'nowrap'}}>Submit Link</button>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGIN / REGISTER UI ---
  return (
    <div style={{ fontFamily: '"Inter", -apple-system, sans-serif', backgroundColor: '#0f172a', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>

      {toast.show && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', background: toast.type === 'success' ? '#10b981' : '#f43f5e', color: '#fff', padding: '14px 24px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: '600', fontSize: '14px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span>{toast.type === 'success' ? '✔️' : '❌'}</span>
          {toast.message}
        </div>
      )}

      <div style={{ background: '#1e293b', color: '#f8fafc', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', width: '100%', maxWidth: '400px', boxSizing: 'border-box', border: '1px solid #334155' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#f8fafc' }}>{isLogin ? 'Login to Portal' : 'Register Account'}</h2>
        {message && <div style={{ color: message.includes('❌') ? '#f43f5e' : '#10b981', textAlign: 'center', marginBottom: '16px' }}>{message}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <>
              <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required style={{padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '8px', outline: 'none'}} />
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '8px', outline: 'none'}}>
                <option value="student">Student</option><option value="admin">Administrator</option>
              </select>
              {role === 'student' && <input type="text" placeholder="Roll Number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required style={{padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '8px', outline: 'none'}}/>}
              {role === 'admin' && <input type="password" placeholder="Admin Secret Key" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} required style={{padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #f43f5e', borderRadius: '8px', outline: 'none'}}/>}
            </>
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '8px', outline: 'none'}} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '8px', outline: 'none'}} />
          <button type="submit" style={{ padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>{isLogin ? 'Sign In' : 'Register'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px' }}>
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold' }}>{isLogin ? 'Create an account' : 'Sign in instead'}</span>
        </p>
      </div>
    </div>
  );
}

export default App;
