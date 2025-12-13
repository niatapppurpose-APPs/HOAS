import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Pages/Login";
import Dashboard from "./components/Pages/Dashboard";
import { AuthProvider } from "./components/context/AuthContext";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
