import { Card, Space, Typography, Button, Tag, Descriptions, Modal, Form, Input, message } from 'antd';
import {
  CheckCircleOutlined,
  CheckCircleFilled,
  ThunderboltOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { Exercise } from '../../types/personalTraining';
import { useWorkoutPlanStore } from '../../stores/workoutPlanStore';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ExerciseItemProps {
  exercise: Exercise;
  exerciseNumber: number;
  workoutPlanId: number;
  dayNumber: number;
  isCompleted: boolean;
  onComplete: () => void;
}

const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  exerciseNumber,
  workoutPlanId,
  dayNumber,
  isCompleted,
  onComplete,
}) => {
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [form] = Form.useForm();
  const markExerciseComplete = useWorkoutPlanStore((state) => state.markExerciseComplete);

  const handleComplete = async () => {
    try {
      const values = await form.validateFields();
      await markExerciseComplete({
        workoutPlanId,
        dayNumber,
        exerciseId: exercise.id,
        notes: values.notes,
      });
      message.success(`${exercise.name} marked as complete!`);
      setShowCompleteModal(false);
      form.resetFields();
      onComplete();
    } catch (error) {
      console.error('Error marking exercise complete:', error);
    }
  };

  return (
    <>
      <Card
        size="small"
        style={{
          backgroundColor: isCompleted ? '#f6ffed' : '#ffffff',
          borderColor: isCompleted ? '#b7eb8f' : '#d9d9d9',
          borderWidth: 2,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Exercise Info */}
          <div style={{ flex: 1 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {/* Exercise Name */}
              <div>
                <Space>
                  <Tag color="blue">#{exerciseNumber}</Tag>
                  <Text strong style={{ fontSize: 16 }}>
                    {exercise.name}
                  </Text>
                  {isCompleted && (
                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
                  )}
                </Space>
              </div>

              {/* Exercise Details */}
              <Descriptions size="small" column={4} style={{ marginTop: 8 }}>
                <Descriptions.Item label="Sets">
                  <Text strong>{exercise.sets}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Reps">
                  <Text strong>{exercise.reps}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Weight">
                  <Text strong>{exercise.weight || 'Bodyweight'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Rest">
                  <Space>
                    <ClockCircleOutlined />
                    <Text>{exercise.restTime}</Text>
                  </Space>
                </Descriptions.Item>
              </Descriptions>

              {/* Exercise Notes */}
              {exercise.notes && (
                <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <ThunderboltOutlined style={{ marginRight: 6 }} />
                    {exercise.notes}
                  </Text>
                </div>
              )}
            </Space>
          </div>

          {/* Action Button */}
          <div style={{ marginLeft: 16 }}>
            {isCompleted ? (
              <Button
                type="default"
                icon={<CheckCircleFilled />}
                size="large"
                disabled
                style={{ borderColor: '#52c41a', color: '#52c41a' }}
              >
                Completed
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                size="large"
                onClick={() => setShowCompleteModal(true)}
              >
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Complete Modal */}
      <Modal
        title={`Mark "${exercise.name}" as Complete`}
        open={showCompleteModal}
        onCancel={() => {
          setShowCompleteModal(false);
          form.resetFields();
        }}
        onOk={handleComplete}
        okText="Mark Complete"
        cancelText="Cancel"
      >
        <div style={{ marginBottom: 16 }}>
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label="Sets">{exercise.sets}</Descriptions.Item>
            <Descriptions.Item label="Reps">{exercise.reps}</Descriptions.Item>
            <Descriptions.Item label="Weight" span={2}>
              {exercise.weight || 'Bodyweight'}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="notes"
            label="Add Notes (Optional)"
            extra="How did it feel? Any adjustments made?"
          >
            <TextArea
              rows={3}
              placeholder="e.g., Felt great! Increased weight by 2.5kg..."
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ExerciseItem;
