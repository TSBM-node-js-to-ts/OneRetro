-- Migration number: 0002     2025-11-29T00:00:00.000Z

CREATE TABLE IF NOT EXISTS reflection_tags (
    reflection_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (reflection_id, tag_id),
    FOREIGN KEY (reflection_id) REFERENCES reflections(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE INDEX IF NOT EXISTS idx_reflection_tags_reflection_id
    ON reflection_tags (reflection_id);

CREATE INDEX IF NOT EXISTS idx_reflection_tags_tag_id
    ON reflection_tags (tag_id);

