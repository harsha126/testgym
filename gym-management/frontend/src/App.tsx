import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { useAuthStore } from "./stores/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import UserDetailPage from "./pages/UserDetailPage";
import UserDashboard from "./pages/UserDashboard";

const App: React.FC = () => {
    const { isAuthenticated, role } = useAuthStore();

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: "#0544A4",
                    fontFamily: "'Gudea', 'Helvetica', 'Arial', sans-serif",
                    borderRadius: 8,
                    colorBgContainer: "#ffffff",
                },
                components: {
                    Layout: {
                        headerBg: "#0544A4",
                    },
                },
            }}
        >
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/owner"
                        element={
                            <ProtectedRoute requiredRole="OWNER">
                                <OwnerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/owner/users/:id"
                        element={
                            <ProtectedRoute requiredRole="OWNER">
                                <UserDetailPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/user"
                        element={
                            <ProtectedRoute requiredRole="USER">
                                <UserDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/"
                        element={
                            isAuthenticated ? (
                                <Navigate
                                    to={role === "OWNER" ? "/owner" : "/user"}
                                    replace
                                />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
};

export default App;
