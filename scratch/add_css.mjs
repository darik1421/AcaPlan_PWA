import fs from 'fs';

const extraCSS = `
/* ==========================================================================
   Restricciones & Consecutivas Modern UX Styles
   ========================================================================== */

.restrictions-nav-tabs {
  display: flex;
  gap: 8px;
  background: #f1f4f9;
  padding: 6px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid var(--border-subtle);
  overflow-x: auto;
  scrollbar-width: none;
}
.restrictions-nav-tabs::-webkit-scrollbar {
  display: none;
}

.restrictions-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 9px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.restrictions-tab-btn:hover {
  color: var(--primary-indigo);
  background: rgba(255, 255, 255, 0.7);
}

.restrictions-tab-btn.active {
  background: #ffffff;
  color: var(--primary-indigo);
  box-shadow: 0 2px 6px rgba(48, 44, 145, 0.1);
  font-weight: 700;
}

.restrictions-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  background: var(--primary-light);
  color: var(--primary-indigo);
}

.restrictions-tab-btn.active .restrictions-badge {
  background: var(--primary-indigo);
  color: #ffffff;
}

.teacher-avatar-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary-indigo);
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.teacher-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag-origin {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  margin-top: 3px;
}

.tag-origin.excel {
  background: #ecfdf5;
  color: #065f46;
}

.day-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  background: #f1f5f9;
  color: var(--text-ink);
}

.time-slot-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-ink);
}

/* Day Pills in Restriction Modal */
.day-pills-selector {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
  margin-bottom: 8px;
}

.day-pill-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  color: var(--text-ink);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.day-pill-btn:hover {
  border-color: var(--primary-indigo);
  color: var(--primary-indigo);
  background: var(--primary-light);
}

.day-pill-btn.selected {
  background: var(--primary-indigo);
  color: #ffffff;
  border-color: var(--primary-indigo);
}

/* Consecutive rules pairing visualizer */
.consecutive-pairing-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid var(--border-card);
  border-radius: 10px;
  padding: 14px 18px;
  margin: 14px 0;
}

.pairing-subject-card {
  flex: 1;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px 14px;
}

.pairing-connector {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--primary-indigo);
  white-space: nowrap;
}

.confirm-checkbox-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 14px 0;
}

.confirm-checkbox-box label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #166534;
  cursor: pointer;
  margin: 0;
}
`;

fs.appendFileSync('frontend/src/features/management/management.css', extraCSS);
console.log('Successfully appended styles to management.css');

