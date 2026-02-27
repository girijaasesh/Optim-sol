-- V1__initial_schema.sql
-- AgilePro Institute — Initial Database Schema
-- PostgreSQL 15+

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
    id                          BIGSERIAL PRIMARY KEY,
    full_name                   VARCHAR(100) NOT NULL,
    email                       VARCHAR(255) NOT NULL UNIQUE,
    password                    VARCHAR(255),
    phone                       VARCHAR(30),
    company                     VARCHAR(150),
    job_title                   VARCHAR(100),
    country                     VARCHAR(80),
    role                        VARCHAR(20)  NOT NULL DEFAULT 'USER',
    provider                    VARCHAR(20)  NOT NULL DEFAULT 'LOCAL',
    provider_id                 VARCHAR(255),
    email_verified              BOOLEAN      NOT NULL DEFAULT FALSE,
    email_verification_token    VARCHAR(255),
    email_verification_expiry   TIMESTAMP,
    password_reset_token        VARCHAR(255),
    password_reset_expiry       TIMESTAMP,
    mfa_enabled                 BOOLEAN      NOT NULL DEFAULT FALSE,
    mfa_secret                  VARCHAR(255),
    account_locked              BOOLEAN      NOT NULL DEFAULT FALSE,
    failed_login_attempts       INT          NOT NULL DEFAULT 0,
    lockout_until               TIMESTAMP,
    avatar_url                  VARCHAR(500),
    gst_number                  VARCHAR(50),
    experience_level            VARCHAR(50),
    preferred_currency          VARCHAR(5)   NOT NULL DEFAULT 'USD',
    last_login_at               TIMESTAMP,
    last_login_ip               VARCHAR(60),
    created_at                  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ─────────────────────────────────────────────
