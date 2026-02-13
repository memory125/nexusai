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
      case 'chat': return <ChatPage />;
      case 'agents': return <AgentsPage />;
      case 'skills': return <SkillsPage />;
      case 'knowledge': return <KnowledgeBasePage />;
      case 'models': return <ModelsPage />;
      case 'project': return <ProjectPage />;
      case 'mcp': return <MCPPage />;
      case 'settings': return <SettingsPage />;
      default: return <ChatPage />;
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
