import { useEffect, useState } from 'react';
import { Card, Empty, Spin, Typography, Tabs, Space, Tag, Alert } from 'antd';
import { TrophyOutlined, CalendarOutlined, FireOutlined } from '@ant-design/icons';
import { useWorkoutPlanStore } from '../../stores/workoutPlanStore';
import { useAuthStore } from '../../stores/authStore';
import WorkoutDayCard from './WorkoutDayCard';

const { Title, Text, Paragraph } = Typography;

const MyWorkoutPlan: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { activeWorkoutPlan, progress, fetchActivePlanByUserId, fetchProgress } = useWorkoutPlanStore();
  const userId = useAuthStore((state) => state.userId);

  useEffect(() => {
    if (userId) {
      loadWorkoutPlan();
    }
  }, [userId]);

  const loadWorkoutPlan = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await fetchActivePlanByUserId(userId);
      if (activeWorkoutPlan) {
        await fetchProgress(activeWorkoutPlan.id);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading workout plan:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" tip="Loading your workout plan..." />
        </div>
      </Card>
    );
  }

  if (!activeWorkoutPlan) {
    return (
      <Card>
        <Empty
          description={
            <Space direction="vertical">
              <Text>No active workout plan</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Your trainer will assign a personalized workout plan soon!
              </Text>
            </Space>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const { planData } = activeWorkoutPlan;
  const totalExercises = planData.days?.reduce(
    (sum, day) => sum + (day.exercises?.length || 0),
    0
  ) || 0;

  const completedExercises = progress.length;
  const progressPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  return (
    <div>
      {/* Header Card */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Space>
              <TrophyOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Title level={3} style={{ margin: 0 }}>
                {planData.planName}
              </Title>
            </Space>
            {planData.description && (
              <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                {planData.description}
              </Paragraph>
            )}
          </div>

          <Space size="large" wrap>
            <div>
              <Text type="secondary">Duration</Text>
              <div>
                <Text strong>{planData.totalWeeks} Weeks</Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Training Days</Text>
              <div>
                <Text strong>{planData.daysPerWeek} Days/Week</Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Total Exercises</Text>
              <div>
                <Text strong>{totalExercises}</Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Progress</Text>
              <div>
                <Text strong style={{ color: progressPercentage > 50 ? '#52c41a' : '#1890ff' }}>
                  {completedExercises}/{totalExercises} ({progressPercentage}%)
                </Text>
              </div>
            </div>
          </Space>

          {planData.selectedDays && planData.selectedDays.length > 0 && (
            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                <CalendarOutlined /> Training Schedule:
              </Text>
              <Space wrap>
                {planData.selectedDays.map((day) => (
                  <Tag key={day} color="blue">
                    {day}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          {planData.generalNotes && (
            <Alert
              message="Important Notes"
              description={planData.generalNotes}
              type="info"
              showIcon
              icon={<FireOutlined />}
            />
          )}
        </Space>
      </Card>

      {/* Workout Days Tabs */}
      <Card>
        <Tabs
          defaultActiveKey="0"
          items={planData.days?.map((day, index) => ({
            key: index.toString(),
            label: (
              <Space>
                <span>{day.dayName}</span>
                {day.focusArea && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({day.focusArea})
                  </Text>
                )}
              </Space>
            ),
            children: (
              <WorkoutDayCard
                day={day}
                workoutPlanId={activeWorkoutPlan.id}
                progress={progress}
                onExerciseComplete={loadWorkoutPlan}
              />
            ),
          }))}
        />
      </Card>
    </div>
  );
};

export default MyWorkoutPlan;
