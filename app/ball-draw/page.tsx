import type { Metadata } from 'next';
import BallDraw from './BallDraw';
import './ball-draw.css';

export const metadata: Metadata = {
  title: 'Ball Draw — ZzzCulture',
};

export default function BallDrawPage() {
  return <BallDraw />;
}
