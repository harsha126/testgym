import { Card, Tag, Button, Space, Typography, Popconfirm, Tooltip } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EditOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { PersonalTraining } from '../../types/personalTraining';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

interface PTUserCardProps {
  ptUser: PersonalTraining;
  onViewPlans: (ptUser: PersonalTraining) => void;
  onRemove: (userId: number) => void;
  onEditPayment: (ptUser: PersonalTraining) => void;
}

const PTUserCard: React.FC<PTUserCardProps> = ({
  ptUser,
  onViewPlans,
  onRemove,
  onEditPayment,
}) => {
  const getPaymentFrequencyLabel = (frequency: string, customDays?: number) => {
    if (frequency === 'CUSTOM' && customDays) {
      return `Every ${customDays} days`;
    }
    const labels: Record<string, string> = {
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      HALF_YEARLY: 'Half-Yearly',
      YEARLY: 'Yearly',
    };
    return labels[frequency] || frequency;
  };

  const enrollmentDuration = dayjs().diff(dayjs(ptUser.enrollmentDate), 'day');

  return (
    <Card
      hoverable
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: 16 }}
      extra={
        <Space>
          {ptUser.activeWorkoutPlansCount > 0 && (
            <Tag color="green" icon={<TrophyOutlined />}>
              {ptUser.activeWorkoutPlansCount} Active Plan{ptUser.activeWorkoutPlansCount > 1 ? 's' : ''}
            </Tag>
          )}
          {!ptUser.isActive && <Tag color="red">Inactive</Tag>}
        </Space>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* User Info Section */}
        <div style={{ flex: 1 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              <Text strong style={{ fontSize: 16 }}>
                {ptUser.userName}
              </Text>
            </div>

            <div>
              <PhoneOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              <Text type="secondary">{ptUser.userPhone}</Text>
            </div>

            <div>
              <CalendarOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
              <Text type="secondary">
                Enrolled: {dayjs(ptUser.enrollmentDate).format('MMM DD, YYYY')}
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({enrollmentDuration} days ago)
                </Text>
              </Text>
            </div>

            <div>
              <DollarOutlined style={{ marginRight: 8, color: '#722ed1' }} />
              <Text strong style={{ color: '#722ed1' }}>
                ₹{ptUser.extraPaymentAmount.toLocaleString()}
              </Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                / {getPaymentFrequencyLabel(ptUser.paymentFrequency, ptUser.customFrequencyDays)}
              </Text>
            </div>

            {ptUser.notes && (
              <div>
                <FileTextOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true }}
                  style={{ margin: 0, display: 'inline' }}
                  type="secondary"
                >
                  {ptUser.notes}
                </Paragraph>
              </div>
            )}
          </Space>
        </div>

        {/* Action Buttons */}
        <div style={{ marginLeft: 16 }}>
          <Space direction="vertical">
            <Button
              type="primary"
              icon={<TrophyOutlined />}
              onClick={() => onViewPlans(ptUser)}
              block
            >
              Manage Plans
            </Button>

            <Tooltip title="Edit payment details">
              <Button
                icon={<EditOutlined />}
                onClick={() => onEditPayment(ptUser)}
                block
              >
                Edit Payment
              </Button>
            </Tooltip>

            <Popconfirm
              title="Remove from Personal Training?"
              description={`Are you sure you want to remove ${ptUser.userName} from personal training?`}
              onConfirm={() => onRemove(ptUser.userId)}
              okText="Yes, Remove"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />} block>
                Remove
              </Button>
            </Popconfirm>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default PTUserCard;
