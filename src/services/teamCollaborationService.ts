/**
 * Team Collaboration Service
 * 
 * Features:
 * - Team management and member roles
 * - Shared knowledge bases
 * - Permission management (read/write/admin)
 * - Audit logging
 * - Shared prompt templates
 * - Team activity feed
 */

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: TeamRole;
  joinedAt: number;
  lastActiveAt: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  avatar: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: number;
  updatedAt: number;
  settings: TeamSettings;
}

export interface TeamSettings {
  allowPublicSharing: boolean;
  defaultKnowledgeBasePermission: 'read' | 'write';
  requireApprovalForJoin: boolean;
  maxMembers: number;
}

export interface SharedKnowledgeBase {
  id: string;
  teamId: string;
  name: string;
  description: string;
  ownerId: string;
  permissions: Record<string, 'read' | 'write' | 'admin'>; // userId -> permission
  documentCount: number;
  lastUpdatedAt: number;
}

export interface SharedPromptTemplate {
  id: string;
  teamId: string;
  name: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  useCount: number;
}

export interface AuditLogEntry {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'share' | 'join' | 'leave' | 'permission_change';
  resourceType: 'team' | 'knowledge_base' | 'prompt_template' | 'member';
  resourceId: string;
  resourceName: string;
  details: any;
  timestamp: number;
}

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'conversation' | 'knowledge_update' | 'prompt_created' | 'member_joined';
  content: string;
  metadata: any;
  timestamp: number;
}

export class TeamCollaborationService {
  private teams: Map<string, Team> = new Map();
  private sharedKnowledgeBases: Map<string, SharedKnowledgeBase> = new Map();
  private sharedPrompts: Map<string, SharedPromptTemplate> = new Map();
  private auditLogs: AuditLogEntry[] = [];
  private activities: TeamActivity[] = [];
  private currentUserId: string = 'current_user';

  constructor() {
    this.loadFromStorage();
    this.initializeMockData();
  }

