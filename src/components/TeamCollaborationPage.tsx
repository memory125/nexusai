import { useState, useEffect } from 'react';
import {
  Users, Plus, Database, FileText, History, Shield,
  UserPlus, Trash2, LogOut, Crown, User, Eye,
  Edit3
} from 'lucide-react';
import {
  teamCollaborationService,
  Team,
  TeamMember,
  TeamRole,
  SharedKnowledgeBase,
  SharedPromptTemplate,
  AuditLogEntry,
  TeamActivity
} from '../services/teamCollaborationService';

type TabType = 'overview' | 'members' | 'knowledge' | 'prompts' | 'audit';

export function TeamCollaborationPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SharedPromptTemplate | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showEditMemberRole, setShowEditMemberRole] = useState(false);
  const [showKnowledgeBasePermission, setShowKnowledgeBasePermission] = useState(false);
  const [showPromptPermission, setShowPromptPermission] = useState(false);
  const [editingKnowledgeBase, setEditingKnowledgeBase] = useState<SharedKnowledgeBase | null>(null);
  const [editingPromptForPermission, setEditingPromptForPermission] = useState<SharedPromptTemplate | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<SharedKnowledgeBase[]>([]);
  const [prompts, setPrompts] = useState<SharedPromptTemplate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [myRole, setMyRole] = useState<TeamRole | null>(null);

  // New team form
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer');

  // Prompt form
  const [promptName, setPromptName] = useState('');
  const [promptDesc, setPromptDesc] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [promptCategory, setPromptCategory] = useState('general');

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (activeTeamId) {
      loadTeamData(activeTeamId);
    }
  }, [activeTeamId, activeTab]);

  const loadTeams = () => {
    const myTeams = teamCollaborationService.getMyTeams();
    setTeams(myTeams);
    if (myTeams.length > 0 && !activeTeamId) {
      setActiveTeamId(myTeams[0].id);
    }
  };

  const loadTeamData = (teamId: string) => {
    const team = teamCollaborationService.getTeam(teamId);
    if (team) {
      setMembers(team.members);
      setKnowledgeBases(teamCollaborationService.getTeamKnowledgeBases(teamId));
      setPrompts(teamCollaborationService.getTeamPrompts(teamId));
      setAuditLogs(teamCollaborationService.getAuditLogs(teamId));
      setActivities(teamCollaborationService.getTeamActivity(teamId));
      setMyRole(teamCollaborationService.getMyRoleInTeam(teamId));
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    try {
      await teamCollaborationService.createTeam({
        name: newTeamName,
        description: newTeamDesc,
        avatar: '👥',
      });
      loadTeams();
      setShowCreateTeam(false);
      setNewTeamName('');
      setNewTeamDesc('');
    } catch (error) {
      alert('创建失败: ' + (error as Error).message);
    }
  };

  const handleInviteMember = async () => {
    if (!activeTeamId || !inviteEmail.trim()) return;
    
    try {
      await teamCollaborationService.inviteMember(activeTeamId, inviteEmail, inviteRole);
      loadTeamData(activeTeamId);
      setShowInviteMember(false);
      setInviteEmail('');
    } catch (error) {
      alert('邀请失败: ' + (error as Error).message);
    }
  };

  const handleCreatePrompt = async () => {
    if (!activeTeamId || !promptName.trim() || !promptContent.trim()) return;
    
    try {
      await teamCollaborationService.createSharedPrompt(activeTeamId, {
        name: promptName,
        description: promptDesc,
        content: promptContent,
        category: promptCategory,
        tags: [],
      });
      loadTeamData(activeTeamId);
      setShowCreatePrompt(false);
      setPromptName('');
      setPromptDesc('');
      setPromptContent('');
    } catch (error) {
      alert('创建失败: ' + (error as Error).message);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeTeamId) return;
    if (!confirm('确定要移除该成员吗？')) return;
    
    try {
      await teamCollaborationService.removeMember(activeTeamId, memberId);
      loadTeamData(activeTeamId);
    } catch (error) {
      alert('移除失败: ' + (error as Error).message);
    }
  };

  const handleLeaveTeam = async () => {
    if (!activeTeamId) return;
    if (!confirm('确定要离开该团队吗？')) return;
    
    try {
      await teamCollaborationService.leaveTeam(activeTeamId);
      setActiveTeamId(null);
      loadTeams();
    } catch (error) {
      alert('离开失败: ' + (error as Error).message);
    }
  };

  const handleDeleteTeam = async () => {
    if (!activeTeamId) return;
    if (!confirm('确定要删除该团队吗？此操作不可撤销，所有团队数据将被永久删除。')) return;
    
    try {
      await teamCollaborationService.deleteTeam(activeTeamId);
      setActiveTeamId(null);
      loadTeams();
    } catch (error) {
      alert('删除失败: ' + (error as Error).message);
    }
  };

  const handleUpdateTeam = async () => {
    if (!activeTeamId || !newTeamName.trim()) return;
    
    try {
      await teamCollaborationService.updateTeam(activeTeamId, {
        name: newTeamName,
        description: newTeamDesc,
      });
      loadTeams();
      loadTeamData(activeTeamId);
      setShowEditTeam(false);
      setNewTeamName('');
      setNewTeamDesc('');
    } catch (error) {
      alert('更新失败: ' + (error as Error).message);
    }
  };

  const handleEditPrompt = (prompt: SharedPromptTemplate) => {
    setEditingPrompt(prompt);
    setPromptName(prompt.name);
    setPromptDesc(prompt.description);
    setPromptContent(prompt.content);
    setPromptCategory(prompt.category);
    setShowEditPrompt(true);
  };

  const handleUpdatePrompt = async () => {
    if (!editingPrompt || !promptName.trim() || !promptContent.trim()) return;
    
    try {
      await teamCollaborationService.updateSharedPrompt(editingPrompt.id, {
        name: promptName,
        description: promptDesc,
        content: promptContent,
        category: promptCategory,
      });
      loadTeamData(activeTeamId!);
      setShowEditPrompt(false);
      setEditingPrompt(null);
      setPromptName('');
      setPromptDesc('');
      setPromptContent('');
    } catch (error) {
      alert('更新失败: ' + (error as Error).message);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('确定要删除这个模板吗？')) return;
    
    try {
      await teamCollaborationService.deleteSharedPrompt(promptId);
      loadTeamData(activeTeamId!);
    } catch (error) {
      alert('删除失败: ' + (error as Error).message);
    }
  };

  // Knowledge Base Permission Handlers
  const openKnowledgeBasePermission = (kb: SharedKnowledgeBase) => {
    setEditingKnowledgeBase(kb);
    setShowKnowledgeBasePermission(true);
  };

  const handleSetKnowledgeBasePermission = async (userId: string, permission: 'read' | 'write' | 'admin' | 'remove') => {
    if (!editingKnowledgeBase) return;
    
    try {
      if (permission === 'remove') {
        await teamCollaborationService.removeKnowledgeBasePermission(editingKnowledgeBase.id, userId);
      } else {
        await teamCollaborationService.setKnowledgeBasePermission(editingKnowledgeBase.id, userId, permission);
      }
      loadTeamData(activeTeamId!);
      // Refresh knowledge bases
      const kbs = teamCollaborationService.getTeamKnowledgeBases(activeTeamId!);
      setKnowledgeBases(kbs);
    } catch (error) {
      alert('设置权限失败: ' + (error as Error).message);
    }
  };

  // Prompt Permission Handlers
  const openPromptPermission = (prompt: SharedPromptTemplate) => {
    setEditingPromptForPermission(prompt);
    setShowPromptPermission(true);
  };

  const handleSetPromptPermission = async (userId: string, permission: 'read' | 'write' | 'admin' | 'remove') => {
    if (!editingPromptForPermission) return;
    
    try {
      if (permission === 'remove') {
        await teamCollaborationService.removePromptPermission(editingPromptForPermission.id, userId);
      } else {
        await teamCollaborationService.setPromptPermission(editingPromptForPermission.id, userId, permission);
      }
      loadTeamData(activeTeamId!);
      // Refresh prompts
      const pts = teamCollaborationService.getTeamPrompts(activeTeamId!);
      setPrompts(pts);
    } catch (error) {
      alert('设置权限失败: ' + (error as Error).message);
    }
  };

  const handleEditMemberRole = (member: TeamMember) => {
    setEditingMember(member);
    setInviteRole(member.role);
    setShowEditMemberRole(true);
  };

  const handleUpdateMemberRole = async () => {
    if (!activeTeamId || !editingMember) return;
    
    try {
      await teamCollaborationService.changeMemberRole(activeTeamId, editingMember.id, inviteRole);
      loadTeamData(activeTeamId);
      setShowEditMemberRole(false);
      setEditingMember(null);
    } catch (error) {
      alert('更新失败: ' + (error as Error).message);
    }
  };

  const openEditTeamModal = () => {
    if (activeTeam) {
      setNewTeamName(activeTeam.name);
      setNewTeamDesc(activeTeam.description);
      setShowEditTeam(true);
    }
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-amber-400" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-400" />;
      case 'editor': return <Edit3 className="h-4 w-4 text-green-400" />;
      case 'viewer': return <Eye className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleLabel = (role: TeamRole) => {
    switch (role) {
      case 'owner': return '所有者';
      case 'admin': return '管理员';
      case 'editor': return '编辑者';
      case 'viewer': return '查看者';
    }
  };

  const activeTeam = teams.find(t => t.id === activeTeamId);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>团队协作</h2>
              <p className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>共享知识库、团队模板、权限管理</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateTeam(true)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
            style={{ color: 'var(--t-text)' }}
          >
            <Plus className="h-4 w-4" />
            创建团队
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Teams Sidebar */}
        <div className="w-64 border-r p-4 overflow-y-auto" style={{ borderColor: 'var(--t-glass-border)' }}>
          <h3 className="text-xs font-medium mb-3" style={{ color: 'var(--t-text-muted)' }}>我的团队 ({teams.length})</h3>
          
          <div className="space-y-2">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => setActiveTeamId(team.id)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                  activeTeamId === team.id ? 'bg-white/10 ring-1' : 'hover:bg-white/5'
                }`}
                style={{ borderColor: activeTeamId === team.id ? 'var(--t-accent-border)' : 'transparent' }}
              >
                <span className="text-2xl">{team.avatar}</span>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--t-text)' }}>{team.name}</div>
                  <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{team.members.length} 成员</div>
                </div>
              </button>
            ))}
          </div>

          {teams.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--t-text-muted)' }}>
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">暂无团队</p>
            </div>
          )}
        </div>

        {/* Team Detail */}
        {activeTeam ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Team Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--t-glass-border)' }}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeTeam.avatar}</span>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--t-text)' }}>{activeTeam.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{activeTeam.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {myRole && (
                  <span className="px-3 py-1 rounded-full text-xs bg-white/5 flex items-center gap-1" style={{ color: 'var(--t-text-muted)' }}>
                    {getRoleIcon(myRole)}
                    {getRoleLabel(myRole)}
                  </span>
                )}
                {(myRole === 'owner' || myRole === 'admin') && (
                  <button
                    onClick={openEditTeamModal}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--t-text-muted)' }}
                    title="编辑团队"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
                {myRole === 'owner' && (
                  <button
                    onClick={handleDeleteTeam}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    title="删除团队"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {myRole !== 'owner' && (
                  <button
                    onClick={handleLeaveTeam}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    title="离开团队"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: 'var(--t-glass-border)' }}>
              {[
                { id: 'overview', label: '概览', icon: Users },
                { id: 'members', label: '成员', icon: User },
                { id: 'knowledge', label: '知识库', icon: Database },
                { id: 'prompts', label: '模板', icon: FileText },
                { id: 'audit', label: '审计日志', icon: History },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeTab === tab.id ? 'border-b-2' : ''
                  }`}
                  style={{
                    color: activeTab === tab.id ? 'var(--t-text)' : 'var(--t-text-muted)',
                    borderColor: activeTab === tab.id ? 'var(--t-accent-light)' : 'transparent'
                  }}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="glass-card rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold" style={{ color: 'var(--t-text)' }}>{members.length}</div>
                      <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>成员</div>
                    </div>
                    <div className="glass-card rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold" style={{ color: 'var(--t-text)' }}>{knowledgeBases.length}</div>
                      <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>知识库</div>
                    </div>
                    <div className="glass-card rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold" style={{ color: 'var(--t-text)' }}>{prompts.length}</div>
                      <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>模板</div>
                    </div>
                    <div className="glass-card rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold" style={{ color: 'var(--t-text)' }}>{auditLogs.length}</div>
                      <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>操作记录</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--t-text)' }}>最近活动</h4>
                    <div className="space-y-2">
                      {activities.slice(0, 5).map(activity => (
                        <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl glass-card">
                          <span className="text-lg">{activity.userAvatar}</span>
                          <div className="flex-1">
                            <span className="text-sm" style={{ color: 'var(--t-text)' }}>{activity.userName}</span>
                            <span className="text-sm mx-1" style={{ color: 'var(--t-text-muted)' }}>{activity.content}</span>
                          </div>
                          <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      {activities.length === 0 && (
                        <div className="text-center py-8" style={{ color: 'var(--t-text-muted)' }}>
                          暂无活动
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>团队成员 ({members.length})</h4>
                    {(myRole === 'owner' || myRole === 'admin') && (
                      <button
                        onClick={() => setShowInviteMember(true)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
                        style={{ color: 'var(--t-text)' }}
                      >
                        <UserPlus className="h-4 w-4" />
                        邀请成员
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl glass-card">
                        <span className="text-2xl">{member.avatar}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{member.name}</span>
                            {getRoleIcon(member.role)}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{member.email}</div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/5" style={{ color: 'var(--t-text-muted)' }}>
                          {getRoleLabel(member.role)}
                        </span>
                        {myRole === 'owner' && member.role !== 'owner' && (
                          <>
                            <button
                              onClick={() => handleEditMemberRole(member)}
                              className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                              title="修改角色"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                              title="移除成员"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'knowledge' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>共享知识库 ({knowledgeBases.length})</h4>
                    {(myRole === 'owner' || myRole === 'admin' || myRole === 'editor') && (
                      <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm flex items-center gap-2" style={{ color: 'var(--t-text)' }}>
                        <Plus className="h-4 w-4" />
                        新建知识库
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {knowledgeBases.map(kb => {
                      const kbPermission = teamCollaborationService.getKnowledgeBasePermission(kb.id);
                      const canManagePermission = kbPermission === 'owner' || kbPermission === 'admin';
                      
                      return (
                        <div key={kb.id} className="glass-card rounded-xl p-4 group">
                          <div className="flex items-start justify-between mb-2">
                            <Database className="h-5 w-5" style={{ color: 'var(--t-accent-light)' }} />
                            <div className="flex items-center gap-1">
                              <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{kb.documentCount} 文档</span>
                              {canManagePermission && (
                                <button
                                  onClick={() => openKnowledgeBasePermission(kb)}
                                  className="p-1 rounded hover:bg-blue-500/20 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="管理权限"
                                >
                                  <Shield className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <h5 className="font-medium mb-1" style={{ color: 'var(--t-text)' }}>{kb.name}</h5>
                          <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{kb.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'prompts' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>共享模板 ({prompts.length})</h4>
                    <button
                      onClick={() => setShowCreatePrompt(true)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
                      style={{ color: 'var(--t-text)' }}
                    >
                      <Plus className="h-4 w-4" />
                      新建模板
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {prompts.map(prompt => {
                      const canEdit = teamCollaborationService.canEditPrompt(prompt.id);
                      
                      return (
                        <div key={prompt.id} className="glass-card rounded-xl p-4 group">
                          <div className="flex items-start justify-between mb-2">
                            <FileText className="h-5 w-5" style={{ color: 'var(--t-accent-light)' }} />
                            <div className="flex items-center gap-1">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5" style={{ color: 'var(--t-text-muted)' }}>
                                使用 {prompt.useCount} 次
                              </span>
                              {/* Show permission/manage buttons for owner/admin */}
                              {canEdit && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <button
                                    onClick={() => openPromptPermission(prompt)}
                                    className="p-1 rounded hover:bg-green-500/20 text-green-400 transition-colors"
                                    title="管理权限"
                                  >
                                    <Shield className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleEditPrompt(prompt)}
                                    className="p-1 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                                    title="编辑模板"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePrompt(prompt.id)}
                                    className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                                    title="删除模板"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <h5 className="font-medium mb-1" style={{ color: 'var(--t-text)' }}>{prompt.name}</h5>
                          <p className="text-xs mb-2" style={{ color: 'var(--t-text-muted)' }}>{prompt.description}</p>
                          <div className="flex gap-2">
                            {prompt.tags.map(tag => (
                              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5" style={{ color: 'var(--t-text-muted)' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'audit' && (
                <div>
                  <h4 className="text-sm font-medium mb-4" style={{ color: 'var(--t-text)' }}>审计日志</h4>
                  <div className="space-y-2">
                    {auditLogs.slice(0, 20).map(log => (
                      <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl glass-card text-sm">
                        <History className="h-4 w-4" style={{ color: 'var(--t-text-muted)' }} />
                        <div className="flex-1">
                          <span style={{ color: 'var(--t-text)' }}>{log.userName}</span>
                          <span className="mx-1" style={{ color: 'var(--t-text-muted)' }}>
                            {log.action === 'create' ? '创建了' :
                             log.action === 'update' ? '更新了' :
                             log.action === 'delete' ? '删除了' :
                             log.action === 'join' ? '加入了' :
                             log.action === 'leave' ? '离开了' : '操作了'}
                          </span>
                          <span style={{ color: 'var(--t-accent-light)' }}>{log.resourceName}</span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-indigo-400/50" />
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--t-text)' }}>团队协作</h3>
            <p className="text-sm max-w-md mb-6" style={{ color: 'var(--t-text-secondary)' }}>
              创建或加入团队，与成员共享知识库、提示词模板，共同提升工作效率
            </p>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-colors"
            >
              创建第一个团队
            </button>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--t-text)' }}>创建新团队</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>团队名称</label>
                <input
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm"
                  placeholder="输入团队名称..."
                  style={{ color: 'var(--t-text)' }}
                />
              </div>
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>描述</label>
                <textarea
                  value={newTeamDesc}
                  onChange={e => setNewTeamDesc(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm h-20"
                  placeholder="输入团队描述..."
                  style={{ color: 'var(--t-text)' }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateTeam(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                取消
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim()}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm transition-colors disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--t-text)' }}>邀请成员</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>邮箱地址</label>
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm"
                  placeholder="member@example.com"
                  style={{ color: 'var(--t-text)' }}
                />
              </div>
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>角色</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as TeamRole)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm"
                  style={{ color: 'var(--t-text)' }}
                >
                  <option value="viewer">查看者 - 只能查看内容</option>
                  <option value="editor">编辑者 - 可以编辑内容</option>
                  <option value="admin">管理员 - 可以管理成员</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteMember(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                取消
              </button>
              <button
                onClick={handleInviteMember}
                disabled={!inviteEmail.trim()}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm transition-colors disabled:opacity-50"
              >
                邀请
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Prompt Modal */}
      {showCreatePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--t-text)' }}>新建共享模板</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>模板名称</label>
                <input
                  value={promptName}
                  onChange={e => setPromptName(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm"
                  placeholder="输入模板名称..."
                  style={{ color: 'var(--t-text)' }}
                />
              </div>
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>描述</label>
                <input
                  value={promptDesc}
                  onChange={e => setPromptDesc(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm"
                  placeholder="简要描述这个模板的用途..."
                  style={{ color: 'var(--t-text)' }}
                />
              </div>
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>分类</label>
                <select
                  value={promptCategory}
                  onChange={e => setPromptCategory(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm"
                  style={{ color: 'var(--t-text)' }}
                >
                  <option value="general">通用</option>
                  <option value="coding">编程</option>
                  <option value="writing">写作</option>
                  <option value="analysis">分析</option>
                  <option value="creative">创意</option>
                </select>
              </div>
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>模板内容</label>
                <textarea
                  value={promptContent}
                  onChange={e => setPromptContent(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm h-32"
                  placeholder="输入提示词模板内容..."
                  style={{ color: 'var(--t-text)' }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreatePrompt(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                取消
              </button>
              <button
                onClick={handleCreatePrompt}
                disabled={!promptName.trim() || !promptContent.trim()}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm transition-colors disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--t-text)' }}>编辑团队信息</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>团队名称</label>
                <input
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm"
                  placeholder="输入团队名称..."
                  style={{ color: 'var(--t-text)' }}
                />
              </div>
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>描述</label>
                <textarea
                  value={newTeamDesc}
                  onChange={e => setNewTeamDesc(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm h-20"
                  placeholder="输入团队描述..."
                  style={{ color: 'var(--t-text)' }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditTeam(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                取消
              </button>
              <button
                onClick={handleUpdateTeam}
                disabled={!newTeamName.trim()}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm transition-colors disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Prompt Modal */}
      {showEditPrompt && editingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--t-text)' }}>编辑模板</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>模板名称</label>
                <input
                  value={promptName}
                  onChange={e => setPromptName(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm"
                  placeholder="输入模板名称..."
                  style={{ color: 'var(--t-text)' }}
                />
              </div>
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>描述</label>
                <input
                  value={promptDesc}
                  onChange={e => setPromptDesc(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm"
                  placeholder="简要描述这个模板的用途..."
                  style={{ color: 'var(--t-text)' }}
                />
              </div>
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>分类</label>
                <select
                  value={promptCategory}
                  onChange={e => setPromptCategory(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm"
                  style={{ color: 'var(--t-text)' }}
                >
                  <option value="general">通用</option>
                  <option value="coding">编程</option>
                  <option value="writing">写作</option>
                  <option value="analysis">分析</option>
                  <option value="creative">创意</option>
                </select>
              </div>
              <div>
                <label className="text-sm block mb-2" style={{ color: 'var(--t-text-secondary)' }}>模板内容</label>
                <textarea
                  value={promptContent}
                  onChange={e => setPromptContent(e.target.value)}
                  className="glass-input w-full rounded-xl py-2 px-3 text-sm h-32"
                  placeholder="输入提示词模板内容..."
                  style={{ color: 'var(--t-text)' }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditPrompt(false);
                  setEditingPrompt(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                取消
              </button>
              <button
                onClick={handleUpdatePrompt}
                disabled={!promptName.trim() || !promptContent.trim()}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm transition-colors disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Role Modal */}
      {showEditMemberRole && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--t-text)' }}>修改成员角色</h3>
            <div className="mb-4 p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{editingMember.avatar}</span>
                <div>
                  <div className="font-medium" style={{ color: 'var(--t-text)' }}>{editingMember.name}</div>
                  <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{editingMember.email}</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm block" style={{ color: 'var(--t-text-secondary)' }}>选择新角色</label>
              {(['viewer', 'editor', 'admin'] as TeamRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => setInviteRole(role)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                    inviteRole === role ? 'bg-indigo-500/20 ring-1 ring-indigo-500/50' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {getRoleIcon(role)}
                  <div className="text-left">
                    <div className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{getRoleLabel(role)}</div>
                    <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                      {role === 'viewer' && '只能查看团队内容'}
                      {role === 'editor' && '可以编辑知识库和模板'}
                      {role === 'admin' && '可以管理成员和设置'}
                    </div>
                  </div>
                  {inviteRole === role && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400" />}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditMemberRole(false);
                  setEditingMember(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                取消
              </button>
              <button
                onClick={handleUpdateMemberRole}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Base Permission Modal */}
      {showKnowledgeBasePermission && editingKnowledgeBase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--t-text)' }}>
              管理知识库权限
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--t-text-muted)' }}>
              {editingKnowledgeBase.name}
            </p>
            
            <div className="space-y-3">
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--t-text-secondary)' }}>
                团队成员权限
              </div>
              {members.filter(m => m.userId !== editingKnowledgeBase.ownerId).map(member => {
                const currentPermission = editingKnowledgeBase.permissions[member.userId];
                
                return (
                  <div key={member.id} className="p-3 rounded-xl bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{member.avatar}</span>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{member.name}</div>
                        <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                          团队角色: {getRoleLabel(member.role)}
                        </div>
                      </div>
                    </div>
                    <select
                      value={currentPermission || ''}
                      onChange={(e) => handleSetKnowledgeBasePermission(member.userId, e.target.value as any)}
                      className="glass-input rounded-lg py-1 px-2 text-sm"
                      style={{ color: 'var(--t-text)' }}
                    >
                      <option value="">继承团队角色</option>
                      <option value="read">只读</option>
                      <option value="write">可编辑</option>
                      <option value="admin">管理员</option>
                      {currentPermission && <option value="remove">移除权限</option>}
                    </select>
                  </div>
                );
              })}
              
              {members.filter(m => m.userId !== editingKnowledgeBase.ownerId).length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--t-text-muted)' }}>
                  没有其他团队成员
                </p>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowKnowledgeBasePermission(false);
                  setEditingKnowledgeBase(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Permission Modal */}
      {showPromptPermission && editingPromptForPermission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--t-text)' }}>
              管理模板权限
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--t-text-muted)' }}>
              {editingPromptForPermission.name}
            </p>
            
            <div className="space-y-3">
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--t-text-secondary)' }}>
                团队成员权限
              </div>
              {members.filter(m => m.userId !== editingPromptForPermission.createdBy).map(member => {
                const currentPermission = editingPromptForPermission.permissions[member.userId];
                
                return (
                  <div key={member.id} className="p-3 rounded-xl bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{member.avatar}</span>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{member.name}</div>
                        <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
                          团队角色: {getRoleLabel(member.role)}
                        </div>
                      </div>
                    </div>
                    <select
                      value={currentPermission || ''}
                      onChange={(e) => handleSetPromptPermission(member.userId, e.target.value as any)}
                      className="glass-input rounded-lg py-1 px-2 text-sm"
                      style={{ color: 'var(--t-text)' }}
                    >
                      <option value="">继承团队角色</option>
                      <option value="read">只读</option>
                      <option value="write">可编辑</option>
                      <option value="admin">管理员</option>
                      {currentPermission && <option value="remove">移除权限</option>}
                    </select>
                  </div>
                );
              })}
              
              {members.filter(m => m.userId !== editingPromptForPermission.createdBy).length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--t-text-muted)' }}>
                  没有其他团队成员
                </p>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPromptPermission(false);
                  setEditingPromptForPermission(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
