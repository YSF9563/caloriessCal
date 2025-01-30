import { useState, useEffect } from 'react';
import './App.css';
import { FaWeight, FaRulerVertical, FaRunning, FaMoon, FaSun, FaArrowRight, FaArrowLeft, FaCalculator, FaChartLine } from 'react-icons/fa';
import { BsFillCalendarDateFill, BsGenderAmbiguous, BsFire, BsCheckCircleFill } from 'react-icons/bs';
import { IoMdFitness } from 'react-icons/io';

interface WeightEntry {
  date: string;
  weight: number;
}

interface WeeklyProgress {
  startDate: string;
  endDate: string;
  weightChange: number;
  isOnTrack: boolean;
}

interface FormData {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female';
  activityLevel: string;
  goal: 'maintain' | 'lose' | 'gain';
  rate: 'slow' | 'moderate' | 'fast';
  weightEntries: WeightEntry[];
  startDate: string;
  lastMetabolismCheck: string;
  hasCompletedCalculator: boolean;
}

const STORAGE_KEY = 'caloriesCalData';

const ACTIVITY_QUESTIONS = [
  {
    id: 1,
    question: "How often do you exercise?",
    options: [
      { text: "Never or rarely", points: 0 },
      { text: "1-2 times per week", points: 1 },
      { text: "3-4 times per week", points: 2 },
      { text: "5-7 times per week", points: 3 },
      { text: "Multiple times per day", points: 4 }
    ]
  },
  {
    id: 2,
    question: "What's your daily activity level outside of exercise?",
    options: [
      { text: "Mostly sitting (office job)", points: 0 },
      { text: "Light movement (teacher, retail)", points: 1 },
      { text: "Moderate movement (waiter, cleaning)", points: 2 },
      { text: "Heavy physical work (construction, athlete)", points: 3 }
    ]
  },
  {
    id: 3,
    question: "How intense are your workouts typically?",
    options: [
      { text: "Light (walking, yoga)", points: 0 },
      { text: "Moderate (jogging, light weights)", points: 1 },
      { text: "Vigorous (running, heavy weights)", points: 2 },
      { text: "Very intense (HIIT, competitive sports)", points: 3 }
    ]
  }
];

const ACTIVITY_LEVELS = {
  sedentary: { 
    label: 'Sedentary', 
    multiplier: 1.2,
    icon: '🧘‍♂️',
    description: 'Little to no regular exercise'
  },
  light: { 
    label: 'Lightly Active', 
    multiplier: 1.375,
    icon: '🚶‍♂️',
    description: 'Light exercise 1-3 times/week'
  },
  moderate: { 
    label: 'Moderately Active', 
    multiplier: 1.55,
    icon: '🏃‍♂️',
    description: 'Moderate exercise 3-5 times/week'
  },
  very: { 
    label: 'Very Active', 
    multiplier: 1.725,
    icon: '💪',
    description: 'Hard exercise 6-7 times/week'
  },
  extra: { 
    label: 'Extra Active', 
    multiplier: 1.9,
    icon: '🏋️‍♂️',
    description: 'Very hard exercise & physical job'
  }
};

type View = 'calculator' | 'tracker';

