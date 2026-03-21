import { Modal, Result, Button } from 'antd';
import { RocketOutlined } from '@ant-design/icons';

interface DietPlanModalProps {
  visible: boolean;
  userName?: string;
  onClose: () => void;
}

const DietPlanModal: React.FC<DietPlanModalProps> = ({ visible, userName, onClose }) => {
  return (
    <Modal
      title={userName ? `Diet Plan for ${userName}` : 'Diet Plan'}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Got it
        </Button>,
      ]}
      width={600}
    >
      <Result
        icon={<RocketOutlined style={{ color: '#1890ff' }} />}
        title="Diet Plan Feature Coming Soon!"
        subTitle="We're working hard to bring you a comprehensive diet plan management system. This feature will allow you to create personalized nutrition plans, track macros, and manage meal schedules for your personal training clients."
        extra={
          <div style={{ textAlign: 'left', marginTop: 24, padding: 16, backgroundColor: '#f0f5ff', borderRadius: 8 }}>
            <h4 style={{ marginTop: 0 }}>Upcoming Features:</h4>
            <ul style={{ paddingLeft: 20, color: '#666' }}>
              <li>Customizable meal plans with macro tracking</li>
              <li>Daily calorie and nutrition goals</li>
              <li>Meal templates and recipe library</li>
              <li>Progress tracking and adjustments</li>
              <li>Integration with workout plans</li>
            </ul>
            <p style={{ marginBottom: 0, marginTop: 16, color: '#999', fontSize: 13 }}>
              Stay tuned for updates! In the meantime, focus on creating awesome workout plans for your clients.
            </p>
          </div>
        }
      />
    </Modal>
  );
};

export default DietPlanModal;
