import { useEffect } from 'react';
import { useStore } from './store';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { ChatPage } from './components/ChatPage';
import { AgentsPage } from './components/AgentsPage';
import { SkillsPage } from './components/SkillsPage';
import { ModelsPage } from './components/ModelsPage';
import { SettingsPage } from './components/SettingsPage';
import { ProjectPage } from './components/ProjectPage';
import { KnowledgeBasePage } from './components/KnowledgeBasePage';
import { MCPPage } from './components/MCPPage';
import { PluginPage } from './components/PluginPage';
import { WorkflowPage } from './components/WorkflowPage';
import { IntelligentSearchPage } from './components/IntelligentSearchPage';
import { DataManagementPage } from './components/DataManagementPage';
import { BrowserAutomationPage } from './components/BrowserAutomationPage';
import { TeamCollaborationPage } from './components/TeamCollaborationPage';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Add transition class briefly
    document.documentElement.classList.add('theme-transition');
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 500);
    return () => clearTimeout(timer);
  }, [theme]);

  return <>{children}</>;
}

function GlowOrbs() {
  const { theme } = useStore();

  // Get orb colors from CSS custom properties or use theme-based defaults
  const getOrbStyle = (index: number): React.CSSProperties => {
    const orbConfigs = [
      { width: 600, height: 600, top: '-15%', left: '-10%', delay: '0s' },
      { width: 500, height: 500, bottom: '-15%', right: '-10%', delay: '-5s' },
      { width: 350, height: 350, top: '40%', left: '30%', delay: '-10s' },
      { width: 300, height: 300, bottom: '10%', left: '60%', delay: '-15s' },
    ];
    const config = orbConfigs[index];
    return {
      width: config.width,
      height: config.height,
      top: config.top,
      left: config.left,
      bottom: config.bottom,
      right: config.right,
      animationDelay: config.delay,
      background: `var(--t-orb${index + 1})`,
    } as React.CSSProperties;
  };

  // Force re-render on theme change
  return (
    <div key={theme}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="glow-orb" style={getOrbStyle(i)} />
      ))}
    </div>
  );
}

function MainLayout() {
  const { currentPage } = useStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'chat': return <ChatPage key={currentPage} />;
      case 'agents': return <AgentsPage key={currentPage} />;
      case 'skills': return <SkillsPage key={currentPage} />;
      case 'knowledge': return <KnowledgeBasePage key={currentPage} />;
      case 'models': return <ModelsPage key={currentPage} />;
      case 'project': return <ProjectPage key={currentPage} />;
      case 'mcp': return <MCPPage key={currentPage} />;
      case 'plugins': return <PluginPage key={currentPage} />;
      case 'workflow': return <WorkflowPage key={currentPage} />;
      case 'search': return <IntelligentSearchPage key={currentPage} />;
      case 'data-management': return <DataManagementPage key={currentPage} />;
      case 'browser': return <BrowserAutomationPage key={currentPage} />;
      case 'team': return <TeamCollaborationPage key={currentPage} />;
      case 'settings': return <SettingsPage key={currentPage} />;
      default: return <ChatPage key={currentPage} />;
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      <GlowOrbs />
      <Sidebar />
      <div className="relative z-10 flex-1 m-2 ml-2">
        <div className="glass h-full rounded-2xl overflow-hidden">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export function App() {
  const { isLoggedIn } = useStore();

  return (
    <ThemeProvider>
      {isLoggedIn ? <MainLayout /> : <AuthPage />}
    </ThemeProvider>
  );
}
