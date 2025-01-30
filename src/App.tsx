import { useState, useEffect } from 'react';
import './App.css';
import { FaWeight, FaRulerVertical, FaRunning, FaMoon, FaSun, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { BsFillCalendarDateFill, BsGenderAmbiguous, BsFire, BsCheckCircleFill } from 'react-icons/bs';
import { IoMdFitness } from 'react-icons/io';

interface FormData {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female';
  activityLevel: string;
  goal: 'maintain' | 'lose' | 'gain';
  rate: 'slow' | 'moderate' | 'fast';
}

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

function App() {
  const [step, setStep] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [formData, setFormData] = useState<FormData>({
    age: 0,
    weight: 0,
    height: 0,
    gender: 'male',
    activityLevel: 'sedentary',
    goal: 'maintain',
    rate: 'moderate'
  });

  const [activityAnswers, setActivityAnswers] = useState<number[]>([]);
  const [calories, setCalories] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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
    setFormData({
      age: 0,
      weight: 0,
      height: 0,
      gender: 'male',
      activityLevel: 'sedentary',
      goal: 'maintain',
      rate: 'moderate'
    });
    setActivityAnswers([]);
    setCalories(null);
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
    </div>
  );
}

export default App;
