import { useMemo } from 'react';
import { ScoringSystemProps } from '../models/ScoringSystem.model';

interface ScoreStats {
  percentage: number;
  grade: string;
  color: string;
}

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
      .slice(0, 3);
  }, [topicsPlayed]);

  const difficultyRates = useMemo(() => {
    return Object.entries(difficultyStats).reduce((acc, [diff, stats]) => {
      const rate = stats.total === 0 ? 0 : (stats.correct / stats.total) * 100;
      acc[diff] = rate;
      return acc;
    }, {} as Record<string, number>);
  }, [difficultyStats]);

  return (
    <div className="mt-4 d-flex flex-column gap-3">
      <div className="d-flex align-items-center gap-3">
        <div className="text-white">
          <span className="fs-5 fw-semibold">Score: </span>
          <span className={`badge ${stats.color} fs-5`}>{score} / {total}</span>
        </div>
        <div className="text-white">
          <span className="fs-5 fw-semibold">Grade: </span>
          <span className={`badge ${stats.color} fs-5`}>{stats.grade} ({stats.percentage.toFixed(1)}%)</span>
        </div>
      </div>

      <div className="card bg-dark text-white">
        <div className="card-body">
          <h5 className="card-title">Top Topics</h5>
          <div className="d-flex flex-wrap gap-2">
            {topTopics.map(({ topic, count }) => (
              <span key={topic} className="badge bg-primary">
                {topic}: {count} times
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-dark text-white">
        <div className="card-body">
          <h5 className="card-title">Success Rates</h5>
          <div className="d-flex flex-wrap gap-2">
            {Object.entries(difficultyRates).map(([diff, rate]) => (
              <div key={diff} className="d-flex align-items-center gap-1">
                <span className="text-capitalize">{diff}:</span>
                <div className="progress flex-grow-1" style={{ width: '100px' }}>
                  <div 
                    className="progress-bar" 
                    role="progressbar"
                    style={{ width: `${rate}%` }}
                    aria-valuenow={rate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    {rate.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}