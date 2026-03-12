import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message, Space } from "antd";
import {
    UserOutlined,
    LockOutlined,
    ThunderboltOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../stores/authStore";

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, loading, error } = useAuthStore();
    const [form] = Form.useForm();

    const handleSubmit = async (values: {
        phone: string;
        password: string;
    }) => {
        try {
            await login(values);
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                navigate(user.role === "OWNER" ? "/owner" : "/user");
            }
        } catch (err: any) {
            message.error(err.response?.data?.error || "Login failed");
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    "linear-gradient(135deg, #0544A4 0%, #021d47 50%, #010e24 100%)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Animated background elements */}
            <div
                style={{
                    position: "absolute",
                    top: "-10%",
                    right: "-10%",
                    width: "500px",
                    height: "500px",
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle, rgba(5,68,164,0.3) 0%, transparent 70%)",
                    animation: "pulse 4s ease-in-out infinite",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: "-15%",
                    left: "-5%",
                    width: "400px",
                    height: "400px",
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle, rgba(5,68,164,0.2) 0%, transparent 70%)",
                    animation: "pulse 5s ease-in-out infinite reverse",
                }}
            />

            <Card
                style={{
                    width: "min(420px, 92vw)",
                    borderRadius: 16,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                    border: "none",
                    background: "rgba(255,255,255,0.97)",
                    backdropFilter: "blur(20px)",
                }}
                bodyStyle={{ padding: "clamp(24px, 6vw, 40px) clamp(20px, 6vw, 36px)" }}
            >
                <Space
                    direction="vertical"
                    size={4}
                    style={{
                        width: "100%",
                        textAlign: "center",
                        marginBottom: 32,
                    }}
                >
                    <ThunderboltOutlined
                        style={{
                            fontSize: 40,
                            color: "#0544A4",
                            marginBottom: 8,
                        }}
                    />
                    <Title
                        level={2}
                        style={{
                            margin: 0,
                            fontFamily: "'Old Standard TT', serif",
                            color: "#0544A4",
                            fontWeight: 700,
                            letterSpacing: "-0.5px",
                        }}
                    >
                        IRON ADDICTS
                    </Title>
                    <Text
                        style={{
                            fontFamily: "'Gudea', sans-serif",
                            color: "#666",
                            fontSize: 14,
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                        }}
                    >
                        Gym Management
                    </Text>
                </Space>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                >
                    <Form.Item
                        name="phone"
                        rules={[
                            {
                                required: true,
                                message: "Enter your phone number",
                            },
                        ]}
                    >
                        <Input
                            prefix={
                                <UserOutlined style={{ color: "#0544A4" }} />
                            }
                            placeholder="Phone Number"
                            style={{ borderRadius: 8, height: 48 }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: "Enter your password" },
                        ]}
                    >
                        <Input.Password
                            prefix={
                                <LockOutlined style={{ color: "#0544A4" }} />
                            }
                            placeholder="Password"
                            style={{ borderRadius: 8, height: 48 }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            style={{
                                height: 48,
                                borderRadius: 8,
                                background: "#0544A4",
                                border: "none",
                                fontFamily: "'Gudea', sans-serif",
                                fontWeight: 700,
                                fontSize: 16,
                                letterSpacing: "1px",
                                boxShadow: "0 4px 15px rgba(5,68,164,0.4)",
                            }}
                        >
                            SIGN IN
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
        </div>
    );
};

export default LoginPage;
