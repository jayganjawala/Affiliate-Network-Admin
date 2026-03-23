// components/Toast.js
import React from "react";
// import { ToastContainer } from "react-toastify";
// import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from "react-hot-toast";

const Toast = () => {
  return (
    // <ToastContainer
    //   position="top-right"
    //   autoClose={2000}
    //   hideProgressBar={false}
    //   newestOnTop
    //   closeOnClick
    //   pauseOnHover
    //   draggable
    //   theme="light"
    // />
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 2000,
        style: {
          background: "#fff",
          color: "#363636",
          fontSize: "18px",
          padding: "14px 18px",
          minWidth: "300px",
          borderRadius: "10px",
        },
      }}
    />
  );
};

export default Toast;
