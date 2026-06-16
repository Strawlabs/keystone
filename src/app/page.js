'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '@/frontend/store/store';
import { 
  Building2, Folder, FileText, CheckSquare, ClipboardList, 
  Users, Bell, Settings, Plus, Activity, Shield, CheckCircle, 
  AlertCircle, Search
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Import refactored modular components
import AuthScreens from '@/frontend/components/AuthScreens';
import Sidebar from '@/frontend/components/Sidebar';
import Header from '@/frontend/components/Header';
import Modals from '@/frontend/components/Modals';
import DashboardView from '@/frontend/components/DashboardView';
import ProjectsView from '@/frontend/components/ProjectsView';
import DrawingsView from '@/frontend/components/DrawingsView';
import ApprovalCenterView from '@/frontend/components/ApprovalCenterView';
import BlueprintReviewPanel from '@/frontend/components/BlueprintReviewPanel';
import TasksView from '@/frontend/components/TasksView';
import SiteLogsView from '@/frontend/components/SiteLogsView';
import NotificationsView from '@/frontend/components/NotificationsView';
import { UsersView, ActivityView, SettingsView, SaaSAdminView } from '@/frontend/components/AdministrativeViews';

export default function Home() {
  const store = useStore();
  const { 
    currentUser, isAuthenticated, projects, drawings, approvals, tasks, 
    siteLogs, notifications, activityLogs, users, activeTab, 
    selectedProjectId, selectedDrawingId, selectedApprovalId, loading, error, successMessage,
    setTab, setSelectedProjectId, setSelectedDrawingId, setSelectedApprovalId,
    login, signup, verify, logout, resetPassword, createProject, updateProject, deleteProject,
    createDrawing, createDrawingRevision, submitApproval, approveDrawing, rejectDrawing,
    createTask, updateTask, completeTask, createSiteLog, markNotificationRead, fetchData,
    setError, setSuccess
  } = store;

  // Local UI States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password Page State
  const [forgotEmail, setForgotEmail] = useState('');

  // Signup Page State
  const [signupForm, setSignupForm] = useState({ name: '', email: '', companyName: '', password: '', confirmPassword: '' });
  const [signupSentCode, setSignupSentCode] = useState(null);
  const [signupCodeInput, setSignupCodeInput] = useState('');

  // Modals visibility
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSiteLogModal, setShowSiteLogModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Global Search
  const [globalSearch, setGlobalSearch] = useState('');

  // Form Inputs
  const [newProj, setNewProj] = useState({ name: '', code: '', client_name: '', client_email: '', location: '', description: '', status: 'planning', start_date: '', end_date: '', members: [] });
  const [newLog, setNewLog] = useState({ project_id: '', notes: '', site_status: 'active', photos: [] });
  const [newTaskInput, setNewTaskInput] = useState({ project_id: '', title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'staff' });
  const [newDrawingInput, setNewDrawingInput] = useState({ project_id: '', name: '', drawing_number: '', category: 'architectural', revision_number: '1', revision_notes: '', file_url: '' });
  const [newApprovalInput, setNewApprovalInput] = useState({ drawing_id: '', client_id: '', comments: '' });

  // Filters and Searches
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');
  const [drawingSearch, setDrawingSearch] = useState('');
  const [drawingCategoryFilter, setDrawingCategoryFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');

  // Drawing Interactive Review Canvas States
  const [zoomScale, setZoomScale] = useState(1);
  const [blueprintPins, setBlueprintPins] = useState([
    { id: 1, x: 35, y: 45, comment: 'Verify kitchen counter width is exactly 1200mm.', user: 'Alex Rivera', role: 'client', date: 'Oct 24, 2026' }
  ]);
  const [newPinComment, setNewPinComment] = useState('');
  const [clickCoords, setClickCoords] = useState(null);
  const drawingContainerRef = useRef(null);

  // Load initial data on mount/auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, currentUser?.id]);

  // Blueprint Drop-Pin Comment
  const handleBlueprintClick = (e) => {
    if (currentUser?.role !== 'client' && currentUser?.role !== 'architect' && currentUser?.role !== 'admin') return;
    const rect = drawingContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setClickCoords({ x, y });
  };

  const submitPinComment = () => {
    if (!newPinComment.trim() || !clickCoords) return;
    const newPin = {
      id: Date.now(),
      x: clickCoords.x,
      y: clickCoords.y,
      comment: newPinComment,
      user: currentUser.name,
      role: currentUser.role,
      date: 'Today'
    };
    setBlueprintPins([...blueprintPins, newPin]);
    setNewPinComment('');
    setClickCoords(null);
    setSuccess('Comment pin dropped on blueprint!');
  };

  // Toast Alerts Render
  const renderToasts = () => (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {successMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in border border-emerald-500 text-sm">
          <CheckCircle className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="bg-rose-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in border border-rose-500 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  // NAVIGATION & ROLE ACCESS CONTROL — Matches KeystoneDocument 3 exactly
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2, roles: ['admin', 'architect', 'staff', 'client'] },
    { id: 'projects', label: 'Projects', icon: Folder, roles: ['admin', 'architect', 'client'] },
    { id: 'assigned-projects', label: 'Assigned Projects', icon: Folder, roles: ['staff'] },
    { id: 'drawings', label: 'Drawings', icon: FileText, roles: ['admin', 'architect', 'staff', 'client'] },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList, roles: ['admin', 'architect', 'staff'] },
    { id: 'site-logs', label: 'Site Logs', icon: Activity, roles: ['admin', 'architect', 'staff'] },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, roles: ['admin', 'architect', 'client'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['admin'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'architect', 'staff', 'client'] },
    { id: 'activity', label: 'Activity Timeline', icon: Activity, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
    { id: 'saas', label: 'SaaS Admin', icon: Shield, roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(currentUser?.role));

  const handleOpenProjectModal = () => {
    if (isClient || isStaff) return;
    setShowProjectModal(true);
  };

  // Create Project Submit
  const handleSaveProject = async (e) => {
    e.preventDefault();
    const success = await createProject(newProj);
    if (success) {
      setShowProjectModal(false);
      setNewProj({ name: '', code: '', client_name: '', client_email: '', location: '', description: '', status: 'planning', start_date: '', end_date: '', members: [] });
    }
  };

  // Create Task Submit
  const handleSaveTask = async (e) => {
    e.preventDefault();
    const success = await createTask({
      project_id: newTaskInput.project_id || (projects[0]?.id || ''),
      title: newTaskInput.title,
      description: newTaskInput.description,
      assigned_to: newTaskInput.assigned_to || (users[2]?.id || 'u3'),
      priority: newTaskInput.priority,
      due_date: newTaskInput.due_date
    });
    if (success) {
      setShowTaskModal(false);
      setNewTaskInput({ project_id: '', title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
    }
  };

  // Create User Submit
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSuccess(`Invite request sent to ${newUser.name} (${newUser.email})`);
    setShowUserModal(false);
    setNewUser({ name: '', email: '', role: 'staff' });
  };

  // Handle Client Decision Actions (from blueprint panel)
  const handleClientApprovalAction = async (status) => {
    const activeApproval = approvals.find(a => a.drawing_id === selectedDrawingId);
    if (!activeApproval) return;
    
    if (status === 'approved') {
      const ok = await approveDrawing(activeApproval.id, 'Approved by client. Looks complete.');
      if (ok) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setTab('approvals');
      }
    } else {
      const commentInput = prompt('Please enter revision remarks / rejection reasons:');
      if (commentInput !== null) {
        await rejectDrawing(activeApproval.id, commentInput, status === 'revision_requested');
        setTab('approvals');
      }
    }
  };

  // UNAUTHENTICATED VIEWS
  if (!isAuthenticated) {
    return (
      <AuthScreens
        activeTab={activeTab}
        setTab={setTab}
        login={login}
        signup={signup}
        verify={verify}
        resetPassword={resetPassword}
        error={error}
        successMessage={successMessage}
        setError={setError}
        signupForm={signupForm}
        setSignupForm={setSignupForm}
        signupSentCode={signupSentCode}
        setSignupSentCode={setSignupSentCode}
        signupCodeInput={signupCodeInput}
        setSignupCodeInput={setSignupCodeInput}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        forgotEmail={forgotEmail}
        setForgotEmail={setForgotEmail}
        loading={loading}
      />
    );
  }

  // Role helpers
  const isAdmin = currentUser?.role === 'admin';
  const isArchitect = currentUser?.role === 'architect';
  const isStaff = currentUser?.role === 'staff';
  const isClient = currentUser?.role === 'client';

  const toggleNotificationDropdown = () => setShowNotificationDropdown(!showNotificationDropdown);

  // Filter computations
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(projectSearch.toLowerCase()) || 
                          p.code?.toLowerCase().includes(projectSearch.toLowerCase()) ||
                          p.client_name?.toLowerCase().includes(projectSearch.toLowerCase());
    const matchesStatus = projectStatusFilter === 'all' || p.status === projectStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // For staff, show only projects they're assigned to (using all for now since we don't have project_members fetched)
  const assignedProjects = filteredProjects;

  const filteredDrawings = drawings.filter(d => {
    const matchesSearch = d.name?.toLowerCase().includes(drawingSearch.toLowerCase()) ||
                          (d.project_name && d.project_name.toLowerCase().includes(drawingSearch.toLowerCase()));
    const matchesCat = drawingCategoryFilter === 'all' || d.category === drawingCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'assigned') return t.assigned_to === currentUser?.id;
    if (taskFilter === 'pending') return t.status === 'pending';
    if (taskFilter === 'in_progress') return t.status === 'in_progress';
    if (taskFilter === 'completed') return t.status === 'completed';
    if (taskFilter === 'delayed') return t.status === 'delayed';
    return true;
  });

  const activeDrawing = drawings.find(d => d.id === selectedDrawingId) || drawings[0];

  const renderTabContent = () => {
    const tab = activeTab;
    switch (tab) {
      case 'dashboard':
        return (
          <DashboardView
            currentUser={currentUser}
            projects={projects}
            approvals={approvals}
            tasks={tasks}
            siteLogs={siteLogs}
            drawings={drawings}
            users={users}
            setTab={setTab}
            setShowProjectModal={setShowProjectModal}
            setShowUserModal={setShowUserModal}
          />
        );
      case 'projects':
      case 'assigned-projects':
        return (
          <ProjectsView
            projectSearch={projectSearch}
            setProjectSearch={setProjectSearch}
            projectStatusFilter={projectStatusFilter}
            setProjectStatusFilter={setProjectStatusFilter}
            filteredProjects={tab === 'assigned-projects' ? assignedProjects : filteredProjects}
            isClient={isClient}
            isStaff={isStaff}
            setShowProjectModal={setShowProjectModal}
            updateProject={updateProject}
            deleteProject={deleteProject}
            isAssignedView={tab === 'assigned-projects'}
          />
        );
      case 'drawings':
        return (
          <DrawingsView
            drawingCategoryFilter={drawingCategoryFilter}
            setDrawingCategoryFilter={setDrawingCategoryFilter}
            drawingSearch={drawingSearch}
            setDrawingSearch={setDrawingSearch}
            filteredDrawings={filteredDrawings}
            isClient={isClient}
            isStaff={isStaff}
            currentUser={currentUser}
            setShowDrawingModal={setShowDrawingModal}
            setSelectedDrawingId={setSelectedDrawingId}
            setTab={setTab}
            submitApproval={submitApproval}
            users={users}
          />
        );
      case 'approvals':
        return (
          <ApprovalCenterView
            approvals={approvals}
            drawings={drawings}
            users={users}
            currentUser={currentUser}
            submitApproval={submitApproval}
            approveDrawing={approveDrawing}
            rejectDrawing={rejectDrawing}
            setSelectedDrawingId={setSelectedDrawingId}
            setTab={setTab}
            projects={projects}
          />
        );
      case 'tasks':
        return (
          <TasksView
            taskFilter={taskFilter}
            setTaskFilter={setTaskFilter}
            filteredTasks={filteredTasks}
            isClient={isClient}
            isStaff={isStaff}
            currentUser={currentUser}
            setShowTaskModal={setShowTaskModal}
            completeTask={completeTask}
            updateTask={updateTask}
            users={users}
          />
        );
      case 'site-logs':
        return (
          <SiteLogsView
            siteLogs={siteLogs}
            isClient={isClient}
            setShowSiteLogModal={setShowSiteLogModal}
            projects={projects}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            notifications={notifications}
            markNotificationRead={markNotificationRead}
            setTab={setTab}
          />
        );
      case 'users':
        return isAdmin && <UsersView users={users} setShowUserModal={setShowUserModal} />;
      case 'activity':
        return isAdmin && <ActivityView activityLogs={activityLogs} users={users} />;
      case 'settings':
        return isAdmin && <SettingsView store={store} />;
      case 'saas':
        return isAdmin && <SaaSAdminView />;
      // Blueprint review — accessible via drawing card click
      case 'blueprint-review':
        return (
          <BlueprintReviewPanel
            activeDrawing={activeDrawing}
            zoomScale={zoomScale}
            setZoomScale={setZoomScale}
            drawingContainerRef={drawingContainerRef}
            handleBlueprintClick={handleBlueprintClick}
            blueprintPins={blueprintPins}
            clickCoords={clickCoords}
            isClient={isClient}
            handleClientApprovalAction={handleClientApprovalAction}
            newPinComment={newPinComment}
            setNewPinComment={setNewPinComment}
            submitPinComment={submitPinComment}
            setClickCoords={setClickCoords}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 flex font-sans">
      {renderToasts()}

      {/* Sidebar Navigation */}
      <Sidebar
        filteredMenuItems={filteredMenuItems}
        activeTab={activeTab}
        setTab={setTab}
        currentUser={currentUser}
        isClient={isClient}
        isStaff={isStaff}
        handleOpenProjectModal={handleOpenProjectModal}
        logout={logout}
        notifications={notifications}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-955">
        
        {/* Global Top Navbar */}
        <Header
          activeTab={activeTab}
          currentUser={currentUser}
          toggleNotificationDropdown={toggleNotificationDropdown}
          showNotificationDropdown={showNotificationDropdown}
          notifications={notifications}
          markNotificationRead={markNotificationRead}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          setTab={setTab}
        />

        {/* Global Page Content Container */}
        <main className="flex-1 p-8">
          {renderTabContent()}
        </main>
      </div>

      {/* Modals Bundle Overlay */}
      <Modals
        showProjectModal={showProjectModal}
        setShowProjectModal={setShowProjectModal}
        showSiteLogModal={showSiteLogModal}
        setShowSiteLogModal={setShowSiteLogModal}
        showTaskModal={showTaskModal}
        setShowTaskModal={setShowTaskModal}
        showDrawingModal={showDrawingModal}
        setShowDrawingModal={setShowDrawingModal}
        showUserModal={showUserModal}
        setShowUserModal={setShowUserModal}
        newProj={newProj}
        setNewProj={setNewProj}
        handleSaveProject={handleSaveProject}
        newLog={newLog}
        setNewLog={setNewLog}
        createSiteLog={createSiteLog}
        projects={projects}
        newTaskInput={newTaskInput}
        setNewTaskInput={setNewTaskInput}
        handleSaveTask={handleSaveTask}
        users={users}
        newDrawingInput={newDrawingInput}
        setNewDrawingInput={setNewDrawingInput}
        createDrawing={createDrawing}
        newUser={newUser}
        setNewUser={setNewUser}
        handleSaveUser={handleSaveUser}
        currentUser={currentUser}
        currentTenantId={store.currentTenantId}
      />
    </div>
  );
}
