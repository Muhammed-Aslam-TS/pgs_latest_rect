export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], // Ensure Tailwind scans your files
    theme: {
      extend: {
        screens: {
          xs: "400px",  // Custom Extra Small devices
          "2xl": "1440px", // Larger than xl
          "3xl": "1600px", // Custom Large Screens
        },
      },
    },
    plugins: [],
  };
  