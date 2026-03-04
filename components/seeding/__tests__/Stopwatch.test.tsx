import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockStart = vi.fn();
const mockStop = vi.fn();
const mockLap = vi.fn();
const mockReset = vi.fn();

vi.mock('@/hooks/useStopwatch', () => ({
  useStopwatch: () => ({
    centiseconds: 12345,
    isRunning: false,
    lapTimes: [5000, 10000],
    finalTime: 12345,
    start: mockStart,
    stop: mockStop,
    lap: mockLap,
    reset: mockReset,
  }),
}));

import { Stopwatch } from '../Stopwatch';

describe('Stopwatch', () => {
  it('renders station label', () => {
    render(<Stopwatch stationIndex={0} onTimeRecorded={vi.fn()} />);
    expect(screen.getByText('Station')).toBeInTheDocument();
  });

  it('renders reset button when final time exists', () => {
    render(<Stopwatch stationIndex={0} onTimeRecorded={vi.fn()} />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('renders formatted time', () => {
    render(<Stopwatch stationIndex={0} onTimeRecorded={vi.fn()} />);
    expect(screen.getByText('02:03.45')).toBeInTheDocument();
  });

  it('renders assign button when final time exists', () => {
    render(<Stopwatch stationIndex={0} onTimeRecorded={vi.fn()} />);
    expect(screen.getByText('Assign')).toBeInTheDocument();
  });

  it('calls onTimeRecorded when assign is clicked', () => {
    const onTimeRecorded = vi.fn();
    render(<Stopwatch stationIndex={0} onTimeRecorded={onTimeRecorded} />);
    fireEvent.click(screen.getByText('Assign'));
    expect(onTimeRecorded).toHaveBeenCalledWith(12345);
  });

  it('shows lap times', () => {
    render(<Stopwatch stationIndex={0} onTimeRecorded={vi.fn()} />);
    expect(screen.getByText(/00:50\.00/)).toBeInTheDocument();
  });
});
