'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

interface SerialNumbersInputProps {
  serialNumbers: string[];
  setSerialNumbers: (sns: string[]) => void;
}

export default function SerialNumbersInput({ serialNumbers, setSerialNumbers }: SerialNumbersInputProps) {
  const handleAdd = () => {
    setSerialNumbers([...serialNumbers, '']);
  };

  const handleRemove = (index: number) => {
    setSerialNumbers(serialNumbers.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, value: string) => {
    const newSerialNumbers = [...serialNumbers];
    newSerialNumbers[index] = value.trim();
    setSerialNumbers(newSerialNumbers);
  };

  return (
    <div className="space-y-2">
      {serialNumbers.map((sn, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            value={sn}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={`Serial Number #${index + 1}`}
            className="block w-full p-2 border border-gray-400 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button type="button" onClick={() => handleRemove(index)} className="text-red-500 hover:text-red-700 p-2">
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      ))}
      <button 
        type="button" 
        onClick={handleAdd} 
        className="w-full mt-2 flex items-center justify-center gap-2 p-2 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
      >
        <FontAwesomeIcon icon={faPlus} />
        Adicionar Serial Number
      </button>
    </div>
  );
}