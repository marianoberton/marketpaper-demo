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

(function(window, document) {
  'use strict';

  // Configuración por defecto
  const DEFAULT_CONFIG = {
    webhookUrl: '',
    trackingEnabled: true,
    autoCapture: true,
    debug: false,
    formSelectors: [
      'form[data-fomo-capture]',
      'form.contact-form',
      'form.lead-form',
      'form#contact',
      'form#lead-form'
    ],
    fieldMapping: {
      name: ['name', 'nombre', 'full_name', 'fullname'],
      email: ['email', 'correo', 'e-mail'],
      phone: ['phone', 'telefono', 'tel', 'mobile'],
      company: ['company', 'empresa', 'organization'],
      message: ['message', 'mensaje', 'comment', 'comentario', 'description']
    }
  };

  let config = {};
  let isInitialized = false;

  // Utilidades
  const utils = {
    log: function(message, data) {
      if (config.debug) {
        console.log('[FOMO Lead Capture]', message, data || '');
      }
    },

    error: function(message, error) {
      console.error('[FOMO Lead Capture]', message, error || '');
    },

    getUTMParams: function() {
      const urlParams = new URLSearchParams(window.location.search);
      return {
        utm_source: urlParams.get('utm_source'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_medium: urlParams.get('utm_medium'),
        utm_content: urlParams.get('utm_content'),
        utm_term: urlParams.get('utm_term')
      };
    },

    getPageInfo: function() {
      return {
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
    },

    findFieldByNames: function(form, fieldNames) {
      for (let name of fieldNames) {
        // Buscar por name attribute
        let field = form.querySelector(`[name="${name}"]`);
        if (field) return field;

        // Buscar por id
        field = form.querySelector(`#${name}`);
        if (field) return field;

        // Buscar por placeholder que contenga el nombre
        field = form.querySelector(`[placeholder*="${name}"]`);
        if (field) return field;
      }
      return null;
    },

    extractFormData: function(form) {
      const data = {};
      const mapping = config.fieldMapping;

      // Mapear campos conocidos
      for (let [key, fieldNames] of Object.entries(mapping)) {
        const field = this.findFieldByNames(form, fieldNames);
        if (field && field.value.trim()) {
          data[key] = field.value.trim();
        }
      }

      // Si no encontramos nombre o email, intentar extraer de todos los campos
      if (!data.name || !data.email) {
        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
          if (!data.name && (key.toLowerCase().includes('name') || key.toLowerCase().includes('nombre'))) {
            data.name = value.trim();
          }
          if (!data.email && (key.toLowerCase().includes('email') || key.toLowerCase().includes('correo'))) {
            data.email = value.trim();
          }
          if (!data.phone && (key.toLowerCase().includes('phone') || key.toLowerCase().includes('tel'))) {
            data.phone = value.trim();
          }
        }
      }

      return data;
    },

    validateEmail: function(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },

    sendToWebhook: function(leadData) {
      if (!config.webhookUrl) {
        this.error('Webhook URL not configured');
        return Promise.reject('Webhook URL not configured');
      }

      const payload = {
        ...leadData,
        ...this.getUTMParams(),
        ...this.getPageInfo(),
        form_id: leadData.form_id || 'web-capture',
        source: 'web-form'
      };

      this.log('Sending lead data:', payload);

      return fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        this.log('Lead sent successfully:', data);
        return data;
      })
      .catch(error => {
        this.error('Error sending lead:', error);
        throw error;
      });
    }
  };

  // Captura de formularios
  const formCapture = {
    init: function() {
      if (!config.autoCapture) return;

      // Buscar formularios existentes
      this.attachToExistingForms();

      // Observar nuevos formularios (para SPAs)
      this.observeNewForms();

      utils.log('Form capture initialized');
    },

    attachToExistingForms: function() {
      config.formSelectors.forEach(selector => {
        const forms = document.querySelectorAll(selector);
        forms.forEach(form => this.attachToForm(form));
      });
    },

    observeNewForms: function() {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Verificar si el nodo es un formulario
              if (node.tagName === 'FORM') {
                this.checkAndAttachForm(node);
              }
              // Buscar formularios dentro del nodo
              config.formSelectors.forEach(selector => {
                const forms = node.querySelectorAll ? node.querySelectorAll(selector) : [];
                forms.forEach(form => this.attachToForm(form));
              });
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    },

    checkAndAttachForm: function(form) {
      const shouldCapture = config.formSelectors.some(selector => {
        return form.matches(selector);
      });

      if (shouldCapture) {
        this.attachToForm(form);
      }
    },

    attachToForm: function(form) {
      // Evitar adjuntar múltiples veces
      if (form.dataset.fomoAttached) return;
      form.dataset.fomoAttached = 'true';

      utils.log('Attaching to form:', form);

      form.addEventListener('submit', (e) => {
        this.handleFormSubmit(e, form);
      });
    },

    handleFormSubmit: function(event, form) {
      const formData = utils.extractFormData(form);

      // Validar datos mínimos
      if (!formData.name || !formData.email) {
        utils.log('Form missing required fields (name or email), skipping capture');
        return;
      }

      if (!utils.validateEmail(formData.email)) {
        utils.log('Invalid email format, skipping capture');
        return;
      }

      // Agregar ID del formulario si existe
      if (form.id) {
        formData.form_id = form.id;
      }

      // Enviar al webhook (no bloquear el envío del formulario)
      utils.sendToWebhook(formData)
        .then(response => {
          utils.log('Lead captured successfully');
          
          // Disparar evento personalizado
          window.dispatchEvent(new CustomEvent('fomoLeadCaptured', {
            detail: { leadData: formData, response: response }
          }));
        })
        .catch(error => {
          utils.error('Failed to capture lead:', error);
          
          // Disparar evento de error
          window.dispatchEvent(new CustomEvent('fomoLeadCaptureError', {
            detail: { leadData: formData, error: error }
          }));
        });
    }
  };

  // Tracking de eventos
  const eventTracking = {
    init: function() {
      if (!config.trackingEnabled) return;

      this.trackPageView();
      this.trackClicks();
      this.trackScrollDepth();

      utils.log('Event tracking initialized');
    },

    trackPageView: function() {
      const pageData = {
        event: 'page_view',
        ...utils.getPageInfo(),
        ...utils.getUTMParams()
      };

      utils.log('Page view tracked:', pageData);
    },

    trackClicks: function() {
      document.addEventListener('click', (e) => {
        const target = e.target;
        
        // Trackear clics en CTAs importantes
        if (target.matches('a[href*="contact"], a[href*="demo"], button[type="submit"], .cta-button')) {
          const clickData = {
            event: 'cta_click',
            element: target.tagName.toLowerCase(),
            text: target.textContent.trim(),
            href: target.href || null,
            ...utils.getPageInfo()
          };

          utils.log('CTA click tracked:', clickData);
        }
      });
    },

    trackScrollDepth: function() {
      let maxScroll = 0;
      let scrollTimer;

      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          const scrollPercent = Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
          );

          if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;

            // Trackear hitos importantes
            if ([25, 50, 75, 90].includes(scrollPercent)) {
              utils.log(`Scroll depth: ${scrollPercent}%`);
            }
          }
        }, 100);
      });
    }
  };

  // API pública
  const FomoLeadCapture = {
    init: function(userConfig = {}) {
      if (isInitialized) {
        utils.log('Already initialized');
        return;
      }

      // Combinar configuración
      config = { ...DEFAULT_CONFIG, ...userConfig };

      if (!config.webhookUrl) {
        utils.error('webhookUrl is required');
        return;
      }

      // Inicializar módulos
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          formCapture.init();
          eventTracking.init();
        });
      } else {
        formCapture.init();
        eventTracking.init();
      }

      isInitialized = true;
      utils.log('FOMO Lead Capture initialized', config);
    },

    // Método para capturar lead manualmente
    captureLead: function(leadData) {
      if (!isInitialized) {
        utils.error('Not initialized. Call init() first.');
        return Promise.reject('Not initialized');
      }

      return utils.sendToWebhook(leadData);
    },

    // Método para trackear evento personalizado
    trackEvent: function(eventName, eventData = {}) {
      if (!config.trackingEnabled) return;

      const trackingData = {
        event: eventName,
        ...eventData,
        ...utils.getPageInfo()
      };

      utils.log('Custom event tracked:', trackingData);
    },

    // Configurar después de la inicialización
    configure: function(newConfig) {
      config = { ...config, ...newConfig };
      utils.log('Configuration updated:', config);
    }
  };

  // Exponer API globalmente
  window.FomoLeadCapture = FomoLeadCapture;

  // Auto-inicialización si se encuentra configuración en el DOM
  document.addEventListener('DOMContentLoaded', () => {
    const configScript = document.querySelector('script[data-fomo-config]');
    if (configScript) {
      try {
        const autoConfig = JSON.parse(configScript.dataset.fomoConfig);
        FomoLeadCapture.init(autoConfig);
      } catch (error) {
        utils.error('Error parsing auto-config:', error);
      }
    }
  });

})(window, document);

// Ejemplo de uso:
/*
<script src="https://tu-dominio.com/fomo-lead-capture.js"></script>
<script>
  FomoLeadCapture.init({
    webhookUrl: 'https://tu-dominio.com/api/webhook/leads',
    trackingEnabled: true,
    autoCapture: true,
    debug: true
  });

  // Escuchar eventos
  window.addEventListener('fomoLeadCaptured', function(e) {
    console.log('Lead capturado:', e.detail);
    // Aquí puedes agregar lógica adicional como mostrar un mensaje de éxito
  });

  window.addEventListener('fomoLeadCaptureError', function(e) {
    console.error('Error capturando lead:', e.detail);
  });
</script>
*/