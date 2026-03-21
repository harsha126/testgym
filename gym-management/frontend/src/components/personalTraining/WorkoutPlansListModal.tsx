import { Modal, List, Button, Tag, Space, Empty, Popconfirm, Tooltip, Typography } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { PersonalTraining, WorkoutPlan } from '../../types/personalTraining';
import { useWorkoutPlanStore } from '../../stores/workoutPlanStore';
import dayjs from 'dayjs';

const { Text } = Typography;

interface WorkoutPlansListModalProps {
  visible: boolean;
  ptUser: PersonalTraining | null;
  onClose: () => void;
  onCreatePlan: (ptUser: PersonalTraining) => void;
  onEditPlan: (plan: WorkoutPlan) => void;
  onDuplicatePlan: (plan: WorkoutPlan) => void;
}

const WorkoutPlansListModal: React.FC<WorkoutPlansListModalProps> = ({
  visible,
  ptUser,
  onClose,
  onCreatePlan,
  onEditPlan,
  onDuplicatePlan,
}) => {
  const [loading, setLoading] = useState(false);
  const {
    workoutPlans,
    fetchPlansByPTId,
    activatePlan,
    deactivatePlan,
    deletePlan,
  } = useWorkoutPlanStore();

  useEffect(() => {
    if (visible && ptUser) {
      loadPlans();
    }
  }, [visible, ptUser]);

  const loadPlans = async () => {
    if (!ptUser) return;
    setLoading(true);
    try {
      await fetchPlansByPTId(ptUser.id);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (planId: number) => {
    await activatePlan(planId);
    await loadPlans();
  };

  const handleDeactivate = async (planId: number) => {
    await deactivatePlan(planId);
    await loadPlans();
  };

  const handleDelete = async (planId: number) => {
    await deletePlan(planId);
    await loadPlans();
  };

  const renderPlanItem = (plan: WorkoutPlan) => {
    const daysCount = plan.planData.days?.length || 0;
    const totalExercises = plan.planData.days?.reduce(
      (sum, day) => sum + (day.exercises?.length || 0),
      0
    ) || 0;

    return (
      <List.Item
        key={plan.id}
        actions={[
          plan.isActive ? (
            <Tooltip title="Deactivate this plan">
              <Button
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleDeactivate(plan.id)}
              >
                Deactivate
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Activate this plan for the user">
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleActivate(plan.id)}
              >
                Activate
              </Button>
            </Tooltip>
          ),
          <Tooltip title="Edit this plan">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEditPlan(plan)}
            />
          </Tooltip>,
          <Tooltip title="Duplicate to another user">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => onDuplicatePlan(plan)}
            />
          </Tooltip>,
          <Popconfirm
            title="Delete this plan?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(plan.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete this plan">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>,
        ]}
      >
        <List.Item.Meta
          title={
            <Space>
              <Text strong style={{ fontSize: 15 }}>
                {plan.planName}
              </Text>
              {plan.isActive && (
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  Active
                </Tag>
              )}
            </Space>
          }
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <CalendarOutlined style={{ marginRight: 6 }} />
                <Text type="secondary">
                  {daysCount} workout day{daysCount !== 1 ? 's' : ''} • {totalExercises} total exercises
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Created: {dayjs(plan.createdAt).format('MMM DD, YYYY')} by {plan.createdByName}
                </Text>
              </div>
              {plan.planData.description && (
                <Text type="secondary" italic style={{ fontSize: 13 }}>
                  {plan.planData.description}
                </Text>
              )}
            </Space>
          }
        />
      </List.Item>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <span>Workout Plans for {ptUser?.userName}</span>
          {workoutPlans.length > 0 && (
            <Tag color="blue">{workoutPlans.length} plan{workoutPlans.length !== 1 ? 's' : ''}</Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => ptUser && onCreatePlan(ptUser)}
        >
          Create New Plan
        </Button>,
      ]}
    >
      {workoutPlans.length === 0 ? (
        <Empty
          description={
            <Space direction="vertical">
              <Text>No workout plans created yet</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Create a personalized workout plan to get started!
              </Text>
            </Space>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => ptUser && onCreatePlan(ptUser)}
          >
            Create First Plan
          </Button>
        </Empty>
      ) : (
        <List
          loading={loading}
          dataSource={workoutPlans}
          renderItem={renderPlanItem}
          style={{ maxHeight: '60vh', overflowY: 'auto' }}
        />
      )}
    </Modal>
  );
};

export default WorkoutPlansListModal;
