-- Add personal training support to the gym management system
-- This migration adds tables for personal training enrollment, workout plans, and progress tracking

-- 1. Add personal training flag to users table
ALTER TABLE users ADD COLUMN is_personal_training BOOLEAN DEFAULT FALSE;

-- Add index for quick PT user lookup
CREATE INDEX idx_users_is_personal_training ON users(is_personal_training) WHERE is_personal_training = true;

-- 2. Create personal_training table
-- Stores personal training enrollment details with payment information
CREATE TABLE personal_training (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    extra_payment_amount DECIMAL(10,2) NOT NULL,
    payment_frequency VARCHAR(50) NOT NULL, -- MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY, CUSTOM
    custom_frequency_days INT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_payment_frequency CHECK (payment_frequency IN ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'CUSTOM')),
    CONSTRAINT chk_custom_frequency CHECK (
        (payment_frequency != 'CUSTOM') OR (payment_frequency = 'CUSTOM' AND custom_frequency_days IS NOT NULL)
    )
);

CREATE INDEX idx_pt_user_id ON personal_training(user_id);
CREATE INDEX idx_pt_is_active ON personal_training(is_active);

-- 3. Create workout_plans table
-- Stores personalized workout plans for PT users with JSON structure
CREATE TABLE workout_plans (
    id BIGSERIAL PRIMARY KEY,
    personal_training_id BIGINT NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    plan_data JSONB NOT NULL, -- Stores complete workout plan structure
    is_active BOOLEAN DEFAULT FALSE,
    created_by BIGINT NOT NULL, -- Owner who created the plan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wp_personal_training FOREIGN KEY (personal_training_id) REFERENCES personal_training(id) ON DELETE CASCADE,
    CONSTRAINT fk_wp_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_wp_pt_id ON workout_plans(personal_training_id);
CREATE INDEX idx_wp_is_active ON workout_plans(is_active);
CREATE INDEX idx_wp_user_active ON workout_plans(personal_training_id, is_active);
CREATE INDEX idx_wp_plan_data ON workout_plans USING GIN(plan_data); -- For JSON queries

-- 4. Create workout_plan_progress table
-- Tracks user progress on individual exercises
CREATE TABLE workout_plan_progress (
    id BIGSERIAL PRIMARY KEY,
    workout_plan_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    day_number INT NOT NULL,
    exercise_id VARCHAR(100) NOT NULL, -- References exercise ID in JSON
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT fk_wpp_workout_plan FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_wpp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_wpp_workout_plan_id ON workout_plan_progress(workout_plan_id);
CREATE INDEX idx_wpp_user_id ON workout_plan_progress(user_id);
CREATE INDEX idx_wpp_completed_at ON workout_plan_progress(completed_at);
CREATE INDEX idx_wpp_composite ON workout_plan_progress(workout_plan_id, user_id, day_number);

-- Comments for documentation
COMMENT ON TABLE personal_training IS 'Stores personal training enrollment details for users with extra payment information';
COMMENT ON TABLE workout_plans IS 'Personalized workout plans with detailed exercise schedules stored as JSON';
COMMENT ON TABLE workout_plan_progress IS 'Tracks completion of individual exercises by users';
COMMENT ON COLUMN workout_plans.plan_data IS 'JSON structure containing days, exercises, sets, reps, weights, and notes';
