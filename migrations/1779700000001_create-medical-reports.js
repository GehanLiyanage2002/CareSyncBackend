exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    -- Create medical_reports table if it doesn't exist
    CREATE TABLE IF NOT EXISTS medical_reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      attachment_url VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Ensure attachment_url column exists in case the table was already created without it
    ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(255);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE medical_reports DROP COLUMN IF EXISTS attachment_url;
    DROP TABLE IF EXISTS medical_reports CASCADE;
  `);
};
