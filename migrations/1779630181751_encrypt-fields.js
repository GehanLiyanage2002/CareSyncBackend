exports.shorthands = undefined;

exports.up = (pgm) => {
  // Alter Users table
  pgm.alterColumn('users', 'mobile_number', { type: 'text' });
  pgm.alterColumn('users', 'blood_group', { type: 'text' });
  pgm.alterColumn('users', 'allergies', { type: 'text' });
  pgm.alterColumn('users', 'face_descriptor', { type: 'text' });

  // Alter Doctor Profiles table
  pgm.alterColumn('doctor_profiles', 'specialization', { type: 'text' });
  pgm.alterColumn('doctor_profiles', 'experience', { type: 'text' });
  pgm.alterColumn('doctor_profiles', 'bio', { type: 'text' });

  // Alter Appointments table
  pgm.alterColumn('appointments', 'patient_name', { type: 'text' });
  // Using explicit cast for integer to text conversion
  pgm.sql(`ALTER TABLE appointments ALTER COLUMN patient_age TYPE text USING patient_age::text;`);
  pgm.alterColumn('appointments', 'patient_gender', { type: 'text' });
  pgm.alterColumn('appointments', 'patient_contact', { type: 'text' });
  pgm.alterColumn('appointments', 'appointment_time', { type: 'text' });
  pgm.alterColumn('appointments', 'reason', { type: 'text' });
};

exports.down = (pgm) => {
  // Revert Appointments table
  pgm.alterColumn('appointments', 'reason', { type: 'text' });
  pgm.alterColumn('appointments', 'appointment_time', { type: 'varchar(50)' });
  pgm.alterColumn('appointments', 'patient_contact', { type: 'varchar(50)' });
  pgm.alterColumn('appointments', 'patient_gender', { type: 'varchar(50)' });
  pgm.sql(`ALTER TABLE appointments ALTER COLUMN patient_age TYPE integer USING patient_age::integer;`);
  pgm.alterColumn('appointments', 'patient_name', { type: 'varchar(255)' });

  // Revert Doctor Profiles table
  pgm.alterColumn('doctor_profiles', 'bio', { type: 'text' });
  pgm.alterColumn('doctor_profiles', 'experience', { type: 'varchar(255)' });
  pgm.alterColumn('doctor_profiles', 'specialization', { type: 'varchar(255)' });

  // Revert Users table
  pgm.alterColumn('users', 'face_descriptor', { type: 'text' });
  pgm.alterColumn('users', 'allergies', { type: 'text' });
  pgm.alterColumn('users', 'blood_group', { type: 'varchar(10)' });
  pgm.alterColumn('users', 'mobile_number', { type: 'varchar(20)' });
};
