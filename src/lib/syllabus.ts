export interface SyllabusChapter {
  id: string;
  title: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology';
  classLevel: 11 | 12;
  topics: string[];
}

export const SYLLABUS_DATA: SyllabusChapter[] = [
  // ==========================================
  // PHYSICS CLASS 11
  // ==========================================
  {
    id: 'phy11-units-dimensions',
    title: 'Units, Dimensions & Measurements',
    subject: 'Physics',
    classLevel: 11,
    topics: ['SI Units', 'Dimensional Analysis', 'Least Count & Errors', 'Vernier Calliper & Screw Gauge']
  },
  {
    id: 'phy11-kinematics',
    title: 'Kinematics',
    subject: 'Physics',
    classLevel: 11,
    topics: ['Motion in a Straight Line', 'Projectile Motion', 'Relative Velocity', 'Uniform Circular Motion']
  },
  {
    id: 'phy11-laws-motion',
    title: 'Newton\'s Laws of Motion & Friction',
    subject: 'Physics',
    classLevel: 11,
    topics: ['Inertia & Newton\'s Laws', 'Friction & Coefficients', 'Circular Motion Dynamics', 'Constraint Relations', 'Atwood Machines']
  },
  {
    id: 'phy11-work-energy',
    title: 'Work, Energy & Power',
    subject: 'Physics',
    classLevel: 11,
    topics: ['Work Done by Forces', 'Kinetic & Potential Energy', 'Conservation of Energy', 'Power & Collisions']
  },
  {
    id: 'phy11-rotational-motion',
    title: 'System of Particles & Rotational Motion',
    subject: 'Physics',
    classLevel: 11,
    topics: ['Center of Mass', 'Moment of Inertia', 'Torque & Angular Momentum', 'Rolling Motion']
  },
  {
    id: 'phy11-gravitation',
    title: 'Gravitation',
    subject: 'Physics',
    classLevel: 11,
    topics: ['Newton\'s Law of Gravitation', 'Acceleration due to Gravity', 'Orbital Velocity', 'Escape Velocity', 'Kepler\'s Laws']
  },
  {
    id: 'phy11-solids-fluids',
    title: 'Properties of Solids & Fluids',
    subject: 'Physics',
    classLevel: 11,
    topics: ['Elasticity & Hooke\'s Law', 'Viscosity & Terminal Velocity', 'Surface Tension', 'Bernoulli\'s Theorem', 'Pascal\'s Law']
  },
  {
    id: 'phy11-thermodynamics',
    title: 'Thermodynamics & Kinetic Theory',
    subject: 'Physics',
    classLevel: 11,
    topics: ['Thermal Expansion & Calorimetry', 'Laws of Thermodynamics', 'Carnot Cycle & Efficiency', 'Ideal Gas Equation & Kinetic Theory']
  },
  {
    id: 'phy11-oscillations-waves',
    title: 'Oscillations & Waves',
    subject: 'Physics',
    classLevel: 11,
    topics: ['Simple Harmonic Motion', 'Superposition of Waves', 'Doppler Effect', 'Resonance & Standing Waves']
  },

  // ==========================================
  // PHYSICS CLASS 12
  // ==========================================
  {
    id: 'phy12-electrostatics',
    title: 'Electrostatics',
    subject: 'Physics',
    classLevel: 12,
    topics: ['Coulomb\'s Law', 'Electric Field & Gauss Law', 'Electrostatic Potential', 'Capacitors & Dielectrics']
  },
  {
    id: 'phy12-current-elec',
    title: 'Current Electricity',
    subject: 'Physics',
    classLevel: 12,
    topics: ['Ohm\'s Law & Drift Velocity', 'Kirchhoff\'s Rules', 'Wheatstone Bridge & Potentiometer', 'Heating Effects of Current']
  },
  {
    id: 'phy12-magnetism',
    title: 'Magnetic Effects & Magnetism',
    subject: 'Physics',
    classLevel: 12,
    topics: ['Biot-Savart & Ampere\'s Law', 'Lorentz Force on Charged Particles', 'Torque on Current Loop', 'Bar Magnet & Earth Magnetism']
  },
  {
    id: 'phy12-emi-ac',
    title: 'Electromagnetic Induction & AC',
    subject: 'Physics',
    classLevel: 12,
    topics: ['Faraday\'s & Lenz\'s Laws', 'Self & Mutual Inductance', 'LCR AC Circuits', 'Transformers & Generators']
  },
  {
    id: 'phy12-em-waves',
    title: 'Electromagnetic Waves',
    subject: 'Physics',
    classLevel: 12,
    topics: ['Displacement Current', 'Maxwell\'s Equations', 'Electromagnetic Spectrum']
  },
  {
    id: 'phy12-optics',
    title: 'Optics (Ray & Wave)',
    subject: 'Physics',
    classLevel: 12,
    topics: ['Reflection & Refraction', 'Lenses & Optical Instruments', 'Interference & Young\'s Double Slit', 'Diffraction & Polarization']
  },
  {
    id: 'phy12-dual-nature',
    title: 'Dual Nature, Atoms & Nuclei',
    subject: 'Physics',
    classLevel: 12,
    topics: ['Photoelectric Effect', 'De Broglie Waves', 'Bohr\'s Model of Hydrogen', 'Radioactivity & Nuclear Fission/Fusion']
  },
  {
    id: 'phy12-semiconductors',
    title: 'Semiconductor Electronics',
    subject: 'Physics',
    classLevel: 12,
    topics: ['Energy Bands in Solids', 'p-n Junction Diode', 'Zener Diode & Rectifiers', 'Logic Gates']
  },

  // ==========================================
  // CHEMISTRY CLASS 11
  // ==========================================
  {
    id: 'chem11-basic-concepts',
    title: 'Some Basic Concepts of Chemistry',
    subject: 'Chemistry',
    classLevel: 11,
    topics: ['Mole Concept', 'Empirical & Molecular Formula', 'Limiting Reagent & Stoichiometry', 'Concentration Terms']
  },
  {
    id: 'chem11-atom-structure',
    title: 'Structure of Atom',
    subject: 'Chemistry',
    classLevel: 11,
    topics: ['Bohr\'s Model', 'Quantum Numbers', 'Aufbau & Hund\'s Rules', 'Dual Nature & Heisenberg']
  },
  {
    id: 'chem11-periodicity',
    title: 'Classification & Periodicity',
    subject: 'Chemistry',
    classLevel: 11,
    topics: ['Periodic Table History', 'Ionization Enthalpy', 'Electron Gain Enthalpy', 'Atomic & Ionic Radii']
  },
  {
    id: 'chem11-bonding',
    title: 'Chemical Bonding & Hybridization',
    subject: 'Chemistry',
    classLevel: 11,
    topics: ['VSEPR Theory', 'Orbital Hybridization', 'Dipole Moments', 'Molecular Orbital Theory', 'Hydrogen Bonding']
  },
  {
    id: 'chem11-states-matter',
    title: 'States of Matter & Gas Laws',
    subject: 'Chemistry',
    classLevel: 11,
    topics: ['Boyle\'s, Charles\'s & Avogadro\'s Laws', 'Ideal Gas Equation', 'Real Gases & van der Waals']
  },
  {
    id: 'chem11-thermodynamics',
    title: 'Chemical Thermodynamics',
    subject: 'Chemistry',
    classLevel: 11,
    topics: ['First Law of Thermodynamics', 'Enthalpy & Entropy Change', 'Gibbs Free Energy', 'Spontaneity Criteria']
  },
  {
    id: 'chem11-equilibrium',
    title: 'Equilibrium (Chemical & Ionic)',
    subject: 'Chemistry',
    classLevel: 11,
    topics: ['Le Chatelier\'s Principle', 'pH & Buffer Solutions', 'Solubility Product (Ksp)', 'Salt Hydrolysis']
  },
  {
    id: 'chem11-redox-hydrogen',
    title: 'Redox Reactions & Hydrogen',
    subject: 'Chemistry',
    classLevel: 11,
    topics: ['Oxidation Numbers', 'Balancing Redox Equations', 'Hydrogen Properties', 'Water Hardness']
  },
  {
    id: 'chem11-organic-basic',
    title: 'Organic Chemistry: Some Basic Principles',
    subject: 'Chemistry',
    classLevel: 11,
    topics: ['IUPAC Nomenclature', 'Isomerism (Structural & Stereo)', 'Inductive, Electromeric & Resonance Effects', 'Hyperconjugation']
  },
  {
    id: 'chem11-hydrocarbons',
    title: 'Hydrocarbons',
    subject: 'Chemistry',
    classLevel: 11,
    topics: ['Alkanes Chemistry', 'Alkenes & Markownikoff Rule', 'Alkynes Synthesis', 'Aromatic Hydrocarbons']
  },

  // ==========================================
  // CHEMISTRY CLASS 12
  // ==========================================
  {
    id: 'chem12-solid-state',
    title: 'Solid State',
    subject: 'Chemistry',
    classLevel: 12,
    topics: ['Amorphous & Crystalline Solids', 'Unit Cells & Packing Efficiency', 'Crystal Defects', 'Electrical & Magnetic Properties']
  },
  {
    id: 'chem12-solutions',
    title: 'Solutions',
    subject: 'Chemistry',
    classLevel: 12,
    topics: ['Raoult\'s Law', 'Colligative Properties', 'Vant Hoff Factor', 'Ideal & Non-ideal Solutions']
  },
  {
    id: 'chem12-electrochem',
    title: 'Electrochemistry',
    subject: 'Chemistry',
    classLevel: 12,
    topics: ['Nernst Equation', 'Conductance of Electrolytic Solutions', 'Kohlrausch Law', 'Electrolysis & Batteries']
  },
  {
    id: 'chem12-kinetics',
    title: 'Chemical Kinetics',
    subject: 'Chemistry',
    classLevel: 12,
    topics: ['Rate Laws & Order of Reaction', 'Integrated Rate Equations', 'Arrhenius Equation', 'Collision Theory']
  },
  {
    id: 'chem12-surface',
    title: 'Surface Chemistry',
    subject: 'Chemistry',
    classLevel: 12,
    topics: ['Adsorption & Absorption', 'Catalysis Principles', 'Colloids & Emulsions']
  },
  {
    id: 'chem12-coordination',
    title: 'Coordination Compounds',
    subject: 'Chemistry',
    classLevel: 12,
    topics: ['Werner\'s Theory', 'Valence Bond Theory (VBT)', 'Crystal Field Theory (CFT)', 'Isomerism in Coordination']
  },
  {
    id: 'chem12-haloalkanes',
    title: 'Haloalkanes & Haloarenes',
    subject: 'Chemistry',
    classLevel: 12,
    topics: ['Nomenclature & Preparation', 'Nucleophilic Substitution (SN1/SN2)', 'Electrophilic Substitution of Haloarenes']
  },
  {
    id: 'chem12-oxygen-cmpds',
    title: 'Alcohols, Phenols & Ethers',
    subject: 'Chemistry',
    classLevel: 12,
    topics: ['Acidity of Phenols', 'Lucas Test & Reimer-Tiemann', 'Williamsons Ether Synthesis']
  },
  {
    id: 'chem12-carbonyl',
    title: 'Aldehydes, Ketones & Carboxylic Acids',
    subject: 'Chemistry',
    classLevel: 12,
    topics: ['Nucleophilic Addition Reactions', 'Aldol & Cannizzaro Reactions', 'Acidic Nature of Carboxylic Acids']
  },

  // ==========================================
  // MATHEMATICS CLASS 11
  // ==========================================
  {
    id: 'math11-sets-relations',
    title: 'Sets, Relations & Functions',
    subject: 'Mathematics',
    classLevel: 11,
    topics: ['Set Operations', 'Venn Diagrams', 'Cartesian Product', 'Domain & Range of Functions']
  },
  {
    id: 'math11-trig',
    title: 'Trigonometric Functions',
    subject: 'Mathematics',
    classLevel: 11,
    topics: ['Trigonometric Identities', 'Multiple & Sub-multiple Angle Formulas', 'Trigonometric Equations']
  },
  {
    id: 'math11-complex-quadratic',
    title: 'Complex Numbers & Quadratic Equations',
    subject: 'Mathematics',
    classLevel: 11,
    topics: ['Algebra of Complex Numbers', 'Modulus & Argand Plane', 'Roots of Quadratic Equations', 'Location of Roots']
  },
  {
    id: 'math11-permutations',
    title: 'Permutations & Combinations',
    subject: 'Mathematics',
    classLevel: 11,
    topics: ['Fundamental Principle of Counting', 'Permutations (nPr)', 'Combinations (nCr)', 'Circular Permutations']
  },
  {
    id: 'math11-binomial',
    title: 'Binomial Theorem',
    subject: 'Mathematics',
    classLevel: 11,
    topics: ['Expansion & General Term', 'Middle Term & Coefficients', 'Binomial Coefficients properties']
  },
  {
    id: 'math11-sequences',
    title: 'Sequences & Series',
    subject: 'Mathematics',
    classLevel: 11,
    topics: ['Arithmetic Progression (AP)', 'Geometric Progression (GP)', 'Arithmetic-Geometric Progression (AGP)', 'Special Series (Σn, Σn², Σn³)']
  },
  {
    id: 'math11-co-coordinate',
    title: 'Straight Lines & Conic Sections',
    subject: 'Mathematics',
    classLevel: 11,
    topics: ['Straight Line Forms & Slopes', 'Circle Mechanics', 'Parabola Properties', 'Ellipse & Hyperbola Standards']
  },
  {
    id: 'math11-limits-derivatives',
    title: 'Limits & Derivatives',
    subject: 'Mathematics',
    classLevel: 11,
    topics: ['Standard Limits Evaluation', 'Squeeze Theorem', 'First Principles of Differentiation']
  },

  // ==========================================
  // MATHEMATICS CLASS 12
  // ==========================================
  {
    id: 'math12-relations-itf',
    title: 'Relations, Functions & Inverse Trig',
    subject: 'Mathematics',
    classLevel: 12,
    topics: ['Equivalence Relations', 'One-One & Onto Functions', 'ITF Principal Values', 'ITF Properties & Conversion']
  },
  {
    id: 'math12-matrices',
    title: 'Matrices & Determinants',
    subject: 'Mathematics',
    classLevel: 12,
    topics: ['Matrix Algebra & Transpose', 'Symmetric & Skew Symmetric', 'Properties of Determinants', 'Cramer\'s Rule & Inverse']
  },
  {
    id: 'math12-differentiability',
    title: 'Continuity & Differentiability',
    subject: 'Mathematics',
    classLevel: 12,
    topics: ['Continuity Testing', 'Differentiability Verification', 'Chain Rule & Logarithmic Differentiation', 'Implicit & Parametric Forms']
  },
  {
    id: 'math12-aod',
    title: 'Applications of Derivatives (AOD)',
    subject: 'Mathematics',
    classLevel: 12,
    topics: ['Tandent & Normal', 'Monotonicity & Rolle\'s Theorem', 'Mean Value Theorem', 'Maxima & Minima']
  },
  {
    id: 'math12-integrals',
    title: 'Integrals (Indefinite & Definite)',
    subject: 'Mathematics',
    classLevel: 12,
    topics: ['Methods of Integration', 'Integration by Parts & Partial Fractions', 'Definite Integrals properties', 'Definite Integral as Limit of Sum']
  },
  {
    id: 'math12-aoi',
    title: 'Applications of Integrals (Area)',
    subject: 'Mathematics',
    classLevel: 12,
    topics: ['Area bounded by Curves', 'Area under special parabolas and straight lines']
  },
  {
    id: 'math12-diff-eq',
    title: 'Differential Equations',
    subject: 'Mathematics',
    classLevel: 12,
    topics: ['Order & Degree', 'Variable Separable Method', 'Homogeneous Equations', 'Linear Differential Equations']
  },
  {
    id: 'math12-vectors-3d',
    title: 'Vector Algebra & 3D Geometry',
    subject: 'Mathematics',
    classLevel: 12,
    topics: ['Dot & Cross Products', 'Scalar Triple Product', 'Equations of Lines in 3D', 'Equations of Planes', 'Shortest Distance']
  },
  {
    id: 'math12-probability',
    title: 'Probability & Distributions',
    subject: 'Mathematics',
    classLevel: 12,
    topics: ['Conditional Probability & Bayes Theorem', 'Independent Events', 'Binomial Distribution']
  }
];
