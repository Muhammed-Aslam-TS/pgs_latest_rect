import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Loader from "../../components/common/Loader";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
        const result = await login(formData.email, formData.password);
        if (result.success) {
            navigate(result.role === "admin" ? "/admin" : "/");
        } else {
            setError(result.message);
        }
    } catch (err) {
        setError("Connection failed. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="bg-[#1e293b]/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 mb-6 shadow-inner">
                <Icon icon="solar:shield-keyhole-bold-duotone" className="text-4xl text-blue-400" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">System Portal</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">Secure Access Framework v2.0</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3"
            >
              <Icon icon="solar:danger-bold-duotone" className="text-rose-400 text-xl flex-shrink-0" />
              <p className="text-rose-400 text-xs font-bold leading-tight">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Icon icon="solar:letter-bold-duotone" className="text-xl" />
                </div>
                <input 
                  type="email" name="email" value={formData.email} onChange={handleChange} required
                  placeholder="admin@liquidpark.com"
                  className="w-full bg-[#0a0f1e]/60 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Secure Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Icon icon="solar:lock-password-bold-duotone" className="text-xl" />
                </div>
                <input 
                  type="password" name="password" value={formData.password} onChange={handleChange} required
                  placeholder="••••••••••••"
                  className="w-full bg-[#0a0f1e]/60 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-4 mt-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : "Establish Connection"}
              {!loading && <Icon icon="solar:alt-arrow-right-bold" className="text-lg" />}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-white/5 pt-8">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
              Need access? {" "}
              <Link to="/register" className="text-blue-400 hover:text-white transition-colors">
                Initialize Account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
            <p className="text-[9px] text-slate-600 font-mono tracking-tighter">&copy; 2026 LIQUIDPARK PGS • CRYPTO-SIGNED SESSION • ENCRYPTED TRAFFIC</p>
        </div>
      </motion.div>
      {loading && <Loader message="Verifying Identity..." fullScreen={true} />}
    </div>
  );
};

export default AdminLogin;
