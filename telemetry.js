/**
 * RVCA Dual-Write Telemetry Client (telemetry.js)
 * Asynchronously batches and transmits micro-interaction events
 * to both WordPress REST API and Node.js/MongoDB Vercel backend.
 * Captures: clicks, 500ms+ hover interest, copy events, typing velocity (WPM),
 * scroll depth, dwell time, and message transcripts.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RVCATelemetry = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {

  class TelemetryClient {
    constructor(config = {}) {
      const globalCfg = (typeof window !== 'undefined' && window.RVCA_CONFIG) || {};
      this.wpRestUrl = config.wpRestUrl || globalCfg.wpRestUrl || (typeof window !== 'undefined' && window.RVCA_WP_ENDPOINT) || '/wp-json/rvca-chatbot/v1/telemetry';
      this.vercelUrl = config.vercelUrl || (globalCfg.vercelUrl ? (globalCfg.vercelUrl.replace(/\/api\/?$/, '') + '/api/dashboard/interactions') : null) || (typeof window !== 'undefined' && window.RVCA_VERCEL_ENDPOINT) || '/api/dashboard/interactions';
      this.leadUrl = config.leadUrl || (globalCfg.vercelUrl ? (globalCfg.vercelUrl.replace(/\/api\/?$/, '') + '/send-lead') : null) || '/send-lead';
      this.batchIntervalMs = config.batchIntervalMs || 4000;
      this.maxBatchSize = config.maxBatchSize || 20;

      this.sessionId = this._getOrCreateSessionId();
      this.queue = [];
      this.timer = null;
      this.isFlushing = false;

      // Micro-interaction trackers
      this.startTime = Date.now();
      this.hoverTimers = new Map();
      this.typingStartTime = null;
      this.typedCharCount = 0;
      this.maxScrollDepth = 0;

      this._initMicroTrackers();
      this._startBatchTimer();
    }

    _getOrCreateSessionId() {
      try {
        let sid = sessionStorage.getItem('rvca_session_id');
        if (!sid) {
          sid = 'rvca_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
          sessionStorage.setItem('rvca_session_id', sid);
        }
        return sid;
      } catch (e) {
        return 'rvca_fallback_' + Date.now();
      }
    }

    _initMicroTrackers() {
      if (typeof window === 'undefined') return;

      // 1. Dwell time & flush on unload
      window.addEventListener('beforeunload', () => {
        this.track('session_dwell', {
          dwellSeconds: Math.round((Date.now() - this.startTime) / 1000),
          maxScrollDepth: this.maxScrollDepth
        });
        this.flush(true);
      });

      // 2. Text Copy Detection
      document.addEventListener('copy', (e) => {
        const selected = window.getSelection() ? window.getSelection().toString() : '';
        if (selected && selected.length > 3) {
          this.track('text_copy', {
            snippet: selected.slice(0, 100),
            charCount: selected.length
          });
        }
      });
    }

    track(eventType, payload = {}) {
      const event = {
        sessionId: this.sessionId,
        type: eventType,
        data: payload,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      };

      this.queue.push(event);
      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      }
    }

    // 500ms+ Hover Interest Tracking
    trackHoverStart(targetId, meta = {}) {
      if (this.hoverTimers.has(targetId)) clearTimeout(this.hoverTimers.get(targetId));
      const timer = setTimeout(() => {
        this.track('hover_interest', {
          targetId,
          durationMs: 500,
          ...meta
        });
        this.hoverTimers.delete(targetId);
      }, 500);
      this.hoverTimers.set(targetId, timer);
    }

    trackHoverEnd(targetId) {
      if (this.hoverTimers.has(targetId)) {
        clearTimeout(this.hoverTimers.get(targetId));
        this.hoverTimers.delete(targetId);
      }
    }

    // Typing Velocity (Words Per Minute) Tracking
    trackKeyStroke() {
      if (!this.typingStartTime) {
        this.typingStartTime = Date.now();
        this.typedCharCount = 0;
      }
      this.typedCharCount++;
    }

    trackMessageSent(messageText) {
      if (this.typingStartTime && this.typedCharCount > 0) {
        const elapsedMinutes = (Date.now() - this.typingStartTime) / 60000;
        const words = messageText.trim().split(/\s+/).length;
        const wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;

        this.track('typing_velocity', {
          wpm: Math.min(wpm, 200),
          wordCount: words,
          charCount: this.typedCharCount,
          durationSec: parseFloat((elapsedMinutes * 60).toFixed(1))
        });
      }
      this.typingStartTime = null;
      this.typedCharCount = 0;
    }

    // Scroll depth tracking within messages container
    trackScrollDepth(containerElement) {
      if (!containerElement) return;
      const { scrollTop, scrollHeight, clientHeight } = containerElement;
      const totalScrollable = scrollHeight - clientHeight;
      if (totalScrollable <= 0) return;
      const pct = Math.round((scrollTop / totalScrollable) * 100);
      if (pct > this.maxScrollDepth) {
        this.maxScrollDepth = pct;
        if (pct >= 50 && pct < 55) {
          this.track('scroll_depth_50', { depthPercent: 50 });
        } else if (pct >= 90) {
          this.track('scroll_depth_90', { depthPercent: 90 });
        }
      }
    }

    _startBatchTimer() {
      if (typeof window === 'undefined') return;
      this.timer = setInterval(() => {
        if (this.queue.length > 0) {
          this.flush();
        }
      }, this.batchIntervalMs);
    }

    async flush(useBeacon = false) {
      if (this.queue.length === 0 || this.isFlushing) return;
      this.isFlushing = true;
      const batch = this.queue.splice(0, this.maxBatchSize);

      const payloadString = JSON.stringify({
        sessionId: this.sessionId,
        events: batch,
        flushedAt: new Date().toISOString()
      });

      // Dual-Write Target 1: Vercel / Node.js Backend
      if (this.vercelUrl) {
        try {
          if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
            navigator.sendBeacon(this.vercelUrl, new Blob([payloadString], { type: 'application/json' }));
          } else if (typeof fetch !== 'undefined') {
            fetch(this.vercelUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payloadString,
              keepalive: true
            }).catch(e => console.warn('[RVCA Telemetry] Node write non-blocking fail:', e.message));
          }
        } catch (err) {
          // Non-blocking catch
        }
      }

      // Dual-Write Target 2: WordPress REST API (MySQL)
      if (this.wpRestUrl && this.wpRestUrl !== this.vercelUrl) {
        try {
          if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
            navigator.sendBeacon(this.wpRestUrl, new Blob([payloadString], { type: 'application/json' }));
          } else if (typeof fetch !== 'undefined') {
            fetch(this.wpRestUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payloadString,
              keepalive: true
            }).catch(e => console.warn('[RVCA Telemetry] WP write non-blocking fail:', e.message));
          }
        } catch (err) {
          // Non-blocking catch
        }
      }

      this.isFlushing = false;
    }

    async submitLead(leadData) {
      const payload = {
        sessionId: this.sessionId,
        leadData,
        createdAt: new Date().toISOString()
      };

      try {
        const res = await fetch(this.leadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        this.track('lead_submitted', { name: leadData.name, program: leadData.program });
        return result;
      } catch (err) {
        this.track('lead_submission_fallback', { name: leadData.name });
        return { success: true, fallback: true };
      }
    }
  }

  return TelemetryClient;
});
