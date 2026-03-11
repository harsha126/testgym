import React, { useEffect } from "react";
import { Badge, Popover, List, Button, Empty, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNotificationStore } from "../stores/notificationStore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text } = Typography;

const NotificationBell: React.FC = () => {
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        fetchUnreadCount,
        markNotificationAsRead,
    } = useNotificationStore();

    useEffect(() => {
        fetchUnreadCount();
        fetchNotifications();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const content = (
        <div style={{ width: 320, maxHeight: 400, overflow: "auto" }}>
            {notifications.length === 0 ? (
                <Empty
                    description="No notifications"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            ) : (
                <List
                    dataSource={notifications}
                    renderItem={(item) => (
                        <List.Item
                            style={{
                                background: item.isRead
                                    ? "transparent"
                                    : "rgba(5, 68, 164, 0.05)",
                                padding: "8px 12px",
                                cursor: "pointer",
                                borderRadius: 6,
                            }}
                            onClick={() =>
                                !item.isRead && markNotificationAsRead(item.id)
                            }
                        >
                            <List.Item.Meta
                                title={
                                    <Text
                                        strong={!item.isRead}
                                        style={{ fontSize: 13 }}
                                    >
                                        {item.title}
                                    </Text>
                                }
                                description={
                                    <div>
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: "#999",
                                            }}
                                        >
                                            {item.message}
                                        </Text>
                                        <br />
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                color: "#bbb",
                                            }}
                                        >
                                            {dayjs(item.createdAt).fromNow()}
                                        </Text>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </div>
    );

    return (
        <Popover
            content={content}
            title="Notifications"
            trigger="click"
            placement="bottomRight"
        >
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <Button
                    type="text"
                    icon={
                        <BellOutlined style={{ fontSize: 20, color: "#fff" }} />
                    }
                    style={{ display: "flex", alignItems: "center" }}
                />
            </Badge>
        </Popover>
    );
};

export default NotificationBell;
