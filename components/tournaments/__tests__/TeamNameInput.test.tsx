import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamNameInput } from '../TeamNameInput';

describe('TeamNameInput', () => {
  it('renders input with placeholder', () => {
    render(<TeamNameInput index={0} value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Team 1')).toBeInTheDocument();
  });

  it('shows character count', () => {
    render(<TeamNameInput index={0} value="Hello" onChange={vi.fn()} />);
    expect(screen.getByText('5/50')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const onChange = vi.fn();
    render(<TeamNameInput index={0} value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('Team 1'), { target: { value: 'New' } });
    expect(onChange).toHaveBeenCalledWith('New');
  });

  it('shows duplicate warning', () => {
    render(<TeamNameInput index={0} value="Dup" onChange={vi.fn()} isDuplicate />);
    expect(screen.getByText('Duplicate name')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<TeamNameInput index={0} value="" onChange={vi.fn()} error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