-- COURSES
-- ─────────────────────────────────────────────
CREATE TABLE courses (
    id                      BIGSERIAL PRIMARY KEY,
    certification_type      VARCHAR(50)      NOT NULL,
    title                   VARCHAR(200)     NOT NULL,
    description             TEXT,
    price                   NUMERIC(10,2)    NOT NULL,
    early_bird_price        NUMERIC(10,2),
    early_bird_deadline     DATE,
    max_seats               INT              NOT NULL DEFAULT 20,
    duration_days           INT              NOT NULL DEFAULT 2,
    format                  VARCHAR(20)      NOT NULL DEFAULT 'VIRTUAL',
    zoom_link               VARCHAR(500),
    venue                   VARCHAR(300),
    materials_link          VARCHAR(500),
    active                  BOOLEAN          NOT NULL DEFAULT TRUE,
    sold_out                BOOLEAN          NOT NULL DEFAULT FALSE,
    start_date              DATE,
    end_date                DATE,
    target_audience         VARCHAR(300),
    created_at              TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_type       ON courses(certification_type);
CREATE INDEX idx_courses_active     ON courses(active);
CREATE INDEX idx_courses_start_date ON courses(start_date);

CREATE TABLE course_outcomes (
    course_id   BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    outcome     VARCHAR(300) NOT NULL
);

-- ─────────────────────────────────────────────
-- REGISTRATIONS
-- ─────────────────────────────────────────────
CREATE TABLE registrations (
    id                          BIGSERIAL PRIMARY KEY,
    registration_ref            VARCHAR(30)   NOT NULL UNIQUE,
    user_id                     BIGINT        NOT NULL REFERENCES users(id),
    course_id                   BIGINT        NOT NULL REFERENCES courses(id),
    status                      VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    amount                      NUMERIC(10,2) NOT NULL,
    currency                    VARCHAR(5)    NOT NULL DEFAULT 'USD',
    stripe_payment_intent_id    VARCHAR(255),
    stripe_session_id           VARCHAR(255),
    payment_status              VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    coupon_code                 VARCHAR(50),
    discount_amount             NUMERIC(10,2),
    corporate_group_id          BIGINT,
    special_accommodations      TEXT,
    gst_number                  VARCHAR(50),
    experience_level            VARCHAR(50),
    created_at                  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP     NOT NULL DEFAULT NOW(),
    confirmed_at                TIMESTAMP
);

CREATE INDEX idx_reg_user_id     ON registrations(user_id);
CREATE INDEX idx_reg_course_id   ON registrations(course_id);
CREATE INDEX idx_reg_status      ON registrations(status);
CREATE INDEX idx_reg_payment     ON registrations(payment_status);
CREATE INDEX idx_reg_ref         ON registrations(registration_ref);

-- ─────────────────────────────────────────────
-- CERTIFICATES
-- ─────────────────────────────────────────────
CREATE TABLE certificates (
    id                  BIGSERIAL PRIMARY KEY,
    certificate_id      VARCHAR(30)  NOT NULL UNIQUE,
    registration_id     BIGINT       NOT NULL REFERENCES registrations(id),
    participant_name    VARCHAR(100) NOT NULL,
    certification_name  VARCHAR(100) NOT NULL,
    issue_date          DATE,
    pdf_path            VARCHAR(500),
    verification_url    VARCHAR(500),
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- COUPONS
-- ─────────────────────────────────────────────
CREATE TABLE coupons (
    id                      BIGSERIAL PRIMARY KEY,
    code                    VARCHAR(50)      NOT NULL UNIQUE,
    discount_type           VARCHAR(20)      NOT NULL,
    discount_value          NUMERIC(10,2)    NOT NULL,
    usage_limit             INT,
    usage_count             INT              NOT NULL DEFAULT 0,
    expiry_date             DATE,
    active                  BOOLEAN          NOT NULL DEFAULT TRUE,
    applicable_course_type  VARCHAR(50),
    created_at              TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);

-- ─────────────────────────────────────────────
-- WAITLIST
-- ─────────────────────────────────────────────
CREATE TABLE waitlist (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT    NOT NULL REFERENCES users(id),
    course_id   BIGINT    NOT NULL REFERENCES courses(id),
    position    INT       NOT NULL DEFAULT 1,
    status      VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    notified_at TIMESTAMP,
    expires_at  TIMESTAMP,
    joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, course_id)
);

-- ─────────────────────────────────────────────
-- CORPORATE GROUPS
-- ─────────────────────────────────────────────
CREATE TABLE corporate_groups (
    id                  BIGSERIAL PRIMARY KEY,
    company_name        VARCHAR(150) NOT NULL,
    contact_name        VARCHAR(100),
    contact_email       VARCHAR(255),
    contact_phone       VARCHAR(30),
    course_id           BIGINT       REFERENCES courses(id),
    group_size          INT          NOT NULL DEFAULT 1,
    discount_percentage NUMERIC(5,2),
    invoice_status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    invoice_ref         VARCHAR(50),
    custom_content      TEXT,
    lms_group_id        VARCHAR(100),
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────
CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    action      VARCHAR(50)  NOT NULL,
    username    VARCHAR(255),
    ip_address  VARCHAR(60),
    user_agent  VARCHAR(500),
    details     TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_action   ON audit_logs(action);
CREATE INDEX idx_audit_username ON audit_logs(username);
CREATE INDEX idx_audit_created  ON audit_logs(created_at);

-- ─────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────
INSERT INTO users (full_name, email, password, role, email_verified, mfa_enabled)
VALUES
  ('Super Admin', 'superadmin@agilepro.com',
   '$2a$12$placeholder_bcrypt_hash_superadmin', 'SUPER_ADMIN', TRUE, TRUE),
  ('Dr. Sarah Mitchell', 'admin@agilepro.com',
   '$2a$12$placeholder_bcrypt_hash_admin', 'ADMIN', TRUE, TRUE),
  ('Demo User', 'user@agilepro.com',
   '$2a$12$placeholder_bcrypt_hash_user', 'USER', TRUE, FALSE);

INSERT INTO courses (certification_type, title, description, price, early_bird_price, early_bird_deadline, max_seats, duration_days, format, start_date, end_date, target_audience)
VALUES
  ('SAFE_AGILIST', 'SAFe Agilist (SA)', 'Core SAFe principles for enterprise agile transformation leaders.',
   1595.00, 1295.00, '2026-03-01', 20, 2, 'VIRTUAL', '2026-03-15', '2026-03-16', 'Executives, Managers, Change Agents'),
  ('SAFE_SCRUM_MASTER', 'SAFe Scrum Master (SSM)', 'Empower Scrum Masters within the SAFe enterprise context.',
   1395.00, 1195.00, '2026-02-28', 20, 2, 'VIRTUAL', '2026-03-22', '2026-03-23', 'Scrum Masters, Team Leads'),
  ('SAFE_POPM', 'SAFe Product Owner / Product Manager', 'Master product ownership at enterprise scale.',
   1795.00, 1495.00, '2026-03-20', 20, 3, 'IN_PERSON', '2026-04-05', '2026-04-07', 'Product Owners, Product Managers');

INSERT INTO coupons (code, discount_type, discount_value, usage_limit, expiry_date, applicable_course_type)
VALUES
  ('EARLYBIRD26', 'PERCENTAGE', 20.00, 100, '2026-03-31', NULL),
  ('CORP2026',    'PERCENTAGE', 25.00, NULL, '2026-12-31', 'CORPORATE_WORKSHOP');