function App() {
  const [step, setStep] = useState(1);
  
  // Clear all stored data on initial load
  useEffect(() => {
    localStorage.clear(); // Clear all localStorage data
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [formData, setFormData] = useState<FormData>({
    age: 0,
    weight: 0,
    height: 0,
    gender: 'male',
    activityLevel: 'sedentary',
    goal: 'maintain',
    rate: 'moderate',
    weightEntries: [],
    startDate: new Date().toISOString().split('T')[0],
    lastMetabolismCheck: new Date().toISOString().split('T')[0],
    hasCompletedCalculator: false
  });

  const [activityAnswers, setActivityAnswers] = useState<number[]>([]);
  const [calories, setCalories] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentView, setCurrentView] = useState<View>('calculator');

  // Update theme based on system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme changes without saving to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Save form data changes
  useEffect(() => {
    if (formData.hasCompletedCalculator) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  const calculateActivityLevel = (points: number) => {
    if (points <= 2) return 'sedentary';
    if (points <= 4) return 'light';
    if (points <= 6) return 'moderate';
    if (points <= 8) return 'very';
    return 'extra';
  };

  const handleActivityAnswer = (points: number) => {
    const newAnswers = [...activityAnswers, points];
    setActivityAnswers(newAnswers);
    
    if (newAnswers.length === ACTIVITY_QUESTIONS.length) {
      const totalPoints = newAnswers.reduce((a, b) => a + b, 0);
      const level = calculateActivityLevel(totalPoints);
      setFormData(prev => ({ ...prev, activityLevel: level }));
      setStep(4);
    }
  };

  const calculateCalories = () => {
    setIsCalculating(true);
    let bmr;
    if (formData.gender === 'male') {
      bmr = 88.362 + (13.397 * formData.weight) + (4.799 * formData.height) - (5.677 * formData.age);
    } else {
      bmr = 447.593 + (9.247 * formData.weight) + (3.098 * formData.height) - (4.330 * formData.age);
    }
    
    const maintenanceCalories = bmr * ACTIVITY_LEVELS[formData.activityLevel as keyof typeof ACTIVITY_LEVELS].multiplier;
    
    setTimeout(() => {
      setCalories(Math.round(maintenanceCalories));
      setIsCalculating(false);
      // Mark calculator as completed when calories are calculated
      setFormData(prev => ({ ...prev, hasCompletedCalculator: true }));
    }, 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'weight' || name === 'height' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleNext = () => {
    if (step === 1 && formData.age && formData.weight && formData.height) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 3) {
        setActivityAnswers([]);
      }
    }
  };

  const handleReset = () => {
    setStep(1);
    const newFormData: FormData = {
      age: 0,
      weight: 0,
      height: 0,
      gender: 'male' as const,
      activityLevel: 'sedentary',
      goal: 'maintain' as const,
      rate: 'moderate' as const,
      weightEntries: [],
      startDate: new Date().toISOString().split('T')[0],
      lastMetabolismCheck: new Date().toISOString().split('T')[0],
      hasCompletedCalculator: false
    };
    setFormData(newFormData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFormData));
    setActivityAnswers([]);
    setCalories(null);
    setCurrentView('calculator');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 4) {
      calculateCalories();
      setStep(5);
    }
  };

  const getCalorieAdjustment = () => {
    if (formData.goal === 'maintain') return 0;
    
    let baseAdjustment = formData.goal === 'lose' ? -1 : 1;
    switch (formData.rate) {
      case 'slow': return baseAdjustment * 250;
      case 'moderate': return baseAdjustment * 500;
      case 'fast': return baseAdjustment * 750;
      default: return 0;
    }
  };

  const addWeightEntry = (weight: number) => {
    const date = new Date().toISOString().split('T')[0];
    const newEntry: WeightEntry = { date, weight };
    
    setFormData(prev => {
      // Don't allow multiple entries for the same day
      const existingEntries = prev.weightEntries.filter(entry => entry.date !== date);
      const updatedEntries = [...existingEntries, newEntry]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return {
        ...prev,
        weightEntries: updatedEntries
      };
    });
  };

  const calculateWeightStats = () => {
    if (formData.weightEntries.length === 0) return null;

    const sortedEntries = [...formData.weightEntries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const initialWeight = sortedEntries[0].weight;
    const currentWeight = sortedEntries[sortedEntries.length - 1].weight;
    const totalChange = currentWeight - initialWeight;
    
    // Calculate weekly average change
    const firstDate = new Date(sortedEntries[0].date);
    const lastDate = new Date(sortedEntries[sortedEntries.length - 1].date);
    const weeksDiff = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    const weeklyChange = totalChange / weeksDiff;

    return {
      initialWeight,
      currentWeight,
      totalChange,
      weeklyChange,
      trend: totalChange === 0 ? 'maintained' : totalChange > 0 ? 'gained' : 'lost'
    };
  };

  const checkMetabolism = () => {
    const entries = formData.weightEntries;
    if (entries.length < 14) return null;

    const lastCheck = new Date(formData.lastMetabolismCheck);
    const today = new Date();
    const daysSinceCheck = Math.floor((today.getTime() - lastCheck.getTime()) / (24 * 60 * 60 * 1000));

    if (daysSinceCheck < 14) return null;

    const weeklyChange = Number(calculateWeightStats()?.weeklyChange || 0);
    const targetChange = formData.goal === 'lose' ? 
      (formData.rate === 'slow' ? -0.25 : formData.rate === 'moderate' ? -0.5 : -0.75) :
      formData.goal === 'gain' ?
      (formData.rate === 'slow' ? 0.25 : formData.rate === 'moderate' ? 0.5 : 0.75) : 0;

    const difference = Math.abs(weeklyChange - targetChange);
    
    if (difference > 0.2) {
      const adjustment = Math.round((difference * 500) * (weeklyChange > targetChange ? -1 : 1));
      setCalories(prev => prev ? prev + adjustment : prev);
      setFormData(prev => ({ ...prev, lastMetabolismCheck: today.toISOString().split('T')[0] }));
      return {
        adjustment,
        isOnTrack: false,
        message: `Your metabolism has been adjusted by ${Math.abs(adjustment)} calories ${adjustment > 0 ? 'up' : 'down'}`
      };
    }
    return {
      adjustment: 0,
      isOnTrack: true,
      message: "You're on track with your goals!"
    };
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content measurements-step">
            <h2>Basic Measurements</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="age">
                  <BsFillCalendarDateFill size={24} />
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age || ''}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="120"
                  placeholder="Years"
                />
              </div>

              <div className="form-group">
                <label htmlFor="weight">
                  <FaWeight size={24} />
                  Weight
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.1"
                  placeholder="kg"
                />
              </div>

              <div className="form-group">
                <label htmlFor="height">
                  <FaRulerVertical size={24} />
                  Height
                </label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height || ''}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.1"
                  placeholder="cm"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content gender-step">
            <h2>Select Your Gender</h2>
            <div className="gender-options">
              <label className={`gender-option ${formData.gender === 'male' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleInputChange}
                />
                <span className="gender-icon">♂</span>
                <span className="gender-label">Male</span>
              </label>
              <label className={`gender-option ${formData.gender === 'female' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleInputChange}
                />
                <span className="gender-icon">♀</span>
                <span className="gender-label">Female</span>
              </label>
            </div>
          </div>
        );

      case 3:
        const currentQuestion = ACTIVITY_QUESTIONS[activityAnswers.length];
        return (
          <div className="step-content activity-test-step">
            <h2>Activity Level Test</h2>
            <div className="question-card">
              <h3>{currentQuestion.question}</h3>
              <div className="options-grid">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className="option-btn"
                    onClick={() => handleActivityAnswer(option.points)}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
            <div className="progress-dots">
              {ACTIVITY_QUESTIONS.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index < activityAnswers.length ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content goal-step">
            <h2>Select Your Goal</h2>
            <div className="goal-options">
              <label className={`goal-option ${formData.goal === 'lose' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="goal"
                  value="lose"
                  checked={formData.goal === 'lose'}
                  onChange={handleInputChange}
                />
                <span className="goal-icon">⬇️</span>
                <span className="goal-label">Lose Weight</span>
              </label>
              <label className={`goal-option ${formData.goal === 'maintain' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="goal"
                  value="maintain"
                  checked={formData.goal === 'maintain'}
                  onChange={handleInputChange}
                />
                <span className="goal-icon">⚖️</span>
                <span className="goal-label">Maintain Weight</span>
              </label>
              <label className={`goal-option ${formData.goal === 'gain' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="goal"
                  value="gain"
                  checked={formData.goal === 'gain'}
                  onChange={handleInputChange}
                />
                <span className="goal-icon">⬆️</span>
                <span className="goal-label">Gain Weight</span>
              </label>
            </div>

            {formData.goal !== 'maintain' && (
              <div className="rate-selection">
                <h3>Select Rate</h3>
                <div className="rate-options">
                  <label className={`rate-option ${formData.rate === 'slow' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="rate"
                      value="slow"
                      checked={formData.rate === 'slow'}
                      onChange={handleInputChange}
                    />
                    <span className="rate-label">Slow</span>
                    <span className="rate-value">{formData.goal === 'lose' ? '-0.25' : '+0.25'} kg/week</span>
                  </label>
                  <label className={`rate-option ${formData.rate === 'moderate' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="rate"
                      value="moderate"
                      checked={formData.rate === 'moderate'}
                      onChange={handleInputChange}
                    />
                    <span className="rate-label">Moderate</span>
                    <span className="rate-value">{formData.goal === 'lose' ? '-0.5' : '+0.5'} kg/week</span>
                  </label>
                  <label className={`rate-option ${formData.rate === 'fast' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="rate"
                      value="fast"
                      checked={formData.rate === 'fast'}
                      onChange={handleInputChange}
                    />
                    <span className="rate-label">Fast</span>
                    <span className="rate-value">{formData.goal === 'lose' ? '-0.75' : '+0.75'} kg/week</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        if (!calories) return null;
        const adjustedCalories = calories + getCalorieAdjustment();
        const activityLevel = ACTIVITY_LEVELS[formData.activityLevel as keyof typeof ACTIVITY_LEVELS];
        const metabolismStatus = checkMetabolism();
        
        return (
          <div className="step-content results-step">
            <div className="results-header">
              <h2>Your Personalized Plan</h2>
              <div className="activity-badge">
                <span className="activity-icon">{activityLevel.icon}</span>
                <span className="activity-label">{activityLevel.label}</span>
              </div>
            </div>

            <div className="calories-display">
              <div className="calories-circle">
                <span className="calories-number">{adjustedCalories}</span>
                <span className="calories-unit">calories/day</span>
              </div>
            </div>

            <div className="macros-grid">
              <div className="macro-card">
                <span className="macro-icon">🥩</span>
                <span className="macro-label">Protein</span>
                <span className="macro-value">{Math.round(adjustedCalories * 0.3 / 4)}g</span>
              </div>
              <div className="macro-card">
                <span className="macro-icon">🍚</span>
                <span className="macro-label">Carbs</span>
                <span className="macro-value">{Math.round(adjustedCalories * 0.4 / 4)}g</span>
              </div>
              <div className="macro-card">
                <span className="macro-icon">🥑</span>
                <span className="macro-label">Fats</span>
                <span className="macro-value">{Math.round(adjustedCalories * 0.3 / 9)}g</span>
              </div>
            </div>

            <div className="weight-tracking">
              <h3>Weight Tracking</h3>
              {metabolismStatus && (
                <div className="metabolism-info">
                  <h4>Metabolism Check</h4>
                  <div className={`metabolism-status ${metabolismStatus.isOnTrack ? 'status-good' : 'status-warning'}`}>
                    <span className="status-icon">
                      {metabolismStatus.isOnTrack ? '✅' : '⚠️'}
                    </span>
                    <span>{metabolismStatus.message}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="results-info">
              <p className="info-text">
                Based on your {activityLevel.label.toLowerCase()} lifestyle and goal to
                {formData.goal === 'maintain' ? ' maintain your current weight' :
                 formData.goal === 'lose' ? ` lose ${formData.rate === 'slow' ? '0.25' :
                                                    formData.rate === 'moderate' ? '0.5' : '0.75'} kg per week` :
                 ` gain ${formData.rate === 'slow' ? '0.25' :
                         formData.rate === 'moderate' ? '0.5' : '0.75'} kg per week`}.
              </p>
            </div>

            <div className="results-actions">
              <button type="button" onClick={handleReset} className="nav-btn reset-btn">
                <FaArrowLeft size={20} />
                Start Over
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderNavigation = () => (
    <div className="nav-bar">
      <button 
        className={`nav-item ${currentView === 'calculator' ? 'active' : ''}`}
        onClick={() => setCurrentView('calculator')}
      >
        <FaCalculator size={20} />
        <span>Calculator</span>
      </button>
      <button 
        className={`nav-item ${currentView === 'tracker' ? 'active' : ''}`}
        onClick={() => setCurrentView('tracker')}
      >
        <FaChartLine size={20} />
        <span>Weight Tracker</span>
      </button>
    </div>
  );

  const renderWeightTracker = () => {
    if (!formData.hasCompletedCalculator) {
      return (
        <div className="tracker-container">
          <div className="empty-state">
            <h2>Complete the Calculator First</h2>
            <p>Please complete the calorie calculator before tracking your weight.</p>
            <button 
              onClick={() => setCurrentView('calculator')} 
              className="nav-btn next-btn"
            >
              Go to Calculator
              <FaArrowRight size={20} />
            </button>
          </div>
        </div>
      );
    }

    const stats = calculateWeightStats();
    const today = new Date().toISOString().split('T')[0];
    const canAddWeight = !formData.weightEntries.some(entry => entry.date === today);
    const metabolismStatus = checkMetabolism();

    return (
      <div className="tracker-container">
        <h2>Weight Tracker</h2>
        
        {canAddWeight && (
          <div className="weight-input-section">
            <h3>Add Today's Weight</h3>
            <div className="weight-input">
              <input
                type="number"
                step="0.1"
                placeholder="Enter weight in kg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const weight = parseFloat((e.target as HTMLInputElement).value);
                    if (!isNaN(weight) && weight > 0) {
                      addWeightEntry(weight);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
                onBlur={(e) => {
                  const weight = parseFloat(e.target.value);
                  if (!isNaN(weight) && weight > 0) {
                    addWeightEntry(weight);
                    e.target.value = '';
                  }
                }}
              />
              <span className="unit">kg</span>
            </div>
          </div>
        )}

        {formData.weightEntries.length > 0 && (
          <>
            <div className="weight-stats">
              <div className="stat-card">
                <span className="stat-label">Latest Weight</span>
                <span className="stat-value">
                  {formData.weightEntries[0].weight.toFixed(1)} kg
                </span>
              </div>
              {stats && (
                <div className="stat-card">
                  <span className="stat-label">Weekly Change</span>
                  <span className="stat-value" style={{ 
                    color: stats.weeklyChange === 0 ? 'inherit' : 
                           stats.weeklyChange > 0 ? 'var(--warning-color)' : 
                           'var(--success-color)' 
                  }}>
                    {stats.weeklyChange > 0 ? '+' : ''}{stats.weeklyChange.toFixed(2)} kg/week
                  </span>
                </div>
              )}
            </div>

            {metabolismStatus && (
              <div className="metabolism-info">
                <h4>Metabolism Check</h4>
                <div className={`metabolism-status ${metabolismStatus.isOnTrack ? 'status-good' : 'status-warning'}`}>
                  <span className="status-icon">
                    {metabolismStatus.isOnTrack ? '✅' : '⚠️'}
                  </span>
                  <span>{metabolismStatus.message}</span>
                </div>
              </div>
            )}

            <div className="weight-history">
              <h3>Weight History</h3>
              <div className="history-list">
                {formData.weightEntries
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <div key={entry.date} className="history-item">
                      <span className="history-date">
                        {new Date(entry.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="history-weight">{entry.weight.toFixed(1)} kg</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="calculator-container">
      <div className="theme-toggle">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="theme-toggle-btn"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
        </button>
      </div>
      
      {renderNavigation()}
      
      {currentView === 'calculator' ? (
        <>
          <div className="header">
            <IoMdFitness size={48} />
            <h1>Calorie Calculator</h1>
          </div>

          <div className="progress-bar">
            <div className="progress-steps">
              {[1, 2, 3, 4, 5].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`progress-step ${step >= stepNumber ? 'active' : ''} ${
                    step === stepNumber ? 'current' : ''
                  }`}
                >
                  {step > stepNumber ? <BsCheckCircleFill size={24} /> : stepNumber}
                </div>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="calculator-form">
            {renderStep()}

            <div className="form-navigation">
              {step > 1 && step !== 5 && (
                <button type="button" onClick={handleBack} className="nav-btn back-btn">
                  <FaArrowLeft size={20} />
                  Back
                </button>
              )}
              
              {step < 4 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="nav-btn next-btn"
                  disabled={
                    step === 1 && (!formData.age || !formData.weight || !formData.height)
                  }
                >
                  Next
                  <FaArrowRight size={20} />
                </button>
              )}

              {step === 4 && (
                <button type="submit" className="nav-btn calculate-btn">
                  <BsFire size={20} />
                  Calculate Plan
                </button>
              )}
            </div>
          </form>
        </>
      ) : (
        renderWeightTracker()
      )}
    </div>
  );
}

export default App;
