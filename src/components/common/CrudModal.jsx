import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CrudModal — Reusable edit modal for CRUD operations.
 *
 * Props:
 *   isOpen      — boolean
 *   onClose     — () => void
 *   onSave      — (formData) => Promise<void>
 *   title       — string
 *   fields      — [{ key, label, type?, disabled?, placeholder? }]
 *   initialData — { [key]: value }
 *   loading     — boolean (optional)
 *   accentColor — string (optional, e.g. "blue", "emerald", "purple")
 */
const CrudModal = ({
  isOpen,
  onClose,
  onSave,
  title = "Edit Record",
  fields = [],
  initialData = {},
  loading = false,
  accentColor = "blue"
}) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({ ...initialData });
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
  };

  const colorMap = {
    blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-500', ring: 'focus:border-blue-500/50', shadow: 'shadow-blue-500/20', text: 'text-blue-400', bgLight: 'bg-blue-500/10', border: 'border-blue-500/20' },
    emerald: { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', ring: 'focus:border-emerald-500/50', shadow: 'shadow-emerald-500/20', text: 'text-emerald-400', bgLight: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-500', ring: 'focus:border-purple-500/50', shadow: 'shadow-purple-500/20', text: 'text-purple-400', bgLight: 'bg-purple-500/10', border: 'border-purple-500/20' },
  };

  const colors = colorMap[accentColor] || colorMap.blue;

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow effects */}
          <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full ${colors.bgLight} blur-[80px] pointer-events-none`} />
          <div className={`absolute -bottom-20 -left-20 h-40 w-40 rounded-full ${colors.bgLight} blur-[80px] pointer-events-none`} />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colors.bgLight} ${colors.border} border`}>
                <Icon icon="solar:pen-new-square-bold-duotone" className={`text-lg ${colors.text}`} />
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <Icon icon="solar:close-circle-bold-duotone" className="text-xl" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative z-10 p-6 space-y-5">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {field.label}
                </label>
                <input
                  type={field.type || "text"}
                  disabled={field.disabled}
                  placeholder={field.placeholder || ""}
                  value={formData[field.key] ?? ""}
                  onChange={(e) => handleChange(field.key, field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
                  className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all outline-none ${colors.ring} ${
                    field.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/[0.08]'
                  }`}
                />
              </div>
            ))}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`${colors.bg} ${colors.hover} disabled:opacity-50 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${colors.shadow} flex items-center gap-2`}
              >
                {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default CrudModal;
