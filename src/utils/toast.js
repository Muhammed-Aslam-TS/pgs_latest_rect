import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Success Toast
export const showSuccessToast = (message = "Success!") => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    theme: "colored",
  });
};

// Error Toast
export const showErrorToast = (message = "Something went wrong!") => {
  toast.error(message, {
    position: "top-right",
    autoClose: 3000,
    theme: "colored",
  });
};
