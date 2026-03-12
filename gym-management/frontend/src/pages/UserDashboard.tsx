import React, { useEffect } from "react";
import {
    Card,
    Typography,
    Tag,
    Progress,
    Table,
    Timeline,
    Layout,
    Row,
    Col,
    Empty,
} from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { useAuthStore } from "../stores/authStore";
import { useSubscriptionStore } from "../stores/subscriptionStore";
import AppHeader from "../components/AppHeader";
import dayjs from "dayjs";

const { Content } = Layout;
const { Text } = Typography;

const UserDashboard: React.FC = () => {
    const { userId } = useAuthStore();
    const {
        subscriptions,
        currentSubscription,
        payments,
        fetchSubscriptions,
        fetchCurrentSubscription,
        fetchPayments,
    } = useSubscriptionStore();

    useEffect(() => {
        if (userId) {
            fetchCurrentSubscription(userId);
            fetchSubscriptions(userId);
            fetchPayments(userId);
        }
    }, [userId]);

    const daysProgress = currentSubscription
        ? Math.min(
              100,
              Math.max(
                  0,
                  (currentSubscription.daysRemaining /
                      dayjs(currentSubscription.endDate).diff(
                          dayjs(currentSubscription.startDate),
                          "day",
                      )) *
                      100,
              ),
          )
        : 0;

    const paymentColumns = [
        {
            title: "Date",
            dataIndex: "paymentDate",
            key: "paymentDate",
            render: (d: string) => dayjs(d).format("DD MMM YYYY"),
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (a: number) => `₹${a.toLocaleString()}`,
        },
        { title: "Method", dataIndex: "paymentMethod", key: "paymentMethod" },
        { title: "Plan", dataIndex: "planName", key: "planName" },
        {
            title: "Notes",
            dataIndex: "notes",
            key: "notes",
            render: (n: string) => n || "-",
        },
    ];

    return (
        <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
            <AppHeader showLogout />

            <Content
                style={{
                    padding: "clamp(12px, 3vw, 24px)",
                    maxWidth: 900,
                    margin: "0 auto",
                    width: "100%",
                }}
            >
                {/* Current Plan Card */}
                <Card
                    title={
                        <span style={{ fontFamily: "'Gudea', sans-serif" }}>
                            <CalendarOutlined /> My Plan
                        </span>
                    }
                    style={{
                        borderRadius: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        marginBottom: 16,
                    }}
                >
                    {currentSubscription ? (
                        <Row gutter={24} align="middle">
                            <Col xs={24} sm={14}>
                                <div style={{ marginBottom: 8 }}>
                                    <Tag
                                        color="blue"
                                        style={{
                                            fontSize: 16,
                                            padding: "4px 12px",
                                        }}
                                    >
                                        {currentSubscription.planName}
                                    </Tag>
                                    <Tag
                                        color={
                                            currentSubscription.status ===
                                            "ACTIVE"
                                                ? "green"
                                                : "red"
                                        }
                                    >
                                        {currentSubscription.status}
                                    </Tag>
                                </div>
                                <Text
                                    type="secondary"
                                    style={{
                                        display: "block",
                                        marginBottom: 4,
                                    }}
                                >
                                    {dayjs(
                                        currentSubscription.startDate,
                                    ).format("DD MMM YYYY")}{" "}
                                    →{" "}
                                    {dayjs(currentSubscription.endDate).format(
                                        "DD MMM YYYY",
                                    )}
                                </Text>
                                <Text>
                                    <strong>
                                        {currentSubscription.daysRemaining}
                                    </strong>{" "}
                                    days remaining
                                </Text>
                            </Col>
                            <Col
                                xs={24}
                                sm={10}
                                style={{ textAlign: "center", paddingTop: 8 }}
                            >
                                <Progress
                                    type="circle"
                                    percent={Math.round(daysProgress)}
                                    format={() =>
                                        `${currentSubscription.daysRemaining}d`
                                    }
                                    strokeColor={
                                        currentSubscription.daysRemaining <= 3
                                            ? "#ff4d4f"
                                            : currentSubscription.daysRemaining <=
                                                7
                                              ? "#fa8c16"
                                              : "#52c41a"
                                    }
                                    size={100}
                                />
                            </Col>
                        </Row>
                    ) : (
                        <Empty description="No active subscription. Please contact the gym." />
                    )}
                </Card>

                {/* Subscription History */}
                <Card
                    title="Subscription History"
                    style={{
                        borderRadius: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        marginBottom: 16,
                    }}
                >
                    <Timeline
                        items={subscriptions.map((sub) => ({
                            color:
                                sub.status === "ACTIVE"
                                    ? "green"
                                    : sub.status === "EXPIRED"
                                      ? "red"
                                      : "gray",
                            children: (
                                <div>
                                    <Text strong>{sub.planName}</Text>{" "}
                                    <Tag
                                        color={
                                            sub.status === "ACTIVE"
                                                ? "green"
                                                : "red"
                                        }
                                        style={{ fontSize: 11 }}
                                    >
                                        {sub.status}
                                    </Tag>
                                    <br />
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 13 }}
                                    >
                                        {dayjs(sub.startDate).format(
                                            "DD MMM YYYY",
                                        )}{" "}
                                        →{" "}
                                        {dayjs(sub.endDate).format(
                                            "DD MMM YYYY",
                                        )}
                                    </Text>
                                </div>
                            ),
                        }))}
                    />
                    {subscriptions.length === 0 && (
                        <Text type="secondary">No subscription history</Text>
                    )}
                </Card>

                {/* Payment History */}
                <Card
                    title="Payment History"
                    style={{
                        borderRadius: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                >
                    <Table
                        columns={paymentColumns}
                        dataSource={payments}
                        rowKey="id"
                        scroll={{ x: 500 }}
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: "No payments recorded" }}
                    />
                </Card>
            </Content>
        </Layout>
    );
};

export default UserDashboard;
