import { Modal, Form, InputNumber, Select, DatePicker, Input, message } from 'antd';
import { useEffect, useState } from 'react';
import { usePersonalTrainingStore } from '../../stores/personalTrainingStore';
import { EnrollPersonalTrainingRequest, PAYMENT_FREQUENCIES } from '../../types/personalTraining';
import dayjs from 'dayjs';

interface EnrollPTModalProps {
  visible: boolean;
  userId: number;
  userName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const EnrollPTModal: React.FC<EnrollPTModalProps> = ({
  visible,
  userId,
  userName,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [showCustomDays, setShowCustomDays] = useState(false);
  const enrollUser = usePersonalTrainingStore((state) => state.enrollUser);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldsValue({
        enrollmentDate: dayjs(),
        paymentFrequency: 'MONTHLY',
      });
      setShowCustomDays(false);
    }
  }, [visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const request: EnrollPersonalTrainingRequest = {
        userId,
        enrollmentDate: values.enrollmentDate?.format('YYYY-MM-DD'),
        extraPaymentAmount: values.extraPaymentAmount,
        paymentFrequency: values.paymentFrequency,
        customFrequencyDays: values.customFrequencyDays,
        notes: values.notes,
      };

      await enrollUser(request);
      message.success(`${userName} enrolled in Personal Training successfully!`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      console.error('Enroll PT error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentFrequencyChange = (value: string) => {
    setShowCustomDays(value === 'CUSTOM');
    if (value !== 'CUSTOM') {
      form.setFieldValue('customFrequencyDays', undefined);
    }
  };

  return (
    <Modal
      title={`Enroll ${userName} in Personal Training`}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Enroll"
      cancelText="Cancel"
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          enrollmentDate: dayjs(),
          paymentFrequency: 'MONTHLY',
        }}
      >
        <Form.Item
          name="enrollmentDate"
          label="Enrollment Date"
          rules={[{ required: true, message: 'Please select enrollment date' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          name="extraPaymentAmount"
          label="Extra Payment Amount (₹)"
          rules={[
            { required: true, message: 'Please enter payment amount' },
            { type: 'number', min: 1, message: 'Amount must be greater than 0' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="e.g., 2000"
            min={0}
            precision={2}
            prefix="₹"
          />
        </Form.Item>

        <Form.Item
          name="paymentFrequency"
          label="Payment Frequency"
          rules={[{ required: true, message: 'Please select payment frequency' }]}
        >
          <Select
            placeholder="Select frequency"
            onChange={handlePaymentFrequencyChange}
            options={PAYMENT_FREQUENCIES.map((pf) => ({
              value: pf.value,
              label: pf.label,
            }))}
          />
        </Form.Item>

        {showCustomDays && (
          <Form.Item
            name="customFrequencyDays"
            label="Custom Frequency (Days)"
            rules={[
              { required: true, message: 'Please enter custom frequency days' },
              { type: 'number', min: 1, message: 'Must be at least 1 day' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="e.g., 45"
              min={1}
              suffix="days"
            />
          </Form.Item>
        )}

        <Form.Item name="notes" label="Notes (Optional)">
          <Input.TextArea
            rows={3}
            placeholder="Add any additional notes about this enrollment..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f5ff', borderRadius: 6 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
            <strong>Note:</strong> This is an extra charge in addition to the regular gym subscription.
            The user will maintain their existing subscription plan.
          </p>
        </div>
      </Form>
    </Modal>
  );
};

export default EnrollPTModal;
