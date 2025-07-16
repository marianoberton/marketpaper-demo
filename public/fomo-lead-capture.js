/**
 * FOMO Lead Capture Script
 * Integra este script en tu web para capturar leads automáticamente
 * 
 * Uso:
 * <script src="https://tu-dominio.com/fomo-lead-capture.js"></script>
 * <script>
 *   FomoLeadCapture.init({
 *     webhookUrl: 'https://tu-dominio.com/api/webhook/leads',
 *     trackingEnabled: true,
 *     autoCapture: true
 *   });
 * </script>
 */

(function() {
  'use strict';

    // Configuración global del widget
    window.FOMO_CONFIG = window.FOMO_CONFIG || {};
    
    const defaultConfig = {
        apiEndpoint: 'https://your-domain.vercel.app/api/webhook/contact-lead',
        trigger: 'exit-intent', // 'exit-intent', 'scroll', 'time', 'manual'
        scrollThreshold: 70, // % de scroll para activar
        timeDelay: 30000, // ms para activar por tiempo
        position: 'bottom-right', // 'bottom-right', 'bottom-left', 'center', 'top'
        theme: 'modern', // 'modern', 'minimal', 'rounded'
        showPoweredBy: true,
        autoCapture: true, // Capturar UTM y metadata automáticamente
        fields: {
            name: { required: true, placeholder: 'Tu nombre completo' },
            email: { required: true, placeholder: 'tu@email.com' },
            company: { required: false, placeholder: 'Tu empresa (opcional)' },
            pain_point: { required: true, placeholder: '¿Cuál es tu principal desafío?' }
        },
        messages: {
            title: '¡Espera! Antes de que te vayas...',
            subtitle: 'Déjanos ayudarte con tu proyecto',
            button: 'Quiero información gratuita',
            success: '¡Gracias! Te contactaremos pronto.',
            error: 'Error al enviar. Inténtalo de nuevo.'
        },
        styling: {
            primaryColor: '#667eea',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            borderRadius: '12px'
        }
    };
    
    // Merge configuración del usuario
    const config = { ...defaultConfig, ...window.FOMO_CONFIG };
    
    class FOMOLeadCapture {
        constructor() {
            this.isVisible = false;
            this.hasBeenShown = false;
            this.exitIntentListener = null;
            this.scrollListener = null;
            this.timeoutId = null;
            this.metadata = this.collectMetadata();
            
            this.init();
        }
        
        init() {
            // Verificar que no se haya mostrado ya
            if (this.hasBeenShown || localStorage.getItem('fomo_lead_shown')) {
                return;
            }
            
            this.createStyles();
            this.createModal();
            this.setupTriggers();
            
            console.log('🚀 FOMO Lead Capture Widget inicializado');
        }
        
        collectMetadata() {
      const urlParams = new URLSearchParams(window.location.search);
            
      return {
                // UTM Parameters
        utm_source: urlParams.get('utm_source'),
                utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
                utm_term: urlParams.get('utm_term'),
        utm_content: urlParams.get('utm_content'),

                // Technical info
                user_agent: navigator.userAgent,
                referrer: document.referrer || null,
        page_url: window.location.href,
        page_title: document.title,
                screen_resolution: `${screen.width}x${screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                
                // Engagement data
                timestamp: new Date().toISOString(),
                session_duration: Math.round((Date.now() - performance.timing.navigationStart) / 1000)
            };
        }
        
        createStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .fomo-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 999999;
                    display: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    backdrop-filter: blur(4px);
                }
                
                .fomo-overlay.show {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 1;
                }
                
                .fomo-modal {
                    background: ${config.styling.backgroundColor};
                    border-radius: ${config.styling.borderRadius};
                    padding: 32px;
                    max-width: 480px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                    transform: scale(0.9) translateY(20px);
                    transition: transform 0.3s ease;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    position: relative;
                }
                
                .fomo-overlay.show .fomo-modal {
                    transform: scale(1) translateY(0);
                }
                
                .fomo-close {
                    position: absolute;
                    top: 12px;
                    right: 16px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #999;
                    padding: 4px;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .fomo-close:hover {
                    background: #f5f5f5;
                    color: #666;
                }
                
                .fomo-header {
                    text-align: center;
                    margin-bottom: 24px;
                }
                
                .fomo-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: ${config.styling.textColor};
                    margin: 0 0 8px 0;
                    line-height: 1.3;
                }
                
                .fomo-subtitle {
                    font-size: 16px;
                    color: #666;
                    margin: 0;
                    line-height: 1.4;
                }
                
                .fomo-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .fomo-field {
                    display: flex;
                    flex-direction: column;
                }
                
                .fomo-input, .fomo-textarea {
                    padding: 12px 16px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.3s ease;
                    font-family: inherit;
                    outline: none;
                }
                
                .fomo-input:focus, .fomo-textarea:focus {
                    border-color: ${config.styling.primaryColor};
                    box-shadow: 0 0 0 3px ${config.styling.primaryColor}20;
                }
                
                .fomo-textarea {
                    resize: vertical;
                    min-height: 80px;
                }
                
                .fomo-submit {
                    background: linear-gradient(135deg, ${config.styling.primaryColor} 0%, ${config.styling.primaryColor}dd 100%);
                    color: white;
                    border: none;
                    padding: 14px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-top: 8px;
                }
                
                .fomo-submit:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 16px ${config.styling.primaryColor}40;
                }
                
                .fomo-submit:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .fomo-powered-by {
                    text-align: center;
                    margin-top: 16px;
                    font-size: 12px;
                    color: #999;
                }
                
                .fomo-powered-by a {
                    color: ${config.styling.primaryColor};
                    text-decoration: none;
                }
                
                .fomo-message {
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    font-size: 14px;
                    text-align: center;
                    display: none;
                }
                
                .fomo-message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .fomo-message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                @media (max-width: 600px) {
                    .fomo-modal {
                        padding: 24px 20px;
                        margin: 20px;
                        width: calc(100% - 40px);
                    }
                    
                    .fomo-title {
                        font-size: 20px;
                    }
                }
                
                /* Animación de entrada */
                @keyframes fomo-slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .fomo-modal.animate {
                    animation: fomo-slide-up 0.3s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
        
        createModal() {
            const overlay = document.createElement('div');
            overlay.className = 'fomo-overlay';
            overlay.innerHTML = `
                <div class="fomo-modal">
                    <button class="fomo-close" type="button">&times;</button>
                    
                    <div class="fomo-header">
                        <h2 class="fomo-title">${config.messages.title}</h2>
                        <p class="fomo-subtitle">${config.messages.subtitle}</p>
                    </div>
                    
                    <div class="fomo-message success"></div>
                    <div class="fomo-message error"></div>
                    
                    <form class="fomo-form">
                        ${this.generateFormFields()}
                        
                        <button type="submit" class="fomo-submit">
                            ${config.messages.button}
                        </button>
                    </form>
                    
                    ${config.showPoweredBy ? `
                        <div class="fomo-powered-by">
                            Powered by <a href="https://fomoplatform.com" target="_blank">FOMO Platform</a>
                        </div>
                    ` : ''}
                </div>
            `;
            
            document.body.appendChild(overlay);
            this.overlay = overlay;
            this.modal = overlay.querySelector('.fomo-modal');
            this.form = overlay.querySelector('.fomo-form');
            
            this.setupEventListeners();
        }
        
        generateFormFields() {
            return Object.entries(config.fields).map(([fieldName, fieldConfig]) => {
                const isTextarea = fieldName === 'pain_point' || fieldName === 'notes';
                const required = fieldConfig.required ? 'required' : '';
                
                if (isTextarea) {
                    return `
                        <div class="fomo-field">
                            <textarea 
                                name="${fieldName}" 
                                class="fomo-textarea" 
                                placeholder="${fieldConfig.placeholder}"
                                ${required}
                            ></textarea>
                        </div>
                    `;
                } else {
                    const inputType = fieldName === 'email' ? 'email' : 'text';
                    return `
                        <div class="fomo-field">
                            <input 
                                type="${inputType}" 
                                name="${fieldName}" 
                                class="fomo-input" 
                                placeholder="${fieldConfig.placeholder}"
                                ${required}
                            />
                        </div>
                    `;
                }
            }).join('');
        }
        
        setupEventListeners() {
            // Cerrar modal
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide();
                }
            });
            
            this.overlay.querySelector('.fomo-close').addEventListener('click', () => {
                this.hide();
            });
            
            // Submit form
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });
            
            // ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isVisible) {
                    this.hide();
                }
            });
        }
        
        setupTriggers() {
            if (config.trigger === 'exit-intent') {
                this.setupExitIntent();
            } else if (config.trigger === 'scroll') {
                this.setupScrollTrigger();
            } else if (config.trigger === 'time') {
                this.setupTimeTrigger();
            }
            
            // Manual trigger
            window.showFOMOLeadCapture = () => this.show();
        }
        
        setupExitIntent() {
            this.exitIntentListener = (e) => {
                if (e.clientY <= 0 && !this.hasBeenShown) {
                    this.show();
                }
            };
            document.addEventListener('mouseleave', this.exitIntentListener);
        }
        
        setupScrollTrigger() {
            this.scrollListener = () => {
                const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
                if (scrolled >= config.scrollThreshold && !this.hasBeenShown) {
                    this.show();
                }
            };
            window.addEventListener('scroll', this.scrollListener);
        }
        
        setupTimeTrigger() {
            this.timeoutId = setTimeout(() => {
                if (!this.hasBeenShown) {
                    this.show();
                }
            }, config.timeDelay);
        }
        
        show() {
            if (this.hasBeenShown) return;
            
            this.hasBeenShown = true;
            this.isVisible = true;
            
            // Actualizar metadata con información actual
            this.metadata = { ...this.metadata, ...this.collectMetadata() };
            
            this.overlay.classList.add('show');
            this.modal.classList.add('animate');
            
            // Marcar como mostrado en localStorage (opcional)
            localStorage.setItem('fomo_lead_shown', Date.now().toString());
            
            // Cleanup triggers
            this.cleanupTriggers();
            
            console.log('📝 FOMO Lead Capture mostrado');
        }
        
        hide() {
            this.isVisible = false;
            this.overlay.classList.remove('show');
            
            setTimeout(() => {
                this.overlay.style.display = 'none';
            }, 300);
        }
        
        async submitForm() {
            const submitBtn = this.form.querySelector('.fomo-submit');
            const successMsg = this.overlay.querySelector('.fomo-message.success');
            const errorMsg = this.overlay.querySelector('.fomo-message.error');
            
            // Reset messages
            successMsg.style.display = 'none';
            errorMsg.style.display = 'none';
            
            // Disable button
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            
            try {
                // Collect form data
                const formData = new FormData(this.form);
                const data = Object.fromEntries(formData.entries());
                
                // Merge with metadata
                const payload = {
                    ...data,
                    ...this.metadata,
                    widget_version: '2.0',
                    trigger_type: config.trigger
                };
                
                console.log('📤 Enviando lead:', payload);
                
                // Send to API
                const response = await fetch(config.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Lead enviado exitosamente:', result);
                    
                    successMsg.textContent = config.messages.success;
                    successMsg.style.display = 'block';
                    
                    // Hide form and show success
                    this.form.style.display = 'none';
                    
                    // Auto-close after success
                    setTimeout(() => {
                        this.hide();
                    }, 3000);
                    
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
                
            } catch (error) {
                console.error('❌ Error enviando lead:', error);
                
                errorMsg.textContent = config.messages.error;
                errorMsg.style.display = 'block';
                
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
        
        cleanupTriggers() {
            if (this.exitIntentListener) {
                document.removeEventListener('mouseleave', this.exitIntentListener);
            }
            if (this.scrollListener) {
                window.removeEventListener('scroll', this.scrollListener);
            }
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }
        }
        
        destroy() {
            this.cleanupTriggers();
            if (this.overlay) {
                this.overlay.remove();
            }
        }
    }
    
    // Auto-initialize cuando el DOM esté listo
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.fomoLeadCapture = new FOMOLeadCapture();
        });
      } else {
        window.fomoLeadCapture = new FOMOLeadCapture();
    }
    
    // Global methods
    window.FOMO = {
        show: () => window.showFOMOLeadCapture && window.showFOMOLeadCapture(),
        destroy: () => window.fomoLeadCapture && window.fomoLeadCapture.destroy()
    };
    
})();