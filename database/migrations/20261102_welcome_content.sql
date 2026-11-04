-- Optional copy overrides for the four public welcome slides.
CREATE TABLE IF NOT EXISTS WelcomeSlides (
    slide_number TINYINT UNSIGNED PRIMARY KEY,
    eyebrow VARCHAR(80) NOT NULL,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(500) NOT NULL,
    updated_by BIGINT UNSIGNED NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES Users(user_id)
);
