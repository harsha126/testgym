import React, { useEffect, useState } from "react";
import {
    Modal,
    Form,
    Select,
    DatePicker,
    InputNumber,
    Input,
    message,
} from "antd";
import { useSubscriptionStore } from "../stores/subscriptionStore";
import { createSubscription } from "../api/subscriptions";
import dayjs from "dayjs";

interface Props {
    userId: number;
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultStartDate?: string;
}

const SubscriptionModal: React.FC<Props> = ({
    userId,
    visible,
    onClose,
    onSuccess,
    defaultStartDate,
}) => {
    const [form] = Form.useForm();
    const { plans, fetchPlans } = useSubscriptionStore();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchPlans();
            form.resetFields();
            if (defaultStartDate) {
                form.setFieldsValue({ startDate: dayjs(defaultStartDate) });
            } else {
                form.setFieldsValue({ startDate: dayjs() });
            }
        }
    }, [visible]);

    const handlePlanChange = (planId: number) => {
        setSelectedPlan(planId);
        const plan = plans.find((p) => p.planId === planId);
        setIsCustom(plan?.planName === "Custom");

        if (plan && plan.planName !== "Custom") {
            const startDate = form.getFieldValue("startDate");
            if (startDate) {
                const durationMap: Record<string, number> = {
                    Monthly: 30,
                    Quarterly: 90,
                    "Half-Yearly": 180,
                    Yearly: 365,
                };
                const days = durationMap[plan.planName] || 30;
                form.setFieldsValue({ endDate: startDate.add(days, "day") });
            }
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            await createSubscription(userId, {
                planId: values.planId,
                startDate: values.startDate.format("YYYY-MM-DD"),
                endDate: values.endDate
                    ? values.endDate.format("YYYY-MM-DD")
                    : undefined,
                customDurationDays: values.customDurationDays,
                notes: values.notes,
                amount: values.amount,
                paymentMethod: values.paymentMethod,
                paymentNotes: values.paymentNotes,
            });

            message.success("Subscription created successfully");
            onSuccess();
            onClose();
        } catch (err: any) {
            message.error(
                err.response?.data?.error || "Failed to create subscription",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="New Subscription"
            open={visible}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            width="min(520px, 96vw)"
            okText="Create Subscription"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="planId"
                    label="Plan Type"
                    rules={[{ required: true, message: "Select a plan" }]}
                >
                    <Select
                        placeholder="Select plan"
                        onChange={handlePlanChange}
                    >
                        {plans.map((p) => (
                            <Select.Option key={p.planId} value={p.planId}>
                                {p.planName}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="startDate"
                    label="Start Date"
                    rules={[{ required: true }]}
                >
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item name="endDate" label="End Date">
                    <DatePicker
                        style={{ width: "100%" }}
                        disabled={!isCustom}
                    />
                </Form.Item>

                {isCustom && (
                    <Form.Item
                        name="customDurationDays"
                        label="Or Duration (days)"
                    >
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                )}

                <Form.Item name="amount" label="Amount Paid">
                    <InputNumber min={0} prefix="₹" style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item name="paymentMethod" label="Payment Method">
                    <Select placeholder="Select method">
                        <Select.Option value="CASH">Cash</Select.Option>
                        <Select.Option value="UPI">UPI</Select.Option>
                        <Select.Option value="CARD">Card</Select.Option>
                        <Select.Option value="BANK_TRANSFER">
                            Bank Transfer
                        </Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item name="notes" label="Notes">
                    <Input.TextArea rows={2} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default SubscriptionModal;
