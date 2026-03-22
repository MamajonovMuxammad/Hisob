import { useEffect, useState } from 'react';

export default function LandingPage({ onStart }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Header */}
      <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-container header-inner">
          <div className="logo-glow">
            <span style={{ fontSize: 24 }}>🤖</span>
            <span style={{ fontWeight: 800, fontSize: 20 }}>Hisob.<span style={{ color: '#4F8EF7' }}>AI</span></span>
          </div>
          <button className="btn btn-primary" onClick={onStart} style={{ padding: '12px 28px', borderRadius: 30 }}>
            Войти в систему →
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="glow-sphere s1"></div>
        <div className="glow-sphere s2"></div>
        <div className="landing-container hero-content">
          <span className="badge badge-blue" style={{ marginBottom: 20, padding: '6px 16px', fontSize: 13, background: 'rgba(79, 142, 247, 0.1)' }}>
            ✨ Первый ИИ-бухгалтер в Узбекистане
          </span>
          <h1 className="hero-title">Поручите бухгалтерию<br/>искуственному интеллекту</h1>
          <p className="hero-subtitle">
            Hisob.AI автоматически считает налоги, генерирует акты, счета-фактуры и договоры. 
            Создан специально для ИП и ООО Республики Узбекистан.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40 }}>
            <button className="btn btn-primary btn-lg" onClick={onStart}>
              Начать бесплатно
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => document.getElementById('features').scrollIntoView({behavior: 'smooth'})}>
              Как это работает?
            </button>
          </div>
          
          <div className="hero-dashboard-mockup fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="mockup-header">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
            <div className="mockup-body">
              <div style={{ width: 200, borderRight: '1px solid #2D3748', padding: 20 }}>
                <div style={{ background: '#2D3748', height: 20, borderRadius: 4, marginBottom: 16 }}></div>
                <div style={{ background: '#1c2333', height: 16, borderRadius: 4, marginBottom: 12 }}></div>
                <div style={{ background: '#1c2333', height: 16, borderRadius: 4, width: '80%' }}></div>
              </div>
              <div style={{ flex: 1, padding: 30 }}>
                <div style={{ background: 'linear-gradient(90deg, #4F8EF7, #805ad5)', height: 120, borderRadius: 12, marginBottom: 20 }}></div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ background: '#1c2333', height: 80, borderRadius: 8, flex: 1 }}></div>
                  <div style={{ background: '#1c2333', height: 80, borderRadius: 8, flex: 1 }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features-section">
        <div className="landing-container">
          <h2 className="section-title">Всё, что нужно вашему бизнесу</h2>
          <div className="features-grid">
            <div className="feature-card fade-up">
              <div className="f-icon">💬</div>
              <div className="f-title">Умный ИИ-Консультант</div>
              <div className="f-desc">Задайте любой вопрос по налоговому кодексу РУз, и ИИ ответит на понятном языке. От расчета НДС до оформления сотрудников.</div>
            </div>
            <div className="feature-card fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="f-icon">📄</div>
              <div className="f-title">Мгновенные Документы</div>
              <div className="f-desc">Генерируйте профессиональные счета-фактуры, акты и договоры с полными реквизитами в один клик. Идеальный экспорт в PDF.</div>
            </div>
            <div className="feature-card fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="f-icon">💰</div>
              <div className="f-title">Налоговые Калькуляторы</div>
              <div className="f-desc">Точный расчет УСН, налога на прибыль, НДФЛ и социальных налогов (ИНПС, соцналог). Никогда не переплачивайте.</div>
            </div>
            <div className="feature-card fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="f-icon">👥</div>
              <div className="f-title">Управление Штатом</div>
              <div className="f-desc">Ведите учет сотрудников, ГПД, автоматически формируйте расчётные листки и контролируйте фонд оплаты труда (ФОТ).</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo-glow">
            🤖 Hisob.<span style={{ color: '#4F8EF7' }}>AI</span>
          </div>
          <div style={{ color: '#A0AEC0', fontSize: 13 }}>
            © 2026 Hisob.AI. Все права защищены. Разработано для бизнеса Узбекистана.
          </div>
        </div>
      </footer>
    </div>
  );
}
