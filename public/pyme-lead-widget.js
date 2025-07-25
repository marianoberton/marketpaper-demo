/**
 * FOMO Platform - Widget de Captura de Leads para PYMEs
 * 
 * Uso:
 * <script src="https://tu-dominio.com/pyme-lead-widget.js"></script>
 * <script>
 *   FOMOPymeWidget.init({
 *     apiUrl: 'https://tu-dominio.com/api/webhook/pyme-leads',
 *     companyId: 'tu-company-id', // Opcional
 *     theme: 'modern', // 'modern', 'minimal', 'gradient'
 *     position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
 *     title: 'Impulsa tu PYME',
 *     subtitle: 'Descubre cómo podemos ayudarte'
 *   });
 * </script>
 */

(function() {
    'use strict';
    
    const FOMOPymeWidget = {
        config: {
            apiUrl: '',
            companyId: null,
            theme: 'modern',
            position: 'bottom-right',
            title: 'Solicita una Demo',
            subtitle: 'Transforma tu negocio hoy'
        },
        
        isOpen: false,
        
        init: function(options) {
            this.config = { ...this.config, ...options };
            this.createWidget();
            this.attachEventListeners();
        },
        
        createWidget: function() {
            // Crear contenedor principal
            const widgetContainer = document.createElement('div');
            widgetContainer.id = 'fomo-pyme-widget';
            widgetContainer.innerHTML = this.getWidgetHTML();
            
            // Agregar estilos
            const style = document.createElement('style');
            style.textContent = this.getWidgetCSS();
            document.head.appendChild(style);
            
            // Agregar al DOM
            document.body.appendChild(widgetContainer);
        },
        
        getWidgetHTML: function() {
            return `
                <!-- Botón flotante -->
                <div id="fomo-widget-trigger" class="fomo-widget-trigger ${this.config.position}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        <path d="M13 8H7"/>
                        <path d="M17 12H7"/>
                    </svg>
                </div>
                
                <!-- Modal del formulario -->
                <div id="fomo-widget-modal" class="fomo-widget-modal">
                    <div class="fomo-widget-overlay"></div>
                    <div class="fomo-widget-content">
                        <div class="fomo-widget-header">
                            <div class="fomo-widget-title">
                                <h3>${this.config.title}</h3>
                                <p>${this.config.subtitle}</p>
                            </div>
                            <button id="fomo-widget-close" class="fomo-widget-close">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="fomo-widget-body">
                            <div id="fomo-success-message" class="fomo-message fomo-success" style="display: none;">
                                ¡Gracias! Nos pondremos en contacto contigo pronto.
                            </div>
                            
                            <div id="fomo-error-message" class="fomo-message fomo-error" style="display: none;">
                                Ha ocurrido un error. Inténtalo de nuevo.
                            </div>
                            
                            <form id="fomo-pyme-form">
                                <div class="fomo-form-group">
                                    <input type="text" name="full_name" placeholder="Nombre completo *" required>
                                </div>
                                
                                <div class="fomo-form-group">
                                    <input type="text" name="company" placeholder="Empresa *" required>
                                </div>
                                
                                <div class="fomo-form-group">
                                    <select name="position" required>
                                        <option value="">Selecciona tu puesto *</option>
                                        <option value="CEO">CEO</option>
                                        <option value="Fundador">Fundador</option>
                                        <option value="Director General">Director General</option>
                                        <option value="Director">Director</option>
                                        <option value="Gerente General">Gerente General</option>
                                        <option value="Gerente">Gerente</option>
                                        <option value="Jefe">Jefe</option>
                                        <option value="Coordinador">Coordinador</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                
                                <div class="fomo-form-group">
                                    <input type="email" name="email" placeholder="Email *" required>
                                </div>
                                
                                <div class="fomo-form-group">
                                    <input type="tel" name="phone" placeholder="Teléfono WhatsApp *" required>
                                </div>
                                
                                <div class="fomo-form-group">
                                    <input type="url" name="website" placeholder="Sitio web">
                                </div>
                                
                                <div class="fomo-form-group">
                                    <select name="country" required>
                                        <option value="">País *</option>
                                        <option value="Argentina">Argentina</option>
                                        <option value="México">México</option>
                                        <option value="Colombia">Colombia</option>
                                        <option value="Chile">Chile</option>
                                        <option value="Perú">Perú</option>
                                        <option value="España">España</option>
                                        <option value="Estados Unidos">Estados Unidos</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                
                                <div class="fomo-form-group">
                                                    <select name="monthly_revenue" required>
                    <option value="">Facturación mensual *</option>
                    <option value="menos de $100k">Menos de $100k</option>
                    <option value="$100k - $500k">$100k - $500k</option>
                    <option value="$500k - $2 millones">$500k - $2 millones</option>
                    <option value="$2 - $50 millones">$2 - $50 millones</option>
                    <option value="$50 - $100 millones">$50 - $100 millones</option>
                    <option value="$100 - $500 millones">$100 - $500 millones</option>
                    <option value="más de $500 millones">Más de $500 millones</option>
                                    </select>
                                </div>
                                
                                <div class="fomo-form-group">
                                    <select name="how_found_us" required>
                                        <option value="">¿Cómo nos conociste? *</option>
                                        <option value="Google / Búsqueda web">Google / Búsqueda web</option>
                                        <option value="LinkedIn">LinkedIn</option>
                                        <option value="Redes sociales">Redes sociales</option>
                                        <option value="Referencia">Referencia</option>
                                        <option value="Recomendación">Recomendación</option>
                                        <option value="Evento / Conferencia">Evento / Conferencia</option>
                                        <option value="Publicidad online">Publicidad online</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                
                                <div class="fomo-form-group">
                                    <textarea name="additional_info" placeholder="Cuéntanos más sobre tu empresa y necesidades..." rows="3"></textarea>
                                </div>
                                
                                <button type="submit" class="fomo-submit-btn">
                                    Solicitar Información
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            `;
        },
        
        getWidgetCSS: function() {
            return `
                #fomo-pyme-widget * {
                    box-sizing: border-box;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .fomo-widget-trigger {
                    position: fixed;
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 999998;
                    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s ease;
                    color: white;
                }
                
                .fomo-widget-trigger:hover {
                    transform: scale(1.1);
                    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.6);
                }
                
                .fomo-widget-trigger.bottom-right {
                    bottom: 30px;
                    right: 30px;
                }
                
                .fomo-widget-trigger.bottom-left {
                    bottom: 30px;
                    left: 30px;
                }
                
                .fomo-widget-trigger.top-right {
                    top: 30px;
                    right: 30px;
                }
                
                .fomo-widget-trigger.top-left {
                    top: 30px;
                    left: 30px;
                }
                
                .fomo-widget-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 999999;
                    display: none;
                }
                
                .fomo-widget-modal.active {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .fomo-widget-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                }
                
                .fomo-widget-content {
                    position: relative;
                    background: white;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                    animation: fomo-widget-appear 0.3s ease-out;
                }
                
                @keyframes fomo-widget-appear {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                
                .fomo-widget-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                
                .fomo-widget-title h3 {
                    margin: 0 0 5px 0;
                    font-size: 24px;
                    font-weight: 700;
                }
                
                .fomo-widget-title p {
                    margin: 0;
                    opacity: 0.9;
                    font-size: 16px;
                }
                
                .fomo-widget-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 5px;
                    transition: background-color 0.2s ease;
                }
                
                .fomo-widget-close:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                
                .fomo-widget-body {
                    padding: 30px;
                    max-height: 60vh;
                    overflow-y: auto;
                }
                
                .fomo-message {
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    font-weight: 500;
                }
                
                .fomo-success {
                    background: #10b981;
                    color: white;
                }
                
                .fomo-error {
                    background: #ef4444;
                    color: white;
                }
                
                .fomo-form-group {
                    margin-bottom: 20px;
                }
                
                .fomo-form-group input,
                .fomo-form-group select,
                .fomo-form-group textarea {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 16px;
                    transition: border-color 0.3s ease;
                    background: #fafafa;
                }
                
                .fomo-form-group input:focus,
                .fomo-form-group select:focus,
                .fomo-form-group textarea:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                }
                
                .fomo-form-group textarea {
                    resize: vertical;
                    font-family: inherit;
                }
                
                .fomo-submit-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 16px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s ease, opacity 0.2s ease;
                }
                
                .fomo-submit-btn:hover {
                    transform: translateY(-2px);
                }
                
                .fomo-submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .fomo-loading {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 3px solid #ffffff;
                    border-radius: 50%;
                    border-top-color: transparent;
                    margin-right: 10px;
                    animation: fomo-spin 1s ease-in-out infinite;
                }
                
                @keyframes fomo-spin {
                    to { transform: rotate(360deg); }
                }
                
                @media (max-width: 480px) {
                    .fomo-widget-content {
                        width: 95%;
                        margin: 20px;
                        max-height: 95vh;
                    }
                    
                    .fomo-widget-header {
                        padding: 20px;
                    }
                    
                    .fomo-widget-title h3 {
                        font-size: 20px;
                    }
                    
                    .fomo-widget-body {
                        padding: 20px;
                    }
                }
            `;
        },
        
        attachEventListeners: function() {
            const trigger = document.getElementById('fomo-widget-trigger');
            const modal = document.getElementById('fomo-widget-modal');
            const closeBtn = document.getElementById('fomo-widget-close');
            const overlay = modal.querySelector('.fomo-widget-overlay');
            const form = document.getElementById('fomo-pyme-form');
            
            // Abrir modal
            trigger.addEventListener('click', () => this.openModal());
            
            // Cerrar modal
            closeBtn.addEventListener('click', () => this.closeModal());
            overlay.addEventListener('click', () => this.closeModal());
            
            // Manejar escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeModal();
                }
            });
            
            // Manejar envío del formulario
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        },
        
        openModal: function() {
            const modal = document.getElementById('fomo-widget-modal');
            modal.classList.add('active');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
        },
        
        closeModal: function() {
            const modal = document.getElementById('fomo-widget-modal');
            modal.classList.remove('active');
            this.isOpen = false;
            document.body.style.overflow = '';
        },
        
        handleFormSubmit: async function(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('.fomo-submit-btn');
            const successMessage = document.getElementById('fomo-success-message');
            const errorMessage = document.getElementById('fomo-error-message');
            
            // Ocultar mensajes previos
            successMessage.style.display = 'none';
            errorMessage.style.display = 'none';
            
            // Mostrar loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="fomo-loading"></span>Enviando...';
            
            try {
                // Recopilar datos del formulario
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                // Agregar información técnica
                data.user_agent = navigator.userAgent;
                data.referrer = document.referrer;
                data.page_url = window.location.href;
                data.company_id = this.config.companyId;
                
                // Agregar parámetros UTM
                const urlParams = new URLSearchParams(window.location.search);
                data.utm_source = urlParams.get('utm_source') || null;
                data.utm_medium = urlParams.get('utm_medium') || null;
                data.utm_campaign = urlParams.get('utm_campaign') || null;
                data.utm_content = urlParams.get('utm_content') || null;
                data.utm_term = urlParams.get('utm_term') || null;
                
                const response = await fetch(this.config.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    successMessage.style.display = 'block';
                    e.target.reset();
                    
                    // Opcional: Enviar evento a analytics
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'lead_captured', {
                            'event_category': 'pyme_widget',
                            'event_label': 'pyme_lead_submission',
                            'value': result.lead_score
                        });
                    }
                    
                    // Cerrar modal después de 3 segundos
                    setTimeout(() => {
                        this.closeModal();
                    }, 3000);
                    
                } else {
                    throw new Error(result.error || 'Error desconocido');
                }
                
            } catch (error) {
                console.error('Error:', error);
                errorMessage.textContent = error.message || 'Ha ocurrido un error. Inténtalo de nuevo.';
                errorMessage.style.display = 'block';
                
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Solicitar Información';
            }
        }
    };
    
    // Exponer el widget globalmente
    window.FOMOPymeWidget = FOMOPymeWidget;
    
})(); 