/**
 * enrolments.js – FICTIONAL enrolments of a university:
 * faculty → school → degree → major. Only the majors (leaves) have a value;
 * d3.hierarchy(...).sum() adds them up for every degree, school and faculty.
 * `short` is used as the arc label when the full name does not fit.
 */
const major = (name, value, short) => ({ name, value, short });

export const enrolments = {
  name: 'University',
  children: [
    {
      name: 'Science, Engineering & Technology',
      short: 'Sci/Eng',
      children: [
        {
          name: 'School of Computing',
          short: 'Comp.',
          children: [
            {
              name: 'Bachelor of Computer Science',
              short: 'CompSci',
              children: [
                major('Artificial Intelligence', 620, 'AI'), major('Data Science', 540, 'DataSci'), major('Software Development', 710, 'SoftDev'),
                major('Cybersecurity', 430, 'Cyber'), major('Cloud Computing', 280, 'Cloud'),
              ],
            },
            {
              name: 'Bachelor of Information Technology',
              short: 'IT',
              children: [major('Business Analytics', 260, 'Analytics'), major('Networks', 190, 'Network'), major('Web & Mobile', 330, 'Web/Mob')],
            },
            { name: 'Bachelor of Games & Interactivity', short: 'Games', children: [major('Game Design', 240, 'GameDes'), major('Game Programming', 210, 'GameProg')] },
          ],
        },
        {
          name: 'School of Engineering',
          short: 'Eng.',
          children: [
            {
              name: 'Bachelor of Engineering',
              short: 'Eng.',
              children: [major('Civil', 380), major('Electrical', 290, 'Elec.'), major('Mechanical', 350, 'Mech.'), major('Robotics', 270, 'Robot.')],
            },
            { name: 'Bachelor of Aviation', short: 'Aviat.', children: [major('Pilot Training', 150, 'Pilot'), major('Aviation Management', 120, 'Av. Mgmt')] },
          ],
        },
        {
          name: 'School of Science',
          children: [
            { name: 'Bachelor of Science', children: [major('Biotechnology', 260, 'Biotech'), major('Chemistry', 170, 'Chem.'), major('Physics', 140)] },
          ],
        },
      ],
    },
    {
      name: 'Business & Law',
      short: 'Bus/Law',
      children: [
        {
          name: 'School of Business',
          short: 'Bus.',
          children: [
            {
              name: 'Bachelor of Business',
              short: 'Bus.',
              children: [major('Marketing', 420, 'Mktg'), major('Finance', 390), major('Management', 360, 'Mgmt'), major('Entrepreneurship', 180, 'Entrep.')],
            },
            { name: 'Bachelor of Accounting', short: 'Acctg', children: [major('Accounting', 310, 'Acctg'), major('Taxation', 120, 'Tax')] },
          ],
        },
        {
          name: 'School of Law',
          children: [{ name: 'Bachelor of Laws', children: [major('Commercial Law', 230, 'CommLaw'), major('Criminal Law', 190, 'CrimLaw')] }],
        },
      ],
    },
    {
      name: 'Health, Arts & Design',
      short: 'HA&D',
      children: [
        {
          name: 'School of Design',
          children: [
            {
              name: 'Bachelor of Design',
              children: [major('Communication Design', 310, 'Comm. Design'), major('Interior Design', 180, 'Interior'), major('Digital Media', 260, 'Digital')],
            },
          ],
        },
        {
          name: 'School of Health Sciences',
          short: 'Health',
          children: [
            { name: 'Bachelor of Psychology', short: 'Psych', children: [major('Psychology', 520, 'Psych')] },
            { name: 'Bachelor of Health Science', short: 'HlthSci', children: [major('Nutrition', 160, 'Nutr.'), major('Exercise Science', 210, 'ExSci')] },
          ],
        },
      ],
    },
  ],
};
