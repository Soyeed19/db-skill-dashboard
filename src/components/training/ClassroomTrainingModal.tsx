import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Volume2
} from 'lucide-react';

interface ClassroomTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchCode: string;
  trainerName: string;
}

interface Slide {
  id: number;
  title: string;
  category: string;
  duration: string;
  content: {
    bullets: string[];
    highlight: string;
    criticalRule: string;
    diagramType?: 'blindspot' | 'stopping_distance' | 'fatigue' | 'first_aid';
  };
  trainerNotes: string;
  quizQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Commercial Vehicle Defensive Driving & Space Cushioning',
    category: 'Module 1: Vehicle Dynamics',
    duration: '45 mins',
    content: {
      bullets: [
        'Maintain a minimum 4-second following distance under normal highway conditions; expand to 6-8 seconds in rain, fog, or night.',
        'Never ride the vehicle bumper; heavy commercial trucks require up to 40% more braking distance than passenger cars.',
        'Always establish an escape route (left shoulder or open lane) in case of sudden pile-ups ahead.',
        'Anticipate pedestrian and two-wheeler blind cut-ins at highway intersections and toll gates.'
      ],
      highlight: 'Speed kills, but stopping distance saves lives. A loaded 40-ton trailer traveling at 60 km/h requires over 65 meters to come to a dead stop!',
      criticalRule: 'RULE OF THUMB: Look 15-20 seconds ahead (about a quarter-mile on expressways) to detect hazard patterns before touching the brake pedal.',
      diagramType: 'stopping_distance'
    },
    trainerNotes: 'Emphasize the difference between perception-reaction distance and actual mechanical braking lag in pneumatic air-brake systems.',
    quizQuestion: {
      question: 'What is the recommended minimum following distance for heavy trucks at 60 km/h in wet conditions?',
      options: ['2 seconds', '4 seconds', '6 to 8 seconds', '10 seconds'],
      correctIndex: 2,
      explanation: 'Wet asphalt reduces tire friction by nearly half, requiring 6-8 seconds minimum cushion.'
    }
  },
  {
    id: 2,
    title: 'Heavy Truck Blind Zones (The "NO-ZONES")',
    category: 'Module 1: Vehicle Dynamics',
    duration: '35 mins',
    content: {
      bullets: [
        'Front Blind Zone: Commercial trucks have a 6-meter dead blind zone directly in front of the elevated cabin.',
        'Right Side Blind Zone: Extending across two full lanes; two-wheelers overtaking on the wrong side are completely invisible.',
        'Rear Blind Zone: Extends up to 60 meters directly behind closed trailers or tankers; always use a spotter when reversing.',
        'Convex & Cross-view mirrors must be adjusted prior to moving wheels—never during motion.'
      ],
      highlight: 'IF YOU CANNOT SEE THE DRIVER IN HIS SIDE MIRROR, HE CANNOT SEE YOU! Teach drivers this fundamental universal truth.',
      criticalRule: 'REVERSING PROTOCOL: 3 short horn beeps before reverse gear engagement; hazard flashers ON; helper on the ground in sight.',
      diagramType: 'blindspot'
    },
    trainerNotes: 'Have trainees walk around a mock truck perimeter in the yard to witness where the mirror blind spots exist.',
    quizQuestion: {
      question: 'Where is the largest commercial truck blind zone located?',
      options: ['Directly above the cab', 'On the passenger/left side across 2 lanes', 'Inside the driver cabin', 'Front bumper only'],
      correctIndex: 1,
      explanation: 'The left/passenger side has the widest blind perimeter due to distance from driver seat.'
    }
  },
  {
    id: 3,
    title: 'Pre-Trip 16-Point Circle Inspection Protocol',
    category: 'Module 2: Maintenance & Safety',
    duration: '40 mins',
    content: {
      bullets: [
        'Walk full 360-degree circle around the vehicle before turning the ignition key.',
        'Tire Tread & Pressure: Minimum 3mm tread depth across all dual tires; check for lodged stones or deep sidewall cuts.',
        'Brake Air Reservoir: Drain moisture daily from pneumatic air tanks to prevent brake line freezing or valve failure.',
        'Wheel Lug Nuts: Visually check for rust streaks or loose indicator arrows indicating loose wheel studs.',
        'Retro-Reflective Tape & Lights: Front white, side amber, rear red reflective tapes must be cleaned of mud and road grime.'
      ],
      highlight: 'A 5-minute pre-trip circle inspection eliminates 85% of catastrophic roadside axle and tire blowouts on the highway.',
      criticalRule: 'FAIL-SAFE RULE: If air pressure drops below 60 PSI on the dashboard gauge, DO NOT move the truck.',
      diagramType: 'stopping_distance'
    },
    trainerNotes: 'Distribute physical inspection card checklists to trainees. Show photos of tire blowouts caused by under-inflation.',
    quizQuestion: {
      question: 'Why must pneumatic air brake moisture valves be purged daily?',
      options: ['To cool the cabin', 'To remove water and oil sludge that damages relay valves', 'To reduce fuel weight', 'To blow the horn louder'],
      correctIndex: 1,
      explanation: 'Condensed water and oil vapors contaminate brake valves and cause brake lock or failure.'
    }
  },
  {
    id: 4,
    title: 'Fatigue Management, Micro-Sleep & Alcohol Prohibition',
    category: 'Module 3: Driver Health',
    duration: '50 mins',
    content: {
      bullets: [
        'Circadian Low Zones: The biological body demands sleep between 02:00 AM - 05:00 AM and 02:00 PM - 04:00 PM.',
        'Micro-sleep Danger: A 3-second micro-sleep at 80 km/h means traveling 67 meters completely blindfolded!',
        'Mandatory Rest Cycle: 30 minutes break every 4 hours of continuous steering time; maximum 9 hours driving in a 24-hour cycle.',
        'Zero Tolerance: 0.00% blood alcohol concentration (BAC). DB Skills enforcement includes random breathalyzer checkpoints.'
      ],
      highlight: 'Coffee and energy drinks do NOT cure driver fatigue; they only mask exhaustion temporarily. Only sleep restores brain reflexes!',
      criticalRule: 'PULL-OVER PROTOCOL: Heavy eyelids, yawning, drifting over rumble strips = PULL OVER AT THE NEAREST DHABA OR TOLL PLAZA.',
      diagramType: 'fatigue'
    },
    trainerNotes: 'Share real accident case studies from highway night collisions. Emphasize nutrition, hydration, and cabin ventilation.',
    quizQuestion: {
      question: 'What is the most effective biological remedy for driver drowsiness?',
      options: ['Smoking cigarettes', 'Blaring loud radio', 'Pulling over for a 20-30 min power nap', 'Drinking 3 cups of black tea'],
      correctIndex: 2,
      explanation: 'A short power nap clears adenosine buildup in the brain and resets reaction time.'
    }
  },
  {
    id: 5,
    title: 'Accident Scene Management, CPR & Emergency Response',
    category: 'Module 4: First Aid',
    duration: '40 mins',
    content: {
      bullets: [
        'Scene Safety First: Position warning triangles 50 meters behind the disabled vehicle; turn on hazard flashers.',
        'Good Samaritan Protection: Under Supreme Court guidelines, citizens aiding accident victims are protected from police harassment.',
        'The Golden Hour: Immediate control of severe arterial bleeding and maintaining open airway saves 70% of trauma lives.',
        'Fire Extinguisher PASS Method: Pull pin, Aim nozzle at base of fire, Squeeze lever, Sweep side to side.'
      ],
      highlight: 'Every commercial driver is a certified highway first-responder. Your calm action can save a fellow brother driver.',
      criticalRule: 'HAZMAT WARNING: In tanker accidents carrying hazardous placards (Class 3 Flammable), NEVER use water on chemical fires!',
      diagramType: 'first_aid'
    },
    trainerNotes: 'Demonstrate chest compressions (100-120 bpm) and application of pressure tourniquets for severe limb bleeding.',
    quizQuestion: {
      question: 'How far back from a stalled truck on the highway should the emergency reflective warning triangle be placed?',
      options: ['5 meters', '15 meters', '50 meters', '200 meters'],
      correctIndex: 2,
      explanation: '50 meters gives oncoming vehicles moving at 80 km/h sufficient reaction time to change lanes.'
    }
  }
];

