import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Layout,
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Input,
    Typography,
    DatePicker,
    Space,
    message,
    Button,
} from "antd";
import {
    DollarCircleOutlined,
    RiseOutlined,
    ArrowLeftOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import AppHeader from "../components/AppHeader";
import { getPaymentHistory } from "../api/payments";
import { useDebounce } from "../hooks/useDebounce";
import type { Payment, PaymentHistoryResponse } from "../types";

const { Content } = Layout;
const { Text, Title } = Typography;

const PAGE_SIZE = 20;

const PaymentHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [searchText, setSearchText] = useState("");
    const debouncedSearch = useDebounce(searchText, 300);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PaymentHistoryResponse | null>(null);

    const fetchData = async (
        date: Dayjs,
        search: string,
        currentPage: number,
    ) => {
        setLoading(true);
        try {
            const response = await getPaymentHistory({
                year: date.year(),
                month: date.month() + 1,
                search: search || undefined,
                page: currentPage,
                size: PAGE_SIZE,
            });
            setData(response.data);
        } catch {
            message.error("Failed to load payment history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedDate, debouncedSearch, page);
    }, [selectedDate, debouncedSearch, page]);

    const handleDateChange = (value: Dayjs | null) => {
        if (value) {
            setSelectedDate(value);
            setPage(0);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
        setPage(0);
    };

    const columns: ColumnsType<Payment> = [
        {
            title: "Name",
            dataIndex: "userName",
            key: "userName",
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: "Phone",
            dataIndex: "userPhone",
            key: "userPhone",
            render: (text: string) =>
                text || <Text type="secondary">—</Text>,
        },
        {
            title: "Plan",
            dataIndex: "planName",
            key: "planName",
            render: (text: string) =>
                text || <Text type="secondary">—</Text>,
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (amount: number) => (
                <Text strong style={{ color: "#0544A4" }}>
                    ₹{Number(amount).toLocaleString("en-IN")}
                </Text>
            ),
        },
        {
            title: "Date",
            dataIndex: "paymentDate",
            key: "paymentDate",
            render: (date: string) => dayjs(date).format("DD MMM YYYY"),
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
                {/* Page Title + Back */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 24,
                    }}
                >
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate("/owner")}
                        style={{ flexShrink: 0 }}
                    >
                        Back
                    </Button>
                    <Title
                        level={4}
                        style={{
                            margin: 0,
                            fontFamily: "'Gudea', sans-serif",
                        }}
                    >
                        Payment History
                    </Title>
                </div>

                {/* Revenue Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12}>
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
                                        Monthly Revenue (
                                        {selectedDate.format("MMM YYYY")})
                                    </Text>
                                }
                                value={data?.monthlyTotal ?? 0}
                                precision={2}
                                prefix={
                                    <DollarCircleOutlined
                                        style={{ color: "#0544A4" }}
                                    />
                                }
                                suffix="₹"
                                valueStyle={{
                                    color: "#0544A4",
                                    fontWeight: 700,
                                }}
                                formatter={(val) =>
                                    `₹${Number(val).toLocaleString("en-IN")}`
                                }
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12}>
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
                                        Yearly Revenue ({selectedDate.year()})
                                    </Text>
                                }
                                value={data?.yearlyTotal ?? 0}
                                precision={2}
                                prefix={
                                    <RiseOutlined
                                        style={{ color: "#52c41a" }}
                                    />
                                }
                                valueStyle={{
                                    color: "#52c41a",
                                    fontWeight: 700,
                                }}
                                formatter={(val) =>
                                    `₹${Number(val).toLocaleString("en-IN")}`
                                }
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Payments Table */}
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
                                    fontFamily: "'Gudea', sans-serif",
                                }}
                            >
                                Payments
                            </Title>
                            <Space wrap>
                                <DatePicker
                                    picker="month"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    allowClear={false}
                                    style={{ minWidth: 140 }}
                                />
                                <Input
                                    placeholder="Search by name or phone..."
                                    value={searchText}
                                    onChange={handleSearchChange}
                                    allowClear
                                    style={{ width: "min(220px, 100%)" }}
                                />
                            </Space>
                        </div>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={data?.payments ?? []}
                        rowKey="id"
                        loading={loading}
                        scroll={{ x: 600 }}
                        pagination={{
                            total: data?.totalElements ?? 0,
                            current: page + 1,
                            pageSize: PAGE_SIZE,
                            showSizeChanger: false,
                            onChange: (p) => setPage(p - 1),
                            showTotal: (total) =>
                                `Total ${total} payments`,
                        }}
                        style={{ fontFamily: "'Gudea', sans-serif" }}
                    />
                </Card>
            </Content>
        </Layout>
    );
};

export default PaymentHistoryPage;
