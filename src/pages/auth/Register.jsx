import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Loader from "../../components/common/Loader";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "user",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Synchronization Error: Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

            if (result.success) {
                navigate(result.role === "admin" ? "/admin" : "/");
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("Quantum verification failed. Check connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded blur-[140px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-emerald-600/5 rounded blur-[140px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-[480px]"
            >
                <div className="bg-[#1e293b]/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 sm:p-12 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex p-4 rounded bg-emerald-500/10 border border-emerald-500/20 mb-6">
                            <Icon icon="solar:user-plus-bold-duotone" className="text-4xl text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase">Access Enrollment</h2>
                        <p className="text-slate-400 text-sm mt-2">Initialize your system credentials</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 rounded bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 overflow-hidden"
                            >
                                <Icon icon="solar:shield-warning-bold-duotone" className="text-rose-400 text-xl" />
                                <p className="text-rose-400 text-[11px] font-bold leading-tight">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mb-8 p-1.5 bg-[#0a0f1e]/60 rounded-[1.5rem] border border-white/5 grid grid-cols-2 gap-2 relative">
                        <button
                            type="button" onClick={() => setFormData(p => ({ ...p, role: 'user' }))}
                            className={`py-3 px-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${formData.role === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            Standard Access
                        </button>
                        <button
                            type="button" onClick={() => setFormData(p => ({ ...p, role: 'admin' }))}
                            className={`py-3 px-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${formData.role === 'admin' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            Master Admin
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Identity Signature</label>
                            <input
                                type="text" name="name" value={formData.name} onChange={handleChange} required
                                placeholder="System Operator"
                                className="w-full bg-[#0a0f1e]/40 border border-white/5 rounded px-5 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Network Endpoint (Email)</label>
                            <input
                                type="email" name="email" value={formData.email} onChange={handleChange} required
                                placeholder="operator@liquidpark.net"
                                className="w-full bg-[#0a0f1e]/40 border border-white/5 rounded px-5 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Encryption Key</label>
                                <input
                                    type="password" name="password" value={formData.password} onChange={handleChange} required
                                    placeholder="••••••••"
                                    className="w-full bg-[#0a0f1e]/40 border border-white/5 rounded px-5 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Verify Key</label>
                                <input
                                    type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
                                    placeholder="••••••••"
                                    className="w-full bg-[#0a0f1e]/40 border border-white/5 rounded px-5 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                                />
                            </div>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full py-4 mt-4 rounded bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? "Initializing..." : "Register Framework Access"}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/5 pt-8">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                            Already enrolled? {" "}
                            <Link to="/login" className="text-emerald-400 hover:text-white transition-colors">
                                Return to Portal
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
            {loading && <Loader message="Compiling User Manifest..." fullScreen={true} />}
        </div>
    );
};

export default Register;
