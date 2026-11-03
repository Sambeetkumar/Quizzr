import React from 'react';

const Spinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 w-full space-y-6">
      <div className="w-12 h-12 border-4 border-black/10 dark:border-white/10 border-t-accentPrimary rounded-full animate-spin"></div>
      {message && <p className="text-textSecondary text-lg font-medium animate-pulse">{message}</p>}
    </div>
  );
};

export default Spinner;
