const Forms = ({ fields, onSubmit, title, className = "", submitText = "Submit", darkMode = false }) => {
    return (
      <form
        onSubmit={onSubmit}
        className={`${!darkMode ? 'bg-white shadow-lg' : 'bg-transparent'} rounded-2xl p-6 max-w-md mx-auto ${className}`}
      >
        {title && <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>}
  
        {fields.map((field, index) => (
          <div className="mb-4" key={index}>
            <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              value={field.value}
              onChange={field.onChange}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                darkMode 
                ? 'bg-white/5 border-white/10 text-white placeholder-slate-500 focus:bg-white/10' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
          </div>
        ))}
  
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30 mt-2"
        >
          {submitText}
        </button>
      </form>
    );
  };
export default Forms; 