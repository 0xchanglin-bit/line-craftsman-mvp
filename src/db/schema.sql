-- LINE 協尋水電師傅系統 Schema
-- MySQL 8.0+ / InnoDB / utf8mb4_unicode_ci

SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- --------------------------------------------------------
-- 1. users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT            NOT NULL AUTO_INCREMENT,
  line_user_id  VARCHAR(255)   NOT NULL,
  name          VARCHAR(255)   DEFAULT NULL,
  phone         VARCHAR(20)    DEFAULT NULL,
  role          ENUM('seeker','craftsman') NOT NULL DEFAULT 'seeker',
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_line_user_id (line_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. craftsmen
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS craftsmen (
  id              INT           NOT NULL AUTO_INCREMENT,
  user_id         INT           NOT NULL,
  service_areas   JSON          DEFAULT ('[]'),
  skills          JSON          DEFAULT ('[]'),
  average_rating  FLOAT         NOT NULL DEFAULT 0,
  total_reviews   INT           NOT NULL DEFAULT 0,
  certification   VARCHAR(255)  DEFAULT NULL,
  is_verified     TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_craftsmen_user (user_id),
  KEY idx_user (user_id),
  CONSTRAINT fk_craftsmen_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. cases
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS cases (
  id            INT           NOT NULL AUTO_INCREMENT,
  creator_id    INT           NOT NULL,
  location_area VARCHAR(100)  DEFAULT NULL,
  category      VARCHAR(50)   DEFAULT NULL,
  description   TEXT          DEFAULT NULL,
  budget_min    INT           DEFAULT NULL,
  budget_max    INT           DEFAULT NULL,
  status        ENUM('active','matched','completed','cancelled') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at  TIMESTAMP     NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_status  (status),
  KEY idx_creator (creator_id),
  CONSTRAINT fk_cases_creator FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. contacts
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id                INT          NOT NULL AUTO_INCREMENT,
  case_id           INT          NOT NULL,
  seeker_id         INT          NOT NULL,
  craftsman_id      INT          NOT NULL,
  seeker_phone      VARCHAR(20)  DEFAULT NULL,
  craftsman_phone   VARCHAR(20)  DEFAULT NULL,
  seeker_line_id    VARCHAR(255) DEFAULT NULL,
  craftsman_line_id VARCHAR(255) DEFAULT NULL,
  status            ENUM('pending','contacted','matched') NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_case       (case_id),
  CONSTRAINT fk_contacts_case      FOREIGN KEY (case_id)      REFERENCES cases (id) ON DELETE CASCADE,
  CONSTRAINT fk_contacts_seeker    FOREIGN KEY (seeker_id)    REFERENCES users  (id),
  CONSTRAINT fk_contacts_craftsman FOREIGN KEY (craftsman_id) REFERENCES users  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. ratings
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
  id                  INT  NOT NULL AUTO_INCREMENT,
  case_id             INT  NOT NULL,
  rater_id            INT  NOT NULL,
  rated_craftsman_id  INT  NOT NULL,
  score               INT  NOT NULL,
  comment             TEXT DEFAULT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_craftsman (rated_craftsman_id),
  CONSTRAINT chk_score      CHECK (score >= 1 AND score <= 5),
  CONSTRAINT fk_ratings_case      FOREIGN KEY (case_id)            REFERENCES cases (id) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_rater     FOREIGN KEY (rater_id)           REFERENCES users (id),
  CONSTRAINT fk_ratings_craftsman FOREIGN KEY (rated_craftsman_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. service_skills
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_skills (
  id          INT           NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  category    VARCHAR(50)   DEFAULT NULL,
  description TEXT          DEFAULT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_skill_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. broadcast_logs
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS broadcast_logs (
  id            INT          NOT NULL AUTO_INCREMENT,
  case_id       INT          NOT NULL,
  craftsman_id  INT          NOT NULL,
  line_user_id  VARCHAR(255) DEFAULT NULL,
  status        VARCHAR(50)  DEFAULT NULL,
  error_message TEXT         DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_case (case_id),
  CONSTRAINT fk_broadcast_case      FOREIGN KEY (case_id)      REFERENCES cases     (id) ON DELETE CASCADE,
  CONSTRAINT fk_broadcast_craftsman FOREIGN KEY (craftsman_id) REFERENCES craftsmen (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
