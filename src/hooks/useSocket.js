import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import config from "../config/config";

// Keep a module-level socket instance so we don't create multiple connections
let socketInstance = null;

export const useSocket = (event, callback) => {
  // Store the latest callback so we don't have to reconnect on callback change
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // Initialize socket connection if it doesn't exist
    if (!socketInstance) {
      socketInstance = io(config.socket.url, config.socket.options);
      
      socketInstance.on("connect", () => {
        console.log("Connected to Socket.IO Server:", socketInstance.id);
      });

      socketInstance.on("disconnect", () => {
        console.log("Disconnected from Socket.IO Server");
      });
    }

    if (!event || !savedCallback.current) return;

    // Define the event listener
    const listener = (data) => {
      if (savedCallback.current) {
        savedCallback.current(data);
      }
    };

    socketInstance.on(event, listener);

    // Cleanup listener on unmount
    return () => {
      socketInstance.off(event, listener);
    };
  }, [event]); // Re-bind only if event name changes

  return socketInstance;
};
