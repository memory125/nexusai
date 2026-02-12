import { useState } from 'react';
import { useStore } from '../store';
import { Eye, EyeOff, Sparkles, ArrowRight, User, Mail, Lock } from 'lucide-react';

export function AuthPage() {
  const { authMode, setAuthMode, login, register } = useStore();
  const [email, setEmail] = useState('demo@nexusai.com');
  const [password, setPassword] = useState('demo123');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (authMode === 'login') {
        const success = login(email, password);
        if (!success) setError('邮箱或密码错误');
      } else {
        if (!username.trim()) { setError('请输入用户名'); setLoading(false); return; }
        if (password.length < 6) { setError('密码至少6位'); setLoading(false); return; }
        const success = register(username, email, password);
        if (!success) setError('该邮箱已被注册');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background orbs */}
      <div className="glow-orb" style={{ width: 500, height: 500, background: 'var(--t-orb1)', top: '-10%', left: '-5%' }} />
      <div className="glow-orb" style={{ width: 400, height: 400, background: 'var(--t-orb2)', bottom: '-10%', right: '-5%', animationDelay: '-7s' }} />
      <div className="glow-orb" style={{ width: 300, height: 300, background: 'var(--t-orb3)', top: '50%', left: '50%', animationDelay: '-14s' }} />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg" style={{ background: `linear-gradient(135deg, var(--t-gradient-from), var(--t-gradient-to))`, boxShadow: `0 8px 24px var(--t-accent-glow)` }}>
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">NexusAI</h1>
          <p className="mt-2 text-text-secondary">智能大模型工作台</p>
        </div>

        {/* Auth Card */}
        <div className="glass-strong rounded-2xl p-8">
          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-white/5 p-1">
            <button
              onClick={() => { setAuthMode('login'); setError(''); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                authMode === 'login'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              登 录
            </button>
            <button
              onClick={() => { setAuthMode('register'); setError(''); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                authMode === 'register'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              注 册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div className="animate-fade-in">
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">用户名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="glass-input w-full rounded-xl py-3 pl-10 pr-4 text-sm"
                    placeholder="请输入用户名"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="glass-input w-full rounded-xl py-3 pl-10 pr-4 text-sm"
                  placeholder="请输入邮箱"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="glass-input w-full rounded-xl py-3 pl-10 pr-10 text-sm"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-fade-in rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glass-btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {authMode === 'login' ? '登 录' : '注 册'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {authMode === 'login' && (
            <p className="mt-4 text-center text-xs text-text-muted">
              演示账号: demo@nexusai.com / demo123
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
