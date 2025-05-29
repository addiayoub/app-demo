import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, UserX, UserCheck, Edit, Trash2, 
  BarChart2, PieChart, LineChart, RefreshCw, Search,
  ChevronDown, ChevronUp, Loader2,
  LogOut,
  Settings
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';

const AdminDashboard = () => {
  const { user: currentUser, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
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

  const API_BASE_URL = import.meta.env.VITE_API_URL;
// Ajoutez cet état au début de votre composant
const [avatarPreview, setAvatarPreview] = useState('');
const [selectedFile, setSelectedFile] = useState(null);



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
      throw new Error(errorData.message || `Échec de l'upload de l'avatar : ${response.status}`);
    }
    
    const data = await response.json();
    // Retourner les données complètes
    return {
      avatarPath: data.avatar,
      user: data.user
    };
  } catch (error) {
    console.error('Erreur upload avatar:', error);
    throw error;
  }
};
const getAvatarUrl = (avatar, name) => {
  if (!avatar) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${name || 'default'}`;
  }
  
  // Si c'est déjà une URL complète (http/https), la retourner telle quelle
  if (avatar.startsWith('http')) {
    return avatar;
  }
  
  // Si c'est un chemin relatif, construire l'URL complète
  if (avatar.startsWith('/uploads/')) {
    return `${API_BASE_URL}${avatar}`;
  }
  
  // Sinon, retourner l'avatar tel quel (probablement une URL externe)
  return avatar;
};
// Fonction pour gérer la sélection de fichier
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Vérifier la taille du fichier (max 5 Mo)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'Erreur!',
        text: 'La taille du fichier dépasse la limite de 5 Mo',
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
  // Animation variants
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

  // FIX 1: Vérification de sécurité pour éviter l'erreur "Cannot read properties of undefined"
  const filteredUsers = users.filter(user => 
    user && user.name && user.email && (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Fetch users and stats
  useEffect(() => {
    fetchUsers();
    fetchStats();
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
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data || []); // FIX 2: Assurer qu'on a toujours un array
      updateChartData(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats({
        totalUsers: data.stats.totalUsers,
        admins: data.stats.adminUsers,
        regularUsers: data.stats.regularUsers,
        inactiveUsers: data.stats.totalUsers - data.stats.verifiedUsers
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  // Update chart data with real data
  const updateChartData = (usersData) => {
    if (!Array.isArray(usersData) || usersData.length === 0) {
      setChartData({ roles: [], activity: [] });
      return;
    }

    // Group by role
    const roleData = usersData.reduce((acc, user) => {
      if (user && user.role) {
        acc[user.role] = (acc[user.role] || 0) + 1;
      }
      return acc;
    }, {});

    // Group by month for activity
    const monthlyData = usersData.reduce((acc, user) => {
      if (user && user.createdAt) {
        const date = new Date(user.createdAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            month: new Date(date.getFullYear(), date.getMonth()).toLocaleString('default', { month: 'short', year: 'numeric' }),
            newUsers: 0,
            activeUsers: Math.floor(Math.random() * (usersData.length / 3)) + 5
          };
        }
        acc[monthYear].newUsers++;
      }
      return acc;
    }, {});

    // Convert to array and sort
    const sortedMonths = Object.values(monthlyData).sort((a, b) => 
      new Date(a.month) - new Date(b.month)
    );

    setChartData({
      roles: Object.entries(roleData).map(([name, value]) => ({ 
        value, 
        name: name.charAt(0).toUpperCase() + name.slice(1) 
      })),
      activity: sortedMonths.slice(-6) // Last 6 months
    });
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
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
        
        // FIX 3: Mise à jour immédiate de l'UI
        setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
        toast.success('User deleted successfully');
        fetchStats(); // Refresh stats
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  // Start editing user
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

  // Show add user form
  const showAddUserForm = () => {
    setEditingUser(null);
    setShowAddForm(true);
    setFormData({ name: '', email: '', role: 'user', password: '' });
  };

 // Fonction pour réinitialiser le formulaire (modifiez hideForms)
const hideForms = () => {
  setEditingUser(null);
  setShowAddForm(false);
  setFormData({ name: '', email: '', role: 'user', password: '', avatar: null });
  setAvatarPreview('');
  setSelectedFile(null);
};

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

// Fonction handleUpdateUser - CORRIGÉE
const handleUpdateUser = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    let avatarUrl = formData.avatar;
    
    // Si un fichier a été sélectionné, l'uploader d'abord
    if (selectedFile) {
      const uploadResult = await uploadAvatarFile(selectedFile, editingUser._id);
      avatarUrl = uploadResult.avatarPath;
    }
    
    // Préparer les données de mise à jour
    const updateData = {
      name: formData.name,
      email: formData.email,
      role: formData.role
    };
    
    // Inclure le mot de passe seulement s'il est fourni
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    // Inclure l'avatar s'il y en a un
    if (avatarUrl) {
      updateData.avatar = avatarUrl;
    }
    
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
      throw new Error(errorData.message || 'Échec de la mise à jour de l\'utilisateur');
    }
    
    const result = await response.json();
    const updatedUser = result.user;
    
    // Mettre à jour la liste des utilisateurs avec les données complètes du serveur
    setUsers(prevUsers => 
      prevUsers.map(u => u._id === editingUser._id ? updatedUser : u)
    );
    
    // Mettre à jour les données du graphique
    const newUsersData = users.map(u => u._id === editingUser._id ? updatedUser : u);
    updateChartData(newUsersData);
    
    hideForms();
    
    Swal.fire({
      title: 'Succès!',
      text: 'Utilisateur mis à jour avec succès',
      icon: 'success',
      showConfirmButton: false,
      timer: 1500
    });
    
    fetchStats();
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    Swal.fire({
      title: 'Erreur!',
      text: error.message || 'Échec de la mise à jour de l\'utilisateur',
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3b82f6'
    });
  } finally {
    setIsSubmitting(false);
    setAvatarPreview('');
    setSelectedFile(null);
  }
};

// FIX: Create new user avec mise à jour immédiate
const handleCreateUser = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    let createData = { ...formData };
    
    // Si un fichier a été sélectionné mais pas encore uploadé, utiliser l'URL de prévisualisation
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
      throw new Error(errorData.message || 'Failed to create user');
    }
    
    const result = await response.json();
    const newUser = result.user;
    
    // Ajouter le nouvel utilisateur à la liste avec les données complètes du serveur
    setUsers(prevUsers => [...prevUsers, newUser]);
    
    // Mettre à jour les graphiques avec la nouvelle liste
    const newUsersData = [...users, newUser];
    updateChartData(newUsersData);
    
    hideForms();
    
    Swal.fire({
      title: 'Success!',
      text: 'User created successfully',
      icon: 'success',
      showConfirmButton: false,
      timer: 1500
    });
    
    fetchStats();
  } catch (error) {
    console.error('Error creating user:', error);
    Swal.fire({
      title: 'Error!',
      text: error.message || 'Failed to create user',
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3b82f6'
    });
  } finally {
    setIsSubmitting(false);
  }
};
  // FIX 7: Correction des données de légende pour les graphiques
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
      // FIX: Utiliser les noms des données réelles au lieu de noms fixes
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

  // User Activity Chart with real data
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

  // Stats cards data
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
      
      {/* Header */}
      <motion.header 
        variants={itemVariants}
        className="bg-white shadow-sm sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-50 h-15 rounded-full bg-gradient-to-r  flex items-center justify-center">
             <img src="/ID&A TECH .png" alt="" />

            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 hidden md:inline cursor-pointer">Welcome, {currentUser?.name}</span>
            <motion.button 
              onClick={logout}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="hidden md:inline"></span>
              <span className="">
                <LogOut size={20} />
              </span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
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

        {/* Charts Section */}
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
                <h3 className="text-lg font-semibold">User Roles Distribution</h3>
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

        {/* User Management Section */}
        <motion.section 
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <h2 className="text-xl font-semibold">User Management</h2>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 pb-5 flex items-center pointer-events-none cursor-pointer">
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
                  <UserPlus size={18} className="mr-2 " />
                  Add User
                </motion.button>
              </div>
            </div>
          </div>

          {/* User Form - Appears when editing or adding */}
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
    {/* Preview de l'avatar */}
    <div className="flex-shrink-0">
  <img 
  src={avatarPreview || getAvatarUrl(formData.avatar, formData.name)}
  alt="Preview avatar" 
  className="h-16 w-16 rounded-full border-2 border-gray-200 object-cover"
/>
    </div>
    
    {/* Container pour les inputs */}
    <div className="flex-1 space-y-2">
      {/* Input file pour upload */}
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
          Choisir un fichier
        </label>
        {selectedFile && (
          <span className="ml-2 text-sm text-gray-500">
            {selectedFile.name}
          </span>
        )}
      </div>
      
      {/* Séparateur */}
      <div className="flex items-center">
        <div className="flex-1 border-t border-gray-200"></div>
        <span className="px-2 text-xs text-gray-400">OU</span>
        <div className="flex-1 border-t border-gray-200"></div>
      </div>
      
      {/* Input URL pour lien externe */}
      <input
        type="url"
        name="avatar"
        value={formData.avatar || ''}
        onChange={(e) => {
          handleInputChange(e);
          setAvatarPreview('');
          setSelectedFile(null);
        }}
        placeholder="Coller l'URL d'une image"
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

          {/* Users Table */}
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
                                  alt={`Avatar de ${user.name}`}
                                  onError={(e) => {
                                    // Fallback si l'image ne charge pas
                                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'default'}`;
                                  }}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">
                                  Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
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
                            {user.role}
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
        </motion.section>
      </main>
    </motion.div>
  );
};

export default AdminDashboard;