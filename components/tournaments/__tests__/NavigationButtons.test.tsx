import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationButtons } from '../NavigationButtons';

describe('NavigationButtons', () => {
  const defaultProps = {
    currentStep: 1,
    totalSteps: 5,
    onBack: vi.fn(),
    onNext: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders Back and Next buttons', () => {
    render(<NavigationButtons {...defaultProps} />);
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('disables Back on first step', () => {
    render(<NavigationButtons {...defaultProps} currentStep={0} />);
    expect(screen.getByText('Back').closest('button')).toBeDisabled();
  });

  it('shows Create Tournament on last step', () => {
    render(<NavigationButtons {...defaultProps} currentStep={4} />);
    expect(screen.getByText('Create Tournament')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('calls onBack when Back clicked', () => {
    render(<NavigationButtons {...defaultProps} />);
    fireEvent.click(screen.getByText('Back'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('calls onNext when Next clicked', () => {
    render(<NavigationButtons {...defaultProps} />);
    fireEvent.click(screen.getByText('Next'));
    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it('calls onSubmit on last step', () => {
    render(<NavigationButtons {...defaultProps} currentStep={4} />);
    fireEvent.click(screen.getByText('Create Tournament'));
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('disables Next when isNextDisabled', () => {
    render(<NavigationButtons {...defaultProps} isNextDisabled />);
    expect(screen.getByText('Next').closest('button')).toBeDisabled();
  });
});
