import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LiveActivityPage from "./pages/LiveActivityPage";
import HistoryPage from "./pages/HistoryPage";
import "./styles.css";

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <Header />

        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/live-activity" element={<LiveActivityPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}