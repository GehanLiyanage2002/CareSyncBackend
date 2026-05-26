exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS token_number INTEGER;
    
    DROP TABLE IF EXISTS doctor_schedules CASCADE;
    
    CREATE TABLE doctor_schedules (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
      schedule_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      slot_duration_minutes INTEGER NOT NULL,
      UNIQUE(doctor_id, schedule_date)
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS doctor_schedules CASCADE;
    ALTER TABLE appointments DROP COLUMN IF EXISTS token_number;
    ALTER TABLE doctor_profiles DROP COLUMN IF EXISTS is_available;
  `);
};
