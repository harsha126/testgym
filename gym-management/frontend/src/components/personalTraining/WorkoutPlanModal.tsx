import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Card,
  InputNumber,
  Divider,
  Checkbox,
  Collapse,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { PersonalTraining, WorkoutPlan, DAYS_OF_WEEK, Exercise, WorkoutDay } from '../../types/personalTraining';
import { useWorkoutPlanStore } from '../../stores/workoutPlanStore';

const { TextArea } = Input;
const { Text } = Typography;
const { Panel } = Collapse;

interface WorkoutPlanModalProps {
  visible: boolean;
  ptUser: PersonalTraining | null;
  editingPlan?: WorkoutPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const WorkoutPlanModal: React.FC<WorkoutPlanModalProps> = ({
  visible,
  ptUser,
  editingPlan,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const { createPlan, updatePlan } = useWorkoutPlanStore();

  const isEditMode = !!editingPlan;

  useEffect(() => {
    if (visible) {
      if (editingPlan) {
        // Editing existing plan
        form.setFieldsValue({
          planName: editingPlan.planName,
          description: editingPlan.planData.description,
          totalWeeks: editingPlan.planData.totalWeeks || 4,
          selectedDays: editingPlan.planData.selectedDays || [],
          generalNotes: editingPlan.planData.generalNotes,
          isActive: editingPlan.isActive,
        });
        setWorkoutDays(editingPlan.planData.days || []);
      } else {
        // Creating new plan
        form.resetFields();
        form.setFieldsValue({
          totalWeeks: 4,
          selectedDays: [],
          isActive: false,
        });
        setWorkoutDays([]);
      }
    }
  }, [visible, editingPlan, form]);

  const handleAddDay = () => {
    const selectedDays = form.getFieldValue('selectedDays') || [];
    if (selectedDays.length === 0) {
      message.warning('Please select at least one day of the week first');
      return;
    }

    const newDay: WorkoutDay = {
      dayNumber: workoutDays.length + 1,
      dayName: selectedDays[workoutDays.length] || `Day ${workoutDays.length + 1}`,
      focusArea: '',
      exercises: [],
    };
    setWorkoutDays([...workoutDays, newDay]);
  };

  const handleRemoveDay = (dayIndex: number) => {
    const updated = workoutDays.filter((_, idx) => idx !== dayIndex);
    // Renumber days
    const renumbered = updated.map((day, idx) => ({
      ...day,
      dayNumber: idx + 1,
    }));
    setWorkoutDays(renumbered);
  };

  const handleMoveDayUp = (dayIndex: number) => {
    if (dayIndex === 0) return;
    const updated = [...workoutDays];
    [updated[dayIndex - 1], updated[dayIndex]] = [updated[dayIndex], updated[dayIndex - 1]];
    // Renumber
    const renumbered = updated.map((day, idx) => ({ ...day, dayNumber: idx + 1 }));
    setWorkoutDays(renumbered);
  };

  const handleMoveDayDown = (dayIndex: number) => {
    if (dayIndex === workoutDays.length - 1) return;
    const updated = [...workoutDays];
    [updated[dayIndex], updated[dayIndex + 1]] = [updated[dayIndex + 1], updated[dayIndex]];
    // Renumber
    const renumbered = updated.map((day, idx) => ({ ...day, dayNumber: idx + 1 }));
    setWorkoutDays(renumbered);
  };

  const handleUpdateDay = (dayIndex: number, field: keyof WorkoutDay, value: any) => {
    const updated = [...workoutDays];
    updated[dayIndex] = { ...updated[dayIndex], [field]: value };
    setWorkoutDays(updated);
  };

  const handleAddExercise = (dayIndex: number) => {
    const updated = [...workoutDays];
    const newExercise: Exercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      sets: 3,
      reps: '10-12',
      weight: '',
      restTime: '60 seconds',
      notes: '',
      order: updated[dayIndex].exercises.length + 1,
    };
    updated[dayIndex].exercises.push(newExercise);
    setWorkoutDays(updated);
  };

  const handleRemoveExercise = (dayIndex: number, exerciseIndex: number) => {
    const updated = [...workoutDays];
    updated[dayIndex].exercises = updated[dayIndex].exercises.filter((_, idx) => idx !== exerciseIndex);
    // Reorder
    updated[dayIndex].exercises = updated[dayIndex].exercises.map((ex, idx) => ({ ...ex, order: idx + 1 }));
    setWorkoutDays(updated);
  };

  const handleUpdateExercise = (dayIndex: number, exerciseIndex: number, field: keyof Exercise, value: any) => {
    const updated = [...workoutDays];
    updated[dayIndex].exercises[exerciseIndex] = {
      ...updated[dayIndex].exercises[exerciseIndex],
      [field]: value,
    };
    setWorkoutDays(updated);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validate workout days
      if (workoutDays.length === 0) {
        message.error('Please add at least one workout day');
        return;
      }

      // Validate each day has exercises
      for (let i = 0; i < workoutDays.length; i++) {
        if (workoutDays[i].exercises.length === 0) {
          message.error(`Day ${i + 1} (${workoutDays[i].dayName}) has no exercises`);
          return;
        }
        // Validate each exercise has a name
        for (let j = 0; j < workoutDays[i].exercises.length; j++) {
          if (!workoutDays[i].exercises[j].name.trim()) {
            message.error(`Exercise ${j + 1} in Day ${i + 1} is missing a name`);
            return;
          }
        }
      }

      setSubmitting(true);

      const planData = {
        planName: values.planName,
        description: values.description,
        totalWeeks: values.totalWeeks,
        daysPerWeek: workoutDays.length,
        selectedDays: values.selectedDays,
        days: workoutDays,
        generalNotes: values.generalNotes,
        metadata: {
          difficulty: 'Intermediate',
          equipment: [],
          tags: [],
        },
      };

      const request = {
        personalTrainingId: ptUser!.id,
        planName: values.planName,
        planData,
        isActive: values.isActive || false,
      };

      if (isEditMode && editingPlan) {
        await updatePlan(editingPlan.id, request);
        message.success('Workout plan updated successfully!');
      } else {
        await createPlan(request);
        message.success('Workout plan created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      console.error('Submit workout plan error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectedDaysChange = (selectedDays: string[]) => {
    form.setFieldValue('selectedDays', selectedDays);

    // Update existing days' names if they match selected days
    const updated = workoutDays.map((day, idx) => ({
      ...day,
      dayName: selectedDays[idx] || day.dayName,
    }));
    setWorkoutDays(updated);
  };

  return (
    <Modal
      title={isEditMode ? `Edit Workout Plan: ${editingPlan?.planName}` : `Create Workout Plan for ${ptUser?.userName}`}
      open={visible}
      onCancel={onClose}
      width={1000}
      style={{ top: 20 }}
      confirmLoading={submitting}
      onOk={handleSubmit}
      okText={isEditMode ? 'Update Plan' : 'Create Plan'}
      cancelText="Cancel"
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
        <Form form={form} layout="vertical">
          {/* Basic Info */}
          <Card title="Basic Information" size="small" style={{ marginBottom: 16 }}>
            <Form.Item
              name="planName"
              label="Plan Name"
              rules={[{ required: true, message: 'Please enter plan name' }]}
            >
              <Input placeholder="e.g., Beginner Strength Training - Week 1" />
            </Form.Item>

            <Form.Item name="description" label="Description (Optional)">
              <TextArea rows={2} placeholder="Brief description of this workout plan..." />
            </Form.Item>

            <Space size="large">
              <Form.Item name="totalWeeks" label="Duration (Weeks)">
                <InputNumber min={1} max={52} />
              </Form.Item>

              <Form.Item name="isActive" valuePropName="checked">
                <Checkbox>Set as active plan (will deactivate other plans)</Checkbox>
              </Form.Item>
            </Space>
          </Card>

          {/* Day Selection */}
          <Card title="Training Schedule" size="small" style={{ marginBottom: 16 }}>
            <Form.Item
              name="selectedDays"
              label="Select Training Days"
              rules={[{ required: true, message: 'Please select at least one day' }]}
            >
              <Checkbox.Group
                options={DAYS_OF_WEEK.map((day) => ({ label: day, value: day }))}
                onChange={handleSelectedDaysChange}
              />
            </Form.Item>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddDay}
              block
              style={{ marginTop: 8 }}
            >
              Add Workout Day
            </Button>
          </Card>

          {/* Workout Days */}
          {workoutDays.length > 0 && (
            <Card title={`Workout Days (${workoutDays.length})`} size="small" style={{ marginBottom: 16 }}>
              <Collapse accordion>
                {workoutDays.map((day, dayIndex) => (
                  <Panel
                    header={
                      <Space>
                        <Text strong>
                          Day {day.dayNumber}: {day.dayName}
                        </Text>
                        {day.focusArea && <Text type="secondary">- {day.focusArea}</Text>}
                        <Text type="secondary">({day.exercises.length} exercises)</Text>
                      </Space>
                    }
                    key={dayIndex}
                    extra={
                      <Space onClick={(e) => e.stopPropagation()}>
                        {dayIndex > 0 && (
                          <Button
                            size="small"
                            icon={<ArrowUpOutlined />}
                            onClick={() => handleMoveDayUp(dayIndex)}
                          />
                        )}
                        {dayIndex < workoutDays.length - 1 && (
                          <Button
                            size="small"
                            icon={<ArrowDownOutlined />}
                            onClick={() => handleMoveDayDown(dayIndex)}
                          />
                        )}
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveDay(dayIndex)}
                        />
                      </Space>
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Input
                        placeholder="Focus Area (e.g., Chest & Triceps)"
                        value={day.focusArea}
                        onChange={(e) => handleUpdateDay(dayIndex, 'focusArea', e.target.value)}
                        addonBefore="Focus:"
                      />

                      <Divider plain>
                        Exercises
                      </Divider>

                      {day.exercises.map((exercise, exIndex) => (
                        <Card
                          key={exercise.id}
                          size="small"
                          title={`Exercise ${exIndex + 1}`}
                          extra={
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveExercise(dayIndex, exIndex)}
                            />
                          }
                          style={{ backgroundColor: '#fafafa' }}
                        >
                          <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <Input
                              placeholder="Exercise name (e.g., Bench Press)"
                              value={exercise.name}
                              onChange={(e) =>
                                handleUpdateExercise(dayIndex, exIndex, 'name', e.target.value)
                              }
                              required
                            />
                            <Space wrap>
                              <InputNumber
                                addonBefore="Sets"
                                min={1}
                                max={10}
                                value={exercise.sets}
                                onChange={(val) =>
                                  handleUpdateExercise(dayIndex, exIndex, 'sets', val || 3)
                                }
                              />
                              <Input
                                addonBefore="Reps"
                                placeholder="8-10"
                                value={exercise.reps}
                                onChange={(e) =>
                                  handleUpdateExercise(dayIndex, exIndex, 'reps', e.target.value)
                                }
                                style={{ width: 150 }}
                              />
                              <Input
                                addonBefore="Weight"
                                placeholder="60kg"
                                value={exercise.weight}
                                onChange={(e) =>
                                  handleUpdateExercise(dayIndex, exIndex, 'weight', e.target.value)
                                }
                                style={{ width: 150 }}
                              />
                              <Input
                                addonBefore="Rest"
                                placeholder="60 seconds"
                                value={exercise.restTime}
                                onChange={(e) =>
                                  handleUpdateExercise(dayIndex, exIndex, 'restTime', e.target.value)
                                }
                                style={{ width: 180 }}
                              />
                            </Space>
                            <TextArea
                              rows={2}
                              placeholder="Notes for this exercise (optional)"
                              value={exercise.notes}
                              onChange={(e) =>
                                handleUpdateExercise(dayIndex, exIndex, 'notes', e.target.value)
                              }
                            />
                          </Space>
                        </Card>
                      ))}

                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddExercise(dayIndex)}
                        block
                      >
                        Add Exercise
                      </Button>
                    </Space>
                  </Panel>
                ))}
              </Collapse>
            </Card>
          )}

          {/* General Notes */}
          <Card title="General Notes" size="small">
            <Form.Item name="generalNotes">
              <TextArea
                rows={3}
                placeholder="Add general notes, warm-up instructions, cool-down tips, etc."
              />
            </Form.Item>
          </Card>
        </Form>
      </div>
    </Modal>
  );
};

export default WorkoutPlanModal;
