import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster position="top-right" />
    </>
  );
}

export default App;