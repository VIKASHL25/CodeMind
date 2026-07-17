import { createContext, useContext, useRef } from "react";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const ws = useRef(null);

  const connectAndAnalyze = (payload, callbacks) => {
    const WS_URL = import.meta.env.VITE_WS_URL ||
    (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host;
      ws.current = new WebSocket(`${WS_URL}/ws/analyze`);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify(payload));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "status")         callbacks.onStatus?.(data.message);
      if (data.type === "routing")        callbacks.onRouting?.(data);
      if (data.type === "agent_complete") callbacks.onAgentComplete?.(data);
      if (data.type === "charts")         callbacks.onCharts?.(data);
      if (data.type === "final")          callbacks.onFinal?.(data.response);
      if (data.type === "done")           callbacks.onDone?.();
      if (data.type === "error")          callbacks.onError?.(data.message);
    };

    ws.current.onerror = () =>
      callbacks.onError?.("WebSocket connection failed. Is the backend running?");
  };

  const disconnect = () => ws.current?.close();

  return (
    <SocketContext.Provider value={{ connectAndAnalyze, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);