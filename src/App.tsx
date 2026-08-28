import { RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import router from "./route";

function App() {
  return (
    <>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
      <Toaster 
        position="top-center" 
        expand={false} 
        richColors 
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '1.25rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          }
        }}
      />
    </>
  );
}

export default App;