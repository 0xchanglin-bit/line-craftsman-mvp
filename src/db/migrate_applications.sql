USE craftsman_mvp;

CREATE TABLE IF NOT EXISTS craftsman_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,

  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  line_id VARCHAR(100),
  service_areas JSON NOT NULL,
  skills JSON NOT NULL,

  business_card_url VARCHAR(500),
  license_image_url VARCHAR(500),

  status ENUM('pending','approved','rejected','revision_needed') DEFAULT 'pending',
  rejection_reason VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
UPDATE users SET is_admin = TRUE WHERE id = 1;
