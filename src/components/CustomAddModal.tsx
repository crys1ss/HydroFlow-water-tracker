import React, { useState } from 'react';
import { X, Plus, Minus, Check, Droplets, Sparkles, Coffee, Leaf } from 'lucide-react';
import { BeverageType, UnitType } from '../types';
import { formatVolume, OZ_TO_ML_FACTOR, ML_TO_OZ_FACTOR } from '../utils/storage';

interface CustomAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (amountMl: number, beverage: BeverageType, note?: string) => void;
  unit: UnitType;
}

const BEVERAGES: { type: BeverageType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'water', label: 'Plain Water', icon: <Droplets className="w-4 h-4" />, color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { type: 'sparkling', label: 'Sparkling', icon: <Sparkles className="w-4 h-4" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { type: 'infused', label: 'Infused', icon: <Leaf className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { type: 'tea', label: 'Herbal Tea', icon: <Leaf className="w-4 h-4" />, color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { type: 'coffee', label: 'Coffee', icon: <Coffee className="w-4 h-4" />, color: 'bg-stone-50 text-stone-700 border-stone-200' },
];

export const CustomAddModal: React.FC<CustomAddModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  unit,
}) => {
  // If ml: step by 50ml, default 300ml. If oz: step by 2oz, default 10oz.
  const [amountInput, setAmountInput] = useState<number>(unit === 'oz' ? 10 : 300);
  const [selectedBeverage, setSelectedBeverage] = useState<BeverageType>('water');
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const step = unit === 'oz' ? 1 : 50;
  const min = unit === 'oz' ? 1 : 50;
  const max = unit === 'oz' ? 68 : 2000;

  const handleIncrement = () => {
    setAmountInput((prev) => Math.min(max, prev + step));
  };

  const handleDecrement = () => {
    setAmountInput((prev) => Math.max(min, prev - step));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMl = unit === 'oz' ? Math.round(amountInput * OZ_TO_ML_FACTOR) : amountInput;
    if (finalMl > 0) {
      onAdd(finalMl, selectedBeverage, customNote.trim() || undefined);
      setCustomNote('');
      onClose();
    }
  };

  const quickPills = unit === 'oz' ? [6, 8, 12, 16, 24, 32] : [150, 250, 330, 500, 750, 1000];

  return (
    <div
      id="custom-add-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="custom-add-modal-sheet"
        className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Log Hydration</h3>
            <p className="text-xs text-slate-500 mt-0.5">Record exact intake volume & beverage</p>
          </div>
          <button
            id="btn-close-custom-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* Amount Stepper */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Volume
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                id="btn-decrement-amount"
                onClick={handleDecrement}
                className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition shadow-xs"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="flex items-baseline gap-1 min-w-[140px] justify-center">
                <input
                  id="input-custom-volume"
                  type="number"
                  min={min}
                  max={max}
                  value={amountInput}
                  onChange={(e) => setAmountInput(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
                  className="text-4xl font-extrabold text-slate-900 w-24 text-center focus:outline-hidden border-b-2 border-transparent focus:border-sky-500 pb-0.5"
                />
                <span className="text-base font-semibold text-slate-500">
                  {unit}
                </span>
              </div>

              <button
                type="button"
                id="btn-increment-amount"
                onClick={handleIncrement}
                className="w-11 h-11 rounded-full bg-sky-100 hover:bg-sky-200 active:scale-95 text-sky-800 flex items-center justify-center transition shadow-xs"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {quickPills.map((val) => (
                <button
                  key={val}
                  type="button"
                  id={`pill-quick-val-${val}`}
                  onClick={() => setAmountInput(val)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
                    amountInput === val
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{val} {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Beverage Type Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Drink Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BEVERAGES.map((bev) => {
                const isSelected = selectedBeverage === bev.type;
                return (
                  <button
                    key={bev.type}
                    type="button"
                    id={`btn-select-bev-${bev.type}`}
                    onClick={() => setSelectedBeverage(bev.type)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition ${
                      isSelected
                        ? `${bev.color} border-current ring-2 ring-sky-500/20 font-semibold`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {bev.icon}
                    <span>{bev.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label htmlFor="custom-note-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Optional Note
            </label>
            <input
              id="custom-note-input"
              type="text"
              placeholder="e.g. Post-workout hydrate, lemon water"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
              maxLength={40}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              id="btn-cancel-custom-log"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-custom-log"
              className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-xs font-semibold text-white shadow-sm shadow-sky-600/20 transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Log Drink</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
