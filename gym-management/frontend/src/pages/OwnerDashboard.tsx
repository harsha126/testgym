import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table,
    Input,
    Button,
    Space,
    Tag,
    Typography,
    Layout,
    Select,
    Upload,
    message,
    Modal,
    Card,
    Row,
    Col,
    Statistic,
    Tabs,
} from "antd";
import PersonalTrainingTab from "../components/personalTraining/PersonalTrainingTab";
import {
    SearchOutlined,
    UploadOutlined,
    DownloadOutlined,
    UserAddOutlined,
    TeamOutlined,
    CalendarOutlined,
    WarningOutlined,
    DollarCircleOutlined,
} from "@ant-design/icons";
import { useUserStore } from "../stores/userStore";
import { useDebounce } from "../hooks/useDebounce";
import { importExcel, exportExcel } from "../api/excel";
import { register } from "../api/auth";
import { getUserStats } from "../api/users";
import AppHeader from "../components/AppHeader";
import type { ColumnsType } from "antd/es/table";
import type { User } from "../types";
import dayjs from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;

const OwnerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const {
        users,
        totalElements,
        currentPage,
        loading,
        fetchUsers,
        fetchExpiringSoon,
        filterMode,
        searchUsers,
        searchResults,
        searchLoading,
    } = useUserStore();
    const [searchText, setSearchText] = useState("");
    const [registerModalVisible, setRegisterModalVisible] = useState(false);
    const [stats, setStats] = useState({
        totalMembers: 0,
        activePlans: 0,
        expiringSoon: 0,
    });
    const [registerForm, setRegisterForm] = useState({
        name: "",
        phone: "",
        password: "",
    });
    const debouncedSearch = useDebounce(searchText, 300);

    useEffect(() => {
        fetchUsers();
        getUserStats()
            .then((res) => setStats(res.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (debouncedSearch) {
            searchUsers(debouncedSearch);
        }
    }, [debouncedSearch]);

    const handleExport = async () => {
        try {
            const response = await exportExcel();
            if (response.status === 204) {
                message.info("No new data to export");
                return;
            }
            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `gym_members_${dayjs().format("YYYY-MM-DD")}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
            message.success("Export downloaded");
        } catch {
            message.error("Export failed");
        }
    };

    const handleImport = async (file: File) => {
        try {
            const response = await importExcel(file);
            const data = response.data;
            Modal.success({
                title: "Import Complete",
                content: (
                    <div>
                        <p>
                            Imported: <strong>{data.imported}</strong>
                        </p>
                        <p>
                            Skipped (duplicate): <strong>{data.skipped}</strong>
                        </p>
                        {data.errors?.length > 0 && (
                            <p>
                                Errors: <strong>{data.errors.length}</strong>
                            </p>
                        )}
                    </div>
                ),
            });
            fetchUsers();
        } catch {
            message.error("Import failed");
        }
        return false;
    };

    const handleRegister = async () => {
        try {
            await register(registerForm);
            message.success("User registered successfully");
            setRegisterModalVisible(false);
            setRegisterForm({ name: "", phone: "", password: "" });
            fetchUsers();
        } catch (err: any) {
            message.error(err.response?.data?.error || "Registration failed");
        }
    };

    // Dashboard stats — sourced from /api/users/stats (all members, not just current page)
    const { totalMembers, activePlans, expiringSoon } = stats;

    const columns: ColumnsType<User> = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
        },
        {
            title: "Current Plan",
            dataIndex: "currentPlan",
            key: "currentPlan",
            render: (text: string) =>
                text || <Text type="secondary">No Plan</Text>,
        },
        {
            title: "End Date",
            dataIndex: "endDate",
            key: "endDate",
            render: (text: string) =>
                text ? dayjs(text).format("DD MMM YYYY") : "-",
        },
        {
            title: "Days Left",
            dataIndex: "daysLeft",
            key: "daysLeft",
            render: (days: number | undefined) => {
                if (days === undefined || days === null) return <Tag>N/A</Tag>;
                let color = "green";
                if (days <= 0) color = "red";
                else if (days <= 3) color = "red";
                else if (days <= 7) color = "orange";
                return (
                    <Tag color={color} style={{ fontWeight: 600 }}>
                        {days <= 0 ? "Expired" : `${days} days`}
                    </Tag>
                );
            },
            sorter: (a, b) => (a.daysLeft ?? -1) - (b.daysLeft ?? -1),
        },
        {
            title: "Status",
            dataIndex: "subscriptionStatus",
            key: "subscriptionStatus",
            render: (status: string) => {
                const colorMap: Record<string, string> = {
                    ACTIVE: "green",
                    EXPIRED: "red",
                    CANCELLED: "default",
                };
                return status ? (
                    <Tag color={colorMap[status] || "default"}>{status}</Tag>
                ) : (
                    <Tag>NONE</Tag>
                );
            },
        },
    ];

    return (
        <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
            <AppHeader showLogout />

            <Content
                style={{
                    padding: "clamp(12px, 3vw, 24px)",
                    maxWidth: 1200,
                    margin: "0 auto",
                    width: "100%",
                }}
            >
                {/* Stats Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={8}>
                        <Card
                            onClick={() => fetchUsers(0)}
                            style={{
                                borderRadius: 12,
                                boxShadow:
                                    filterMode === "all"
                                        ? "0 0 0 2px #0544A4, 0 4px 16px rgba(5,68,164,0.15)"
                                        : "0 2px 8px rgba(0,0,0,0.06)",
                                cursor: "pointer",
                                transition: "box-shadow 0.2s",
                                border:
                                    filterMode === "all"
                                        ? "1.5px solid #0544A4"
                                        : undefined,
                            }}
                        >
                            <Statistic
                                title={
                                    <Text
                                        style={{
                                            fontFamily: "'Gudea', sans-serif",
                                        }}
                                    >
                                        Total Members
                                    </Text>
                                }
                                value={totalMembers}
                                prefix={
                                    <TeamOutlined
                                        style={{ color: "#0544A4" }}
                                    />
                                }
                                valueStyle={{
                                    color: "#0544A4",
                                    fontWeight: 700,
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card
                            style={{
                                borderRadius: 12,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            }}
                        >
                            <Statistic
                                title={
                                    <Text
                                        style={{
                                            fontFamily: "'Gudea', sans-serif",
                                        }}
                                    >
                                        Active Plans
                                    </Text>
                                }
                                value={activePlans}
                                prefix={
                                    <CalendarOutlined
                                        style={{ color: "#52c41a" }}
                                    />
                                }
                                valueStyle={{
                                    color: "#52c41a",
                                    fontWeight: 700,
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card
                            onClick={() => fetchExpiringSoon(0)}
                            style={{
                                borderRadius: 12,
                                boxShadow:
                                    filterMode === "expiringSoon"
                                        ? "0 0 0 2px #fa8c16, 0 4px 16px rgba(250,140,22,0.18)"
                                        : "0 2px 8px rgba(0,0,0,0.06)",
                                cursor: "pointer",
                                transition: "box-shadow 0.2s",
                                border:
                                    filterMode === "expiringSoon"
                                        ? "1.5px solid #fa8c16"
                                        : undefined,
                            }}
                        >
                            <Statistic
                                title={
                                    <Text
                                        style={{
                                            fontFamily: "'Gudea', sans-serif",
                                        }}
                                    >
                                        Expiring Soon
                                    </Text>
                                }
                                value={expiringSoon}
                                prefix={
                                    <WarningOutlined
                                        style={{ color: "#fa8c16" }}
                                    />
                                }
                                valueStyle={{
                                    color: "#fa8c16",
                                    fontWeight: 700,
                                }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Tabs
                    defaultActiveKey="members"
                    size="large"
                    style={{ fontFamily: "'Gudea', sans-serif" }}
                    items={[
                        {
                            key: "members",
                            label: "Members",
                            children: (
                                <Card
                                    style={{
                                        borderRadius: 12,
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    }}
                                    title={
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                flexWrap: "wrap",
                                                gap: 12,
                                                paddingTop: 8,
                                                paddingBottom: 8,
                                            }}
                                        >
                                            <Title
                                                level={4}
                                                style={{
                                                    margin: 0,
                                                    fontFamily:
                                                        "'Gudea', sans-serif",
                                                }}
                                            >
                                                Members
                                            </Title>
                                            <Space wrap>
                                                <Select
                                                    showSearch
                                                    placeholder="Search members..."
                                                    filterOption={false}
                                                    onSearch={(value) =>
                                                        setSearchText(value)
                                                    }
                                                    loading={searchLoading}
                                                    onSelect={(value: number) =>
                                                        navigate(
                                                            `/owner/users/${value}`,
                                                        )
                                                    }
                                                    style={{
                                                        width: "min(250px, 100%)",
                                                    }}
                                                    notFoundContent={
                                                        searchText
                                                            ? "No results"
                                                            : null
                                                    }
                                                    suffixIcon={
                                                        <SearchOutlined />
                                                    }
                                                    allowClear
                                                    onClear={() =>
                                                        setSearchText("")
                                                    }
                                                >
                                                    {searchResults.map((u) => (
                                                        <Select.Option
                                                            key={u.id}
                                                            value={u.id}
                                                        >
                                                            {u.name} ({u.phone})
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                                <Button
                                                    icon={<UserAddOutlined />}
                                                    type="primary"
                                                    style={{
                                                        background: "#0544A4",
                                                        borderColor: "#0544A4",
                                                    }}
                                                    onClick={() =>
                                                        setRegisterModalVisible(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    Add Member
                                                </Button>
                                                <Button
                                                    icon={
                                                        <DollarCircleOutlined />
                                                    }
                                                    onClick={() =>
                                                        navigate(
                                                            "/owner/payment-history",
                                                        )
                                                    }
                                                >
                                                    Payment History
                                                </Button>
                                                <Upload
                                                    accept=".xlsx"
                                                    showUploadList={false}
                                                    beforeUpload={handleImport}
                                                >
                                                    <Button
                                                        icon={
                                                            <UploadOutlined />
                                                        }
                                                    >
                                                        Import
                                                    </Button>
                                                </Upload>
                                                <Button
                                                    icon={<DownloadOutlined />}
                                                    onClick={handleExport}
                                                >
                                                    Export
                                                </Button>
                                            </Space>
                                        </div>
                                    }
                                >
                                    <Table
                                        columns={columns}
                                        dataSource={users}
                                        rowKey="id"
                                        loading={loading}
                                        scroll={{ x: 600 }}
                                        title={() => (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <Text
                                                    type="secondary"
                                                    style={{
                                                        fontFamily:
                                                            "'Gudea', sans-serif",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    Showing:
                                                </Text>
                                                {filterMode ===
                                                "expiringSoon" ? (
                                                    <Tag
                                                        color="orange"
                                                        icon={
                                                            <WarningOutlined />
                                                        }
                                                        style={{
                                                            fontFamily:
                                                                "'Gudea', sans-serif",
                                                        }}
                                                    >
                                                        Expiring Soon (within 3
                                                        days)
                                                    </Tag>
                                                ) : (
                                                    <Tag
                                                        color="blue"
                                                        icon={<TeamOutlined />}
                                                        style={{
                                                            fontFamily:
                                                                "'Gudea', sans-serif",
                                                        }}
                                                    >
                                                        All Members
                                                    </Tag>
                                                )}
                                            </div>
                                        )}
                                        pagination={{
                                            total: totalElements,
                                            current: currentPage + 1,
                                            pageSize: 20,
                                            showSizeChanger: false,
                                            onChange: (page) =>
                                                filterMode === "expiringSoon"
                                                    ? fetchExpiringSoon(
                                                          page - 1,
                                                      )
                                                    : fetchUsers(page - 1),
                                        }}
                                        onRow={(record) => ({
                                            onClick: () =>
                                                navigate(
                                                    `/owner/users/${record.id}`,
                                                ),
                                            style: { cursor: "pointer" },
                                        })}
                                        style={{
                                            fontFamily: "'Gudea', sans-serif",
                                        }}
                                    />
                                </Card>
                            ),
                        },
                        {
                            key: "personal-training",
                            label: "Personal Training",
                            children: <PersonalTrainingTab />,
                        },
                    ]}
                />
            </Content>

            {/* Register Modal */}
            <Modal
                title="Register New Member"
                open={registerModalVisible}
                onCancel={() => setRegisterModalVisible(false)}
                onOk={handleRegister}
                okText="Register"
            >
                <Space direction="vertical" style={{ width: "100%" }} size={12}>
                    <Input
                        placeholder="Name"
                        value={registerForm.name}
                        onChange={(e) =>
                            setRegisterForm({
                                ...registerForm,
                                name: e.target.value,
                            })
                        }
                    />
                    <Input
                        placeholder="Phone"
                        value={registerForm.phone}
                        onChange={(e) =>
                            setRegisterForm({
                                ...registerForm,
                                phone: e.target.value,
                            })
                        }
                    />
                    <Input.Password
                        placeholder="Password (optional, defaults to last 4 digits + 'gym')"
                        value={registerForm.password}
                        onChange={(e) =>
                            setRegisterForm({
                                ...registerForm,
                                password: e.target.value,
                            })
                        }
                    />
                </Space>
            </Modal>
        </Layout>
    );
};

export default OwnerDashboard;
