import { Quiz, ChapterTimeline, LeaderboardEntry, Lecture } from '../types';

export const PRESEEDED_QUIZZES: Quiz[] = [
  {
    id: 'quiz-nlms',
    title: 'Force, Inertia, and Laws of Motion (JEE Adv Standard)',
    description: 'Advanced-level conceptual evaluation on Newton Laws of Motion, Friction, Friction coefficients, Impulse-momentum theorem, and constraint equations.',
    subject: 'Physics',
    classLevel: 11,
    durationMinutes: 15,
    createdBy: 'teacher-sharma@abhiyantra.com',
    createdAt: new Date().toISOString(),
    isCustom: false,
    questions: [
      {
        id: 'q-nlms-1',
        text: 'A block of mass m is placed on a rough horizontal surface with friction coefficient μ. A force F is applied at an angle θ with the horizontal. What is the minimum force required to slide the block along the surface?',
        options: [
          'F = μmg / (cos θ + μ sin θ)',
          'F = μmg / (sin θ + μ cos θ)',
          'F = μmg / cos(θ - tan⁻¹μ)',
          'F = μmg / √(1 + μ²)'
        ],
        correctAnswerIndex: 3,
        explanation: 'To find the minimum force, we write the equation of equilibrium before slipping. The frictional force f = μ(mg - F sin θ). Sliding starts when f ≤ F cos θ, which yields F >= μmg / (cos θ + μ sin θ). To find the absolute minimum of this force, we maximize the denominator. The maximum value of (cos θ + μ sin θ) is √(1 + μ²) which happens when tan θ = μ. Therefore, the minimum force F_min = μmg / √(1 + μ²).',
        topic: 'Laws of Motion and Friction',
        difficulty: 'Hard'
      },
      {
        id: 'q-nlms-2',
        text: 'Two blocks of masses 2kg and 4kg are connected by a light string over a frictionless pulley. If the system is released from rest, what is the tension in the linking string? (Take g = 10 m/s²)',
        options: [
          'T = 13.33 N',
          'T = 26.67 N',
          'T = 20.00 N',
          'T = 40.00 N'
        ],
        correctAnswerIndex: 1,
        explanation: 'In the Atwood machine system, Acceleration a = (m2 - m1)g / (m1 + m2) = (4 - 2)*10 / (4 + 2) = 20 / 6 = 3.33 m/s². The tension T is given by T = m1(g + a) = 2 * (10 + 3.33) = 26.67 N. Verified with formula T = 2 * m1 * m2 * g / (m1 + m2) = 2 * 2 * 4 * 10 / 6 = 160 / 6 = 26.67 N.',
        topic: 'Atwood Machine and Constraints',
        difficulty: 'Medium'
      },
      {
        id: 'q-nlms-3',
        text: 'A monkey of mass 15kg climbs a rope going over a smooth branch of a tree and linking to a bag of sand of mass 15kg placed on the ground. If the monkey climbs up the rope with acceleration 2 m/s² relative to the rope, the tension in the rope is:',
        options: [
          'T = 150 N',
          'T = 180 N',
          'T = 165 N',
          'T = 225 N'
        ],
        correctAnswerIndex: 1,
        explanation: 'Let T be the tension. For climbing monkey: T - mg = m*a_monkey. Since monkey is moving upward, monkey applies a heavy pull of T = m(g + a) = 15(10 + 2) = 180 N. Since tension exceeds the weight of the sandbag (15kg * g = 150 N), the sandbag will lift off the ground and move upwards, maintaining the rope tension of 180 N.',
        topic: 'Laws of Motion and Friction',
        difficulty: 'Hard'
      }
    ]
  },
  {
    id: 'quiz-chembond',
    title: 'Chemical Bonding & Hybridization (NEET/JEE level)',
    description: 'Challenging questions based on VSEPR theory, molecular orbital configuration, dipole moments, and hybrid state geometry.',
    subject: 'Chemistry',
    classLevel: 11,
    durationMinutes: 10,
    createdBy: 'teacher-sinha@abhiyantra.com',
    createdAt: new Date().toISOString(),
    isCustom: false,
    questions: [
      {
        id: 'q-chem-1',
        text: 'Which of the following compounds has the highest dipole moment due to its structural configuration?',
        options: [
          'NH3 (Ammonia)',
          'NF3 (Nitrogen Trifluoride)',
          'CO2 (Carbon Dioxide)',
          'BF3 (Boron Trifluoride)'
        ],
        correctAnswerIndex: 0,
        explanation: 'CO2 and BF3 are symmetrical structures (linear and trigonal planar respectively), causing individual bond moments to cancel out giving zero net dipole. In NH3 and NF3, geometry is pyramidal. In NH3, the individual N-H orbital dipoles and lone-pair dipole act in the same direction, reinforcing each other. In NF3, highly electronegative F pulls electrons away from N, acting in the direction opposite to the lone pair dipole, which significantly reduces the net dipole moment.',
        topic: 'Dipole Moment',
        difficulty: 'Medium'
      },
      {
        id: 'q-chem-2',
        text: 'According to Molecular Orbital (MO) Theory, what is the bond order and magnetic nature of the superoxide ion (O₂⁻)?',
        options: [
          'Bond Order = 2.0, Diamagnetic',
          'Bond Order = 1.5, Paramagnetic',
          'Bond Order = 1.0, Paramagnetic',
          'Bond Order = 2.5, Diamagnetic'
        ],
        correctAnswerIndex: 1,
        explanation: 'O2 has 16 electrons. Superoxide ion O₂⁻ has 17 electrons. The MO configuration is: KK σ2s² σ*2s² σ2pz² π2px² = π2py² π*2px² = π*2py¹. The number of bonding electrons N_b = 10, and antibonding N_a = 7. Bond Order = 1/2 * (N_b - N_a) = 1/2 * (10 - 7) = 1.5. Due to the presence of 1 unpaired electron in the π* antibonding orbital, O₂⁻ is paramagnetic.',
        topic: 'Molecular Orbital Theory',
        difficulty: 'Hard'
      }
    ]
  },
  {
    id: 'quiz-electrostatics',
    title: 'Electric Potential and Capacitance (Class 12 Adv)',
    description: 'Advanced numerical questions on Gaussian surface fluxes, concentric spherical conductors, and dielectric boundary conditions.',
    subject: 'Physics',
    classLevel: 12,
    durationMinutes: 20,
    createdBy: 'teacher-sharma@abhiyantra.com',
    createdAt: new Date().toISOString(),
    isCustom: false,
    questions: [
      {
        id: 'q-elec-1',
        text: 'A spherical conductor of radius R₁ is surrounded by a concentric uncharged thick conducting shell of internal radius R₂ and outer radius R₃. If a charge +Q is placed on the inner sphere, what is the potential of the inner conductor?',
        options: [
          'V = Q / (4πε₀R₁)',
          'V = Q / (4πε₀) * [1/R₁ - 1/R₂ + 1/R₃]',
          'V = Q / (4πε₀) * [1/R₁ + 1/R₃]',
          'V = Q / (4πε₀) * [1/R₂ - 1/R₃]'
        ],
        correctAnswerIndex: 1,
        explanation: 'Due to electrostatic induction, a charge of -Q is induced on the inner surface (r = R₂) of the outer shell, and +Q is induced on its outer surface (r = R₃). The total potential V of the inner sphere is the sum of potentials due to: inner surface charge +Q (at r=R₁), induced interior charge -Q (at r=R₂), and induced outer charge +Q (at r=R₃). This gives V = V_inner + V_induced_in + V_induced_out = Q/(4πε₀R₁) - Q/(4πε₀R₂) + Q/(4πε₀R₃).',
        topic: 'Electrostatic Potential and Capacitance',
        difficulty: 'Hard'
      },
      {
        id: 'q-elec-2',
        text: 'A parallel plate capacitor is filled with two different slab dielectrics of thickness d/2 each and dielectric constants K₁ and K₂. If the capacitance without dielectric was C₀, what is the new capacitance?',
        options: [
          'C = C₀ * (K₁ + K₂) / 2',
          'C = C₀ * 2K₁K₂ / (K₁ + K₂)',
          'C = C₀ * K₁K₂',
          'C = C₀ * (K₁·K₂ + K₁ + K₂)'
        ],
        correctAnswerIndex: 1,
        explanation: 'The system can be modeled as two capacitors in series, each of plate thickness d/2. C₁ = K₁ε₀A / (d/2) = 2K₁C₀ and C₂ = K₂ε₀A / (d/2) = 2K₂C₀. In series, 1/C_eq = 1/C₁ + 1/C₂ = d/(2K₁ε₀A) + d/(2K₂ε₀A) = d/(2ε₀A) * [ (K₁ + K₂) / K₁K₂ ]. Thus, C_eq = C₀ * 2K₁K₂ / (K₁ + K₂). This is the harmonic mean of dielectrics.',
        topic: 'Electrostatic Potential and Capacitance',
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'quiz-limits',
    title: 'Limits & L\'Hopital\'s Theorem (Class 12 Advanced)',
    description: 'Challenging evaluation of indeterminate mathematical forms, Taylor series expansions, and sandwich theorem limits.',
    subject: 'Mathematics',
    classLevel: 12,
    durationMinutes: 15,
    createdBy: 'teacher-gupta@abhiyantra.com',
    createdAt: new Date().toISOString(),
    isCustom: false,
    questions: [
      {
        id: 'q-limits-1',
        text: 'Evaluate the limit: L = lim (x -> 0) [ (e^x - e^(-x) - 2x) / (x - sin x) ]',
        options: [
          'L = 0',
          'L = 1',
          'L = 2',
          'L = 4'
        ],
        correctAnswerIndex: 2,
        explanation: 'This limit is of 0/0 indeterminate form. Applying Maclaurin series expansion: e^x = 1 + x + x²/2! + x³/3! + x⁴/4! + ... and e^(-x) = 1 - x + x²/2! - x³/3! + ... Then (e^x - e^(-x) - 2x) = 2(x³/3! + x⁵/5! + ...) = x³/3 + o(x³). The denominator is (x - sin x) = x - (x - x³/3! + ...) = x³/6 + o(x³). Therefore, L = lim (x -> 0) [ (x³/3) / (x³/6) ] = 6 / 3 = 2.',
        topic: 'Limits and Continuity',
        difficulty: 'Hard'
      },
      {
        id: 'q-limits-2',
        text: 'Find the limit as n tends to infinity: lim (n -> ∞) [ (1/n) * Σ (r=1 to n) (r / √(n² + r²)) ]',
        options: [
          'L = √2 - 1',
          'L = 1',
          'L = √2 + 1',
          'L = 2'
        ],
        correctAnswerIndex: 0,
        explanation: 'We convert the limit of a Riemann sum into a definite integral. The sum can be written as (1/n) * Σ_r=1^n [ (r/n) / √(1 + (r/n)²) ]. Let x = r/n, as n -> ∞, the sum becomes the integral from 0 to 1 of [ x / √(1 + x²) ] dx. Integrating: Let u = 1+x², du = 2xdx. The bounds change from x:[0,1] to u:[1,2]. The integral becomes 1/2 * ∫_1^2 u^(-1/2) du = [u^(1/2)]_1^2 = √2 - 1.',
        topic: 'Limits and Continuity',
        difficulty: 'Medium'
      }
    ]
  }
];

export const PRESEEDED_TIMELINES: ChapterTimeline[] = [
  {
    id: 'timeline-physics-11',
    title: 'Newton\'s Laws of Motion & Friction',
    subject: 'Physics',
    classLevel: 11,
    topics: [
      'Inertia & Newton\'s 1st Law',
      'Momentum & Newton\'s 2nd Law (dV/dt)',
      'Action-Reaction & Constraints',
      'Friction Dynamics (Static, Kinetic, Rolling)',
      'Atwood Machine Mechanics'
    ],
    description: 'Solve complex dynamics challenges. Learn to apply constraint equations with acceleration vectors on wedge pulley arrangements.',
    durationHours: 24,
    status: 'not_started',
    testId: 'quiz-nlms'
  },
  {
    id: 'timeline-chemistry-11',
    title: 'Chemical Bonding & Hybridization',
    subject: 'Chemistry',
    classLevel: 11,
    topics: [
      'VSEPR Theory & Geometries',
      's-p-d Orbital Hybridization',
      'Dipole moments in isomers',
      'Molecular Orbital configurations (B.O., Magnetism)',
      'Hydrogen bonding configurations'
    ],
    description: 'Identify covalent forces and analyze multi-atom geometries. Study details before entering the mock challenge arena.',
    durationHours: 24,
    status: 'not_started',
    testId: 'quiz-chembond'
  },
  {
    id: 'timeline-physics-12',
    title: 'Electric Potential & Dielectric Boundary Physics',
    subject: 'Physics',
    classLevel: 12,
    topics: [
      'Gaussian Flux in Sphere concentric conductors',
      'Electric potentials in spherical shells',
      'Capacitors with dielectric slabs',
      'Charge redistribution losses'
    ],
    description: 'Derive field values and analyze electric flux values. Setup simulated coaching timers to begin deep study of core topics.',
    durationHours: 24,
    status: 'not_started',
    testId: 'quiz-electrostatics'
  },
  {
    id: 'timeline-math-12',
    title: 'Limits & Indeterminate Calculus Formulations',
    subject: 'Mathematics',
    classLevel: 12,
    topics: [
      'Indeterminate forms (0/0, ∞/∞, 1^∞)',
      'L\'Hopital Theorem & Series Expansions',
      'Definite Integral as Riemann Sum Limits',
      'Sandwich (Squeeze) Theorem bounds'
    ],
    description: 'Master higher-level mathematical limiting bounds. Study the preseeded series materials then attempt the rigorous JEE Advanced evaluation.',
    durationHours: 24,
    status: 'not_started',
    testId: 'quiz-limits'
  }
];

export const INITIAL_LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  { studentId: 'usr-1', studentName: 'Aditya Vardhan', studentEmail: 'aditya@abhiyantra.com', classLevel: 12, totalPoints: 850, testsTaken: 4, averageScorePercentage: 92, accuracy: 0.94 },
  { studentId: 'usr-2', studentName: 'Karnika Iyer', studentEmail: 'karnika@abhiyantra.com', classLevel: 12, totalPoints: 790, testsTaken: 4, averageScorePercentage: 88, accuracy: 0.90 },
  { studentId: 'usr-3', studentName: 'Devansh Roy', studentEmail: 'devansh@abhiyantra.com', classLevel: 11, totalPoints: 720, testsTaken: 3, averageScorePercentage: 91, accuracy: 0.93 },
  { studentId: 'usr-4', studentName: 'Preeti Deshmukh', studentEmail: 'preeti@abhiyantra.com', classLevel: 11, totalPoints: 680, testsTaken: 3, averageScorePercentage: 86, accuracy: 0.88 },
  { studentId: 'usr-5', studentName: 'Aman Sheel', studentEmail: 'aman.sheel@gmail.com', classLevel: 12, totalPoints: 620, testsTaken: 3, averageScorePercentage: 82, accuracy: 0.85 }
];

export const PRESEEDED_LECTURES: Lecture[] = [
  {
    id: 'lec-1',
    title: 'Newton\'s Laws of Motion - Friction Dynamics',
    description: 'Deep dive into static, kinetic, and rolling friction. Learn to solve complex wedge-block constraints and friction coefficient calculations for JEE Advanced.',
    subject: 'Physics',
    classLevel: 11,
    videoUrl: 'https://drive.google.com/file/d/1_9i3uYQc1dJtK7bN8_f4X6c9U5y8ZwP0/view?usp=sharing',
    notesUrl: 'https://drive.google.com/file/d/1N_pdf_NLM_Friction_ClassNotes/view?usp=sharing',
    dppQuizId: 'quiz-nlms',
    durationMinutes: 45,
    addedBy: 'Prof. S.K. Sharma',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lec-2',
    title: 'VSEPR Theory & Molecular Orbitals',
    description: 'Master chemical bonding geometries, bond orders, hybridization states, and magnetic natures of heteronuclear diatomic molecules for JEE/NEET.',
    subject: 'Chemistry',
    classLevel: 11,
    videoUrl: 'https://drive.google.com/file/d/1x2y3z4w5v6u7t8s9r0qP1Q2R3S4T5U6V/view?usp=sharing',
    notesUrl: 'https://drive.google.com/file/d/1N_pdf_VSEPR_MO_ClassNotes/view?usp=sharing',
    dppQuizId: 'quiz-chembond',
    durationMinutes: 38,
    addedBy: 'teacher-sinha@abhiyantra.com',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lec-3',
    title: 'Electrostatic Potential & Spherical Conductors',
    description: 'Learn step-by-step calculations for electric potentials of concentric conducting shells, charge redistribution, and dielectric boundary condition physics.',
    subject: 'Physics',
    classLevel: 12,
    videoUrl: 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0jK1L2M3N4O5P6Q/view?usp=sharing',
    notesUrl: 'https://drive.google.com/file/d/1N_pdf_Electrostatics_ClassNotes/view?usp=sharing',
    dppQuizId: 'quiz-electrostatics',
    durationMinutes: 52,
    addedBy: 'Prof. S.K. Sharma',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lec-4',
    title: 'Limits & L\'Hopital\'s Theorem',
    description: 'Calculus mastery of 0/0 and 1^∞ indeterminate forms, Taylor series expansions, and sandwich theorem limits with board-level and JEE examples.',
    subject: 'Mathematics',
    classLevel: 12,
    videoUrl: 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7/view?usp=sharing',
    notesUrl: 'https://drive.google.com/file/d/1N_pdf_Limits_LHopital_ClassNotes/view?usp=sharing',
    dppQuizId: 'quiz-limits',
    durationMinutes: 42,
    addedBy: 'teacher-gupta@abhiyantra.com',
    createdAt: new Date().toISOString()
  }
];

