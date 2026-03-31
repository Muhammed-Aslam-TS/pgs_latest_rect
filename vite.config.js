import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
});




// import { reactRouter } from "@react-router/dev/vite";
// import { defineConfig } from "vite";
// // import tsconfigPaths from "vite-tsconfig-paths";

// if (!globalThis.structuredClone) {
//   globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
// }

// export default defineConfig({

//   plugins: [
//     tailwindcss(),
//     reactRouter(),
//     // tsconfigPaths(),
//   ],
// });
