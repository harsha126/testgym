import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    Typography,
    Tag,
    Progress,
    Table,
    Timeline,
    Button,
    Space,
    Row,
    Col,
    Descriptions,
    Modal,
    Input,
    message,
    Layout,
} from "antd";
import {
    ArrowLeftOutlined,
    EditOutlined,
    PlusOutlined,
    UserOutlined,
    CalendarOutlined,
} from "@ant-design/icons";
import { useSubscriptionStore } from "../stores/subscriptionStore";
import { getUserById, updateUser } from "../api/users";
import SubscriptionModal from "../components/SubscriptionModal";
import NotificationBell from "../components/NotificationBell";
import { useAuthStore } from "../stores/authStore";
import type { User, Payment } from "../types";
import dayjs from "dayjs";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const UserDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { name: ownerName } = useAuthStore();
    const {
        subscriptions,
        currentSubscription,
        payments,
        fetchSubscriptions,
        fetchCurrentSubscription,
        fetchPayments,
    } = useSubscriptionStore();
    const [user, setUser] = useState<User | null>(null);
    const [subModalVisible, setSubModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        password: "",
    });

    const userId = Number(id);

    const loadData = () => {
        getUserById(userId).then((res) => setUser(res.data));
        fetchSubscriptions(userId);
        fetchCurrentSubscription(userId);
        fetchPayments(userId);
    };

    useEffect(() => {
        loadData();
    }, [userId]);

    const handleEditUser = async () => {
        try {
            const data: any = {};
            if (editForm.name) data.name = editForm.name;
            if (editForm.phone) data.phone = editForm.phone;
            if (editForm.password) data.password = editForm.password;
            await updateUser(userId, data);
            message.success("User updated");
            setEditModalVisible(false);
            loadData();
        } catch (err: any) {
            message.error(err.response?.data?.error || "Update failed");
        }
    };

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

    if (!user) return null;

    return (
        <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
            <Header
                style={{
                    background:
                        "linear-gradient(90deg, #0544A4 0%, #032d6e 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Space>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined style={{ color: "#fff" }} />}
                        onClick={() => navigate("/owner")}
                    />
                    <Title
                        level={4}
                        style={{
                            color: "#fff",
                            margin: 0,
                            fontFamily: "'Old Standard TT', serif",
                        }}
                    >
                        IRON ADDICTS
                    </Title>
                </Space>
                <NotificationBell />
            </Header>

            <Content
                style={{
                    padding: "clamp(12px, 3vw, 24px)",
                    maxWidth: 1200,
                    margin: "0 auto",
                    width: "100%",
                }}
            >
                <Row gutter={[16, 16]}>
                    {/* User Info */}
                    <Col xs={24} md={8}>
                        <Card
                            style={{
                                borderRadius: 12,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            }}
                        >
                            <div
                                style={{
                                    textAlign: "center",
                                    marginBottom: 16,
                                }}
                            >
                                <div
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: "50%",
                                        background:
                                            "linear-gradient(135deg, #0544A4, #032d6e)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 12px",
                                    }}
                                >
                                    <UserOutlined
                                        style={{ fontSize: 32, color: "#fff" }}
                                    />
                                </div>
                                <Title
                                    level={4}
                                    style={{
                                        margin: 0,
                                        fontFamily: "'Gudea', sans-serif",
                                    }}
                                >
                                    {user.name}
                                </Title>
                                <Text type="secondary">{user.phone}</Text>
                            </div>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Member Since">
                                    {dayjs(user.createdAt).format(
                                        "DD MMM YYYY",
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    <Tag
                                        color={user.isActive ? "green" : "red"}
                                    >
                                        {user.isActive ? "Active" : "Inactive"}
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>
                            <Button
                                block
                                icon={<EditOutlined />}
                                style={{ marginTop: 12 }}
                                onClick={() => {
                                    setEditForm({
                                        name: user.name,
                                        phone: user.phone,
                                        password: "",
                                    });
                                    setEditModalVisible(true);
                                }}
                            >
                                Edit User
                            </Button>
                        </Card>
                    </Col>

                    {/* Current Subscription */}
                    <Col xs={24} md={16}>
                        <Card
                            title={
                                <span
                                    style={{
                                        fontFamily: "'Gudea', sans-serif",
                                    }}
                                >
                                    Current Subscription
                                </span>
                            }
                            style={{
                                borderRadius: 12,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                marginBottom: 16,
                            }}
                            extra={
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setSubModalVisible(true)}
                                    style={{ background: "#0544A4" }}
                                >
                                    <span className="btn-text-hide-xs">New Subscription</span>
                                </Button>
                            }
                        >
                            {currentSubscription ? (
                                <Row gutter={16}>
                                    <Col xs={24} sm={12}>
                                        <Descriptions column={1} size="small">
                                            <Descriptions.Item label="Plan">
                                                <Tag color="blue">
                                                    {
                                                        currentSubscription.planName
                                                    }
                                                </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Start">
                                                {dayjs(
                                                    currentSubscription.startDate,
                                                ).format("DD MMM YYYY")}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="End">
                                                {dayjs(
                                                    currentSubscription.endDate,
                                                ).format("DD MMM YYYY")}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Status">
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
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <div
                                            style={{
                                                textAlign: "center",
                                                paddingTop: 8,
                                            }}
                                        >
                                            <Progress
                                                type="circle"
                                                percent={Math.round(
                                                    daysProgress,
                                                )}
                                                format={() =>
                                                    `${currentSubscription.daysRemaining}d`
                                                }
                                                strokeColor={
                                                    currentSubscription.daysRemaining <=
                                                    3
                                                        ? "#ff4d4f"
                                                        : currentSubscription.daysRemaining <=
                                                            7
                                                          ? "#fa8c16"
                                                          : "#52c41a"
                                                }
                                                size={100}
                                            />
                                            <div style={{ marginTop: 8 }}>
                                                <Text type="secondary">
                                                    Days Remaining
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            ) : (
                                <Text type="secondary">
                                    No active subscription
                                </Text>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* Subscription History */}
                <Card
                    title="Subscription History"
                    style={{
                        borderRadius: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        marginBottom: 16,
                        marginTop: 16,
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
                                    <Text strong>{sub.planName}</Text>
                                    <br />
                                    <Text type="secondary">
                                        {dayjs(sub.startDate).format(
                                            "DD MMM YYYY",
                                        )}{" "}
                                        →{" "}
                                        {dayjs(sub.endDate).format(
                                            "DD MMM YYYY",
                                        )}
                                    </Text>
                                    <br />
                                    <Tag
                                        color={
                                            sub.status === "ACTIVE"
                                                ? "green"
                                                : "red"
                                        }
                                    >
                                        {sub.status}
                                    </Tag>
                                    {sub.notes && (
                                        <Text
                                            style={{
                                                marginLeft: 8,
                                                fontSize: 12,
                                            }}
                                        >
                                            {sub.notes}
                                        </Text>
                                    )}
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

            {/* Subscription Modal */}
            <SubscriptionModal
                userId={userId}
                visible={subModalVisible}
                onClose={() => setSubModalVisible(false)}
                onSuccess={loadData}
                defaultStartDate={
                    currentSubscription?.endDate
                        ? dayjs(currentSubscription.endDate)
                              .add(1, "day")
                              .format("YYYY-MM-DD")
                        : undefined
                }
            />

            {/* Edit User Modal */}
            <Modal
                title="Edit User"
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                onOk={handleEditUser}
            >
                <Space direction="vertical" style={{ width: "100%" }} size={12}>
                    <Input
                        value={editForm.name}
                        onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                        }
                        placeholder="Name"
                    />
                    <Input
                        value={editForm.phone}
                        onChange={(e) =>
                            setEditForm({ ...editForm, phone: e.target.value })
                        }
                        placeholder="Phone"
                    />
                    <Input.Password
                        value={editForm.password}
                        onChange={(e) =>
                            setEditForm({
                                ...editForm,
                                password: e.target.value,
                            })
                        }
                        placeholder="New Password"
                    />
                </Space>
            </Modal>
        </Layout>
    );
};

export default UserDetailPage;
