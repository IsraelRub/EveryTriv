import { useMemo } from 'react';
import { ScoringSystemProps } from '../types';

interface ScoreStats {
  percentage: number;
  grade: string;
  color: string;
}

// פונקציה להצגת שם רמת הקושי
const getDifficultyDisplayName = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'Easy';
    case 'medium':
      return 'Medium';
    case 'hard':
      return 'Hard';
    case 'custom':
      return 'Custom';
    default:
      return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }
};

// פונקציה לקבלת צבע לפי רמת קושי
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-success';
    case 'medium':
      return 'bg-warning';
    case 'hard':
      return 'bg-danger';
    case 'custom':
      return 'bg-info';
    default:
      return 'bg-primary';
  }
};

export default function ScoringSystem({ 
  score, 
  total, 
  topicsPlayed, 
  difficultyStats 
}: ScoringSystemProps) {
  const stats = useMemo(() => {
    const gradeRanges = [
      { min: 90, grade: 'A', color: 'bg-success' },
      { min: 80, grade: 'B', color: 'bg-info' },
      { min: 70, grade: 'C', color: 'bg-primary' },
      { min: 60, grade: 'D', color: 'bg-warning' },
      { min: 0, grade: 'F', color: 'bg-danger' }
    ];

    const percentage = total === 0 ? 0 : (score / total) * 100;

    return gradeRanges.reduce<ScoreStats>((acc, range) => {
      if (percentage >= range.min && !acc.grade) {
        return {
          percentage,
          grade: range.grade,
          color: range.color
        };
      }
      return acc;
    }, { percentage: 0, grade: 'F', color: 'bg-danger' });
  }, [score, total]);

  const topTopics = useMemo(() => {
    return Object.entries(topicsPlayed)
      .reduce((acc, [topic, count]) => {
        acc.push({ topic, count });
        return acc;
      }, [] as Array<{ topic: string; count: number }>)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // הגדלתי ל-5 כדי להציג יותר נושאים
  }, [topicsPlayed]);

  const difficultyRates = useMemo(() => {
    return Object.entries(difficultyStats).reduce((acc, [diff, stats]) => {
      const rate = stats.total === 0 ? 0 : (stats.correct / stats.total) * 100;
      acc[diff] = rate;
      return acc;
    }, {} as Record<string, number>);
  }, [difficultyStats]);

  // סטטיסטיקות נוספות לרמות קושי מותאמות
  const customDifficultyStats = useMemo(() => {
    const customStats = difficultyStats['custom'];
    if (!customStats || customStats.total === 0) return null;
    
    return {
      total: customStats.total,
      correct: customStats.correct,
      rate: (customStats.correct / customStats.total) * 100
    };
  }, [difficultyStats]);

  if (total === 0) {
    return (
      <div className="mt-4 text-center">
        <div className="card bg-dark text-white">
          <div className="card-body">
            <h5 className="card-title">🎯 Ready to Start?</h5>
            <p className="card-text">
              Generate your first trivia question to see your statistics here!
            </p>
            <small className="text-white-50">
              💡 Try different difficulty levels including custom descriptions
            </small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 d-flex flex-column gap-3">
      {/* תוצאה כללית */}
      <div className="d-flex align-items-center gap-3 flex-wrap">
        <div className="text-white">
          <span className="fs-5 fw-semibold">Score: </span>
          <span className={`badge ${stats.color} fs-5`}>{score} / {total}</span>
        </div>
        <div className="text-white">
          <span className="fs-5 fw-semibold">Grade: </span>
          <span className={`badge ${stats.color} fs-5`}>{stats.grade} ({stats.percentage.toFixed(1)}%)</span>
        </div>
        <div className="text-white">
          <span className="fs-5 fw-semibold">Questions: </span>
          <span className="badge bg-secondary fs-5">{total}</span>
        </div>
      </div>

      <div className="row g-3">
        {/* נושאים מובילים */}
        <div className="col-12 col-lg-6">
          <div className="card bg-dark text-white h-100">
            <div className="card-body">
              <h5 className="card-title">
                📚 Top Topics
                <span className="badge bg-primary ms-2">{Object.keys(topicsPlayed).length}</span>
              </h5>
              {topTopics.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {topTopics.map(({ topic, count }) => (
                    <span key={topic} className="badge bg-primary">
                      {topic}: {count} time{count !== 1 ? 's' : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white-50 mb-0">No topics played yet</p>
              )}
            </div>
          </div>
        </div>

        {/* שיעורי הצלחה לפי קושי */}
        <div className="col-12 col-lg-6">
          <div className="card bg-dark text-white h-100">
            <div className="card-body">
              <h5 className="card-title">🎯 Success Rates by Difficulty</h5>
              {Object.keys(difficultyRates).length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {Object.entries(difficultyRates)
                    .sort(([,a], [,b]) => b - a) // מיון לפי שיעור הצלחה
                    .map(([diff, rate]) => (
                    <div key={diff} className="d-flex align-items-center gap-2">
                      <span className={`badge ${getDifficultyColor(diff)} text-white`} style={{minWidth: '70px'}}>
                        {getDifficultyDisplayName(diff)}
                      </span>
                      <div className="progress flex-grow-1" style={{ height: '20px' }}>
                        <div 
                          className={`progress-bar ${getDifficultyColor(diff)}`}
                          role="progressbar"
                          style={{ width: `${rate}%` }}
                          aria-valuenow={rate}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          {rate.toFixed(1)}%
                        </div>
                      </div>
                      <small className="text-white-50" style={{minWidth: '50px'}}>
                        ({difficultyStats[diff]?.correct || 0}/{difficultyStats[diff]?.total || 0})
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white-50 mb-0">No difficulty stats yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* סטטיסטיקות מיוחדות לרמות קושי מותאמות */}
      {customDifficultyStats && (
        <div className="card bg-dark text-white">
          <div className="card-body">
            <h5 className="card-title">
              🎨 Custom Difficulty Performance
            </h5>
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <div className="text-center">
                  <div className="fs-4 fw-bold text-info">{customDifficultyStats.total}</div>
                  <small className="text-white-50">Questions</small>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="text-center">
                  <div className="fs-4 fw-bold text-success">{customDifficultyStats.correct}</div>
                  <small className="text-white-50">Correct</small>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="text-center">
                  <div className="fs-4 fw-bold text-warning">{customDifficultyStats.rate.toFixed(1)}%</div>
                  <small className="text-white-50">Success Rate</small>
                </div>
              </div>
            </div>
            <small className="text-white-50 mt-2 d-block">
              💡 Custom difficulties let you challenge yourself with specific knowledge areas
            </small>
          </div>
        </div>
      )}

      {/* הודעת עידוד */}
      {stats.percentage >= 80 && (
        <div className="alert alert-success text-center">
          <strong>🎉 Excellent work!</strong> You're doing great with a {stats.percentage.toFixed(1)}% success rate!
        </div>
      )}
      {stats.percentage >= 60 && stats.percentage < 80 && (
        <div className="alert alert-info text-center">
          <strong>👍 Good job!</strong> Keep it up! Try some custom difficulty levels to challenge yourself more.
        </div>
      )}
      {stats.percentage < 60 && stats.percentage > 0 && (
        <div className="alert alert-warning text-center">
          <strong>💪 Keep trying!</strong> Consider starting with easier topics or custom difficulty descriptions that match your knowledge level.
        </div>
      )}
    </div>
  );
}