import { Space, Typography, Divider } from 'antd';
import { FireOutlined } from '@ant-design/icons';
import { WorkoutDay, WorkoutPlanProgress } from '../../types/personalTraining';
import ExerciseItem from './ExerciseItem';

const { Title, Text, Paragraph } = Typography;

interface WorkoutDayCardProps {
  day: WorkoutDay;
  workoutPlanId: number;
  progress: WorkoutPlanProgress[];
  onExerciseComplete: () => void;
}

const WorkoutDayCard: React.FC<WorkoutDayCardProps> = ({
  day,
  workoutPlanId,
  progress,
  onExerciseComplete,
}) => {
  const isExerciseCompleted = (exerciseId: string) => {
    return progress.some(
      (p) => p.dayNumber === day.dayNumber && p.exerciseId === exerciseId
    );
  };

  const completedCount = day.exercises.filter((ex) => isExerciseCompleted(ex.id)).length;
  const totalCount = day.exercises.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div>
      {/* Day Header */}
      <div style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {day.focusArea && (
            <div>
              <FireOutlined style={{ marginRight: 8, color: '#ff7a45' }} />
              <Text strong style={{ fontSize: 16 }}>
                Focus: {day.focusArea}
              </Text>
            </div>
          )}
          <div>
            <Text type="secondary">
              {completedCount} of {totalCount} exercises completed ({progressPercentage}%)
            </Text>
          </div>
        </Space>
      </div>

      <Divider />

      {/* Exercises List */}
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {day.exercises.map((exercise, index) => (
          <ExerciseItem
            key={exercise.id}
            exercise={exercise}
            exerciseNumber={index + 1}
            workoutPlanId={workoutPlanId}
            dayNumber={day.dayNumber}
            isCompleted={isExerciseCompleted(exercise.id)}
            onComplete={onExerciseComplete}
          />
        ))}
      </Space>

      {day.exercises.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">No exercises added for this day yet</Text>
        </div>
      )}
    </div>
  );
};

export default WorkoutDayCard;