  /**
   * Initialize mock data for demo
   */
  private initializeMockData() {
    if (this.teams.size === 0) {
      // Create a demo team
      this.createTeam({
        name: 'AI 研发团队',
        description: '专注于 AI 技术研究和产品开发',
        avatar: '🤖',
      });
    }
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage() {
    try {
      const teams = localStorage.getItem('team_collaboration_teams');
      const prompts = localStorage.getItem('team_collaboration_prompts');
      const logs = localStorage.getItem('team_collaboration_logs');
      const activities = localStorage.getItem('team_collaboration_activities');

      if (teams) {
        const parsed = JSON.parse(teams);
        Object.entries(parsed).forEach(([id, team]) => {
          this.teams.set(id, team as Team);
        });
      }

      if (prompts) {
        const parsed = JSON.parse(prompts);
        Object.entries(parsed).forEach(([id, prompt]) => {
          this.sharedPrompts.set(id, prompt as SharedPromptTemplate);
        });
      }

      if (logs) {
        this.auditLogs = JSON.parse(logs);
      }

      if (activities) {
        this.activities = JSON.parse(activities);
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
    }
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage() {
    try {
      localStorage.setItem('team_collaboration_teams', JSON.stringify(Object.fromEntries(this.teams)));
      localStorage.setItem('team_collaboration_prompts', JSON.stringify(Object.fromEntries(this.sharedPrompts)));
      localStorage.setItem('team_collaboration_logs', JSON.stringify(this.auditLogs));
      localStorage.setItem('team_collaboration_activities', JSON.stringify(this.activities));
    } catch (error) {
      console.error('Failed to save team data:', error);
    }
  }

  /**
   * Create new team
   */
  async createTeam(data: { name: string; description: string; avatar: string }): Promise<Team> {
    const team: Team = {
      id: `team_${Date.now()}`,
      name: data.name,
      description: data.description,
      avatar: data.avatar,
      ownerId: this.currentUserId,
      members: [{
        id: `member_${Date.now()}`,
        userId: this.currentUserId,
        name: '当前用户',
        email: 'user@example.com',
        avatar: '👤',
        role: 'owner',
        joinedAt: Date.now(),
        lastActiveAt: Date.now(),
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        allowPublicSharing: false,
        defaultKnowledgeBasePermission: 'read',
        requireApprovalForJoin: true,
        maxMembers: 20,
      },
    };

    this.teams.set(team.id, team);
    this.logAudit({
      teamId: team.id,
      action: 'create',
      resourceType: 'team',
      resourceId: team.id,
      resourceName: team.name,
      details: { description: data.description },
    });
    this.saveToStorage();

    return team;
  }

  /**
   * Get all teams for current user
   */
  getMyTeams(): Team[] {
    return Array.from(this.teams.values())
      .filter(team => team.members.some(m => m.userId === this.currentUserId))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Get team by ID
   */
  getTeam(teamId: string): Team | null {
    return this.teams.get(teamId) || null;
  }

  /**
   * Invite member to team
   */
  async inviteMember(teamId: string, email: string, role: TeamRole): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    // Check permission
    const myRole = this.getMyRoleInTeam(teamId);
    if (!myRole || (myRole !== 'owner' && myRole !== 'admin')) {
      throw new Error('无权邀请成员');
    }

    // Simulate inviting
    const newMember: TeamMember = {
      id: `member_${Date.now()}`,
      userId: `user_${Date.now()}`,
      name: email.split('@')[0],
      email,
      avatar: '👤',
      role,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    team.members.push(newMember);
    team.updatedAt = Date.now();

    this.logAudit({
      teamId,
      action: 'join',
      resourceType: 'member',
      resourceId: newMember.id,
      resourceName: newMember.name,
      details: { role, invitedBy: this.currentUserId },
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, memberId: string): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const myRole = this.getMyRoleInTeam(teamId);
    if (!myRole || (myRole !== 'owner' && myRole !== 'admin')) {
      throw new Error('无权移除成员');
    }

    const member = team.members.find(m => m.id === memberId);
    if (!member) return false;

    team.members = team.members.filter(m => m.id !== memberId);
    team.updatedAt = Date.now();

    this.logAudit({
      teamId,
      action: 'leave',
      resourceType: 'member',
      resourceId: memberId,
      resourceName: member.name,
      details: { removedBy: this.currentUserId },
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Change member role
   */
  async changeMemberRole(teamId: string, memberId: string, newRole: TeamRole): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const myRole = this.getMyRoleInTeam(teamId);
    if (!myRole || myRole !== 'owner') {
      throw new Error('只有所有者可以更改角色');
    }

    const member = team.members.find(m => m.id === memberId);
    if (!member) return false;

    const oldRole = member.role;
    member.role = newRole;
    team.updatedAt = Date.now();

    this.logAudit({
      teamId,
      action: 'permission_change',
      resourceType: 'member',
      resourceId: memberId,
      resourceName: member.name,
      details: { oldRole, newRole },
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Get current user's role in team
   */
  getMyRoleInTeam(teamId: string): TeamRole | null {
    const team = this.teams.get(teamId);
    if (!team) return null;

    const me = team.members.find(m => m.userId === this.currentUserId);
    return me?.role || null;
  }

  /**
   * Create shared knowledge base
   */
  async createSharedKnowledgeBase(teamId: string, data: { name: string; description: string }): Promise<SharedKnowledgeBase> {
    const kb: SharedKnowledgeBase = {
      id: `kb_${Date.now()}`,
      teamId,
      name: data.name,
      description: data.description,
      ownerId: this.currentUserId,
      permissions: { [this.currentUserId]: 'admin' },
      documentCount: 0,
      lastUpdatedAt: Date.now(),
    };

    this.sharedKnowledgeBases.set(kb.id, kb);

    this.logAudit({
      teamId,
      action: 'create',
      resourceType: 'knowledge_base',
      resourceId: kb.id,
      resourceName: kb.name,
      details: {},
    });

    this.saveToStorage();
    return kb;
  }

  /**
   * Get team's knowledge bases
   */
  getTeamKnowledgeBases(teamId: string): SharedKnowledgeBase[] {
    return Array.from(this.sharedKnowledgeBases.values())
      .filter(kb => kb.teamId === teamId)
      .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
  }

  /**
   * Set knowledge base permission
   */
  async setKnowledgeBasePermission(kbId: string, userId: string, permission: 'read' | 'write' | 'admin'): Promise<boolean> {
    const kb = this.sharedKnowledgeBases.get(kbId);
    if (!kb) return false;

    // Check if current user has admin permission
    if (kb.ownerId !== this.currentUserId && kb.permissions[this.currentUserId] !== 'admin') {
      throw new Error('无权修改权限');
    }

    kb.permissions[userId] = permission;
    kb.lastUpdatedAt = Date.now();

    this.logAudit({
      teamId: kb.teamId,
      action: 'permission_change',
      resourceType: 'knowledge_base',
      resourceId: kbId,
      resourceName: kb.name,
      details: { userId, permission },
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Create shared prompt template
   */
  async createSharedPrompt(teamId: string, data: {
    name: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
  }): Promise<SharedPromptTemplate> {
    const prompt: SharedPromptTemplate = {
      id: `prompt_${Date.now()}`,
      teamId,
      ...data,
      createdBy: this.currentUserId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      useCount: 0,
    };

    this.sharedPrompts.set(prompt.id, prompt);

    this.logAudit({
      teamId,
      action: 'create',
      resourceType: 'prompt_template',
      resourceId: prompt.id,
      resourceName: prompt.name,
      details: { category: data.category },
    });

    this.addActivity({
      teamId,
      type: 'prompt_created',
      content: `创建了提示词模板 "${data.name}"`,
      metadata: { promptId: prompt.id },
    });

    this.saveToStorage();
    return prompt;
  }

  /**
   * Get team's prompt templates
   */
  getTeamPrompts(teamId: string): SharedPromptTemplate[] {
    return Array.from(this.sharedPrompts.values())
      .filter(p => p.teamId === teamId)
      .sort((a, b) => b.useCount - a.useCount);
  }

  /**
   * Use a prompt template
   */
  usePrompt(promptId: string): SharedPromptTemplate | null {
    const prompt = this.sharedPrompts.get(promptId);
    if (prompt) {
      prompt.useCount++;
      prompt.updatedAt = Date.now();
      this.saveToStorage();
    }
    return prompt || null;
  }

  /**
   * Update shared prompt template
   */
  async updateSharedPrompt(promptId: string, data: Partial<Omit<SharedPromptTemplate, 'id' | 'teamId' | 'createdBy' | 'createdAt'>>): Promise<boolean> {
    const prompt = this.sharedPrompts.get(promptId);
    if (!prompt) return false;

    // Check if current user is the creator
    if (prompt.createdBy !== this.currentUserId) {
      throw new Error('无权修改此模板');
    }

    Object.assign(prompt, data, { updatedAt: Date.now() });

    this.logAudit({
      teamId: prompt.teamId,
      action: 'update',
      resourceType: 'prompt_template',
      resourceId: promptId,
      resourceName: prompt.name,
      details: {},
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Delete shared prompt template
   */
  async deleteSharedPrompt(promptId: string): Promise<boolean> {
    const prompt = this.sharedPrompts.get(promptId);
    if (!prompt) return false;

    // Check if current user is the creator
    if (prompt.createdBy !== this.currentUserId) {
      throw new Error('无权删除此模板');
    }

    this.sharedPrompts.delete(promptId);

    this.logAudit({
      teamId: prompt.teamId,
      action: 'delete',
      resourceType: 'prompt_template',
      resourceId: promptId,
      resourceName: prompt.name,
      details: {},
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Update team information
   */
  async updateTeam(teamId: string, data: { name?: string; description?: string; avatar?: string }): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    // Check permission
    const myRole = this.getMyRoleInTeam(teamId);
    if (!myRole || (myRole !== 'owner' && myRole !== 'admin')) {
      throw new Error('无权编辑团队信息');
    }

    if (data.name) team.name = data.name;
    if (data.description) team.description = data.description;
    if (data.avatar) team.avatar = data.avatar;
    team.updatedAt = Date.now();

    this.logAudit({
      teamId,
      action: 'update',
      resourceType: 'team',
      resourceId: teamId,
      resourceName: team.name,
      details: data,
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Get audit logs for team
   */
  getAuditLogs(teamId: string, options?: { limit?: number; offset?: number }): AuditLogEntry[] {
    const logs = this.auditLogs
      .filter(log => log.teamId === teamId)
      .sort((a, b) => b.timestamp - a.timestamp);

    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return logs.slice(offset, offset + limit);
  }

  /**
   * Get team activity feed
   */
  getTeamActivity(teamId: string, limit: number = 20): TeamActivity[] {
    return this.activities
      .filter(a => a.teamId === teamId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Add activity
   */
  private addActivity(activity: Omit<TeamActivity, 'id' | 'userId' | 'userName' | 'userAvatar' | 'timestamp'>) {
    const newActivity: TeamActivity = {
      ...activity,
      id: `activity_${Date.now()}`,
      userId: this.currentUserId,
      userName: '当前用户',
      userAvatar: '👤',
      timestamp: Date.now(),
    };

    this.activities.unshift(newActivity);
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(0, 100);
    }
  }

  /**
   * Log audit entry
   */
  private logAudit(entry: Omit<AuditLogEntry, 'id' | 'userId' | 'userName' | 'timestamp'>) {
    const logEntry: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}`,
      userId: this.currentUserId,
      userName: '当前用户',
      timestamp: Date.now(),
    };

    this.auditLogs.unshift(logEntry);
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
  }

  /**
   * Leave team
   */
  async leaveTeam(teamId: string): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    if (team.ownerId === this.currentUserId) {
      throw new Error('所有者不能离开团队，请转移所有权或删除团队');
    }

    team.members = team.members.filter(m => m.userId !== this.currentUserId);
    team.updatedAt = Date.now();

    this.logAudit({
      teamId,
      action: 'leave',
      resourceType: 'member',
      resourceId: this.currentUserId,
      resourceName: '当前用户',
      details: {},
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId: string): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    if (team.ownerId !== this.currentUserId) {
      throw new Error('只有所有者可以删除团队');
    }

    // Clean up related data
    this.teams.delete(teamId);
    
    // Delete related knowledge bases
    for (const [id, kb] of this.sharedKnowledgeBases) {
      if (kb.teamId === teamId) {
        this.sharedKnowledgeBases.delete(id);
      }
    }

    // Delete related prompts
    for (const [id, prompt] of this.sharedPrompts) {
      if (prompt.teamId === teamId) {
        this.sharedPrompts.delete(id);
      }
    }

    this.saveToStorage();
    return true;
  }
}

// Singleton instance
export const teamCollaborationService = new TeamCollaborationService();
export default teamCollaborationService;
