import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Users, AlertOctagon, BarChart2, ShieldCheck, Loader2, 
  Search, Trash2, Ban, CheckCircle, RefreshCw, AlertTriangle, Eye
} from 'lucide-react';

export default function AdminDashboard() {
  const { token, user: currentUser } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'users' | 'reports'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // Fetch functions
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/admin/users?q=${encodeURIComponent(userQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Users fetch error:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Reports fetch error:', err);
    }
  };

  // Load active tab data
  const loadData = async () => {
    setLoading(true);
    setStatusMessage({ text: '', type: '' });
    if (activeSubTab === 'stats') await fetchStats();
    if (activeSubTab === 'users') await fetchUsers();
    if (activeSubTab === 'reports') await fetchReports();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  // Handle user search input
  useEffect(() => {
    if (activeSubTab === 'users') {
      const delayDebounceFn = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [userQuery]);

  // Actions
  const handleToggleSuspend = async (userId: string, currentlySuspended: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ suspended: !currentlySuspended })
      });

      if (response.ok) {
        setStatusMessage({ 
          text: `User ${currentlySuspended ? 'unsuspended' : 'suspended'} successfully.`, 
          type: 'success' 
        });
        fetchUsers();
        fetchStats(); // Update stats in case counts change
      } else {
        const data = await response.json();
        setStatusMessage({ text: data.message || 'Error updating status.', type: 'error' });
      }
    } catch (err) {
      console.error('Suspend user error:', err);
      setStatusMessage({ text: 'Server error updating suspension.', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own admin account!");
      return;
    }
    if (!confirm('Are you absolutely sure you want to permanently delete this user profile? This action is IRREVERSIBLE.')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setStatusMessage({ text: 'User account permanently deleted.', type: 'success' });
        fetchUsers();
        fetchStats();
      } else {
        const data = await response.json();
        setStatusMessage({ text: data.message || 'Error deleting user.', type: 'error' });
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setStatusMessage({ text: 'Server error deleting user.', type: 'error' });
    }
  };

  const handleToggleReportStatus = async (reportId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'reviewed' : 'pending';
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (response.ok) {
        setStatusMessage({ text: 'Report status updated successfully.', type: 'success' });
        fetchReports();
        fetchStats();
      } else {
        const data = await response.json();
        setStatusMessage({ text: data.message || 'Error updating report status.', type: 'error' });
      }
    } catch (err) {
      console.error('Report status error:', err);
      setStatusMessage({ text: 'Server error updating report status.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-pink-50 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-black text-xl text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-rose-500" />
            <span>Admin Control Panel</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authorized Administrator View — Secure backend monitoring & curation
          </p>
        </div>
        <button
          onClick={loadData}
          className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-100 dark:border-slate-700 p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer text-slate-500 self-start md:self-auto"
          title="Refresh Current View"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-50 dark:border-slate-800 p-2 flex gap-2 shadow-sm">
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`flex-1 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'stats'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          <span>Dashboard Stats</span>
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex-1 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Accounts</span>
        </button>
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex-1 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'reports'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <AlertOctagon className="h-4 w-4" />
          <span>Content Reports</span>
        </button>
      </div>

      {/* Action Messages */}
      {statusMessage.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/50 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100/50 text-rose-600 dark:text-rose-400'
        }`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* RENDER ACTIVE VIEW */}
      {loading && !stats && users.length === 0 && reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest font-mono">Syncing Database...</p>
        </div>
      ) : (
        <div>
          {/* STATS VIEW */}
          {activeSubTab === 'stats' && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Users</p>
                <p className="text-3xl font-sans font-black text-slate-800 dark:text-slate-100">{stats.usersCount}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Active Stories</p>
                <p className="text-3xl font-sans font-black text-slate-800 dark:text-slate-100">{stats.storiesCount}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Posts</p>
                <p className="text-3xl font-sans font-black text-slate-800 dark:text-slate-100">{stats.postsCount}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Pending Reports</p>
                <p className="text-3xl font-sans font-black text-rose-500">{stats.pendingReportsCount}</p>
              </div>
            </div>
          )}

          {/* USERS LIST VIEW */}
          {activeSubTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-50 dark:border-slate-800 p-3.5 shadow-sm flex items-center gap-2 max-w-md w-full">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter users by name..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-200 w-full font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((u: any) => (
                  <div key={u.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4 items-center">
                    <img src={u.profilePhoto} alt={u.name} className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-100 dark:ring-slate-800 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{u.name}</h4>
                        {u.isAdmin && (
                          <span className="text-[9px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 px-1.5 py-0.5 rounded uppercase">Admin</span>
                        )}
                        {u.suspended && (
                          <span className="text-[9px] font-mono font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 px-1.5 py-0.5 rounded uppercase">Suspended</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleSuspend(u.id, u.suspended)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          u.suspended 
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600' 
                            : 'text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/10 hover:text-rose-500'
                        }`}
                        title={u.suspended ? "Unsuspend User Account" : "Suspend User Account"}
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.id === currentUser?.id}
                        className="p-2 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/10 hover:text-rose-600 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        title="Permanently Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS LIST VIEW */}
          {activeSubTab === 'reports' && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-pink-50 dark:border-slate-800 py-16 text-center space-y-3 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">All reports processed</p>
                  <p className="text-xs text-slate-400">There are no reported posts or profiles in the queue.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report: any) => (
                    <div key={report.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-800/50 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {report.targetType}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            Reported by <span className="font-bold text-slate-700 dark:text-slate-300">{report.reporter?.name || 'Unknown'}</span>
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest font-mono px-2 py-0.5 rounded-full ${
                          report.status === 'pending'
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-100/50'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100/50'
                        }`}>
                          {report.status}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Reason:</span> {report.reason}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Target ID: {report.targetId} • Submitted: {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() => handleToggleReportStatus(report.id, report.status)}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            report.status === 'pending'
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-100 dark:shadow-none'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {report.status === 'pending' ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              <span>Mark Reviewed</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3" />
                              <span>Reopen Report</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
