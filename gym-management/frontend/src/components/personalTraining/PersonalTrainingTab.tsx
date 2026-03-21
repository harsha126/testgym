import { useEffect, useState } from 'react';
import { Button, Space, Typography, Spin, Empty, Input, Select, Modal, Form, InputNumber } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UserAddOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { usePersonalTrainingStore } from '../../stores/personalTrainingStore';
import { useUserStore } from '../../stores/userStore';
import { PersonalTraining, WorkoutPlan, PAYMENT_FREQUENCIES } from '../../types/personalTraining';
import PTUserCard from './PTUserCard';
import EnrollPTModal from './EnrollPTModal';
import WorkoutPlansListModal from './WorkoutPlansListModal';
import WorkoutPlanModal from './WorkoutPlanModal';
import DietPlanModal from './DietPlanModal';

const { Title, Text } = Typography;

const PersonalTrainingTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showWorkoutPlansModal, setShowWorkoutPlansModal] = useState(false);
  const [showWorkoutPlanModal, setShowWorkoutPlanModal] = useState(false);
  const [showDietPlanModal, setShowDietPlanModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [selectedPTUser, setSelectedPTUser] = useState<PersonalTraining | null>(null);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [editPaymentForm] = Form.useForm();

  const { ptUsers, loading, fetchAllActiveUsers, removeUser, updatePayment } = usePersonalTrainingStore();
  const { searchResults, searchLoading, searchUsers } = useUserStore();

  useEffect(() => {
    fetchAllActiveUsers();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      searchUsers(value);
    }
  };

  const handleSelectUser = (userId: number) => {
    const user = searchResults.find((u) => u.id === userId);
    if (user) {
      setShowEnrollModal(true);
      setSearchTerm('');
    }
  };

  const handleEnrollSuccess = () => {
    fetchAllActiveUsers();
  };

  const handleViewPlans = (ptUser: PersonalTraining) => {
    setSelectedPTUser(ptUser);
    setShowWorkoutPlansModal(true);
  };

  const handleCreatePlan = (ptUser: PersonalTraining) => {
    setSelectedPTUser(ptUser);
    setEditingPlan(null);
    setShowWorkoutPlansModal(false);
    setShowWorkoutPlanModal(true);
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    setEditingPlan(plan);
    setShowWorkoutPlansModal(false);
    setShowWorkoutPlanModal(true);
  };

  const handleWorkoutPlanSuccess = () => {
    setShowWorkoutPlansModal(true);
    fetchAllActiveUsers();
  };

  const handleDuplicatePlan = (plan: WorkoutPlan) => {
    // For now, just show a message - full implementation would show a user selector
    Modal.info({
      title: 'Duplicate Plan',
      content: 'Duplication feature will allow you to copy this plan to another PT user. Coming in the next update!',
    });
  };

  const handleEditPayment = (ptUser: PersonalTraining) => {
    setSelectedPTUser(ptUser);
    editPaymentForm.setFieldsValue({
      extraPaymentAmount: ptUser.extraPaymentAmount,
      paymentFrequency: ptUser.paymentFrequency,
      customFrequencyDays: ptUser.customFrequencyDays,
    });
    setShowEditPaymentModal(true);
  };

  const handleUpdatePayment = async () => {
    try {
      const values = await editPaymentForm.validateFields();
      if (selectedPTUser) {
        await updatePayment(
          selectedPTUser.id,
          values.extraPaymentAmount,
          values.paymentFrequency,
          values.customFrequencyDays
        );
        setShowEditPaymentModal(false);
      }
    } catch (error) {
      console.error('Update payment error:', error);
    }
  };

  const handleRemove = async (userId: number) => {
    await removeUser(userId);
  };

  const filteredUsers = ptUsers.filter((ptUser) =>
    ptUser.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ptUser.userPhone.includes(searchTerm)
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space direction="vertical" size="small">
          <Title level={3} style={{ margin: 0 }}>
            <TeamOutlined /> Personal Training
          </Title>
          <Text type="secondary">
            Manage personal training clients and create customized workout plans
          </Text>
        </Space>
      </div>

      {/* Search and Actions */}
      <Space style={{ marginBottom: 16, width: '100%' }} size="middle">
        <Select
          showSearch
          placeholder="Search users to enroll..."
          style={{ width: 300 }}
          loading={searchLoading}
          onSearch={handleSearch}
          onSelect={handleSelectUser}
          filterOption={false}
          notFoundContent={searchLoading ? <Spin size="small" /> : null}
          suffixIcon={<SearchOutlined />}
          options={searchResults
            .filter((user) => !user.isPersonalTraining) // Filter out already enrolled users
            .map((user) => ({
              value: user.id,
              label: `${user.name} - ${user.phone}`,
            }))}
        />
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => {
            if (searchResults.length > 0) {
              handleSelectUser(searchResults[0].id);
            }
          }}
          disabled={searchResults.length === 0}
        >
          Enroll Selected User
        </Button>
      </Space>

      {/* Stats */}
      <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f0f5ff', borderRadius: 8 }}>
        <Space size="large">
          <div>
            <Text type="secondary">Total PT Users</Text>
            <Title level={4} style={{ margin: 0 }}>
              {ptUsers.length}
            </Title>
          </div>
          <div>
            <Text type="secondary">Active Plans</Text>
            <Title level={4} style={{ margin: 0 }}>
              {ptUsers.reduce((sum, pt) => sum + pt.activeWorkoutPlansCount, 0)}
            </Title>
          </div>
          <div>
            <Text type="secondary">Total Revenue (Monthly Est.)</Text>
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
              ₹{ptUsers.reduce((sum, pt) => sum + Number(pt.extraPaymentAmount), 0).toLocaleString()}
            </Title>
          </div>
        </Space>
      </div>

      {/* PT Users List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" tip="Loading personal training users..." />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Empty
          description={
            ptUsers.length === 0
              ? 'No personal training users yet'
              : 'No users match your search'
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {ptUsers.length === 0 && (
            <Text type="secondary">
              Search for a user above and enroll them in personal training to get started!
            </Text>
          )}
        </Empty>
      ) : (
        <div>
          {filteredUsers.map((ptUser) => (
            <PTUserCard
              key={ptUser.id}
              ptUser={ptUser}
              onViewPlans={handleViewPlans}
              onRemove={handleRemove}
              onEditPayment={handleEditPayment}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {searchResults.length > 0 && searchResults[0] && (
        <EnrollPTModal
          visible={showEnrollModal}
          userId={searchResults[0].id}
          userName={searchResults[0].name}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={handleEnrollSuccess}
        />
      )}

      <WorkoutPlansListModal
        visible={showWorkoutPlansModal}
        ptUser={selectedPTUser}
        onClose={() => setShowWorkoutPlansModal(false)}
        onCreatePlan={handleCreatePlan}
        onEditPlan={handleEditPlan}
        onDuplicatePlan={handleDuplicatePlan}
      />

      <WorkoutPlanModal
        visible={showWorkoutPlanModal}
        ptUser={selectedPTUser}
        editingPlan={editingPlan}
        onClose={() => {
          setShowWorkoutPlanModal(false);
          setShowWorkoutPlansModal(true);
        }}
        onSuccess={handleWorkoutPlanSuccess}
      />

      <DietPlanModal
        visible={showDietPlanModal}
        userName={selectedPTUser?.userName}
        onClose={() => setShowDietPlanModal(false)}
      />

      {/* Edit Payment Modal */}
      <Modal
        title={`Edit Payment for ${selectedPTUser?.userName}`}
        open={showEditPaymentModal}
        onCancel={() => setShowEditPaymentModal(false)}
        onOk={handleUpdatePayment}
        okText="Update"
      >
        <Form form={editPaymentForm} layout="vertical">
          <Form.Item
            name="extraPaymentAmount"
            label="Payment Amount (₹)"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} prefix="₹" />
          </Form.Item>

          <Form.Item
            name="paymentFrequency"
            label="Payment Frequency"
            rules={[{ required: true }]}
          >
            <Select options={PAYMENT_FREQUENCIES.map((pf) => ({ value: pf.value, label: pf.label }))} />
          </Form.Item>

          {editPaymentForm.getFieldValue('paymentFrequency') === 'CUSTOM' && (
            <Form.Item
              name="customFrequencyDays"
              label="Custom Days"
              rules={[{ required: true, message: 'Please enter days' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} suffix="days" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default PersonalTrainingTab;
