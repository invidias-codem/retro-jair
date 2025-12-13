import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import './MathBlock.css';

/**
 * MathBlock component for rendering LaTeX math expressions.
 * Supports both inline ($...$) and block ($$...$$) math.
 */
const MathBlock = ({ value, block = false }) => {
  if (!value) return null;

  try {
    if (block) {
      return (
        <div className="math-block-wrapper">
          <BlockMath math={value} />
        </div>
      );
    } else {
      return (
        <span className="math-inline-wrapper">
          <InlineMath math={value} />
        </span>
      );
    }
  } catch (error) {
    console.error('Math rendering error:', error);
    return (
      <span className="math-error" title={error.message}>
        {value}
      </span>
    );
  }
};

export default MathBlock;
