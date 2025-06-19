import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, UserX, UserCheck, Edit, Trash2, 
  BarChart2, CreditCard, LineChart, RefreshCw, Search,
  ChevronDown, ChevronUp, Loader2, Clock, Activity, Eye, Calendar, User
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import DashboardAssignmentModal from './DashboardAssignmentModal';
import { showDeleteConfirmation, showErrorAlert, showLoadingAlert, showSuccessAlert } from './alert';
import PlanAssignmentModal from './PlanAssignmentModal';

const User_admin = () => {
  const { user: currentUser, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDashboardAssignment, setShowDashboardAssignment] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dashboards, setDashboards] = useState([]);
  const [assignedDashboards, setAssignedDashboards] = useState([]);
  const [loadingDashboards, setLoadingDashboards] = useState(false);
  const [showPlanAssignment, setShowPlanAssignment] = useState(false);
  const [selectedUserIdForPlan, setSelectedUserIdForPlan] = useState(null);
  const [allUserPlans, setAllUserPlans] = useState({});
  const [plans, setPlans] = useState([]);
  const [userPlans, setUserPlans] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [activityStats, setActivityStats] = useState({});
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    password: ''
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    admins: 0,
    regularUsers: 0,
    inactiveUsers: 0
  });

  const [chartData, setChartData] = useState({
    roles: [],
    activity: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchUserActivities = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/activities`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch activities');
      
      const data = await response.json();
      setUserActivities(data.activities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      toast.error('Failed to fetch activities');
    }
  };

  const fetchActivityStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/activity-stats`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch activity stats');
      
      const data = await response.json();
      setActivityStats(data.stats);
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      toast.error('Failed to fetch activity stats');
    }
  };

  const handleViewActivities = (userId) => {
    setSelectedUserForActivity(userId);
    setShowActivityModal(true);
    fetchUserActivities(userId);
  };

  const activityChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['Views', 'Edits', 'Logins']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: userActivities.map(a => new Date(a.createdAt).toLocaleDateString())
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Views',
        type: 'bar',
        data: userActivities.map(a => a.action === 'view' ? 1 : 0)
      },
      {
        name: 'Edits',
        type: 'bar',
        data: userActivities.map(a => a.action === 'edit' ? 1 : 0)
      },
      {
        name: 'Logins',
        type: 'bar',
        data: userActivities.map(a => a.action === 'login' ? 1 : 0)
      }
    ]
  };

  const timeSpentChartOption = {
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        name: 'Time Spent',
        type: 'pie',
        radius: '70%',
        data: userActivities
          .filter(a => a.duration)
          .map(a => ({
            value: a.duration,
            name: a.dashboardId ? `Dashboard: ${a.dashboardId.name}` : 'Other'
          }))
      }
    ]
  };

  const fetchAllUserPlans = async (userIds) => {
    try {
      const plansPromises = userIds.map(async (userId) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/plans`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (!response.ok) {
            console.warn(`Error loading plans for user ${userId}`);
            return { userId, plans: [] };
          }
          
          const data = await response.json();
          return { userId, plans: data.plans || [] };
        } catch (error) {
          console.warn(`Error loading plans for user ${userId}:`, error);
          return { userId, plans: [] };
        }
      });

      const results = await Promise.all(plansPromises);
      const plansMap = {};
      
      results.forEach(({ userId, plans }) => {
        plansMap[userId] = plans;
      });
      
      setAllUserPlans(plansMap);
    } catch (error) {
      console.error('Error loading user plans:', error);
    }
  };

  const handleAssignDashboards = (userId) => {
    setSelectedUserId(userId);
    setShowDashboardAssignment(true);
    fetchAssignedDashboards(userId);
  };

  const fetchDashboards = async () => {
    try {
      setLoadingDashboards(true);
      const response = await fetch(`${API_BASE_URL}/api/dashboards`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load dashboards');
      
      const data = await response.json();
      setDashboards(data.data || []);
    } catch (error) {
      console.error('Error loading dashboards:', error);
      toast.error('Failed to load dashboards');
    } finally {
      setLoadingDashboards(false);
    }
  };

  const assignDashboard = async (dashboardId, expiresAt) => {
    try {
      const loadingAlert = showLoadingAlert('Assigning...');
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUserId}/assign`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          dashboardAssignments: [{
            dashboardId,
            expiresAt: expiresAt ? expiresAt.toISOString() : null,
          }],
        }),
      });

      if (!response.ok) throw new Error('Assignment failed');
      const result = await response.json();
      loadingAlert.close();
      await fetchUsers();
      await fetchAssignedDashboards(selectedUserId);
      showSuccessAlert('Assigned!', 'Dashboard assigned successfully');
    } catch (error) {
      showErrorAlert('Error', 'Failed to assign dashboard');
    }
  };

  const unassignDashboard = async (dashboardId) => {
    try {
      const loadingAlert = showLoadingAlert('Removing...');
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUserId}/unassign`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ dashboardIds: [dashboardId] }),
      });

      if (!response.ok) throw new Error('Removal failed');
      const result = await response.json();
      loadingAlert.close();
      await fetchUsers();
      await fetchAssignedDashboards(selectedUserId);
      showSuccessAlert('Removed!', 'Dashboard removed successfully');
    } catch (error) {
      showErrorAlert('Error', 'Failed to remove dashboard');
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pricing/plans`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load plans');
      
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load plans');
    }
  };

  const fetchUserPlans = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/plans`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load user plans');
      
      const data = await response.json();
      setUserPlans(data.plans || []);
    } catch (error) {
      console.error('Error loading user plans:', error);
      toast.error('Failed to load user plans');
      setUserPlans([]);
    }
  };

  const assignPlan = async (planId) => {
    try {
      const loadingAlert = showLoadingAlert('Assigning...');
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUserIdForPlan}/assign-plan`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ planId })
      });

      if (!response.ok) throw new Error('Plan assignment failed');
      const result = await response.json();
      loadingAlert.close();
      await fetchUserPlans(selectedUserIdForPlan);
      const updatedPlans = await fetchUserPlans(selectedUserIdForPlan);
      setAllUserPlans(prev => ({
        ...prev,
        [selectedUserIdForPlan]: updatedPlans
      }));
      await fetchUsers();
      showSuccessAlert('Assigned!', 'Plan assigned successfully');
    } catch (error) {
      showErrorAlert('Error', 'Failed to assign plan');
    }
  };

  const cancelPlan = async (planId) => {
    try {
      const loadingAlert = showLoadingAlert('Canceling...');
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUserIdForPlan}/cancel-plan`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ planId })
      });

      if (!response.ok) throw new Error('Plan cancellation failed');
      const result = await response.json();
      loadingAlert.close();
      await fetchUserPlans(selectedUserIdForPlan);
      const updatedPlans = await fetchUserPlans(selectedUserIdForPlan);
      setAllUserPlans(prev => ({
        ...prev,
        [selectedUserIdForPlan]: updatedPlans
      }));
      await fetchUsers();
      showSuccessAlert('Canceled!', 'Plan canceled successfully');
    } catch (error) {
      showErrorAlert('Error', 'Failed to cancel plan');
    }
  };

  const handleAssignPlans = (userId) => {
    setSelectedUserIdForPlan(userId);
    setShowPlanAssignment(true);
    const existingPlans = allUserPlans[userId];
    if (existingPlans) {
      setUserPlans(existingPlans);
    } else {
      fetchUserPlans(userId);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      setAssignedDashboards([]);
      fetchAssignedDashboards(selectedUserId);
    } else {
      setAssignedDashboards([]);
    }
  }, [selectedUserId]);

  const fetchAssignedDashboards = async (userId) => {
    try {
      setLoadingDashboards(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/dashboards`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load assigned dashboards');
      const data = await response.json();
      setAssignedDashboards(data.dashboards || []);
    } catch (error) {
      console.error('Error loading assigned dashboards:', error);
      toast.error('Failed to load assigned dashboards');
      setAssignedDashboards([]);
    } finally {
      setLoadingDashboards(false);
    }
  };

  const uploadAvatarFile = async (file, userId) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/avatar`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Avatar upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        avatarPath: data.avatar,
        user: data.user
      };
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  };

  const getAvatarUrl = (avatar, name) => {
    if (!avatar) {
      return `https://api.dicebear.com/7.x/initials/svg?seed=${name || 'default'}`;
    }
    
    if (avatar.startsWith('http')) {
      return avatar;
    }
    
    if (avatar.startsWith('/uploads/')) {
      return `${API_BASE_URL}${avatar}`;
    }
    
    return avatar;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'Error!',
          text: 'File size exceeds 5MB limit',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    hover: {
      scale: 1.03,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  const filteredUsers = users.filter(user => 
    user && user.name && user.email && (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchActivityStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (!response.ok) throw new Error('Failed to load users');
      
      const data = await response.json();
      const usersData = data || [];
      setUsers(usersData);
      updateChartData(usersData);
      
      if (usersData.length > 0) {
        const userIds = usersData.map(user => user._id);
        await fetchAllUserPlans(userIds);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const getActivePlansCount = (userId) => {
    const userPlans = allUserPlans[userId] || [];
    return userPlans.filter(userPlan => {
      if (!userPlan.currentPeriodEnd) return true;
      const endDate = new Date(userPlan.currentPeriodEnd);
      const now = new Date();
      return userPlan.status !== 'canceled' && endDate >= now;
    }).length;
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load stats');
      
      const data = await response.json();
      setStats({
        totalUsers: data.stats.totalUsers,
        admins: data.stats.adminUsers,
        regularUsers: data.stats.regularUsers,
        inactiveUsers: data.stats.totalUsers - data.stats.verifiedUsers
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load stats');
    }
  };

  const updateChartData = (usersData) => {
    if (!Array.isArray(usersData) || usersData.length === 0) {
      setChartData({ roles: [], activity: [] });
      return;
    }

    const roleData = usersData.reduce((acc, user) => {
      if (user && user.role) {
        acc[user.role] = (acc[user.role] || 0) + 1;
      }
      return acc;
    }, {});

    const monthlyData = usersData.reduce((acc, user) => {
      if (user && user.createdAt) {
        const date = new Date(user.createdAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            month: new Date(date.getFullYear(), date.getMonth()).toLocaleDateString('fr-FR', { 
              month: 'short', 
              year: 'numeric' 
            }),
            newUsers: 0,
            activeUsers: Math.floor(Math.random() * (usersData.length / 3)) + 5
          };
        }
        acc[monthYear].newUsers++;
      }
      return acc;
    }, {});

    const sortedMonths = Object.values(monthlyData).sort((a, b) => 
      new Date(a.month) - new Date(b.month)
    );

    setChartData({
      roles: Object.entries(roleData).map(([name, value]) => ({ 
        value, 
        name: name === 'admin' ? 'Administrateur' : 'Utilisateur'
      })),
      activity: sortedMonths.slice(-6)
    });
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u._id === userId);
    showDeleteConfirmation(userToDelete.name, async () => {
      try {
        const loadingAlert = showLoadingAlert('Deleting...');
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        loadingAlert.close();
        setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
        fetchStats();
        showSuccessAlert('Deleted!', 'User deleted successfully');
      } catch (error) {
        showErrorAlert('Error', 'Failed to delete user');
        console.error('Delete error:', error);
      }
    });
  };

  const startEditing = (user) => {
    setEditingUser(user);
    setShowAddForm(false);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
  };

  const showAddUserForm = () => {
    setEditingUser(null);
    setShowAddForm(true);
    setFormData({ name: '', email: '', role: 'user', password: '' });
  };

  const hideForms = () => {
    setEditingUser(null);
    setShowAddForm(false);
    setFormData({ name: '', email: '', role: 'user', password: '', avatar: null });
    setAvatarPreview('');
    setSelectedFile(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const loadingAlert = showLoadingAlert('Updating...');
      let avatarUrl = formData.avatar;
      if (selectedFile) {
        const uploadResult = await uploadAvatarFile(selectedFile, editingUser._id);
        avatarUrl = uploadResult.avatarPath;
      }
      
      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      };
      
      if (formData.password) updateData.password = formData.password;
      if (avatarUrl) updateData.avatar = avatarUrl;
      
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
      }
      
      const result = await response.json();
      loadingAlert.close();
      setUsers(prevUsers => 
        prevUsers.map(u => u._id === editingUser._id ? result.user : u)
      );
      updateChartData(users.map(u => u._id === editingUser._id ? result.user : u));
      hideForms();
      showSuccessAlert('Success!', 'User updated successfully');
      fetchStats();
    } catch (error) {
      showErrorAlert('Error', error.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
      setAvatarPreview('');
      setSelectedFile(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const loadingAlert = showLoadingAlert('Creating...');
      let createData = { ...formData };
      if (selectedFile && avatarPreview) {
        createData.avatar = avatarPreview;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(createData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Creation failed');
      }
      
      const result = await response.json();
      loadingAlert.close();
      setUsers(prevUsers => [...prevUsers, result.user]);
      updateChartData([...users, result.user]);
      hideForms();
      showSuccessAlert('Success!', 'User created successfully');
      fetchStats();
    } catch (error) {
      showErrorAlert('Error', error.message || 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userRoleChart = {
    backgroundColor: 'transparent',
    animationDuration: 2000,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: chartData.roles.map(item => item.name)
    },
    series: [
      {
        name: 'User Roles',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: chartData.roles,
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx) {
          return idx * 200;
        }
      }
    ]
  };

  const userActivityChart = {
    backgroundColor: 'transparent',
    animationDuration: 2000,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        return `
          <strong>${params[0].axisValue}</strong><br/>
          New Users: <b>${params[0].data}</b><br/>
          Active Users: <b>${params[1].data}</b>
        `;
      }
    },
    legend: {
      data: ['New Users', 'Active Users'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.activity.map(d => d.month),
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280',
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280'
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6'
        }
      }
    },
    series: [
      {
        name: 'New Users',
        type: 'bar',
        barWidth: '40%',
        data: chartData.activity.map(d => d.newUsers),
        itemStyle: {
          color: '#3b82f6',
          borderRadius: [4, 4, 0, 0]
        },
        animationDelay: function (idx) {
          return idx * 100;
        },
        markLine: {
          data: [{ type: 'average', name: 'Average' }],
          label: {
            position: 'end',
            formatter: 'Avg: {c}'
          }
        }
      },
      {
        name: 'Active Users',
        type: 'line',
        smooth: true,
        data: chartData.activity.map(d => d.activeUsers),
        itemStyle: {
          color: '#10b981'
        },
        lineStyle: {
          width: 3,
          shadowColor: 'rgba(16, 185, 129, 0.3)',
          shadowBlur: 10,
          shadowOffsetY: 8
        },
        animationDelay: function (idx) {
          return idx * 100 + 100;
        },
        markLine: {
          data: [{ type: 'average', name: 'Average' }],
          label: {
            position: 'end',
            formatter: 'Avg: {c}'
          }
        }
      }
    ]
  };

  const statsCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: <Users size={24} />, 
      color: 'bg-blue-100 text-blue-600',
      trend: stats.totalUsers > 0 ? 'up' : 'stable'
    },
    { 
      title: 'Admins', 
      value: stats.admins, 
      icon: <UserCheck size={24} />, 
      color: 'bg-green-100 text-green-600',
      trend: 'stable'
    },
    { 
      title: 'Regular Users', 
      value: stats.regularUsers, 
      icon: <UserPlus size={24} />, 
      color: 'bg-purple-100 text-purple-600',
      trend: stats.regularUsers > 0 ? 'up' : 'stable'
    },
    { 
      title: 'Inactive Users', 
      value: stats.inactiveUsers, 
      icon: <UserX size={24} />, 
      color: 'bg-red-100 text-red-600',
      trend: stats.inactiveUsers > 0 ? 'up' : 'down'
    }
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gray-50"
    >
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statsCards.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover="hover"
              className={`${stat.color} p-6 rounded-xl shadow-sm transition-all`}
            >
              <div className="flex justify-between items-center cursor-pointer">
                <div>
                  <p className="text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="p-3 rounded-full bg-white bg-opacity-30 mb-2">
                    {stat.icon}
                  </div>
                  {stat.trend === 'up' && (
                    <span className="text-xs flex items-center text-green-600 cursor-pointer">
                      <ChevronUp size={14} /> 
                      {stat.value > 0 ? `${Math.round((stat.value / stats.totalUsers) * 100)}%` : '0%'}
                    </span>
                  )}
                  {stat.trend === 'down' && (
                    <span className="text-xs flex items-center text-red-600 cursor-pointer">
                      <ChevronDown size={14} /> 
                      {stat.value > 0 ? `${Math.round((stat.value / stats.totalUsers) * 100)}%` : '0%'}
                    </span>
                  )}
                  {stat.trend === 'stable' && (
                    <span className="text-xs text-gray-500">Stable</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.section 
          variants={containerVariants}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div 
              variants={itemVariants}
              className="bg-white p-6 rounded-xl shadow-sm"
              whileHover={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">User Activity (Last 6 Months)</h3>
                <motion.button 
                  className="p-2 rounded-lg hover:bg-gray-100"
                  onClick={fetchStats}
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RefreshCw size={18} />
                </motion.button>
              </div>
              <ReactECharts 
                option={userActivityChart} 
                style={{ height: '350px' }} 
                className="echarts-for-react"
              />
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="bg-white p-6 rounded-xl shadow-sm"
              whileHover={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Role Distribution</h3>
                <motion.button 
                  className="p-2 rounded-lg hover:bg-gray-100"
                  onClick={fetchUsers}
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RefreshCw size={18} />
                </motion.button>
              </div>
              <ReactECharts 
                option={userRoleChart} 
                style={{ height: '350px' }} 
                className="echarts-for-react"
              />
            </motion.div>
          </div>
        </motion.section>

        <motion.section 
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none cursor-pointer">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <motion.button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center cursor-pointer justify-center"
                  onClick={showAddUserForm}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <UserPlus size={18} className="mr-2" />
                </motion.button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {(editingUser !== null || showAddForm) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 border-b border-gray-200"
              >
                <h3 className="text-md font-medium mb-4 cursor-pointer">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h3>
                <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <img 
                            src={avatarPreview || getAvatarUrl(formData.avatar, formData.name)}
                            alt="Avatar preview" 
                            className="h-16 w-16 rounded-full border-2 border-gray-200 object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <input
                              type="file"
                              id="avatar-upload"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <label
                              htmlFor="avatar-upload"
                              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              Choose file
                            </label>
                            {selectedFile && (
                              <span className="ml-2 text-sm text-gray-500">
                                {selectedFile.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="flex-1 border-t border-gray-200"></div>
                            <span className="px-2 text-xs text-gray-400">OR</span>
                            <div className="flex-1 border-t border-gray-200"></div>
                          </div>
                          <input
                            type="url"
                            name="avatar"
                            value={formData.avatar || ''}
                            onChange={(e) => {
                              handleInputChange(e);
                              setAvatarPreview('');
                              setSelectedFile(null);
                            }}
                            placeholder="Paste image URL"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 cursor-pointer focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {editingUser ? 'New Password (leave blank to keep)' : 'Password'}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!editingUser}
                        minLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer focus:border-transparent"
                      />
                    </motion.div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <motion.button
                      type="button"
                      onClick={hideForms}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer flex items-center"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : editingUser ? (
                        'Update User'
                      ) : (
                        'Create User'
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <Loader2 size={20} className="animate-spin" />
                        <span>Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                      <motion.tr 
                        key={user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={getAvatarUrl(user.avatar, user.name)}
                                alt={`${user.name}'s avatar`}
                                onError={(e) => {
                                  e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'default'}`;
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-xs text-gray-500">
                                Joined {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <motion.span 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <motion.span 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <motion.button
                              onClick={() => startEditing(user)}
                              className="text-blue-600 hover:text-blue-900 cursor-pointer p-1 rounded hover:bg-blue-50"
                              title="Edit"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit size={18} />
                            </motion.button>
                            
                            <motion.button
                              onClick={() => handleViewActivities(user._id)}
                              className="text-indigo-600 hover:text-indigo-900 cursor-pointer p-1 rounded hover:bg-indigo-50"
                              title="View Activities"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Activity size={18} />
                            </motion.button>

                            <div className="relative inline-block">
                              <motion.button
                                onClick={() => handleAssignDashboards(user._id)}
                                className="text-purple-600 hover:text-purple-900 p-2 rounded hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                                title="Assign Dashboards"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <BarChart2 size={18} />
                                {(assignedDashboards.length > 0 || (user.dashboards && user.dashboards.length > 0)) && (
                                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm border-2 border-white">
                                    {selectedUserId === user._id ? assignedDashboards.length : (user.dashboards?.length || 0)}
                                  </span>
                                )}
                              </motion.button>
                              
                              <motion.button
                                onClick={() => handleAssignPlans(user._id)}
                                className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 cursor-pointer transition-colors duration-200"
                                title="Manage Plans"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <CreditCard size={18} />
                                {getActivePlansCount(user._id) > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                                    {getActivePlansCount(user._id)}
                                  </span>
                                )}
                              </motion.button>
                            </div>
                            {user._id !== currentUser?._id && (
                              <motion.button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 cursor-pointer"
                                title="Delete"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Trash2 size={18} />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {showDashboardAssignment && (
            <DashboardAssignmentModal
              userId={selectedUserId}
              onClose={() => {
                setShowDashboardAssignment(false);
                setSelectedUserId(null);
              }}
              dashboards={dashboards}
              assignedDashboards={assignedDashboards}
              onAssign={assignDashboard}
              onUnassign={unassignDashboard}
            />
          )}
          {showPlanAssignment && (
            <PlanAssignmentModal
              onClose={() => {
                setShowPlanAssignment(false);
                setSelectedUserIdForPlan(null);
              }}
              plans={plans}
              userPlans={userPlans}
              onAssign={assignPlan}
              onCancel={cancelPlan}
            />
          )}
          {showActivityModal && (
            <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">User Activities</h3>
                  <button 
                    onClick={() => setShowActivityModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h4 className="text-lg font-medium mb-2 flex items-center">
                      <Activity className="mr-2" /> Activity Overview
                    </h4>
                    <ReactECharts 
                      option={activityChartOption} 
                      style={{ height: '300px' }} 
                    />
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h4 className="text-lg font-medium mb-2 flex items-center">
                      <Clock className="mr-2" /> Time Spent
                    </h4>
                    <ReactECharts 
                      option={timeSpentChartOption} 
                      style={{ height: '300px' }} 
                    />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="text-lg font-medium mb-2 flex items-center">
                    <Eye className="mr-2" /> Recent Activities
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dashboard</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userActivities.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                              No activities found
                            </td>
                          </tr>
                        ) : (
                          userActivities.map((activity, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                {activity.action}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {activity.dashboardId?.name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {activity.duration ? `${activity.duration} sec` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(activity.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.section>
      </main>
    </motion.div>
  );
};

export default User_admin;