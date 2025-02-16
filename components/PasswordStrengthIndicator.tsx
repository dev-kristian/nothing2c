// components/PasswordStrengthIndicator.tsx
import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PasswordRequirement {
  re: RegExp;
  label: string;
}

interface Props {
  password: string;
}

const PasswordStrengthIndicator: React.FC<Props> = ({ password }) => {
  const requirements: PasswordRequirement[] = [
    { re: /.{8,}/, label: '8+ Characters' },
    { re: /[A-Z]/, label: 'Uppercase' },
    { re: /[a-z]/, label: 'Lowercase' },
    { re: /[0-9]/, label: 'Number' },
  ];

  const strength = requirements.reduce((acc, req) => acc + (req.re.test(password) ? 1 : 0), 0);

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex space-x-1">
        {requirements.map((_, index) => (
          <div 
            key={index} 
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              index < strength ? getStrengthColor(strength) : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {requirements.map((requirement, index) => {
          const isMet = requirement.re.test(password);
          return (
            <div 
              key={index} 
              className={`flex items-center ${
                isMet ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {isMet ? (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              ) : (
                <XCircle className="mr-1 h-3 w-3" />
              )}
              {requirement.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