export const ClassroomTrainingModal: React.FC<ClassroomTrainingModalProps> = ({
  isOpen,
  onClose,
  batchCode,
  trainerName
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(1420); // 23 mins in
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSlide = SLIDES[currentSlideIndex];

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
      setSelectedQuizOption(null);
      setQuizSubmitted(false);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
      setSelectedQuizOption(null);
      setQuizSubmitted(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`bg-slate-900 border border-slate-700 text-slate-100 flex flex-col shadow-2xl overflow-hidden transition-all ${
          isFullscreen ? 'w-screen h-screen rounded-none' : 'w-full max-w-5xl h-[88vh] rounded-2xl'
        }`}
      >
        {/* Top Control Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Interactive Safety Slide Deck
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-mono">Batch: {batchCode}</span>
              </div>
              <p className="text-sm font-bold text-white">
                DB Skills 1-Day Commercial Vehicle Driver Safety Masterclass
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 font-mono">Session: {formatTimer(elapsedSeconds)}</span>
            </div>

            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                showNotes
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trainer Notes</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-900/40 transition-colors border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Canvas Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Slide Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col justify-between">
            <div>
              {/* Category & Step Tag */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {currentSlide.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Slide {currentSlideIndex + 1} of {SLIDES.length}
                </span>
              </div>

              {/* Slide Heading */}
              <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-4">
                {currentSlide.title}
              </h2>

              {/* Key Highlight Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/70 to-emerald-950/40 border border-teal-500/30 mb-6 flex items-start gap-3.5">
                <Volume2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    Trainer Key Teaching Focus
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {currentSlide.content.highlight}
                  </p>
                </div>
              </div>

              {/* Bullet Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentSlide.content.bullets.map((bullet, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition-all flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-teal-900/70 text-teal-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-teal-600/40">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{bullet}</p>
                  </div>
                ))}
              </div>

              {/* Critical Rule Callout */}
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-center gap-3 mb-6">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-200 font-medium leading-relaxed">
                  {currentSlide.content.criticalRule}
                </p>
              </div>

              {/* Interactive Quiz Check for Trainees */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Interactive Classroom Check: Ask Trainees!
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-200 mb-3">
                  {currentSlide.quizQuestion.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {currentSlide.quizQuestion.options.map((opt, oIdx) => {
                    let btnStyle = 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-700';
                    if (selectedQuizOption === oIdx) {
                      btnStyle = 'bg-teal-600/30 border-teal-500 text-teal-200';
                    }
                    if (quizSubmitted) {
                      if (oIdx === currentSlide.quizQuestion.correctIndex) {
                        btnStyle = 'bg-emerald-900/60 border-emerald-500 text-emerald-200 font-bold';
                      } else if (selectedQuizOption === oIdx) {
                        btnStyle = 'bg-rose-900/60 border-rose-500 text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={quizSubmitted}
                        onClick={() => setSelectedQuizOption(oIdx)}
                        className={`p-2.5 rounded-lg border text-xs text-left transition-all ${btnStyle}`}
                      >
                        <span className="font-bold mr-2 text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {!quizSubmitted ? (
                  <button
                    disabled={selectedQuizOption === null}
                    onClick={() => setQuizSubmitted(true)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-500 transition-colors"
                  >
                    Reveal Answer & Explanation
                  </button>
                ) : (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-600/30 text-xs text-emerald-300">
                    <span className="font-bold">Correct Answer: </span>
                    {currentSlide.quizQuestion.explanation}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Progress Bar inside Slide */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Trainer: {trainerName}</span>
              <div className="flex items-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setCurrentSlideIndex(i);
                      setSelectedQuizOption(null);
                      setQuizSubmitted(false);
                    }}
                    className={`h-2 rounded-full cursor-pointer transition-all ${
                      i === currentSlideIndex
                        ? 'w-6 bg-teal-400'
                        : i < currentSlideIndex
                        ? 'w-2 bg-emerald-600'
                        : 'w-2 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span>DB Skills Standards v2026.3</span>
            </div>
          </div>

          {/* Collapsible Trainer Notes Drawer */}
          {showNotes && (
            <div className="w-80 border-l border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between shrink-0">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Trainer Field Guide
                    </span>
                  </div>
                  <button onClick={() => setShowNotes(false)} className="text-slate-500 hover:text-slate-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 mb-4">
                  <h5 className="text-xs font-semibold text-teal-300 mb-1">Pedagogy Advice:</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentSlide.trainerNotes}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 text-xs">
                    <span className="font-bold text-slate-300 block mb-1">Recommended Duration:</span>
                    <span className="text-slate-400">{currentSlide.duration} (including Q&A)</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 text-xs">
                    <span className="font-bold text-slate-300 block mb-1">Physical Demonstration:</span>
                    <span className="text-slate-400">Pass around cut tire sections or fire extinguisher gauges.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <span className="text-[11px] text-slate-500 block">DB Skills Level 4 Trainer Curriculum</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Slide Navigation Bar */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3.5 flex items-center justify-between shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors border border-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Module
          </button>

          <div className="text-xs text-slate-400">
            Topic {currentSlideIndex + 1} of {SLIDES.length} :{' '}
            <span className="text-slate-200 font-medium">{currentSlide.title}</span>
          </div>

          {currentSlideIndex < SLIDES.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-lg shadow-teal-950"
            >
              Next Module
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Session & Record Attendance
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
