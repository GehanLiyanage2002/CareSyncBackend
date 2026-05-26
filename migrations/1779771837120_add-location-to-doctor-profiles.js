exports.up = (pgm) => {
  pgm.addColumns('doctor_profiles', {
    location: { type: 'varchar(255)' },
    consultation_fee: { type: 'numeric' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('doctor_profiles', ['location', 'consultation_fee']);
};
