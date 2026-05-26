exports.up = (pgm) => {
  // Add the column with a default of FALSE (meaning new doctors are unapproved)
  pgm.addColumns('doctor_profiles', {
    is_approved: {
      type: 'boolean',
      default: false,
    },
  });

  // Automatically approve all CURRENT doctors so they are not locked out
  pgm.sql('UPDATE doctor_profiles SET is_approved = true');
};

exports.down = (pgm) => {
  pgm.dropColumns('doctor_profiles', ['is_approved']);
};
