import React, { useState } from 'react';
import { useTheme, COLOR_PRESETS } from '../context/ThemeContext';

export const ThemeSettingsDemo: React.FC = () => {
  const { themeMode, setThemeMode, primaryColor, setPrimaryColor, resolvedTheme } = useTheme();
  const [customColor, setCustomColor] = useState(primaryColor);
  const [inputText, setInputText] = useState('');
  const [successMsgVisible, setSuccessMsgVisible] = useState(false);

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomColor(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      setPrimaryColor(val);
    }
  };

  const triggerAction = () => {
    setSuccessMsgVisible(true);
    setTimeout(() => setSuccessMsgVisible(false), 3000);
  };

  return (
    <div style={styles.container}>
      {/* Premium Header */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{ backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Invivizimo" style={{ height: '28px', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
          <div style={styles.headerBadges}>
            <span className="status-badge">Theme State: {resolvedTheme}</span>
            <span className="status-badge" style={{ backgroundColor: 'var(--border)', color: 'var(--text-primary)' }}>
              Color: {primaryColor.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Main Customization Split Layout */}
      <main style={styles.mainLayout}>
        {/* Settings Control Panel */}
        <section className="card" style={styles.settingsPanel}>
          <h2 style={styles.sectionTitle}>🎨 Theme Settings</h2>
          <p style={styles.sectionSubtitle}>Tailor the overall design language, background behavior, and accent color scheme.</p>

          {/* Appearance Selection */}
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>Appearance Mode</label>
            <div style={styles.modeButtons}>
              <button
                className={`btn ${themeMode === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                style={styles.modeBtn}
                onClick={() => setThemeMode('light')}
              >
                ☀️ Light Mode
              </button>
              <button
                className={`btn ${themeMode === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                style={styles.modeBtn}
                onClick={() => setThemeMode('dark')}
              >
                🌙 Dark Mode
              </button>
              <button
                className={`btn ${themeMode === 'system' ? 'btn-primary' : 'btn-secondary'}`}
                style={styles.modeBtn}
                onClick={() => setThemeMode('system')}
              >
                💻 System Auto
              </button>
            </div>
          </div>

          {/* Color Preset Palette */}
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>Accent Color Preset</label>
            <div style={styles.presetsGrid}>
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  className={`color-swatch ${primaryColor === preset.hex ? 'active' : ''}`}
                  style={{ backgroundColor: preset.hex }}
                  onClick={() => {
                    setPrimaryColor(preset.hex);
                    setCustomColor(preset.hex);
                  }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Custom Hex Color Picker */}
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>Custom Branding Color</label>
            <div style={styles.pickerWrapper}>
              <div style={styles.pickerPreview} className="glass-panel">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  style={styles.colorInputElement}
                />
              </div>
              <input
                type="text"
                value={customColor}
                onChange={handleCustomColorChange}
                placeholder="#6366f1"
                className="input-field"
                style={styles.pickerTextInput}
              />
            </div>
            <span style={styles.fieldNote}>Input a custom 6-digit hex code or use the color wheel.</span>
          </div>
        </section>

        {/* Dynamic Live Preview Panel */}
        <section style={styles.previewContainer}>
          <div style={styles.previewHeader}>
            <h2 style={styles.sectionTitle}>👀 Live Workspace Preview</h2>
            <p style={styles.sectionSubtitle}>Interact with the live components to evaluate accessibility, hover curves, and colors.</p>
          </div>

          {/* Scaffolded Dashboard Layout Card */}
          <div className="card" style={styles.dashboardCard}>
            <div style={styles.dashboardHeader}>
              <div>
                <span className="status-badge" style={{ marginBottom: '8px' }}>Active Segment</span>
                <h3>System Performance Dashboard</h3>
              </div>
              <div style={styles.dotMenu}>
                <span style={styles.dot}></span>
                <span style={styles.dot}></span>
                <span style={styles.dot}></span>
              </div>
            </div>

            <div style={styles.metricGrid}>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Total Sessions</span>
                <span style={styles.metricValue}>12,482</span>
                <span style={styles.trendUp}>↗ +18.4%</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Server Health</span>
                <span style={styles.metricValue}>99.98%</span>
                <span style={styles.trendUp}>↗ Stable</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>CORS Allowed</span>
                <span style={styles.metricValue}>2 Origins</span>
                <span style={styles.trendLabel}>Active Limit</span>
              </div>
            </div>

            {/* Interactive Form & Action Trigger */}
            <div style={styles.interactiveArea}>
              <div style={styles.formRow}>
                <input
                  type="text"
                  placeholder="Enter dynamic values..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="input-field"
                  style={styles.formInput}
                />
                <button className="btn btn-primary" onClick={triggerAction}>
                  Execute Action
                </button>
              </div>

              {/* Alert Feedback Element */}
              {successMsgVisible && (
                <div className="glass-panel" style={{ ...styles.alertBox, borderLeft: `4px solid ${primaryColor}` }}>
                  <div style={styles.alertHeader}>
                    <strong style={{ color: primaryColor }}>Action Successful</strong>
                    <span style={styles.alertMessage}>Theme state updated with code: {primaryColor}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Component State Demonstrations */}
            <div style={styles.componentDemoArea}>
              <div style={styles.demoBlock}>
                <span style={styles.demoLabel}>Badge Accent Variation</span>
                <div style={styles.demoRow}>
                  <span className="status-badge">Primary Token</span>
                  <span className="status-badge" style={{ opacity: 0.7 }}>Semi-opaque</span>
                  <span className="status-badge" style={{ backgroundColor: 'transparent', border: `1px solid ${primaryColor}` }}>Bordered</span>
                </div>
              </div>

              <div style={styles.demoBlock}>
                <span style={styles.demoLabel}>Visual Progression Tracker</span>
                <div style={styles.stepperContainer}>
                  <div style={styles.step}>
                    <span style={{ ...styles.stepCircle, backgroundColor: primaryColor, color: '#fff' }}>✓</span>
                    <span style={styles.stepLabel}>Configured</span>
                  </div>
                  <div style={{ ...styles.stepLine, backgroundColor: primaryColor }} />
                  <div style={styles.step}>
                    <span style={{ ...styles.stepCircle, backgroundColor: primaryColor, color: '#fff' }}>✓</span>
                    <span style={styles.stepLabel}>Connected</span>
                  </div>
                  <div style={{ ...styles.stepLine, backgroundColor: 'var(--border)' }} />
                  <div style={styles.step}>
                    <span style={{ ...styles.stepCircle, border: `2px solid ${primaryColor}`, color: primaryColor, backgroundColor: 'var(--bg-card)' }}>3</span>
                    <span style={styles.stepLabel}>Customized</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    height: '70px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 32px',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    borderBottom: '1px solid var(--glass-border)',
  },
  headerContent: {
    width: '1200px',
    maxWidth: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '18px',
    transition: 'background-color 0.2s ease',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  headerBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  mainLayout: {
    flex: 1,
    width: '1200px',
    maxWidth: '100%',
    margin: '0 auto',
    padding: '40px 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '40px',
    alignItems: 'start',
  },
  settingsPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  sectionSubtitle: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '10px',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border)',
  },
  controlLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  modeButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  modeBtn: {
    padding: '12px 6px',
    fontSize: '13px',
    whiteSpace: 'nowrap' as const,
  },
  presetsGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  pickerWrapper: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  pickerPreview: {
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    overflow: 'hidden',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  colorInputElement: {
    position: 'absolute' as const,
    width: '150%',
    height: '150%',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    padding: 0,
  },
  pickerTextInput: {
    flex: 1,
    height: '46px',
  },
  fieldNote: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  previewHeader: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  dashboardCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  dashboardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '16px',
  },
  dotMenu: {
    display: 'flex',
    gap: '4px',
    cursor: 'pointer',
  },
  dot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: 'var(--text-muted)',
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border)',
  },
  metricLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: '600',
  },
  trendUp: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: '500',
  },
  trendLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  interactiveArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  formInput: {
    flex: 1,
  },
  alertBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '16px',
    borderRadius: '12px',
    gap: '6px',
  },
  alertHeader: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  alertMessage: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  componentDemoArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border)',
  },
  demoBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  demoLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  demoRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  stepperContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stepCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  stepLine: {
    flex: 1,
    height: '2px',
    minWidth: '30px',
  },
};
