import React from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Space, Button, Typography } from "antd";
import { LogoutOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useAuthStore } from "../stores/authStore";
import NotificationBell from "./NotificationBell";

const { Header } = Layout;
const { Title, Text } = Typography;

interface AppHeaderProps {
    showBack?: boolean;
    backPath?: string;
    showLogout?: boolean;
}

const headerStyle: React.CSSProperties = {
    background: "linear-gradient(90deg, #0544A4 0%, #032d6e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    height: 56,
    lineHeight: "56px",
};

const AppHeader: React.FC<AppHeaderProps> = ({
    showBack = false,
    backPath = "/",
    showLogout = false,
}) => {
    const navigate = useNavigate();
    const { name, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <Header style={headerStyle}>
            <Space>
                {showBack && (
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined style={{ color: "#fff" }} />}
                        onClick={() => navigate(backPath)}
                    />
                )}
                <Title
                    level={4}
                    style={{
                        color: "#fff",
                        margin: 0,
                        fontFamily: "'Old Standard TT', serif",
                        letterSpacing: "1px",
                    }}
                >
                    IRON ADDICTS
                </Title>
                {!showBack && name && (
                    <Text
                        style={{
                            color: "rgba(255,255,255,0.7)",
                            fontFamily: "'Gudea', sans-serif",
                            display: "none",
                        }}
                        className="header-welcome"
                    >
                        | Welcome, {name}
                    </Text>
                )}
            </Space>
            <Space size={12}>
                <NotificationBell />
                {showLogout && (
                    <Button
                        type="text"
                        icon={<LogoutOutlined style={{ color: "#fff" }} />}
                        onClick={handleLogout}
                        style={{ color: "#fff", padding: "4px 8px" }}
                    >
                        <span className="logout-text">Logout</span>
                    </Button>
                )}
            </Space>
        </Header>
    );
};

export default AppHeader;
