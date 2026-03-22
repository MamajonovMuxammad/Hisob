import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function LandingPage({ onLoggedIn }) {
  const [scrolled, setScrolled] = useState(false);
  const [authMode, setAuthMode] = useState(null); // 'phone' | 'oauth' | null
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parallaxRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      if (parallaxRef.current) {
        const scrolledVal = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${scrolledVal * 0.4}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handlePhoneLogin = async () => {
    if (!phone) return setError('Введите номер телефона');
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.replace(/[^0-9+]/g, '') });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setOtpSent(true);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return setError('Введите код из СМС');
    setLoading(true); setError('');
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone.replace(/[^0-9+]/g, ''),
      token: otp,
      type: 'sms'
    });
    if (error) setError(error.message);
    if (data?.session) {
      onLoggedIn(data.session);
    }
    setLoading(false);
  };

  return (
    <div className="landing-page dark-mode">
      {/* Header */}
      <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-container header-inner">
          <div className="logo-glow" style={{ fontSize: 24, fontWeight: 800 }}>
            🤖 Hisob.<span style={{ color: '#4F8EF7' }}>AI</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => document.getElementById('about').scrollIntoView({behavior: 'smooth'})}>О нас</button>
            <button className="btn btn-primary" onClick={() => setAuthMode('choice')} style={{ borderRadius: 30, padding: '10px 24px' }}>Вход / Регистрация</button>
          </div>
        </div>
      </header>

      {/* Hero Parallax */}
      <section className="hero-section">
        <div className="parallax-bg" ref={parallaxRef}></div>
        <div className="glow-sphere s1"></div>
        <div className="glow-sphere s3"></div>
        <div className="landing-container hero-content">
          <span className="badge badge-purple bounce-anim" style={{ marginBottom: 24, padding: '8px 20px', fontSize: 13, background: 'rgba(128, 90, 213, 0.15)', border: '1px solid rgba(128, 90, 213, 0.5)' }}>
            🔥 Автоматизация бухгалтерии 2026
          </span>
          <h1 className="hero-title slide-up">Искусственный интеллект<br />в роли вашего главного бухгалтера</h1>
          <p className="hero-subtitle slide-up fade-in" style={{ animationDelay: '0.2s' }}>
            Hisob.AI — это революционная платформа для управления финансами, налогами и документооборотом в Узбекистане. 
            Делегируйте рутину нейросетям и сосредоточьтесь на развитии бизнеса.
          </p>
          <div className="slide-up fade-in" style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40, animationDelay: '0.4s' }}>
            <button className="btn btn-primary btn-lg pulse-shadow" onClick={() => setAuthMode('choice')}>
              Начать бесплатно →
            </button>
          </div>
          
          <div className="hero-dashboard-mockup slide-up fade-in" style={{ animationDelay: '0.6s', marginTop: 60 }}>
            {/* Visual Glassmorphism Mockup */}
            <div className="mockup-header"><span className="dot"/><span className="dot"/><span className="dot"/></div>
            <div className="mockup-body mockup-glass">
               <div style={{ padding: 40, textAlign: 'center' }}>
                 <div style={{ fontSize: 64, marginBottom: 20 }}>📊</div>
                 <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Финансовый отчёт сгенерирован</h2>
                 <p style={{ color: '#A0AEC0' }}>Ваши налоги, сотрудники и счета-фактуры синхронизированы в реальном времени.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Long Content Section */}
      <section id="about" className="about-section">
        <div className="landing-container">
          <div className="split-layout">
            <div className="split-text slide-up scroll-reveal">
              <h2 style={{ fontSize: 42, fontWeight: 800, marginBottom: 24, color: '#fff' }}>Кто мы и что мы делаем?</h2>
              <p style={{ fontSize: 18, color: '#A0AEC0', lineHeight: 1.8, marginBottom: 20 }}>
                В современном мире малый бизнес тратит до 30% времени на бумажную волокиту и споры с налоговой. 
                <strong> Hisob.AI</strong> — это первый в СНГ ИИ-бухгалтер, обученный на свежей налоговой базе и кодексах Республики Узбекистан.
              </p>
              <p style={{ fontSize: 18, color: '#A0AEC0', lineHeight: 1.8 }}>
                Мы не просто формируем документы. Наша нейросеть анализирует ваши нужды, консультирует как живой специалист с 20-летним стажем и страхует от пени и штрафов.
              </p>
            </div>
            <div className="split-visual scroll-reveal">
              <div className="glass-card stat-card stat-blue bounce-anim">
                <div style={{ fontSize: 40, fontWeight: 800, color: '#4F8EF7' }}>0 ₽</div>
                <div style={{ color: '#A0AEC0', marginTop: 10 }}>Ошибок в расчётах налогов</div>
              </div>
              <div className="glass-card stat-card stat-purple bounce-anim" style={{ animationDelay: '0.3s', marginTop: 20, transform: 'translateX(-40px)' }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: '#805ad5' }}>10x</div>
                <div style={{ color: '#A0AEC0', marginTop: 10 }}>Ускорение документооборота</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal Overlay */}
      {authMode && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)', zIndex: 9999 }}>
          <div className="modal slide-up" style={{ maxWidth: 420, padding: 40, textAlign: 'center' }}>
            <button className="modal-close" onClick={() => { setAuthMode(null); setOtpSent(false); }} style={{ position: 'absolute', top: 20, right: 24 }}>×</button>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Вход в Hisob.AI</h2>
            <p style={{ color: '#A0AEC0', fontSize: 14, marginBottom: 30 }}>Войдите, чтобы сохранить свои данные сервере</p>

            {error && <div className="alert alert-warning" style={{ marginBottom: 20, textAlign: 'left' }}>❌ {error}</div>}

            {authMode === 'choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <button className="btn btn-primary" onClick={handleGoogleLogin} style={{ padding: 14, background: '#fff', color: '#000', border: '1px solid #ccc' }}>
                   Продолжить с Google
                </button>
                <div style={{ margin: '10px 0', color: '#4A5568', fontSize: 13 }}>ИЛИ</div>
                <button className="btn btn-ghost" onClick={() => setAuthMode('phone')} style={{ padding: 14, background: '#171923' }}>
                  📞 Войти по номеру телефона
                </button>
              </div>
            )}

            {authMode === 'phone' && !otpSent && (
              <div style={{ textAlign: 'left' }}>
                <label className="label">Номер телефона</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input className="input" placeholder="+998 90 123 45 67" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={handlePhoneLogin} disabled={loading} style={{ width: '100%', marginTop: 20, padding: 14 }}>
                  {loading ? 'Отправка...' : 'Получить СМС код'}
                </button>
              </div>
            )}

            {authMode === 'phone' && otpSent && (
              <div style={{ textAlign: 'left' }}>
                <label className="label">СМС код отправлен на {phone}</label>
                <input className="input" placeholder="Введите код (например 123456)" value={otp} onChange={e => setOtp(e.target.value)} />
                <button className="btn btn-primary" onClick={handleVerifyOtp} disabled={loading} style={{ width: '100%', marginTop: 20, padding: 14 }}>
                  {loading ? 'Проверка...' : 'Подтвердить и войти'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
